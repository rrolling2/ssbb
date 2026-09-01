const jwt = require("jsonwebtoken");

const COOKIE_NAME = "sokmaeum_session";
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.warn("⚠️ JWT_SECRET이 설정되지 않았어요. .env에 임의의 긴 문자열을 넣어주세요.");
}

function issueToken(user) {
  return jwt.sign({ uid: user.id, email: user.email }, SECRET || "dev-only-insecure-secret", {
    expiresIn: "30d",
  });
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ ok: false, error: "로그인이 필요해요" });
  try {
    req.user = jwt.verify(token, SECRET || "dev-only-insecure-secret");
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "세션이 만료됐어요. 다시 로그인해주세요" });
  }
}

// ADMIN_EMAILS 환경변수(쉼표로 구분)에 포함된 이메일만 관리자로 인정해요.
// requireAuth 다음에 체이닝해서 써요: app.get(path, requireAuth, requireAdmin, handler)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function requireAdmin(req, res, next) {
  const email = (req.user && req.user.email || "").toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ ok: false, error: "관리자 권한이 없어요" });
  }
  next();
}

module.exports = { issueToken, setSessionCookie, clearSessionCookie, requireAuth, requireAdmin, COOKIE_NAME };
