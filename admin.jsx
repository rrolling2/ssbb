const { useState, useEffect } = React;

const API_BASE = window.SOKMAEUM_API_BASE || "http://localhost:3001";

const C = {
  ink: "#14101E",
  backdrop: "#0B0812",
  panel: "#221A30",
  panel2: "#2B2140",
  line: "#3B2E52",
  mist: "#EDE8F5",
  muted: "#9C8FB8",
  amber: "#F2A65A",
  teal: "#5FD6BE",
  orchid: "#E48FC4",
};
const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Manrope', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const PERSONA_NAMES = { warm: "온기형", strategist: "전략형", spark: "모험형" };

function FieldInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.muted, marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8,
          padding: "8px 10px", color: C.mist, fontSize: 13, outline: "none", fontFamily: FONT_BODY,
        }}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ flex: 1, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 12px", minWidth: 0 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.mist, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function SignupBox({ email, setEmail, stage, codeInput, setCodeInput, error, sending, onSendCode, onVerify }) {
  return (
    <div style={{ maxWidth: 380, margin: "80px auto", padding: 24 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, letterSpacing: 1 }}>ADMIN LOGIN</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.mist, marginTop: 8, fontWeight: 600 }}>
        관리자 이메일로 로그인
      </div>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {stage === "email" ? (
          <>
            <FieldInput label="이메일" value={email} onChange={setEmail} placeholder="admin@example.com" />
            {error && <div style={{ fontSize: 12, color: C.orchid }}>{error}</div>}
            <button disabled={sending} onClick={onSendCode} style={{
              padding: "12px 0", borderRadius: 999, border: "none", cursor: sending ? "not-allowed" : "pointer",
              background: C.amber, color: C.ink, fontWeight: 700, fontSize: 14,
            }}>
              {sending ? "전송 중..." : "인증 코드 받기"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: C.muted }}>{email}로 코드를 보냈어요.</div>
            <FieldInput label="코드" value={codeInput} onChange={setCodeInput} placeholder="6자리 코드" />
            {error && <div style={{ fontSize: 12, color: C.orchid }}>{error}</div>}
            <button onClick={onVerify} style={{
              padding: "12px 0", borderRadius: 999, border: "none", cursor: "pointer",
              background: C.amber, color: C.ink, fontWeight: 700, fontSize: 14,
            }}>
              확인
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, onGrant }) {
  const [amount, setAmount] = useState("10");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (sign) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n === 0) return;
    setBusy(true);
    await onGrant(user.id, n * sign, reason);
    setBusy(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      border: `1px solid ${C.line}`, borderRadius: 12, background: C.panel2, flexWrap: "wrap",
    }}>
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <div style={{ color: C.mist, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 2, fontFamily: FONT_MONO }}>
          {user.persona ? PERSONA_NAMES[user.persona] || user.persona : "미진단"} · {new Date(user.createdAt).toLocaleDateString("ko-KR")}
        </div>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.amber, fontWeight: 700, flexShrink: 0 }}>
        {user.balance} CHAT
      </div>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} style={{
        width: 60, background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 8px",
        color: C.mist, fontSize: 12, outline: "none", fontFamily: FONT_MONO, flexShrink: 0,
      }} />
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="사유(선택)" style={{
        width: 110, background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 8px",
        color: C.mist, fontSize: 12, outline: "none", fontFamily: FONT_BODY, flexShrink: 0,
      }} />
      <button disabled={busy} onClick={() => submit(1)} style={{
        padding: "6px 10px", borderRadius: 999, border: "none", cursor: busy ? "not-allowed" : "pointer",
        background: C.teal, color: C.ink, fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        + 지급
      </button>
      <button disabled={busy} onClick={() => submit(-1)} style={{
        padding: "6px 10px", borderRadius: 999, border: `1px solid ${C.line}`, cursor: busy ? "not-allowed" : "pointer",
        background: "none", color: C.muted, fontSize: 12, flexShrink: 0,
      }}>
        − 차감
      </button>
    </div>
  );
}

function AdminApp() {
  const [screen, setScreen] = useState("loading"); // loading | signup | forbidden | dashboard
  const [me, setMe] = useState(null);

  const [signupStage, setSignupStage] = useState("email");
  const [email, setEmail] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [signupError, setSignupError] = useState("");
  const [sending, setSending] = useState(false);

  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadDashboard = async () => {
    try {
      const [sRes, statRes, uRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/settings`, { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/stats`, { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/users`, { credentials: "include" }),
      ]);
      if (sRes.status === 403) { setScreen("forbidden"); return; }
      const sData = await sRes.json();
      const statData = await statRes.json();
      const uData = await uRes.json();
      setSettings(sData.settings);
      setSettingsDraft(sData.settings);
      setStats(statData.stats);
      setUsers(uData.users || []);
      setScreen("dashboard");
    } catch (e) {
      setScreen("forbidden");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        if (res.status === 401) { setScreen("signup"); return; }
        const data = await res.json();
        if (!data.ok) { setScreen("signup"); return; }
        setMe(data.user);
        await loadDashboard();
      } catch (e) {
        setScreen("signup");
      }
    })();
  }, []);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSendCode = async () => {
    if (!isValidEmail(email)) { setSignupError("올바른 이메일을 입력해주세요"); return; }
    setSignupError("");
    setSending(true);
    setCodeInput("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-code`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSending(false);
      if (!data.ok) { setSignupError(data.error || "코드 발송에 실패했어요"); return; }
      setSignupStage("code");
    } catch (e) {
      setSending(false);
      setSignupError("서버에 연결할 수 없어요");
    }
  };

  const handleVerify = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-code`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeInput }),
      });
      const data = await res.json();
      if (!data.ok) { setSignupError(data.error || "코드가 일치하지 않아요"); return; }
      setMe(data.user);
      await loadDashboard();
    } catch (e) {
      setSignupError("서버에 연결할 수 없어요");
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsDraft),
      });
      const data = await res.json();
      if (data.ok) {
        setSettings(data.settings);
        setSettingsDraft(data.settings);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
      }
    } catch (e) { /* 무시 */ }
    setSavingSettings(false);
  };

  const grantToUser = async (userId, amount, reason) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/grant`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason }),
      });
      const data = await res.json();
      if (data.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, balance: data.balance } : u)));
      }
    } catch (e) { /* 무시 */ }
  };

  const refreshUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { credentials: "include" });
      const data = await res.json();
      if (data.ok) setUsers(data.users);
    } catch (e) { /* 무시 */ }
    setLoadingUsers(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.backdrop, padding: "24px 16px", fontFamily: FONT_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {screen === "loading" && (
          <div style={{ textAlign: "center", color: C.muted, fontFamily: FONT_MONO, marginTop: 80 }}>불러오는 중...</div>
        )}

        {screen === "signup" && (
          <SignupBox
            email={email} setEmail={setEmail} stage={signupStage}
            codeInput={codeInput} setCodeInput={setCodeInput}
            error={signupError} sending={sending}
            onSendCode={handleSendCode} onVerify={handleVerify}
          />
        )}

        {screen === "forbidden" && (
          <div style={{ textAlign: "center", marginTop: 80 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.mist, fontWeight: 600 }}>관리자 권한이 없어요</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>
              {me ? <><b style={{ color: C.mist }}>{me.email}</b>은(는) 관리자로 등록되지 않았어요.</> : "로그인 확인에 실패했어요."}
              <br />서버의 ADMIN_EMAILS 환경변수에 이메일을 추가해주세요.
            </div>
          </div>
        )}

        {screen === "dashboard" && settings && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.mist, fontWeight: 700 }}>속마음 관리자</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, marginTop: 2 }}>{me && me.email}</div>
              </div>
            </div>

            {stats && (
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <StatCard label="총 회원 수" value={stats.totalUsers} />
                <StatCard label="누적 지급 CHAT" value={stats.issued} />
                <StatCard label="누적 소비 CHAT" value={stats.consumed} />
                <StatCard label="진행된 라운드" value={stats.rounds} />
              </div>
            )}

            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, marginBottom: 20 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.mist, fontWeight: 600, marginBottom: 14 }}>크레딧 설정</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 160px" }}>
                  <FieldInput
                    label="신규 가입 크레딧 (CHAT)"
                    type="number"
                    value={settingsDraft.signupBonusChat}
                    onChange={(v) => setSettingsDraft((p) => ({ ...p, signupBonusChat: v }))}
                  />
                </div>
                <div style={{ flex: "1 1 160px" }}>
                  <FieldInput
                    label="라운드당 소모 크레딧 (CHAT)"
                    type="number"
                    value={settingsDraft.roundCostChat}
                    onChange={(v) => setSettingsDraft((p) => ({ ...p, roundCostChat: v }))}
                  />
                </div>
                <div style={{ flex: "1 1 160px" }}>
                  <FieldInput
                    label="라운드당 턴 수"
                    type="number"
                    value={settingsDraft.turnsPerRound}
                    onChange={(v) => setSettingsDraft((p) => ({ ...p, turnsPerRound: v }))}
                  />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <button disabled={savingSettings} onClick={saveSettings} style={{
                  padding: "10px 18px", borderRadius: 999, border: "none", cursor: savingSettings ? "not-allowed" : "pointer",
                  background: C.amber, color: C.ink, fontWeight: 700, fontSize: 13,
                }}>
                  {savingSettings ? "저장 중..." : "저장"}
                </button>
                {savedFlash && <span style={{ color: C.teal, fontSize: 12, fontFamily: FONT_MONO }}>저장됨</span>}
              </div>
            </div>

            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.mist, fontWeight: 600 }}>회원 크레딧 관리</div>
                <button onClick={refreshUsers} style={{
                  background: "none", border: "none", color: C.muted, fontSize: 11.5, fontFamily: FONT_MONO, cursor: "pointer",
                }}>
                  {loadingUsers ? "새로고침 중..." : "새로고침"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {users.length === 0 ? (
                  <div style={{ color: C.muted, fontSize: 13 }}>아직 가입한 회원이 없어요.</div>
                ) : (
                  users.map((u) => <UserRow key={u.id} user={u} onGrant={grantToUser} />)
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AdminApp />);
