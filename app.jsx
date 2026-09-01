const { useState, useRef, useEffect } = React;

// 이 백엔드 주소를 배포한 서버 주소로 바꿔주세요.
// 로컬에서 테스트할 땐 기본값(http://localhost:3001) 그대로 두면 돼요.
const API_BASE = window.SOKMAEUM_API_BASE || "http://localhost:3001";

// ---------- 아이콘 (lucide-react 없이 인라인 SVG로) ----------
function makeIcon(path) {
  return function Icon({ size = 16, color = "currentColor", style }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        {path}
      </svg>
    );
  };
}
const Heart = makeIcon(<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />);
const Target = makeIcon(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>);
const Zap = makeIcon(<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />);
const Play = makeIcon(<path d="M6 3v18l16-9L6 3z" fill="currentColor" stroke="none" />);
const Pause = makeIcon(<><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" /></>);
const RotateCcw = makeIcon(<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>);
const Lock = makeIcon(<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>);
const Unlock = makeIcon(<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.4-2" /></>);
const Sparkles = makeIcon(<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" fill="currentColor" stroke="none" />);
const Users = makeIcon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16.5 5.5a3.5 3.5 0 0 1 0 6.8" /><path d="M21.5 20a6 6 0 0 0-4.5-8" /></>);
const ChevronRight = makeIcon(<path d="M9 6l6 6-6 6" />);
const Check = makeIcon(<path d="M20 6 9 17l-5-5" />);
const ArrowLeft = makeIcon(<path d="M19 12H5M12 19l-7-7 7-7" />);

// ---------- 디자인 토큰 ----------
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

// ---------- 데이터 ----------
const FIELD_LABELS = {
  job: "직업",
  school: "학교",
  age: "나이",
  region: "지역",
  marital: "결혼 여부",
  dating: "데이트 상대 유무",
  body: "키 · 몸무게",
  reading: "독서 취향",
  video: "영상 취향",
};

const DEFAULT_PROFILE = {
  job: { value: "프로덕트 디자이너", public: true },
  school: { value: "한양대학교", public: false },
  age: { value: "28", public: true },
  region: { value: "서울 성수동", public: true },
  marital: { value: "미혼", public: false },
  dating: { value: "없음", public: false },
  body: { value: "170cm · 58kg", public: false },
  reading: { value: "에세이, SF 소설", public: true },
  video: { value: "다큐멘터리, 시트콤", public: true },
};

const PERSONAS = {
  warm: {
    key: "warm",
    name: "온기형",
    title: "The Warm",
    color: C.amber,
    icon: Heart,
    tagline: "관계의 온도를 먼저 살피는 사람",
    desc: "상대의 감정을 세심하게 읽고, 대화의 온도를 부드럽게 맞춰가요. 공감과 배려가 무기예요.",
  },
  strategist: {
    key: "strategist",
    name: "전략형",
    title: "The Strategist",
    color: C.teal,
    icon: Target,
    tagline: "목표를 먼저 그리고 대화하는 사람",
    desc: "상황을 논리적으로 파악하고, 실리와 목표를 향해 대화를 설계해요. 협상에 강해요.",
  },
  spark: {
    key: "spark",
    name: "모험형",
    title: "The Spark",
    color: C.orchid,
    icon: Zap,
    tagline: "예측불가한 흐름을 즐기는 사람",
    desc: "즉흥적이고 유머러스하게 대화를 이끌어요. 새로운 화제를 던지는 데 거침없어요.",
  },
};

const QUIZ = [
  { q: "낯선 모임에 갔을 때 당신은?", options: [
    { t: "구석에서 한 사람과 깊은 대화를 나눈다", k: "warm" },
    { t: "누가 도움이 될 사람인지 살핀다", k: "strategist" },
    { t: "가장 시끄러운 무리에 바로 끼어든다", k: "spark" }] },
  { q: "갈등이 생기면?", options: [
    { t: "상대 감정을 먼저 다독인다", k: "warm" },
    { t: "원인을 분석하고 조건을 조율한다", k: "strategist" },
    { t: "농담으로 분위기부터 바꿔버린다", k: "spark" }] },
  { q: "주말 계획을 짤 때?", options: [
    { t: "가까운 친구와 소소하게", k: "warm" },
    { t: "할 일을 효율적으로 정리", k: "strategist" },
    { t: "즉흥적으로 어디든 떠난다", k: "spark" }] },
  { q: "중요한 결정을 내릴 때 가장 먼저 떠올리는 것은?", options: [
    { t: "이게 관계에 어떤 영향을 줄까", k: "warm" },
    { t: "장단점을 따진 결과가 뭘까", k: "strategist" },
    { t: "일단 해보면 어떨까", k: "spark" }] },
  { q: "첫 대화에서 나도 모르게 하는 행동은?", options: [
    { t: "상대 이야기를 계속 물어본다", k: "warm" },
    { t: "상대가 무슨 일을 하는지 파악한다", k: "strategist" },
    { t: "예상 밖의 질문을 던진다", k: "spark" }] },
  { q: "스트레스를 풀 때?", options: [
    { t: "믿을 수 있는 사람과 대화한다", k: "warm" },
    { t: "문제를 리스트로 정리해 하나씩 해결", k: "strategist" },
    { t: "몸을 움직이거나 새로운 걸 시도", k: "spark" }] },
];

const OPPONENTS = [
  { id: "ria", name: "리아", role: "브랜드 전략 기획자", company: "오르빗 스튜디오", color: "#5FD6BE", bio: "목표가 뚜렷하고 협상에 능한 사람" },
  { id: "noah", name: "노아", role: "여행 에세이 작가", company: "프리로그 매거진", color: "#E48FC4", bio: "즉흥적인 만남을 즐기는 사람" },
  { id: "haneul", name: "하늘", role: "심리상담사", company: "마음온도 심리센터", color: "#F2A65A", bio: "상대 이야기를 잘 들어주는 사람" },
  { id: "jiwoo", name: "지우", role: "프로덕트 매니저", company: "페블베이스", color: "#8EA7F2", bio: "데이터로 설득하는 걸 좋아하는 사람" },
  { id: "seojun", name: "서준", role: "그로스 마케터", company: "그로스랩", color: "#F28C82", bio: "빠른 실행과 숫자를 믿는 사람" },
  { id: "daeun", name: "다은", role: "UX 리서처", company: "루멘디자인", color: "#9FD6A0", bio: "사람을 관찰하는 걸 좋아하는 사람" },
  { id: "eunwoo", name: "은우", role: "셰프", company: "소금과 불", color: "#E8C468", bio: "디테일에 진심인 사람" },
  { id: "chaewon", name: "채원", role: "사진작가", company: "프레임웍스", color: "#7FC8E8", bio: "순간을 포착하는 감각이 좋은 사람" },
  { id: "dohyun", name: "도현", role: "스타트업 대표", company: "넥스트포트", color: "#E88FAF", bio: "큰 그림을 먼저 그리는 사람" },
  { id: "yuna", name: "유나", role: "투자심사역", company: "브릿지캐피탈", color: "#B79CF2", bio: "리스크를 꼼꼼히 따지는 사람" },
];

const DEFAULT_MAX_TURNS = 8;

// ---------- API 헬퍼 ----------
// 실제 AI 호출은 백엔드 프록시(/api/ai/complete)를 통해요.
// Anthropic API 키는 서버에만 있고 브라우저에는 절대 노출되지 않아요.
async function callClaude(system, userMsg) {
  const response = await fetch(`${API_BASE}/api/ai/complete`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages: [{ role: "user", content: userMsg }] }),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "AI 호출 실패");
  const text = (data.content || []).map((b) => b.text || "").join("").trim();
  return text;
}

async function callClaudeJSON(system, userMsg) {
  const text = await callClaude(system, userMsg);
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    return null;
  }
}

function transcriptText(local, myLabel, oppLabel) {
  return local.map((t) => `${t.speaker === "me" ? myLabel : oppLabel}: ${t.text}`).join("\n");
}

function publicInfoString(profile) {
  const entries = Object.entries(profile).filter(([, v]) => v.public);
  if (entries.length === 0) return "공개된 정보 없음";
  return entries.map(([k, v]) => `${FIELD_LABELS[k]}: ${v.value}`).join(", ");
}

function bizContext(bizMode) {
  return bizMode
    ? "지금은 Biz 모드입니다. 두 사람은 '두 브랜드의 공동 팝업스토어 협업'을 두고 협상 중입니다. 예산, 기간, 정산 비율 등 현실적인 조건을 제시하고 목표를 관철하려 하되, 대화가 계속 이어지도록 하세요."
    : "지금은 편안한 첫 대화 자리입니다. 자연스럽고 사람 냄새 나는 스몰토크로 서로를 알아가세요.";
}

// ---------- 작은 컴포넌트 ----------
function TypingDots({ color }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", height: 14 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5, height: 5, borderRadius: 999, background: color,
            animation: `typingBounce 1.1s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
    </span>
  );
}

function Toggle({ checked, onChange, color, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 38, height: 22, borderRadius: 999, position: "relative",
        background: checked ? color : C.line, transition: "background 0.25s",
        border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute", top: 2, left: checked ? 18 : 2, width: 18, height: 18,
          borderRadius: 999, background: C.ink, transition: "left 0.25s",
        }}
      />
    </button>
  );
}

// ---------- 메인 컴포넌트 ----------
function SokmaeumApp() {
  const [screen, setScreen] = useState("loading"); // loading | signup | onboarding | profile | result | switch | app
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ warm: 0, strategist: 0, spark: 0 });
  const [selectedCard, setSelectedCard] = useState(null);
  const [chosenPersona, setChosenPersona] = useState(null);

  const [account, setAccount] = useState(null); // {email, memberId}
  const [creditBalance, setCreditBalance] = useState(null);
  const [roundCostChat, setRoundCostChat] = useState(15);
  const [turnsPerRound, setTurnsPerRound] = useState(DEFAULT_MAX_TURNS);
  const [creditError, setCreditError] = useState("");
  const [signupStage, setSignupStage] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [signupError, setSignupError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  const [activeTab, setActiveTab] = useState("stage"); // stage | visibility
  const [bizMode, setBizMode] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const [opponent, setOpponent] = useState(null);
  const [customOpponent, setCustomOpponent] = useState(null);
  const [opponentForm, setOpponentForm] = useState({ name: "", company: "", role: "", bio: "" });
  const [realMembers, setRealMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [turnLoading, setTurnLoading] = useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  const [verdict, setVerdict] = useState(null);

  const playRef = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcript, turnLoading]);

  // ---------- 계정 부트스트랩: 이미 로그인된 세션이면 처음부터 다시 안 물어봄 ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        if (res.status === 401) { setScreen("signup"); return; }
        const data = await res.json();
        if (!data.ok) { setScreen("signup"); return; }
        setAccount(data.user);
        if (data.profile && PERSONAS[data.profile.persona]) {
          setChosenPersona(PERSONAS[data.profile.persona]);
          setProfile(data.profile.profile);
          setScreen("app");
        } else {
          setScreen("onboarding");
        }
      } catch (e) {
        setScreen("backendError");
      }
    })();
  }, []);

  // ---------- 성향/프로필이 정해지면 서버에 저장 (실제 회원 목록에도 자동 반영) ----------
  useEffect(() => {
    if (!account || !chosenPersona) return;
    (async () => {
      try {
        await fetch(`${API_BASE}/api/profile`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona: chosenPersona.key, profile }),
        });
      } catch (e) { /* 네트워크 오류 시 조용히 무시, 다음 변경 때 다시 시도됨 */ }
    })();
  }, [account, chosenPersona, profile]);

  const fetchCredits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/credits/me`, { credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setCreditBalance(data.balance);
        if (data.settings) {
          setRoundCostChat(data.settings.roundCostChat);
          setTurnsPerRound(data.settings.turnsPerRound);
        }
      }
    } catch (e) { /* 다음 기회에 다시 시도 */ }
  };

  useEffect(() => {
    if (account) fetchCredits();
  }, [account]);

  const handleLogout = async () => {
    try { await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" }); } catch (e) {}
    setAccount(null);
    setChosenPersona(null);
    setProfile(DEFAULT_PROFILE);
    setOpponent(null);
    setCreditBalance(null);
    setCreditError("");
    setScreen("signup");
  };

  // ---------- 회원가입 ----------
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSendCode = async () => {
    if (!isValidEmail(email)) { setSignupError("올바른 이메일을 입력해주세요"); return; }
    setSignupError("");
    setSendingCode(true);
    setCodeInput("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSendingCode(false);
      if (!data.ok) { setSignupError(data.error || "코드 발송에 실패했어요"); return; }
      setSignupStage("code");
    } catch (e) {
      setSendingCode(false);
      setSignupError("인증 서버에 연결할 수 없어요. 백엔드가 실행 중인지 확인해주세요");
    }
  };

  const handleVerifyCode = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeInput }),
      });
      const data = await res.json();
      if (!data.ok) { setSignupError(data.error || "코드가 일치하지 않아요"); return; }
      setSignupError("");
      setAccount(data.user);
      if (data.profile && PERSONAS[data.profile.persona]) {
        setChosenPersona(PERSONAS[data.profile.persona]);
        setProfile(data.profile.profile);
        setScreen("app");
      } else {
        setScreen("onboarding");
      }
    } catch (e) {
      setSignupError("인증 서버에 연결할 수 없어요");
    }
  };

  const backToEmailStage = () => {
    setSignupStage("email");
    setCodeInput("");
    setSignupError("");
  };

  // ---------- 온보딩 ----------
  const answerQuiz = (k) => {
    setScores((prev) => ({ ...prev, [k]: prev[k] + 1 }));
    if (step + 1 < QUIZ.length) {
      setStep(step + 1);
    } else {
      setScreen("result");
    }
  };

  const restartQuiz = () => {
    setStep(0);
    setScores({ warm: 0, strategist: 0, spark: 0 });
    setSelectedCard(null);
    setProfile(DEFAULT_PROFILE);
    setCustomOpponent(null);
    setOpponentForm({ name: "", company: "", role: "", bio: "" });
    setOpponent(null);
    setTranscript([]);
    setCurtainOpen(false);
    setRoundEnded(false);
    setVerdict(null);
    setScreen("onboarding");
  };

  const confirmPersona = () => {
    setChosenPersona(PERSONAS[selectedCard]);
    setScreen(screen === "switch" ? "app" : "profile");
  };

  const openSwitchPersona = () => {
    setSelectedCard(chosenPersona.key);
    setScreen("switch");
  };

  const cancelSwitchPersona = () => {
    setScreen("app");
  };

  const finishProfileSetup = () => setScreen("app");

  const updateOpponentForm = (patch) => setOpponentForm((prev) => ({ ...prev, ...patch }));

  const createCustomOpponent = () => {
    const custom = {
      id: "custom_" + Date.now(),
      type: "npc",
      name: opponentForm.name.trim(),
      company: opponentForm.company.trim() || "개인",
      role: opponentForm.role.trim() || "지인",
      bio: opponentForm.bio.trim() || "자유롭게 대화를 나누고 싶은 사람",
      color: C.mist,
    };
    setCustomOpponent(custom);
    resetRound();
    setOpponent(custom);
    setOpponentForm({ name: "", company: "", role: "", bio: "" });
  };

  const loadRealMembers = async () => {
    if (!account) return;
    setMembersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/members`, { credentials: "include" });
      const data = await res.json();
      setRealMembers(data.ok ? data.members : []);
    } catch (e) {
      setRealMembers([]);
    }
    setMembersLoading(false);
  };

  const chooseRealMember = (m) => {
    resetRound();
    const p = PERSONAS[m.persona] || PERSONAS.warm;
    setOpponent({
      id: m.memberId,
      type: "member",
      name: `${p.name} 회원 · ${m.memberId.slice(-4).toUpperCase()}`,
      persona: m.persona,
      publicProfile: m.profile || {},
      color: p.color,
    });
  };

  useEffect(() => {
    if (screen === "app" && activeTab === "stage" && !opponent && account) {
      loadRealMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeTab, opponent, account]);

  // ---------- 대화 로직 ----------
  const myLabel = "나";

  const buildMySystem = (opponentObj) => {
    const persona = chosenPersona;
    return `당신은 사용자를 대신해 상대방과 대화하는 AI 대리인입니다.
성향: ${persona.name}(${persona.tagline}). ${persona.desc}
사용자가 공개하기로 한 정보만 언급할 수 있습니다: ${publicInfoString(profile)}.
그 외의 개인 정보는 상대가 물어봐도 자연스럽게 화제를 돌리고 얼버무리세요.
지금 대화 상대의 이름은 '${opponentObj.name}'입니다.
${bizContext(bizMode)}
반드시 한국어로, 1~3문장의 짧고 자연스러운 대사만 출력하세요. 화자 이름, 따옴표, 지문은 절대 포함하지 마세요.`;
  };

  const buildOppSystem = (opponentObj) => {
    if (opponentObj.type === "member") {
      const persona = PERSONAS[opponentObj.persona] || PERSONAS.warm;
      const entries = Object.entries(opponentObj.publicProfile || {});
      const pubInfo = entries.length ? entries.map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`).join(", ") : "공개된 정보 없음";
      return `당신은 실제 앱 회원을 대신해 대화하는 AI 대리인입니다.
성향: ${persona.name}(${persona.tagline}). ${persona.desc}
이 회원이 공개하기로 한 정보만 언급할 수 있습니다: ${pubInfo}. 그 외 정보는 상대가 물어봐도 자연스럽게 얼버무리세요.
지금 대화 상대의 이름은 '${myLabel}'입니다.
${bizContext(bizMode)}
반드시 한국어로, 1~3문장의 짧고 자연스러운 대사만 출력하세요. 화자 이름, 따옴표, 지문은 절대 포함하지 마세요.`;
    }
    return `당신은 '${opponentObj.name}'이라는 사람입니다. ${opponentObj.company}에서 ${opponentObj.role}로 일해요. ${opponentObj.bio}.
지금 대화 상대의 이름은 '${myLabel}'입니다.
${bizContext(bizMode)}
반드시 한국어로, 1~3문장의 짧고 자연스러운 대사만 출력하세요. 화자 이름, 따옴표, 지문은 절대 포함하지 마세요.`;
  };

  const generateTurnText = async (speakerRole, local, opponentObj) => {
    const oppLabel = opponentObj.name;
    const sys = speakerRole === "me" ? buildMySystem(opponentObj) : buildOppSystem(opponentObj);
    const speakerName = speakerRole === "me" ? myLabel : oppLabel;
    const hist = transcriptText(local, myLabel, oppLabel);
    const userPrompt = hist
      ? `${hist}\n\n위 대화에 이어서 "${speakerName}"의 다음 대사를 한 번만, 1~3문장으로 자연스럽게 이어가세요. 대사 내용만 출력하세요.`
      : `대화를 자연스럽게 시작하는 첫 마디를 1~2문장으로 건네세요. 대사만 출력하세요.`;
    return callClaude(sys, userPrompt);
  };

  const finalizeRound = async (local, opponentObj) => {
    const oppLabel = opponentObj.name;
    const hist = transcriptText(local, myLabel, oppLabel);
    const sys = `당신은 대화를 처음부터 끝까지 지켜본 관찰자입니다. 아래 JSON 형식으로만 답하세요. 다른 문장은 절대 포함하지 마세요.
{"chemistry": 0-100 사이 정수, "comment": "대화 분위기를 요약하는 한국어 한 문장"${bizMode ? ', "dealReached": true 또는 false, "dealSummary": "합의 내용을 요약하는 한국어 한 문장"' : ""}}`;
    const result = await callClaudeJSON(sys, `${hist}\n\n위 대화를 분석해 JSON으로만 답하세요.`);
    setVerdict(result || { chemistry: 70, comment: "대화가 무난하게 흘러갔어요." });
    setRoundEnded(true);
  };

  const handlePlay = async () => {
    if (!opponent) return;

    // 새 라운드를 시작하는 시점(아직 대사가 없을 때)에만 크레딧을 한 번 차감해요.
    // 일시정지 후 이어하는 경우는 이미 차감된 라운드라 다시 차감하지 않아요.
    if (transcript.length === 0) {
      setCreditError("");
      try {
        const res = await fetch(`${API_BASE}/api/credits/reserve-round`, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (!data.ok) {
          if (typeof data.balance === "number") setCreditBalance(data.balance);
          setCreditError(data.error || "크레딧이 부족해요");
          return;
        }
        setCreditBalance(data.balance);
      } catch (e) {
        setCreditError("크레딧을 확인할 수 없어요. 잠시 후 다시 시도해주세요");
        return;
      }
    }

    playRef.current = true;
    setIsPlaying(true);
    setCurtainOpen(true);
    let local = [...transcript];
    while (playRef.current && local.length < turnsPerRound) {
      const speakerRole = local.length % 2 === 0 ? "me" : "them";
      setTurnLoading(true);
      try {
        const text = await generateTurnText(speakerRole, local, opponent);
        local = [...local, { speaker: speakerRole, text: text || "..." }];
        setTranscript(local);
      } catch (e) {
        local = [...local, { speaker: speakerRole, text: "(연결 오류로 대사를 불러오지 못했어요)" }];
        setTranscript(local);
        playRef.current = false;
      }
      setTurnLoading(false);
      await new Promise((r) => setTimeout(r, 350));
    }
    setIsPlaying(false);
    if (local.length >= turnsPerRound) {
      setTurnLoading(true);
      await finalizeRound(local, opponent);
      setTurnLoading(false);
    }
  };

  const handlePause = () => {
    playRef.current = false;
    setIsPlaying(false);
  };

  const resetRound = () => {
    playRef.current = false;
    setIsPlaying(false);
    setTranscript([]);
    setCurtainOpen(false);
    setRoundEnded(false);
    setVerdict(null);
    setTurnLoading(false);
    setCreditError("");
  };

  const chooseOpponent = (o) => {
    resetRound();
    setOpponent(o);
  };

  const changeOpponent = () => {
    resetRound();
    setOpponent(null);
  };

  const updateProfileField = (key, patch) => {
    setProfile((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const midRound = curtainOpen && !roundEnded;

  return (
    <div style={{ minHeight: "100vh", background: C.backdrop, display: "flex", justifyContent: "center", padding: "24px 12px", fontFamily: FONT_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes typingBounce { 0%,80%,100%{ transform: translateY(0); opacity:.4 } 40%{ transform: translateY(-3px); opacity:1 } }
        @keyframes fadeInUp { from{ opacity:0; transform: translateY(6px);} to{ opacity:1; transform: translateY(0);} }
        @keyframes pulseGlow { 0%,100%{ opacity:.55 } 50%{ opacity:1 } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 999px; }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 420, minHeight: 720, background: C.ink, borderRadius: 28,
        border: `1px solid ${C.line}`, overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6)",
      }}>
        {screen === "loading" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted }}>불러오는 중...</div>
          </div>
        )}

        {screen === "backendError" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.mist, fontWeight: 600 }}>백엔드에 연결할 수 없어요</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 10, lineHeight: 1.6 }}>
              <code style={{ fontFamily: FONT_MONO, color: C.amber }}>{API_BASE}</code> 서버가 실행 중인지,<br />
              그리고 이 페이지의 <code style={{ fontFamily: FONT_MONO, color: C.amber }}>window.SOKMAEUM_API_BASE</code> 설정이 맞는지 확인해주세요.
            </div>
            <button onClick={() => window.location.reload()} style={{
              marginTop: 18, padding: "10px 20px", borderRadius: 999, border: `1px solid ${C.line}`,
              background: "none", color: C.mist, fontSize: 13, cursor: "pointer",
            }}>
              다시 시도
            </button>
          </div>
        )}

        {screen === "signup" && (
          <SignupScreen
            stage={signupStage}
            email={email}
            setEmail={setEmail}
            codeInput={codeInput}
            setCodeInput={setCodeInput}
            error={signupError}
            sending={sendingCode}
            onSendCode={handleSendCode}
            onVerify={handleVerifyCode}
            onBackToEmail={backToEmailStage}
          />
        )}

        {screen === "onboarding" && (
          <OnboardingScreen step={step} onAnswer={answerQuiz} />
        )}

        {screen === "result" && (
          <ResultScreen mode="initial" scores={scores} selectedCard={selectedCard} setSelectedCard={setSelectedCard} onConfirm={confirmPersona} onRestart={restartQuiz} />
        )}

        {screen === "profile" && chosenPersona && (
          <ProfileSetupScreen profile={profile} onUpdate={updateProfileField} onNext={finishProfileSetup} chosenPersona={chosenPersona} />
        )}

        {screen === "switch" && chosenPersona && (
          <ResultScreen mode="switch" scores={scores} selectedCard={selectedCard} setSelectedCard={setSelectedCard} onConfirm={confirmPersona} onRestart={restartQuiz} onBack={cancelSwitchPersona} />
        )}

        {screen === "app" && chosenPersona && (
          <>
            {/* 헤더 */}
            <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: C.mist }}>속마음</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted, letterSpacing: 0.5, marginTop: 2 }}>내 안의 나를 발견하세요</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={openSwitchPersona} style={{
                    display: "flex", alignItems: "center", gap: 6, background: C.panel, border: `1px solid ${C.line}`,
                    borderRadius: 999, padding: "6px 10px", cursor: "pointer",
                  }}>
                    <chosenPersona.icon size={13} color={chosenPersona.color} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mist }}>{chosenPersona.name}</span>
                    <ChevronRight size={11} color={C.muted} style={{ transform: "rotate(90deg)" }} />
                  </button>
                  <button onClick={handleLogout} title="로그아웃" style={{
                    background: C.panel, border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 8px", cursor: "pointer",
                    fontFamily: FONT_MONO, fontSize: 10.5, color: C.muted,
                  }}>
                    로그아웃
                  </button>
                </div>
              </div>

              <div style={{
                marginTop: 10, display: "flex", alignItems: "center", gap: 6,
                fontFamily: FONT_MONO, fontSize: 11, color: C.amber,
              }}>
                <Sparkles size={11} color={C.amber} />
                {creditBalance === null ? "크레딧 확인 중..." : `${creditBalance} CHAT`}
              </div>
              <div style={{
                marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between",
                background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 12px",
                opacity: midRound ? 0.5 : 1,
              }}>
                <div>
                  <div style={{ fontSize: 13, color: C.mist, fontWeight: 600 }}>Biz 모드</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>켜면 두 AI가 가상의 협업을 협상해요</div>
                </div>
                <Toggle checked={bizMode} onChange={setBizMode} color={C.teal} disabled={midRound} />
              </div>
            </div>

            {/* 탭 */}
            <div style={{ display: "flex", padding: "10px 18px 0", gap: 6 }}>
              {[{ id: "stage", label: "무대" }, { id: "visibility", label: "공개 범위" }].map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  flex: 1, padding: "9px 0", borderRadius: "10px 10px 0 0", border: "none", cursor: "pointer",
                  background: activeTab === t.id ? C.panel : "transparent",
                  color: activeTab === t.id ? C.mist : C.muted,
                  fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500, borderBottom: activeTab === t.id ? `2px solid ${chosenPersona.color}` : "2px solid transparent",
                }}>{t.label}</button>
              ))}
            </div>

            <div style={{ flex: 1, background: C.panel, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {activeTab === "stage" && (
                <StageScreen
                  chosenPersona={chosenPersona}
                  opponent={opponent}
                  opponents={customOpponent ? [customOpponent, ...OPPONENTS] : OPPONENTS}
                  realMembers={realMembers}
                  membersLoading={membersLoading}
                  onRefreshMembers={loadRealMembers}
                  onChooseMember={chooseRealMember}
                  opponentForm={opponentForm}
                  onChangeOpponentForm={updateOpponentForm}
                  onCreateCustomOpponent={createCustomOpponent}
                  onChooseOpponent={chooseOpponent}
                  onChangeOpponent={changeOpponent}
                  curtainOpen={curtainOpen}
                  transcript={transcript}
                  isPlaying={isPlaying}
                  turnLoading={turnLoading}
                  roundEnded={roundEnded}
                  verdict={verdict}
                  bizMode={bizMode}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onReset={resetRound}
                  scrollRef={scrollRef}
                  turnsPerRound={turnsPerRound}
                  roundCostChat={roundCostChat}
                  creditBalance={creditBalance}
                  creditError={creditError}
                />
              )}
              {activeTab === "visibility" && (
                <VisibilityScreen profile={profile} onUpdate={updateProfileField} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- 온보딩 화면 ----------
function OnboardingScreen({ step, onAnswer }) {
  const q = QUIZ[step];
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
        {QUIZ.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: i <= step ? C.amber : C.line, transition: "background 0.3s",
          }} />
        ))}
      </div>

      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, letterSpacing: 1 }}>
        {String(step + 1).padStart(2, "0")} / {String(QUIZ.length).padStart(2, "0")}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.mist, marginTop: 10, lineHeight: 1.35, fontWeight: 600 }}>
        {q.q}
      </div>

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => onAnswer(opt.k)} style={{
            textAlign: "left", padding: "16px 16px", borderRadius: 16, border: `1px solid ${C.line}`,
            background: C.panel, color: C.mist, fontSize: 14.5, cursor: "pointer", fontFamily: FONT_BODY,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.amber; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line; }}
          >
            <span>{opt.t}</span>
            <ChevronRight size={16} color={C.muted} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 24, fontSize: 12, color: C.muted, textAlign: "center" }}>
        답변을 바탕으로 당신 안의 세 가지 자아를 찾아드릴게요
      </div>
    </div>
  );
}

// ---------- 결과 화면 ----------
function ResultScreen({ mode = "initial", scores, selectedCard, setSelectedCard, onConfirm, onRestart, onBack }) {
  const isSwitch = mode === "switch";
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const ranked = Object.keys(PERSONAS).sort((a, b) => scores[b] - scores[a]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1 }}>
      {isSwitch ? (
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          color: C.muted, fontSize: 12, fontFamily: FONT_MONO, cursor: "pointer", padding: 0, marginBottom: 4,
        }}>
          <ArrowLeft size={13} /> 돌아가기
        </button>
      ) : (
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, letterSpacing: 1 }}>RESULT</div>
      )}
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.mist, marginTop: 8, fontWeight: 600 }}>
        {isSwitch ? "다른 자아로 전환할까요?" : "당신 안엔 세 가지 자아가 있어요"}
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
        {isSwitch
          ? "같은 진단 결과 안에서 무대에 세울 자아만 바꿀 수 있어요."
          : "무대에 세울 자아를 하나 선택하세요. 이 자아가 당신을 대신해 대화해요."}
      </div>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        {ranked.map((key, idx) => {
          const p = PERSONAS[key];
          const pct = Math.round((scores[key] / total) * 100);
          const selected = selectedCard === key;
          const Icon = p.icon;
          return (
            <button key={key} onClick={() => setSelectedCard(key)} style={{
              textAlign: "left", padding: 16, borderRadius: 18, cursor: "pointer",
              background: C.panel, border: `1.5px solid ${selected ? p.color : C.line}`,
              boxShadow: selected ? `0 0 0 3px ${p.color}22` : "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${p.color}22`,
                  }}>
                    <Icon size={16} color={p.color} />
                  </div>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.mist, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted }}>{p.title}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: p.color, fontWeight: 600 }}>{pct}%</div>
                  {idx === 0 && <div style={{ fontSize: 9, color: C.muted, fontFamily: FONT_MONO }}>최다 응답</div>}
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>{p.desc}</div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <button disabled={!selectedCard} onClick={onConfirm} style={{
          padding: "14px 0", borderRadius: 999, border: "none", cursor: selectedCard ? "pointer" : "not-allowed",
          background: selectedCard ? PERSONAS[selectedCard].color : C.line,
          color: selectedCard ? C.ink : C.muted, fontWeight: 700, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {isSwitch ? "이 자아로 전환하기" : "이 자아로 시작하기"} <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
        </button>
        <button onClick={onRestart} style={{ background: "none", border: "none", color: C.muted, fontSize: 11.5, cursor: "pointer" }}>
          {isSwitch ? "처음부터 다시 진단하기" : "질문 다시 하기"}
        </button>
      </div>
    </div>
  );
}

// ---------- 무대(대화) 화면 ----------
function StageScreen({
  chosenPersona, opponent, opponents, realMembers, membersLoading, onRefreshMembers, onChooseMember,
  opponentForm, onChangeOpponentForm, onCreateCustomOpponent,
  onChooseOpponent, onChangeOpponent, curtainOpen, transcript, isPlaying, turnLoading, roundEnded, verdict, bizMode, onPlay, onPause, onReset, scrollRef,
  turnsPerRound, roundCostChat, creditBalance, creditError,
}) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const insufficientCredits = typeof creditBalance === "number" && creditBalance < roundCostChat;

  if (!opponent) {
    const canCreate = opponentForm.name.trim().length > 0;
    const handleCreate = () => {
      onCreateCustomOpponent();
      setShowCustomForm(false);
    };
    return (
      <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, marginBottom: 4 }}>
          <Users size={14} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11 }}>대화 상대 선택</span>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
          상대를 고르면 두 AI가 당신을 대신해 대화를 시작해요.
        </div>

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: 4 }}>
          {/* 실제 회원 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted, letterSpacing: 1 }}>실제 회원</span>
            <button onClick={onRefreshMembers} style={{ background: "none", border: "none", color: C.muted, fontSize: 10.5, fontFamily: FONT_MONO, cursor: "pointer" }}>
              새로고침
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            {membersLoading ? (
              <div style={{ fontSize: 12.5, color: C.muted, padding: "10px 2px" }}>불러오는 중...</div>
            ) : realMembers.length === 0 ? (
              <div style={{
                fontSize: 12.5, color: C.muted, padding: 14, border: `1px dashed ${C.line}`, borderRadius: 14, lineHeight: 1.5,
              }}>
                아직 대화할 수 있는 다른 회원이 없어요. 다른 사람도 이 앱에 가입하면 여기에 나타나요.
              </div>
            ) : (
              realMembers.map((m) => {
                const p = PERSONAS[m.persona] || PERSONAS.warm;
                const Icon = p.icon;
                const preview = Object.entries(m.profile || {}).slice(0, 2);
                return (
                  <button key={m.memberId} onClick={() => onChooseMember(m)} style={{
                    textAlign: "left", padding: 14, borderRadius: 16, border: `1px solid ${C.line}`,
                    background: C.panel2, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 999, background: `${p.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={17} color={p.color} />
                    </div>
                    <div>
                      <div style={{ color: C.mist, fontWeight: 600, fontSize: 14, fontFamily: FONT_DISPLAY }}>
                        {p.name} 회원 · {m.memberId.slice(-4).toUpperCase()}
                      </div>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                        {preview.length ? preview.map(([k, v]) => `${FIELD_LABELS[k] || k} ${v}`).join(" · ") : "공개된 정보 없음"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* 가상 상대 (NPC) */}
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>가상 상대</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {opponents.map((o) => (
              <button key={o.id} onClick={() => onChooseOpponent(o)} style={{
                textAlign: "left", padding: 14, borderRadius: 16, border: `1px solid ${C.line}`,
                background: C.panel2, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 999, background: `${o.color}22`, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ color: o.color, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15 }}>
                    {(bizMode && o.company ? o.company : o.name).slice(0, 1)}
                  </span>
                </div>
                {bizMode && o.company ? (
                  <div>
                    <div style={{ color: C.mist, fontWeight: 600, fontSize: 14, fontFamily: FONT_DISPLAY }}>{o.company}</div>
                    <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{o.name} · {o.role}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: C.mist, fontWeight: 600, fontSize: 14, fontFamily: FONT_DISPLAY }}>{o.name}</div>
                    <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{o.bio}</div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* 상대 직접 만들기 */}
          <div style={{ marginTop: 14 }}>
            {!showCustomForm ? (
              <button onClick={() => setShowCustomForm(true)} style={{
                width: "100%", padding: "12px 0", borderRadius: 16, border: `1px dashed ${C.line}`,
                background: "none", color: C.muted, fontSize: 12.5, cursor: "pointer",
              }}>
                + 상대 직접 만들기
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <FieldInput label="이름" value={opponentForm.name} onChange={(v) => onChangeOpponentForm({ name: v })} placeholder="예: 예지" />
                <FieldInput label="회사 · 소속" value={opponentForm.company} onChange={(v) => onChangeOpponentForm({ company: v })} placeholder="예: 프리랜서, 또는 회사명" />
                <FieldInput label="직업 · 역할" value={opponentForm.role} onChange={(v) => onChangeOpponentForm({ role: v })} placeholder="예: 일러스트레이터" />
                <FieldInput label="어떤 사람인지 한 줄로" value={opponentForm.bio} onChange={(v) => onChangeOpponentForm({ bio: v })} placeholder="예: 그림 이야기를 하면 눈이 반짝이는 사람" multiline />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowCustomForm(false)} style={{
                    flex: 1, padding: "11px 0", borderRadius: 999, border: `1px solid ${C.line}`, background: "none",
                    color: C.muted, fontSize: 13, cursor: "pointer",
                  }}>
                    취소
                  </button>
                  <button disabled={!canCreate} onClick={handleCreate} style={{
                    flex: 2, padding: "11px 0", borderRadius: 999, border: "none",
                    cursor: canCreate ? "pointer" : "not-allowed",
                    background: canCreate ? chosenPersona.color : C.line,
                    color: canCreate ? C.ink : C.muted, fontWeight: 700, fontSize: 13,
                  }}>
                    이 상대와 대화하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const oppLabel = bizMode && opponent.company ? opponent.company : opponent.name;


  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.line}` }}>
        <button onClick={onChangeOpponent} disabled={curtainOpen && !roundEnded} style={{
          display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
          color: C.muted, fontSize: 11.5, fontFamily: FONT_MONO, cursor: curtainOpen && !roundEnded ? "not-allowed" : "pointer",
          opacity: curtainOpen && !roundEnded ? 0.4 : 1,
        }}>
          <ArrowLeft size={12} /> 다른 상대
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: chosenPersona.color, fontFamily: FONT_MONO }}>나</span>
          <span style={{ color: C.line }}>×</span>
          <span style={{ fontSize: 12, color: opponent.color, fontFamily: FONT_MONO }}>{oppLabel}</span>
        </div>
      </div>

      {!curtainOpen ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${chosenPersona.color}18, transparent 45%, transparent 55%, ${opponent.color}18)` }} />
          <div style={{ display: "flex", alignItems: "center", gap: 18, zIndex: 1 }}>
            <IdentityOrb color={chosenPersona.color} icon={chosenPersona.icon} label="나" />
            <Sparkles size={18} color={C.muted} />
            <IdentityOrb color={opponent.color} initial={oppLabel.slice(0, 1)} label={oppLabel} />
          </div>
          <div style={{ marginTop: 20, fontSize: 12.5, color: C.muted, textAlign: "center", maxWidth: 240, zIndex: 1 }}>
            {bizMode && opponent.company ? `${chosenPersona.name}과 ${opponent.company}의 협상 자리가 준비됐어요.` : `${chosenPersona.name}과 ${opponent.name}의 대화를 지켜보세요.`}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: C.muted, fontFamily: FONT_MONO, zIndex: 1 }}>
            이 라운드는 {roundCostChat} CHAT 소모돼요 {typeof creditBalance === "number" ? `(보유 ${creditBalance} CHAT)` : ""}
          </div>
          {(creditError || insufficientCredits) && (
            <div style={{
              marginTop: 10, padding: "8px 14px", borderRadius: 999, background: `${C.orchid}22`,
              color: C.orchid, fontSize: 12, zIndex: 1, textAlign: "center",
            }}>
              {creditError || "크레딧이 부족해요"}
            </div>
          )}
          <button onClick={onPlay} disabled={insufficientCredits} style={{
            marginTop: 22, padding: "13px 26px", borderRadius: 999, border: "none",
            cursor: insufficientCredits ? "not-allowed" : "pointer",
            background: insufficientCredits ? C.line : chosenPersona.color,
            color: insufficientCredits ? C.muted : C.ink, fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", gap: 8, zIndex: 1,
          }}>
            <Play size={15} /> {insufficientCredits ? "크레딧 부족" : "대화 시작"}
          </button>
          {insufficientCredits && (
            <div style={{ marginTop: 10, fontSize: 11, color: C.muted, zIndex: 1 }}>
              충전하기 (준비 중)
            </div>
          )}
        </div>
      ) : (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
            {transcript.map((line, i) => {
              const isMe = line.speaker === "me";
              const color = isMe ? chosenPersona.color : opponent.color;
              const label = isMe ? "나" : (bizMode && opponent.company ? `${opponent.company} · ${opponent.name}` : opponent.name);
              return (
                <div key={i} style={{ marginBottom: 18, animation: "fadeInUp 0.35s ease" }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1, color: color, marginBottom: 5, textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14.5, color: C.mist, lineHeight: 1.6 }}>{line.text}</div>
                  {i < transcript.length - 1 && <div style={{ height: 1, background: C.line, marginTop: 16, opacity: 0.5 }} />}
                </div>
              );
            })}
            {turnLoading && !roundEnded && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted, marginBottom: 6 }}>
                  {transcript.length % 2 === 0 ? "나" : (bizMode && opponent.company ? opponent.company : opponent.name)}
                </div>
                <TypingDots color={transcript.length % 2 === 0 ? chosenPersona.color : opponent.color} />
              </div>
            )}
            {roundEnded && verdict && (
              <div style={{
                marginTop: 10, padding: 16, borderRadius: 16, background: C.panel2, border: `1px solid ${C.line}`,
                animation: "fadeInUp 0.4s ease",
              }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted, letterSpacing: 1 }}>케미 스코어</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: chosenPersona.color, fontWeight: 700 }}>{verdict.chemistry}</div>
                </div>
                <div style={{ fontSize: 13, color: C.mist, marginTop: 6, lineHeight: 1.5 }}>{verdict.comment}</div>
                {bizMode && verdict.dealSummary && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 10, padding: "3px 8px", borderRadius: 999,
                      background: verdict.dealReached ? `${C.teal}22` : `${C.orchid}22`,
                      color: verdict.dealReached ? C.teal : C.orchid,
                    }}>
                      {verdict.dealReached ? "합의 도달" : "합의 불발"}
                    </span>
                    <div style={{ fontSize: 12.5, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>{verdict.dealSummary}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: "12px 20px 18px", borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, flexShrink: 0 }}>
              {Math.min(transcript.length, turnsPerRound)} / {turnsPerRound}
            </div>
            <div style={{ flex: 1, height: 3, borderRadius: 999, background: C.line, overflow: "hidden" }}>
              <div style={{ width: `${(Math.min(transcript.length, turnsPerRound) / turnsPerRound) * 100}%`, height: "100%", background: chosenPersona.color, transition: "width 0.3s" }} />
            </div>
            {!roundEnded ? (
              <button onClick={isPlaying ? onPause : onPlay} style={{
                width: 36, height: 36, borderRadius: 999, border: "none", cursor: "pointer",
                background: chosenPersona.color, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>
            ) : (
              <button onClick={onReset} style={{
                width: 36, height: 36, borderRadius: 999, border: `1px solid ${C.line}`, cursor: "pointer",
                background: "none", color: C.mist, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function IdentityOrb({ color, icon: Icon, initial, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999, background: `${color}22`,
        border: `1.5px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center",
        animation: "pulseGlow 2.6s infinite ease-in-out",
      }}>
        {Icon ? <Icon size={22} color={color} /> : (
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color }}>{initial}</span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: C.muted, fontFamily: FONT_MONO, maxWidth: 84, textAlign: "center" }}>{label}</div>
    </div>
  );
}

// ---------- 프로필 필드 에디터 (설정 탭 / 온보딩 공용) ----------
function ProfileFieldsEditor({ profile, onUpdate }) {
  const publicEntries = Object.entries(profile).filter(([, v]) => v.public);
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.entries(profile).map(([key, v]) => (
          <div key={key} style={{
            background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {v.public ? <Unlock size={12} color={C.teal} /> : <Lock size={12} color={C.muted} />}
                <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.mist }}>{FIELD_LABELS[key]}</span>
              </div>
              <Toggle checked={v.public} onChange={(val) => onUpdate(key, { public: val })} color={C.teal} />
            </div>
            <input
              value={v.value}
              onChange={(e) => onUpdate(key, { value: e.target.value })}
              style={{
                width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8,
                padding: "8px 10px", color: C.mist, fontSize: 13, outline: "none", fontFamily: FONT_BODY,
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22, marginBottom: 6, fontFamily: FONT_MONO, fontSize: 10, color: C.muted, letterSpacing: 1 }}>
        상대에게 보이는 프로필
      </div>
      <div style={{ background: C.ink, border: `1px dashed ${C.line}`, borderRadius: 14, padding: 14 }}>
        {publicEntries.length === 0 ? (
          <div style={{ fontSize: 12.5, color: C.muted }}>공개된 정보가 없어요. 상대는 당신에 대해 아무것도 알 수 없어요.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {publicEntries.map(([key, v]) => (
              <div key={key} style={{
                background: C.panel2, borderRadius: 999, padding: "6px 12px", fontSize: 12, color: C.mist,
              }}>
                <span style={{ color: C.muted, marginRight: 5 }}>{FIELD_LABELS[key]}</span>{v.value}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------- 공개 범위 화면 (설정 탭) ----------
function VisibilityScreen({ profile, onUpdate }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
        내 AI는 여기서 공개로 설정한 정보만 대화 중에 언급해요. 나머지는 물어봐도 얼버무려요.
      </div>
      <ProfileFieldsEditor profile={profile} onUpdate={onUpdate} />
    </div>
  );
}

// ---------- 온보딩: 프로필 입력 ----------
function ProfileSetupScreen({ profile, onUpdate, onNext, chosenPersona }) {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, letterSpacing: 1 }}>STEP 2 · PROFILE</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.mist, marginTop: 8, fontWeight: 600 }}>
        {chosenPersona.name}의 프로필을 채워주세요
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
        공개로 켠 정보만 내 AI가 대화 중에 언급해요. 나머지는 물어봐도 자연스럽게 얼버무려요.
      </div>

      <div style={{ flex: 1, overflowY: "auto", marginTop: 18, minHeight: 0 }}>
        <ProfileFieldsEditor profile={profile} onUpdate={onUpdate} />
      </div>

      <div style={{ paddingTop: 16, flexShrink: 0 }}>
        <button onClick={onNext} style={{
          width: "100%", padding: "14px 0", borderRadius: 999, border: "none", cursor: "pointer",
          background: chosenPersona.color, color: C.ink, fontWeight: 700, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          다음: 대화 상대 정하기 <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ---------- 회원가입 화면 ----------
function SignupScreen({ stage, email, setEmail, codeInput, setCodeInput, error, sending, onSendCode, onVerify, onBackToEmail }) {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, letterSpacing: 1 }}>SIGN UP</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.mist, marginTop: 8, fontWeight: 600, lineHeight: 1.35 }}>
        이메일로 간단히 확인할게요
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
        실제 회원들과 대화하려면 이메일 인증이 필요해요. 인증 후엔 성향 진단과 프로필 입력을 한 번만 하면 돼요.
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {stage === "email" ? (
          <>
            <FieldInput label="이메일" value={email} onChange={setEmail} placeholder="you@example.com" />
            {error && <div style={{ fontSize: 12, color: C.orchid }}>{error}</div>}
            <button disabled={sending} onClick={onSendCode} style={{
              padding: "14px 0", borderRadius: 999, border: "none", cursor: sending ? "not-allowed" : "pointer",
              background: C.amber, color: C.ink, fontWeight: 700, fontSize: 14,
            }}>
              {sending ? "전송 중..." : "인증 코드 받기"}
            </button>
          </>
        ) : (
          <>
            <div style={{
              background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14,
              fontSize: 12.5, color: C.muted, lineHeight: 1.6,
            }}>
              <b style={{ color: C.mist }}>{email}</b>로 인증 코드를 보냈어요. 메일함(스팸함 포함)을 확인해주세요.
            </div>
            <FieldInput label={`${email}로 받은 코드`} value={codeInput} onChange={setCodeInput} placeholder="6자리 코드 입력" />
            {error && <div style={{ fontSize: 12, color: C.orchid }}>{error}</div>}
            <button onClick={onVerify} style={{
              padding: "14px 0", borderRadius: 999, border: "none", cursor: "pointer",
              background: C.amber, color: C.ink, fontWeight: 700, fontSize: 14,
            }}>
              확인하고 시작하기
            </button>
            <button onClick={onBackToEmail} style={{ background: "none", border: "none", color: C.muted, fontSize: 11.5, cursor: "pointer" }}>
              이메일 다시 입력하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, multiline }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, marginBottom: 8 }}>{label}</div>
      <Tag
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={multiline ? 2 : undefined}
        style={{
          width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8,
          padding: "9px 10px", color: C.mist, fontSize: 13, outline: "none", fontFamily: FONT_BODY,
          resize: "none",
        }}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SokmaeumApp />);