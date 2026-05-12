import { useState, useEffect, useRef, useCallback } from "react";
import { UserPlus, ClipboardList, Brain, TrendingUp } from "lucide-react";

const phoneStyles = `
  .ps{display:flex;flex-direction:column;height:100%;animation:psFadeIn .3s ease}
  @keyframes psFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  .ptop{background:#E6A817;padding:6px 8px 5px;flex-shrink:0}
  .ptop-t{font-size:9px;font-weight:700;color:#412402;text-align:center}
  .ptop-s{font-size:6.5px;color:#633806;text-align:center;margin-top:1px}
  .pbdy{flex:1;overflow-y:auto;padding:7px 8px;scrollbar-width:none}
  .pbdy::-webkit-scrollbar{display:none}
  .pfield label{display:block;font-size:6.5px;color:#888;margin-bottom:2px}
  .pfield input,.pfield select{width:100%;border:1px solid #ddd;border-radius:4px;padding:3px 5px;font-size:7.5px;color:#222;background:#fafafa}
  .pgrid2{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:5px}
  .pbtn2{display:block;width:100%;background:#E6A817;color:#412402;border:none;border-radius:6px;padding:6px;font-size:8.5px;font-weight:700;cursor:pointer;margin-top:7px}
  .pbtn-g2{display:block;width:100%;background:#fff;color:#BA7517;border:1.5px solid #E6A817;border-radius:6px;padding:4px;font-size:7.5px;font-weight:600;cursor:pointer;margin-top:4px}
  .ptag2{display:inline-block;font-size:6.5px;padding:2px 6px;border-radius:8px;margin:2px 1px 0 0;cursor:pointer;font-weight:600}
  .ptag-a2{background:#FAEEDA;color:#854F0B}
  .ptag-g2{background:#EAF3DE;color:#3B6D11}
  .ptag-b2{background:#E6F1FB;color:#185FA5}
  .chip2{display:inline-flex;align-items:center;gap:2px;background:#EAF3DE;color:#27500A;border-radius:8px;padding:1px 6px;font-size:6.5px;margin:2px}
  .chip2 button{background:none;border:none;color:#27500A;cursor:pointer;font-size:9px;line-height:1;padding:0}
  .meal-block2{padding:3px 0;border-bottom:.5px solid #eee;margin-bottom:2px}
  .meal-lbl2{font-size:6.5px;color:#888;font-weight:700;margin-bottom:2px}
  .nbar-row2{display:flex;align-items:center;gap:3px;margin-bottom:4px}
  .nbar-lbl2{font-size:6.5px;color:#555;min-width:48px}
  .nbar-bg2{flex:1;height:4px;background:#eee;border-radius:2px;overflow:hidden}
  .nbar-fill2{height:100%;border-radius:2px;transition:width 1.1s cubic-bezier(.4,0,.2,1)}
  .nbar-val2{font-size:6.5px;font-weight:700;color:#222;min-width:24px;text-align:right}
  .sug-row2{display:flex;gap:5px;align-items:flex-start;padding:4px 0;border-bottom:.5px solid #f0f0f0}
  .sug-icon2{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;font-weight:700}
  .sug-text2{font-size:6.5px;color:#333;line-height:1.5}
  .sug-badge2{display:inline-block;font-size:5.5px;padding:1px 4px;border-radius:6px;margin-top:2px;font-weight:700}
  .scan-wrap2{text-align:center;padding:12px 6px}
  .scan-prog-bar2{width:80px;height:3px;background:#eee;border-radius:2px;margin:5px auto 0;overflow:hidden}
  .scan-fill2{height:100%;background:#E6A817;border-radius:2px;transition:width .5s ease}

  /* ── Responsive layout ── */
  .hiw-grid{
    display:grid;
    grid-template-columns:minmax(0,1fr) minmax(0,1fr);
    gap:72px;
    align-items:start;
  }
  @media(max-width:900px){
    .hiw-grid{
      grid-template-columns:1fr;
      gap:52px;
    }
    .hiw-demo-col{
      align-items:center !important;
    }
    .hiw-demo-inner{
      justify-content:center;
    }
  }
  @media(max-width:480px){
    .hiw-section-inner{
      padding:0 16px !important;
    }
    .hiw-heading{
      font-size:26px !important;
    }
    .hiw-sub{
      font-size:15px !important;
    }
  }
`;

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];
const QUICK_FOODS = [
  ["Oatmeal", "a"], ["Boiled egg", "a"], ["Grilled fish", "b"],
  ["Spinach", "g"], ["Brown rice", "g"], ["Milk", "a"],
  ["Orange", "a"], ["Lentils", "g"],
];

function AvatarSVG() {
  return (
    <svg width={320} height={600} viewBox="0 0 320 600" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}>
      <ellipse cx={175} cy={522} rx={70} ry={9} fill="#E8E8E8" />
      <rect x={148} y={406} width={26} height={108} rx={11} fill="#FAD5A5" stroke="#D4956A" strokeWidth={1} />
      <rect x={178} y={406} width={26} height={108} rx={11} fill="#FAD5A5" stroke="#D4956A" strokeWidth={1} />
      <rect x={143} y={406} width={34} height={68} rx={9} fill="#5F6B8A" stroke="#4a5470" strokeWidth={0.8} />
      <rect x={177} y={406} width={30} height={68} rx={9} fill="#5F6B8A" stroke="#4a5470" strokeWidth={0.8} />
      <ellipse cx={161} cy={514} rx={22} ry={7} fill="#333" />
      <ellipse cx={191} cy={514} rx={22} ry={7} fill="#333" />
      <rect x={139} y={508} width={44} height={8} rx={4} fill="#444" />
      <rect x={169} y={508} width={44} height={8} rx={4} fill="#444" />
      <rect x={122} y={206} width={106} height={206} rx={22} fill="#FAEEDA" stroke="#BA7517" strokeWidth={1.2} />
      <rect x={130} y={206} width={90} height={30} rx={12} fill="#E6A817" opacity={0.25} />
      <path d="M158 206 L154 232 M178 206 L182 232" stroke="#BA7517" strokeWidth={0.8} strokeLinecap="round" />
      <rect x={122} y={372} width={106} height={12} rx={4} fill="#8F7A6A" />
      <rect x={158} y={372} width={18} height={12} rx={2} fill="#BA7517" />
      <rect x={163} y={375} width={8} height={6} rx={1} fill="#E6A817" />
      <path d="M122 250 Q76 268 66 324" fill="none" stroke="#FAD5A5" strokeWidth={28} strokeLinecap="round" />
      <path d="M122 250 Q76 268 66 324" fill="none" stroke="#D4956A" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M228 250 Q252 268 256 336" fill="none" stroke="#FAD5A5" strokeWidth={28} strokeLinecap="round" />
      <path d="M228 250 Q252 268 256 336" fill="none" stroke="#D4956A" strokeWidth={1.2} strokeLinecap="round" />
      <rect x={253} y={334} width={7} height={152} rx={3.5} fill="#8F7A6A" />
      <ellipse cx={256} cy={484} rx={14} ry={5.5} fill="#8F7A6A" />
      <path d="M253 336 Q240 314 251 304" fill="none" stroke="#8F7A6A" strokeWidth={6} strokeLinecap="round" />
      <ellipse cx={66} cy={322} rx={24} ry={11} fill="#FAD5A5" stroke="#D4956A" strokeWidth={0.8} />
      <ellipse cx={66} cy={160} rx={20} ry={9} fill="#FAD5A5" stroke="#D4956A" strokeWidth={0.8} />
      <circle cx={175} cy={128} r={56} fill="#FAD5A5" stroke="#D4956A" strokeWidth={1.5} />
      <ellipse cx={175} cy={84} rx={52} ry={24} fill="white" stroke="#D3D1C7" strokeWidth={1} />
      <ellipse cx={122} cy={116} rx={20} ry={35} fill="white" stroke="#D3D1C7" strokeWidth={0.8} />
      <ellipse cx={228} cy={116} rx={20} ry={35} fill="white" stroke="#D3D1C7" strokeWidth={0.8} />
      <circle cx={162} cy={120} r={7.5} fill="white" stroke="#eee" strokeWidth={0.5} />
      <circle cx={188} cy={120} r={7.5} fill="white" stroke="#eee" strokeWidth={0.5} />
      <circle cx={162} cy={120} r={5} fill="#3d2b1f" />
      <circle cx={188} cy={120} r={5} fill="#3d2b1f" />
      <circle cx={164} cy={118} r={1.8} fill="white" />
      <circle cx={190} cy={118} r={1.8} fill="white" />
      <ellipse cx={175} cy={134} rx={8} ry={6} fill="#D4956A" opacity={0.6} />
      <path d="M169 136 Q175 140 181 136" fill="none" stroke="#BA7517" strokeWidth={0.8} strokeLinecap="round" />
      <path d="M159 150 Q175 164 191 150" fill="none" stroke="#BA7517" strokeWidth={2.2} strokeLinecap="round" />
      <ellipse cx={148} cy={148} rx={11} ry={6} fill="#F5C4B3" opacity={0.5} />
      <ellipse cx={202} cy={148} rx={11} ry={6} fill="#F5C4B3" opacity={0.5} />
      <ellipse cx={121} cy={128} rx={11} ry={15} fill="#FAD5A5" stroke="#D4956A" strokeWidth={1} />
      <ellipse cx={229} cy={128} rx={11} ry={15} fill="#FAD5A5" stroke="#D4956A" strokeWidth={1} />
    </svg>
  );
}

function FingerCursor({ pos, visible, pressed }) {
  if (!visible) return null;
  return (
    <svg width={22} height={36} viewBox="0 0 22 36" fill="none" style={{
      position: "absolute", left: pos.x, top: pos.y, opacity: 1, zIndex: 20,
      pointerEvents: "none", transition: "left .35s, top .35s",
      transform: pressed ? "scale(.85)" : "scale(1)", transformOrigin: "top center",
    }}>
      <path d="M4 36 Q2 30 2 22 L2 10 Q2 4 7 3 Q12 2 14 6 L14 18 Q16 16 19 18 Q21 20 20 25 L18 34 Q16 36 11 36 Z"
        fill="#FAD5A5" stroke="#D4956A" strokeWidth={1} />
    </svg>
  );
}

function SpinnerSVG() {
  return (
    <svg width={50} height={50} viewBox="0 0 50 50" fill="none" style={{ display: "block", margin: "0 auto 10px" }}>
      <circle cx={25} cy={25} r={23} fill="#FAEEDA" stroke="#E6A817" strokeWidth={1.5} />
      <circle cx={25} cy={25} r={15} fill="none" stroke="#BA7517" strokeWidth={1.5} strokeDasharray="6 3">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx={25} cy={25} r={6} fill="none" stroke="#E6A817" strokeWidth={2} strokeDasharray="4 2">
        <animateTransform attributeName="transform" type="rotate" from="360 25 25" to="0 25 25" dur="1.4s" repeatCount="indefinite" />
      </circle>
      <circle cx={25} cy={25} r={2.5} fill="#E6A817" />
    </svg>
  );
}

function Screen0Profile({ s0bodyRef, onStart }) {
  return (
    <div className="ps" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="ptop">
        <div className="ptop-t">NutriTrack AI</div>
        <div className="ptop-s">Daily health companion</div>
      </div>
      <div className="pbdy" ref={s0bodyRef}>
        <div style={{ textAlign: "center", padding: "5px 0 8px" }}>
          <svg width={38} height={38} viewBox="0 0 38 38" fill="none">
            <circle cx={19} cy={19} r={18} fill="#FAEEDA" stroke="#E6A817" strokeWidth={1.5} />
            <path d="M11 23 Q19 30 27 23" fill="none" stroke="#BA7517" strokeWidth={1.5} strokeLinecap="round" />
            <circle cx={14} cy={17} r={2.2} fill="#3d2b1f" />
            <circle cx={24} cy={17} r={2.2} fill="#3d2b1f" />
            <circle cx={14.8} cy={16} r={0.9} fill="white" />
            <circle cx={24.8} cy={16} r={0.9} fill="white" />
          </svg>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#222", marginTop: 4 }}>Good morning, George!</div>
          <div style={{ fontSize: 7, color: "#888", marginTop: 1 }}>Set up your profile to begin</div>
        </div>
        <div className="pgrid2">
          <div className="pfield"><label>Name</label><input defaultValue="George" readOnly /></div>
          <div className="pfield"><label>Age</label><input type="number" defaultValue={72} readOnly /></div>
        </div>
        <div className="pgrid2">
          <div className="pfield"><label>Height (cm)</label><input type="number" defaultValue={170} readOnly /></div>
          <div className="pfield"><label>Weight (kg)</label><input type="number" defaultValue={78} readOnly /></div>
        </div>
        <div className="pfield" style={{ marginBottom: 5 }}>
          <label>Gender</label>
          <select defaultValue="Male"><option>Male</option><option>Female</option></select>
        </div>
        <button className="pbtn2" onClick={onStart}>Start tracking my meals →</button>
      </div>
    </div>
  );
}

function Screen1Meals({ s1bodyRef, foods, foodInput, setFoodInput, onQuickAdd, onRemove, onAnalyse, onBack }) {
  return (
    <div className="ps" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="ptop">
        <div className="ptop-t">Log meals</div>
        <div className="ptop-s">George's meals today</div>
      </div>
      <div className="pbdy" ref={s1bodyRef}>
        {MEALS.map((m) => {
          const mf = foods.filter((f) => f.meal === m);
          return (
            <div key={m} className="meal-block2">
              <div className="meal-lbl2">{m}</div>
              <div>
                {mf.length ? mf.map((f) => (
                  <span key={f.id} className="chip2">{f.name}
                    <button onClick={() => onRemove(f.id)}>×</button>
                  </span>
                )) : <span style={{ fontSize: 7, color: "#bbb", fontStyle: "italic" }}>Nothing yet</span>}
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 7, color: "#888", marginBottom: 3 }}>Add food item</div>
          <div style={{ display: "flex", gap: 4 }}>
            <input value={foodInput} onChange={(e) => setFoodInput(e.target.value)} placeholder="e.g. brown rice"
              style={{ flex: 1, border: "1px solid #ddd", borderRadius: 5, padding: "4px 6px", fontSize: 8, color: "#222", background: "#fafafa" }} />
            <button onClick={() => { if (foodInput.trim()) { onQuickAdd(foodInput.trim(), "Breakfast"); setFoodInput(""); } }}
              style={{ background: "#E6A817", color: "#412402", border: "none", borderRadius: 5, padding: "4px 8px", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>+</button>
          </div>
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap" }}>
            {QUICK_FOODS.map(([name, type]) => (
              <span key={name} className={`ptag2 ptag-${type}2`} onClick={() => onQuickAdd(name, "Breakfast")}>{name}</span>
            ))}
          </div>
        </div>
        {foods.length > 0 && <button className="pbtn2" onClick={onAnalyse}>Analyse my nutrition →</button>}
        <button className="pbtn-g2" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

function Screen2Scanning({ scanProgress, scanStep }) {
  return (
    <div className="ps" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="ptop">
        <div className="ptop-t">AI Analysing</div>
        <div className="ptop-s">Please wait…</div>
      </div>
      <div className="pbdy">
        <div className="scan-wrap2">
          <SpinnerSVG />
          <div style={{ fontSize: 9, fontWeight: 700, color: "#BA7517" }}>Scanning your meals…</div>
          <div style={{ fontSize: 7, color: "#888", marginTop: 4, lineHeight: 1.6 }}>Extracting proteins, vitamins,<br />fats &amp; minerals</div>
          <div style={{ fontSize: 7, color: "#BA7517", fontWeight: 600, marginTop: 8, minHeight: 12 }}>{scanStep}</div>
          <div className="scan-prog-bar2"><div className="scan-fill2" style={{ width: `${scanProgress}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

function Screen3Results({ s3bodyRef, foods, onBack }) {
  const weight = 78;
  const b = Math.min(Math.max(foods.length, 3), 7);
  const prot = Math.round(16 + b * 6), carbs = Math.round(32 + b * 9), fat = Math.round(10 + b * 3.5),
    fiber = Math.round(5 + b * 2), vitC = Math.round(22 + b * 11),
    calcium = Math.round(140 + b * 50), vitD = Math.round(2 + b * 1.4);
  const nutrs = [
    { n: "Protein", v: prot, t: 65, c: "#378ADD" }, { n: "Carbs", v: carbs, t: 130, c: "#E6A817" },
    { n: "Fat", v: fat, t: 55, c: "#D4537E" }, { n: "Fiber", v: fiber, t: 28, c: "#639922" },
    { n: "Vitamin C", v: vitC, t: 90, c: "#E6A817" }, { n: "Calcium", v: calcium, t: 1200, c: "#185FA5" },
    { n: "Vit D", v: vitD, t: 20, c: "#BA7517" },
  ];
  const sugs = [];
  if (prot < 55) sugs.push({ bg: "#E6F1FB", tc: "#0C447C", tag: "Protein", txt: `Protein is ${prot}g — aim for 65g. Add eggs, lentils or fish.` });
  if (calcium < 900) sugs.push({ bg: "#FAEEDA", tc: "#854F0B", tag: "Calcium", txt: `Calcium low (${calcium}mg). Try dairy, tofu or leafy greens.` });
  if (vitD < 15) sugs.push({ bg: "#FAEEDA", tc: "#854F0B", tag: "Vit D", txt: `Vitamin D at ${vitD}mcg — consider fortified foods or sun.` });
  if (fiber < 20) sugs.push({ bg: "#EAF3DE", tc: "#3B6D11", tag: "Fiber", txt: `Fiber is ${fiber}g. Oats and vegetables support digestion.` });
  if (!sugs.length) sugs.push({ bg: "#EAF3DE", tc: "#3B6D11", tag: "Excellent", txt: "Great balance today! Keep varying your meals this week." });
  sugs.push({ bg: "#E6F1FB", tc: "#0C447C", tag: "Hydration", txt: `Target ${Math.round(weight * 0.033 * 10) / 10}L of water daily for kidney health.` });

  return (
    <div className="ps" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="ptop">
        <div className="ptop-t">Nutrition Report</div>
        <div className="ptop-s">George's results</div>
      </div>
      <div className="pbdy" ref={s3bodyRef}>
        <div style={{ fontSize: 7, fontWeight: 700, color: "#888", letterSpacing: ".06em", marginBottom: 7, textTransform: "uppercase" }}>Daily breakdown</div>
        {nutrs.map(({ n, v, t, c }) => (
          <div key={n} className="nbar-row2">
            <span className="nbar-lbl2">{n}</span>
            <div className="nbar-bg2"><div className="nbar-fill2" style={{ background: c, width: `${Math.min(Math.round(v / t * 100), 100)}%` }} /></div>
            <span className="nbar-val2">{v}</span>
          </div>
        ))}
        <div style={{ fontSize: 7, fontWeight: 700, color: "#888", letterSpacing: ".06em", margin: "9px 0 5px", textTransform: "uppercase" }}>AI suggestions</div>
        {sugs.map((s, i) => (
          <div key={i} className="sug-row2">
            <div className="sug-icon2" style={{ background: s.bg, color: s.tc }}>{s.tag[0]}</div>
            <div>
              <div className="sug-text2">{s.txt}</div>
              <span className="sug-badge2" style={{ background: s.bg, color: s.tc }}>{s.tag}</span>
            </div>
          </div>
        ))}
        <button className="pbtn-g2" style={{ marginTop: 8 }} onClick={onBack}>Log more meals</button>
      </div>
    </div>
  );
}

function RecoveryStorySection() {
  const [screen, setScreen] = useState(0);
  const [foods, setFoods] = useState([]);
  const [foodInput, setFoodInput] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");
  const [fingerPos, setFingerPos] = useState({ x: 190, y: 380 });
  const [fingerVisible, setFingerVisible] = useState(false);
  const [fingerPressed, setFingerPressed] = useState(false);
  const [demoLabel, setDemoLabel] = useState("");
  const s0bodyRef = useRef(null);
  const s1bodyRef = useRef(null);
  const s3bodyRef = useRef(null);
  // Ref to cancel the current demo loop if component unmounts
  const cancelledRef = useRef(false);

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const animScroll = (ref, from, to, dur) => new Promise((resolve) => {
    if (!ref.current) { resolve(); return; }
    const start = performance.now();
    const step = (now) => {
      if (cancelledRef.current) { resolve(); return; }
      const p = Math.min((now - start) / dur, 1);
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      ref.current.scrollTop = from + (to - from) * ease;
      if (p < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });

  const moveFinger = (x, y) => new Promise((resolve) => {
    setFingerVisible(true); setFingerPos({ x, y });
    setTimeout(() => {
      setFingerPressed(true);
      setTimeout(() => { setFingerPressed(false); resolve(); }, 200);
    }, 350);
  });

  const hideFinger = () => { setFingerVisible(false); setFingerPressed(false); };

  const runScan = () => new Promise((resolve) => {
    const steps = ["Identifying foods…", "Calculating macros…", "Checking vitamins…", "Comparing targets…", "Generating advice…"];
    let i = 0; setScanProgress(0); setScanStep("");
    const iv = setInterval(() => {
      if (cancelledRef.current) { clearInterval(iv); resolve(); return; }
      if (i < steps.length) { setScanStep(steps[i]); setScanProgress(((i + 1) / steps.length) * 100); i++; }
      else { clearInterval(iv); setTimeout(resolve, 300); }
    }, 550);
  });

  const runDemo = useCallback(async () => {
    // Reset & restart loop indefinitely
    while (!cancelledRef.current) {
      setFoods([]); setScreen(0); setDemoLabel(""); hideFinger();
      await delay(800); if (cancelledRef.current) break;

      setDemoLabel("George enters his profile…");
      await moveFinger(168, 268); hideFinger(); await delay(1200); if (cancelledRef.current) break;

      setDemoLabel("Scrolling down to Start…");
      await animScroll(s0bodyRef, 0, 80, 700); await delay(400); if (cancelledRef.current) break;
      await moveFinger(194, 412); hideFinger();
      setDemoLabel('Tapping "Start tracking"…'); await delay(400); if (cancelledRef.current) break;

      setScreen(1); await delay(600); if (cancelledRef.current) break;

      setDemoLabel("Adding breakfast foods…");
      await moveFinger(172, 328); hideFinger();
      setFoods((p) => [...p, { id: "d1", name: "Oatmeal", meal: "Breakfast" }]); await delay(350); if (cancelledRef.current) break;
      await moveFinger(196, 328); hideFinger();
      setFoods((p) => [...p, { id: "d2", name: "Boiled egg", meal: "Breakfast" }]); await delay(350); if (cancelledRef.current) break;
      await moveFinger(172, 342); hideFinger();
      setFoods((p) => [...p, { id: "d3", name: "Orange juice", meal: "Breakfast" }]); await delay(500); if (cancelledRef.current) break;

      setDemoLabel("Typing a custom food…");
      await moveFinger(168, 360); hideFinger(); await delay(400); if (cancelledRef.current) break;
      const text = "Greek yogurt";
      for (let i = 0; i <= text.length; i++) {
        if (cancelledRef.current) break;
        await delay(80); setFoodInput(text.slice(0, i));
      }
      if (cancelledRef.current) break;

      await delay(600); setDemoLabel("Pressing + to add…");
      await moveFinger(248, 360); hideFinger();
      setFoods((p) => [...p, { id: "d4", name: "Greek yogurt", meal: "Breakfast" }]);
      setFoodInput(""); await delay(500); if (cancelledRef.current) break;

      setDemoLabel("Scrolling to Analyse…");
      await animScroll(s1bodyRef, 0, 160, 800); await delay(400); if (cancelledRef.current) break;
      await moveFinger(194, 424); hideFinger();
      setDemoLabel("Tapping Analyse…"); await delay(400); if (cancelledRef.current) break;

      setScreen(2);
      await runScan(); await delay(300); if (cancelledRef.current) break;

      setScreen(3); setDemoLabel("AI report ready!");
      await delay(700); if (cancelledRef.current) break;
      await animScroll(s3bodyRef, 0, 120, 1200); if (cancelledRef.current) break;

      // Pause on results screen before looping
      await delay(2200); if (cancelledRef.current) break;
      setDemoLabel("Restarting demo…");
      hideFinger();
      await delay(900); if (cancelledRef.current) break;
      // Loop back to top automatically
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    const t = setTimeout(runDemo, 800);
    return () => {
      cancelledRef.current = true;
      clearTimeout(t);
    };
  }, [runDemo]);

  const handleAnalyse = () => {
    setScreen(2);
    setTimeout(() => { runScan().then(() => { setScreen(3); }); }, 100);
  };

  const handleReplay = () => {
    cancelledRef.current = true;
    setTimeout(() => {
      cancelledRef.current = false;
      setFoods([]); setScanProgress(0); setScanStep(""); setScreen(0); setDemoLabel(""); hideFinger();
      setTimeout(runDemo, 300);
    }, 100);
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{phoneStyles}</style>
      <div style={{ position: "relative", width: 320, height: 600, flexShrink: 0 }}>
        <AvatarSVG />
        <div style={{ position: "absolute", left: 110, top: 160, width: 168, height: 300, background: "#1a1a2e", borderRadius: 28, border: "3.5px solid #2d2d4a", zIndex: 5 }} />
        <div style={{ position: "absolute", top: 162, left: 175, transform: "translateX(-50%)", width: 56, height: 12, background: "#1a1a2e", borderRadius: "0 0 10px 10px", zIndex: 7 }} />
        <div style={{ position: "absolute", left: 278, top: 222, width: 5, height: 20, background: "#2d2d4a", borderRadius: "0 3px 3px 0", zIndex: 6 }} />
        <div style={{ position: "absolute", top: 172, left: 114, width: 160, height: 288, background: "#fff", borderRadius: 20, overflow: "hidden", zIndex: 6 }}>
          {screen === 0 && <Screen0Profile s0bodyRef={s0bodyRef} onStart={() => setScreen(1)} />}
          {screen === 1 && <Screen1Meals s1bodyRef={s1bodyRef} foods={foods} foodInput={foodInput} setFoodInput={setFoodInput}
            onQuickAdd={(name, meal) => setFoods((p) => [...p, { id: Date.now() + "r" + Math.random(), name, meal }])}
            onRemove={(id) => setFoods((p) => p.filter((f) => f.id !== id))}
            onAnalyse={handleAnalyse} onBack={() => setScreen(0)} />}
          {screen === 2 && <Screen2Scanning scanProgress={scanProgress} scanStep={scanStep} />}
          {screen === 3 && <Screen3Results s3bodyRef={s3bodyRef} foods={foods} onBack={() => setScreen(1)} />}
        </div>
        <FingerCursor pos={fingerPos} visible={fingerVisible} pressed={fingerPressed} />
      </div>

      {/* Demo label + replay */}
      <div style={{ paddingLeft: 114, marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#BA7517", fontWeight: 500, flex: 1, minHeight: 16 }}>{demoLabel}</span>
        <button
          onClick={handleReplay}
          style={{ background: "#FAEEDA", color: "#854F0B", border: "1.5px solid #E6A817", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Replay demo
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Process Steps
// ─────────────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Register Your Institution",
    description: "Care institutions register and onboard elderly residents. Each resident gets a secure profile linked to your facility.",
    accent: "#185FA5",
    light: "#E6F1FB",
    mid: "#B5D4F4",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Log Daily Health Data",
    description: "Track weight, meals, and medical conditions daily. Our intuitive interface makes data entry quick and accurate.",
    accent: "#3B6D11",
    light: "#EAF3DE",
    mid: "#C0DD97",
  },
  {
    number: "03",
    icon: Brain,
    title: "AI Generates Insights",
    description: "Our AI engine analyzes health patterns and generates personalized nutrition recommendations and diet plans.",
    accent: "#533AB7",
    light: "#EEEDFE",
    mid: "#AFA9EC",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Monitor & Improve",
    description: "Track progress with predictive analytics, receive smart alerts, and continually improve resident health outcomes.",
    accent: "#854F0B",
    light: "#FAEEDA",
    mid: "#FAC775",
  },
];

function ProcessStep({ step, isLast }) {
  const Icon = step.icon;
  return (
    <div style={{ display: "flex", gap: 20, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 56 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: step.light,
          border: `2px solid ${step.mid}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, position: "relative", zIndex: 1,
        }}>
          <Icon size={22} style={{ color: step.accent }} />
        </div>
        {!isLast && (
          <div style={{ flex: 1, width: 2, marginTop: 6, marginBottom: 6, position: "relative" }}>
            <div style={{
              width: "100%", height: "100%",
              backgroundImage: `repeating-linear-gradient(to bottom, ${step.mid} 0px, ${step.mid} 4px, transparent 4px, transparent 10px)`,
              borderRadius: 2,
            }} />
          </div>
        )}
      </div>
      <div style={{ paddingTop: 10, paddingBottom: isLast ? 0 : 32, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: step.mid, letterSpacing: ".08em", fontFamily: "monospace" }}>
            {step.number}
          </span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1a1a2e", lineHeight: 1.3 }}>{step.title}</h3>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{step.description}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      style={{ padding: "80px 0", background: "#ffffff", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="hiw-section-inner" style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#185FA5", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Simple Process
          </p>
          <h2 className="hiw-heading" style={{ margin: "0 0 16px", fontSize: 36, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
            How NutritionX AI Works
          </h2>
          <p className="hiw-sub" style={{ margin: "0 auto", fontSize: 17, color: "#6b7280", maxWidth: 520, lineHeight: 1.7 }}>
            From registration to actionable insights in four simple steps. Designed for busy care professionals.
          </p>
        </div>

        {/* Two-column body */}
        <div className="hiw-grid">

          {/* LEFT — demo */}
          <div className="hiw-demo-col" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div className="hiw-demo-inner" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E6A817" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#854F0B", textTransform: "uppercase", letterSpacing: ".08em" }}>Live demo</span>
            </div>
            <RecoveryStorySection />
          </div>

          {/* RIGHT — steps */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 8 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#639922" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#3B6D11", textTransform: "uppercase", letterSpacing: ".08em" }}>Step by step</span>
              </div>
              <p style={{ margin: 0, fontSize: 15, color: "#6b7280", lineHeight: 1.65 }}>
                Our platform guides care teams through a structured workflow — from first setup to continuous health monitoring.
              </p>
            </div>
            <div>
              {steps.map((step, i) => (
                <ProcessStep key={step.number} step={step} isLast={i === steps.length - 1} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}