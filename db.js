const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// 프로토타입~소규모 서비스 단계에 맞춘 파일 기반 저장소예요.
// 트래픽이 늘어나면 PostgreSQL 등으로 옮기는 걸 권장해요 (README 참고).
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

// 크레딧 단위: CHAT (챗)
const DEFAULT_SETTINGS = {
  signupBonusChat: 30, // 신규 가입 시 지급되는 크레딧
  roundCostChat: 15, // AI 대화 한 라운드(turnsPerRound턴)당 소모되는 크레딧
  turnsPerRound: 8, // 한 라운드를 구성하는 턴 수
};

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify({ users: {}, profiles: {}, credits: {}, transactions: [], settings: DEFAULT_SETTINGS }, null, 2)
    );
  }
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  db.users = db.users || {};
  db.profiles = db.profiles || {};
  db.credits = db.credits || {};
  db.transactions = db.transactions || [];
  db.settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) };
  return db;
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function txId() {
  return "t_" + crypto.randomBytes(6).toString("hex");
}

function getUserByEmail(email) {
  const db = readDb();
  return db.users[email.toLowerCase()] || null;
}

function getUserById(id) {
  const db = readDb();
  return Object.values(db.users).find((u) => u.id === id) || null;
}

function findOrCreateUser(email) {
  const db = readDb();
  const key = email.toLowerCase();
  if (db.users[key]) return db.users[key];
  const user = { id: "u_" + crypto.randomBytes(8).toString("hex"), email: key, createdAt: Date.now() };
  db.users[key] = user;
  const bonus = db.settings.signupBonusChat;
  db.credits[user.id] = { balance: bonus, updatedAt: Date.now() };
  db.transactions.push({
    id: txId(), userId: user.id, type: "signup_bonus", amount: bonus,
    reason: "신규 가입 크레딧", at: Date.now(), balanceAfter: bonus,
  });
  writeDb(db);
  return user;
}

function getProfile(userId) {
  const db = readDb();
  return db.profiles[userId] || null;
}

function upsertProfile(userId, persona, profile) {
  const db = readDb();
  db.profiles[userId] = { persona, profile, updatedAt: Date.now() };
  writeDb(db);
  return db.profiles[userId];
}

// 다른 회원들의 "공개로 설정한" 정보만 뽑아서 매칭 목록으로 반환
function listPublicMembers(excludeUserId) {
  const db = readDb();
  return Object.entries(db.profiles)
    .filter(([uid]) => uid !== excludeUserId)
    .map(([uid, p]) => {
      const entries = Object.entries(p.profile || {}).filter(([, v]) => v && v.public);
      const publicProfile = Object.fromEntries(entries.map(([k, v]) => [k, v.value]));
      return { memberId: uid, persona: p.persona, profile: publicProfile };
    });
}

// ---------- 크레딧 ----------
function getSettings() {
  return readDb().settings;
}

function updateSettings(patch) {
  const db = readDb();
  db.settings = { ...db.settings, ...patch };
  writeDb(db);
  return db.settings;
}

function getCreditBalance(userId) {
  const db = readDb();
  if (!db.credits[userId]) {
    // 크레딧 레코드가 없는 기존 계정은 현재 설정값으로 한 번 백필해요.
    const bonus = db.settings.signupBonusChat;
    db.credits[userId] = { balance: bonus, updatedAt: Date.now() };
    db.transactions.push({
      id: txId(), userId, type: "backfill", amount: bonus,
      reason: "초기 크레딧 백필", at: Date.now(), balanceAfter: bonus,
    });
    writeDb(db);
  }
  return db.credits[userId].balance;
}

// amount만큼 차감을 시도한다. 잔액이 부족하면 실패를 반환한다 (원자적으로 처리).
function deductCredits(userId, amount, reason) {
  const db = readDb();
  if (!db.credits[userId]) {
    db.credits[userId] = { balance: db.settings.signupBonusChat, updatedAt: Date.now() };
  }
  const current = db.credits[userId].balance;
  if (current < amount) {
    return { ok: false, balance: current };
  }
  const next = current - amount;
  db.credits[userId] = { balance: next, updatedAt: Date.now() };
  db.transactions.push({
    id: txId(), userId, type: "consume", amount: -amount,
    reason, at: Date.now(), balanceAfter: next,
  });
  writeDb(db);
  return { ok: true, balance: next };
}

// 관리자 지급/차감 (amount는 음수도 가능)
function adjustCredits(userId, amount, reason) {
  const db = readDb();
  const current = (db.credits[userId] && db.credits[userId].balance) || 0;
  const next = current + amount;
  db.credits[userId] = { balance: next, updatedAt: Date.now() };
  db.transactions.push({
    id: txId(), userId, type: "admin_adjust", amount,
    reason: reason || "관리자 조정", at: Date.now(), balanceAfter: next,
  });
  writeDb(db);
  return next;
}

function listUsersWithCredits() {
  const db = readDb();
  return Object.values(db.users)
    .map((u) => ({
      id: u.id,
      email: u.email,
      createdAt: u.createdAt,
      balance: (db.credits[u.id] && db.credits[u.id].balance) || 0,
      persona: db.profiles[u.id] ? db.profiles[u.id].persona : null,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getStats() {
  const db = readDb();
  let issued = 0;
  let consumed = 0;
  let rounds = 0;
  for (const t of db.transactions) {
    if (t.amount > 0) issued += t.amount;
    if (t.type === "consume") {
      consumed += -t.amount;
      rounds += 1;
    }
  }
  return { totalUsers: Object.keys(db.users).length, issued, consumed, rounds };
}

module.exports = {
  findOrCreateUser,
  getUserByEmail,
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
};
