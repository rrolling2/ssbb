require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { issueCode, verifyCode } = require("./src/codeStore");
const { sendCodeEmail } = require("./src/mailer");
const {
  findOrCreateUser,
  getUserById,
  getProfile,
  upsertProfile,
  listPublicMembers,
  getSettings,
  updateSettings,
  getCreditBalance,
  deductCredits,
  adjustCredits,
  listUsersWithCredits,
  getStats,
} = require("./src/db");
const { issueToken, setSessionCookie, clearSessionCookie, requireAuth, requireAdmin } = require("./src/auth");

const app = express();
app.use(express.json());
app.use(cookieParser());

// 쿠키 기반 세션을 쓰기 때문에 origin은 반드시 프론트엔드의 정확한 주소여야 해요.
// ("*"는 credentials와 함께 쓸 수 없어요.)
const allowedOrigin = process.env.ALLOWED_ORIGIN;
if (!allowedOrigin) {
  console.warn("⚠️ ALLOWED_ORIGIN이 설정되지 않았어요. .env에 프론트엔드 주소를 넣어주세요.");
}
app.use(cors({ origin: allowedOrigin || true, credentials: true }));

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요" },
});

// ---------- 인증 ----------
app.post("/api/auth/send-code", sendLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "올바른 이메일을 입력해주세요" });
  }
  const code = issueCode(email);
  if (!code) {
    return res.status(429).json({ ok: false, error: "잠시 후 다시 요청해주세요 (재발송 대기 중)" });
  }
  try {
    await sendCodeEmail(email, code);
    return res.json({ ok: true });
  } catch (err) {
    console.error("메일 발송 실패:", err.message);
    return res.status(500).json({ ok: false, error: "메일 발송에 실패했어요. 잠시 후 다시 시도해주세요" });
  }
});

app.post("/api/auth/verify-code", (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ ok: false, error: "이메일과 코드를 입력해주세요" });
  }
  const result = verifyCode(email, code);
  if (!result.ok) return res.status(400).json(result);

  const user = findOrCreateUser(email);
  const token = issueToken(user);
  setSessionCookie(res, token);
  const profile = getProfile(user.id);
  return res.json({ ok: true, user: { id: user.id, email: user.email }, profile });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = getUserById(req.user.uid);
  if (!user) return res.status(401).json({ ok: false });
  const profile = getProfile(user.id);
  return res.json({ ok: true, user: { id: user.id, email: user.email }, profile });
});

app.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// ---------- 크레딧 (단위: CHAT) ----------
// 사람과 사람 사이의 순수 대화에는 크레딧이 들지 않아요. AI가 대사를 생성하는 순간에만 소모돼요.
app.get("/api/credits/me", requireAuth, (req, res) => {
  const balance = getCreditBalance(req.user.uid);
  const settings = getSettings();
  res.json({
    ok: true,
    balance,
    settings: {
      signupBonusChat: settings.signupBonusChat,
      roundCostChat: settings.roundCostChat,
      turnsPerRound: settings.turnsPerRound,
    },
  });
});

// 한 라운드(turnsPerRound턴)를 시작할 때 한 번 호출해서 roundCostChat만큼 선차감해요.
// 이후 해당 라운드 안의 AI 호출(턴 생성 + 케미 스코어 판정)은 추가로 차감하지 않아요.
app.post("/api/credits/reserve-round", requireAuth, (req, res) => {
  const settings = getSettings();
  const result = deductCredits(req.user.uid, settings.roundCostChat, `AI 대화 ${settings.turnsPerRound}턴 라운드`);
  if (!result.ok) {
    return res.status(402).json({ ok: false, error: "크레딧이 부족해요", balance: result.balance });
  }
  res.json({ ok: true, balance: result.balance });
});

// ---------- 프로필 (성향 + 공개범위) ----------
app.put("/api/profile", requireAuth, (req, res) => {
  const { persona, profile } = req.body || {};
  if (!persona || !profile) {
    return res.status(400).json({ ok: false, error: "persona와 profile이 필요해요" });
  }
  const saved = upsertProfile(req.user.uid, persona, profile);
  res.json({ ok: true, profile: saved });
});

// ---------- 실제 회원 매칭 목록 ----------
app.get("/api/members", requireAuth, (req, res) => {
  res.json({ ok: true, members: listPublicMembers(req.user.uid) });
});

// ---------- AI 대화 프록시 (API 키는 서버에만 있어요) ----------
app.post("/api/ai/complete", requireAuth, async (req, res) => {
  const { system, messages } = req.body || {};
  if (!system || !Array.isArray(messages)) {
    return res.status(400).json({ ok: false, error: "system과 messages가 필요해요" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ ok: false, error: "서버에 ANTHROPIC_API_KEY가 설정되지 않았어요" });
  }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 500,
        system,
        messages,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Anthropic API 오류:", data);
      return res.status(502).json({ ok: false, error: (data.error && data.error.message) || "AI 호출 실패" });
    }
    return res.json({ ok: true, content: data.content });
  } catch (e) {
    console.error("AI 프록시 오류:", e.message);
    return res.status(502).json({ ok: false, error: "AI 서버에 연결할 수 없어요" });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- 관리자 전용 ----------
app.get("/api/admin/settings", requireAuth, requireAdmin, (_req, res) => {
  res.json({ ok: true, settings: getSettings() });
});

app.put("/api/admin/settings", requireAuth, requireAdmin, (req, res) => {
  const { signupBonusChat, roundCostChat, turnsPerRound } = req.body || {};
  const patch = {};
  for (const [key, val] of Object.entries({ signupBonusChat, roundCostChat, turnsPerRound })) {
    if (val === undefined) continue;
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ ok: false, error: `${key} 값이 올바르지 않아요` });
    }
    patch[key] = key === "turnsPerRound" ? Math.max(1, Math.round(n)) : n;
  }
  const settings = updateSettings(patch);
  res.json({ ok: true, settings });
});

app.get("/api/admin/users", requireAuth, requireAdmin, (_req, res) => {
  res.json({ ok: true, users: listUsersWithCredits() });
});

app.post("/api/admin/users/:userId/grant", requireAuth, requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { amount, reason } = req.body || {};
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) {
    return res.status(400).json({ ok: false, error: "amount가 올바르지 않아요" });
  }
  const balance = adjustCredits(userId, n, reason);
  res.json({ ok: true, balance });
});

app.get("/api/admin/stats", requireAuth, requireAdmin, (_req, res) => {
  res.json({ ok: true, stats: getStats() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`속마음 백엔드 실행 중: http://localhost:${PORT}`);
});
