import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import  RecoveryStorySection from './RecoverySection';

const avatars = ['JM', 'AN', 'RK', 'CM', 'DU'];
const avatarColors = ['#bbf7d0','#86efac','#4ade80','#a7f3d0','#6ee7b7'];

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1600&auto=format&fit=crop',
];

const STEPS = ['Scan', 'Analyze', 'Insights', 'Coach'];

const TOKENS = ['Avocado','Quinoa','Cherry tomato','Olive oil','Spinach','Lemon','Feta'];

const NUTRIENTS = [
  { name: 'Protein',       val: 72, color: '#4ade80' },
  { name: 'Carbs',         val: 45, color: '#fbbf24' },
  { name: 'Healthy fats',  val: 88, color: '#60a5fa' },
  { name: 'Fiber',         val: 91, color: '#a78bfa' },
  { name: 'Vitamins',      val: 65, color: '#f472b6' },
];

const INSIGHTS = [
  { icon: '↑', color: '#4ade80', text: 'High omega-3 — great for brain health' },
  { icon: '✓', color: '#4ade80', text: 'Antioxidants from tomatoes reduce oxidative stress' },
  { icon: '!', color: '#fbbf24', text: 'Add complex carbs for sustained energy' },
  { icon: '↑', color: '#60a5fa', text: 'Excellent hydration profile detected' },
];

const CHAT_REPLIES = {
  default:  "This meal is rich in healthy fats and plant-based protein — ideal for a midday boost without a glycemic spike.",
  protein:  "Your protein here covers ~28% of your daily target. Quinoa + avocado = a complete amino acid profile.",
  calories: "Approximately 420 kcal — balanced for lunch within a 1,800–2,200 kcal daily plan.",
  fat:      "Fats come from avocado and olive oil — monounsaturated fats that actively support heart health.",
};

/* ─── Scan step ─────────────────────────────────────────────── */
function ScanStep() {
  const [visible, setVisible] = useState([]);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setVisible(v => {
        if (v.length >= TOKENS.length) return [];
        return [...v, TOKENS[i % TOKENS.length]];
      });
      i++;
    }, 520);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '1.45', border: '1px solid rgba(74,222,128,.4)', background: 'rgba(0,0,0,.4)' }}>
      <img src={FOOD_IMAGES[0]} alt="food" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,.3)' }} />

      {/* Animated scan line */}
      <div className="absolute left-0 right-0 h-0.5 pointer-events-none" style={{
        background: 'linear-gradient(90deg,transparent,rgba(74,222,128,.9),transparent)',
        animation: 'scanLine 2.4s ease-in-out infinite alternate',
        animationName: 'heroScanLine',
      }} />

      {/* Pulse rings */}
      {[{ top: '30%', left: '28%', size: 60, delay: '0s' }, { top: '30%', left: '28%', size: 60, delay: '.5s' }, { top: '62%', left: '58%', size: 44, delay: '.3s' }].map((r, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{
          width: r.size, height: r.size,
          top: r.top, left: r.left,
          marginTop: -r.size / 2, marginLeft: -r.size / 2,
          border: '2px solid rgba(74,222,128,.7)',
          animation: 'heroPulseRing 1.8s ease-out infinite',
          animationDelay: r.delay,
        }} />
      ))}

      {/* Live badge */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: 'rgba(0,0,0,.65)', border: '1px solid rgba(74,222,128,.6)' }}>
        <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'heroOrbPulse 1.2s infinite' }} />
        <span className="text-green-200 text-xs font-bold">NutriVision scanning</span>
      </div>

      {/* Token chips */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 rounded-xl px-3 py-2" style={{ background: 'rgba(0,0,0,.7)' }}>
        <p className="text-white/50 text-xs font-bold tracking-widest uppercase mb-1">Detected</p>
        <div className="flex flex-wrap gap-1">
          {visible.map((t, i) => (
            <span key={t + i} className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
              background: 'rgba(74,222,128,.2)',
              border: '1px solid rgba(74,222,128,.5)',
              color: '#bbf7d0',
              animation: 'heroTokenFloat .35s ease forwards',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Analyze step ───────────────────────────────────────────── */
function AnalyzeStep() {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,.42)', border: '1px solid rgba(74,222,128,.35)' }}>
      <p className="text-white/50 text-xs font-bold tracking-widest uppercase mb-3">Nutrient breakdown</p>
      <div className="flex flex-col gap-2.5 mb-4">
        {NUTRIENTS.map((n, i) => (
          <div key={n.name} className="flex items-center gap-2.5" style={{ animation: `heroFloatUp .4s ease ${i * .1}s forwards`, opacity: 0 }}>
            <span className="text-white/70 text-xs font-semibold w-24 flex-shrink-0">{n.name}</span>
            <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
              <div className="h-full rounded-full" style={{
                width: `${n.val}%`,
                background: n.color,
                animation: `heroBarGrow .8s ease ${.3 + i * .1}s forwards`,
                transform: 'scaleX(0)',
                transformOrigin: 'left',
              }} />
            </div>
            <span className="text-xs font-bold w-8 text-right" style={{ color: n.color }}>{n.val}%</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: '420', unit: 'kcal', color: '#4ade80', bg: 'rgba(74,222,128,.12)', border: 'rgba(74,222,128,.3)' },
          { val: 'A+', unit: 'Health score', color: '#fbbf24', bg: 'rgba(251,191,36,.12)', border: 'rgba(251,191,36,.3)' },
          { val: '68%', unit: 'Daily goal', color: '#60a5fa', bg: 'rgba(96,165,250,.12)', border: 'rgba(96,165,250,.3)' },
        ].map(c => (
          <div key={c.unit} className="rounded-xl p-2 text-center" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <div className="font-extrabold text-lg" style={{ color: c.color }}>{c.val}</div>
            <div className="text-white/50 text-xs">{c.unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Insights step ──────────────────────────────────────────── */
function InsightsStep() {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,.42)', border: '1px solid rgba(74,222,128,.35)' }}>
      <p className="text-white/50 text-xs font-bold tracking-widest uppercase mb-2">AI insights</p>
      <div className="flex flex-col">
        {INSIGHTS.map((ins, i) => (
          <div key={i} className="flex items-start gap-2.5 py-2" style={{
            borderBottom: i < INSIGHTS.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none',
            animation: `heroFloatUp .45s ease ${i * .15}s forwards`,
            opacity: 0,
          }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold" style={{ background: 'rgba(255,255,255,.1)', color: ins.color }}>{ins.icon}</div>
            <span className="text-white/82 text-xs leading-snug">{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Coach step ─────────────────────────────────────────────── */
function CoachStep() {
  const [msgs, setMsgs] = useState([{ who: 'ai', text: "Hello! I've analyzed your meal. What would you like to know?" }]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = () => {
    const val = input.trim();
    if (!val) return;
    setInput('');
    setMsgs(m => [...m, { who: 'user', text: val }]);
    const lc = val.toLowerCase();
    let reply = CHAT_REPLIES.default;
    if (lc.includes('protein')) reply = CHAT_REPLIES.protein;
    else if (lc.includes('calori')) reply = CHAT_REPLIES.calories;
    else if (lc.includes('fat')) reply = CHAT_REPLIES.fat;
    setTimeout(() => setMsgs(m => [...m, { who: 'ai', text: reply }]), 650);
  };

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'rgba(0,0,0,.42)', border: '1px solid rgba(74,222,128,.35)' }}>
      <p className="text-white/50 text-xs font-bold tracking-widest uppercase">NutriCoach</p>
      <div className="flex flex-col gap-2 min-h-28 overflow-y-auto max-h-36">
        {msgs.map((m, i) => (
          <div key={i} className="text-xs py-1.5 px-3 rounded-xl leading-snug max-w-[90%]"
            style={m.who === 'ai'
              ? { background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.85)', alignSelf: 'flex-start', borderRadius: '12px 12px 12px 2px' }
              : { background: 'rgba(74,222,128,.25)', border: '1px solid rgba(74,222,128,.4)', color: '#d1fae5', alignSelf: 'flex-end', borderRadius: '12px 12px 2px 12px' }
            }>{m.text}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-1">
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your meal…"
          className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
          style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}
        />
        <button onClick={send} className="bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-lg border-none cursor-pointer">Send</button>
      </div>
    </div>
  );
}

/* ─── Main HeroSection ───────────────────────────────────────── */
export default function HeroSection() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="hero" className="relative overflow-hidden" style={{
      background: 'linear-gradient(120deg, #15803d 0%, #16a34a 45%, #22c55e 100%)',
      minHeight: '420px',
    }}>
      {/* Keyframe injection */}
      <style>{`
        @keyframes heroScanLine { 0%{top:10%} 100%{top:85%} }
        @keyframes heroPulseRing { 0%{transform:scale(.8);opacity:.7} 70%{transform:scale(1.3);opacity:0} 100%{transform:scale(1.3);opacity:0} }
        @keyframes heroOrbPulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes heroFloatUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heroBarGrow { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes heroTokenFloat { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes heroBgFade {
          0%,100%{opacity:0;transform:scale(1.04)}
          8%,30%{opacity:1;transform:scale(1)}
          38%{opacity:0;transform:scale(.97)}
        }
        .hero-food-slide { position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;animation:heroBgFade 25s infinite; }
        .hero-food-slide:nth-child(1){animation-delay:0s}
        .hero-food-slide:nth-child(2){animation-delay:5s}
        .hero-food-slide:nth-child(3){animation-delay:10s}
        .hero-food-slide:nth-child(4){animation-delay:15s}
        .hero-food-slide:nth-child(5){animation-delay:20s}
      `}</style>

      {/* Food slideshow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {FOOD_IMAGES.map((src, i) => (
          <div key={i} className="hero-food-slide" style={{ backgroundImage: `url('${src}')` }} />
        ))}
      </div>

      {/* Green overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(120deg, rgba(20,83,45,.92) 0%, rgba(21,128,61,.82) 40%, rgba(22,163,74,.58) 100%)',
      }} />

      {/* Dark diagonal right */}
      <div className="absolute top-0 right-0 bottom-0 pointer-events-none" style={{
        width: '55%',
        background: 'linear-gradient(135deg, rgba(0,0,0,.07), rgba(0,0,0,.22))',
        clipPath: 'polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)',
      }} />

      {/* Radial glow */}
      <div className="absolute pointer-events-none rounded-full" style={{
        width: 500, height: 500, top: -112, right: -80,
        background: 'radial-gradient(circle, rgba(255,255,255,.08) 0%, transparent 65%)',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-12 py-16 grid lg:grid-cols-2 gap-10 items-center">

        {/* LEFT */}
        <div className="flex flex-col">
          <h1 className="text-white font-extrabold leading-tight mb-8"
            style={{ fontSize: 'clamp(32px,4.2vw,54px)', letterSpacing: '-0.025em' }}>
            AI-powered Food<br />Analyzer for a Better<br />Quality of Life.
          </h1>

          <div className="flex flex-wrap gap-3.5 mb-11">
            <button onClick={() => navigate('/register')}
              className="bg-white text-green-700 font-semibold text-sm px-6 py-3.5 rounded-lg hover:bg-green-50 transition-all">
              Get Started Free
            </button>
            <button onClick={() => navigate('/features')}
              className="font-semibold text-sm text-white px-6 py-3.5 rounded-lg border border-white/40 hover:bg-white/20 transition-all"
              style={{ background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(6px)' }}>
              Explore our features
            </button>
          </div>

          <p className="text-xs font-bold tracking-widest uppercase text-white/60 mb-3">Testimonials</p>
          <div className="flex items-center">
            {avatars.map((initials, i) => (
              <div key={initials} className="w-10 h-10 rounded-full flex items-center justify-center text-green-900 text-xs font-bold border-2 border-green-600 -mr-2.5 relative"
                style={{ background: avatarColors[i], zIndex: avatars.length - i }}>
                {initials}
              </div>
            ))}
            <button onClick={() => navigate('/testimonials')}
              className="w-10 h-10 rounded-full flex items-center justify-center ml-5 border border-white/50 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.18)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mt-7 w-fit">
            <button onClick={() => navigate('/support')}
              className="inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-full border-none"
              style={{ background: '#f59e0b' }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,.25)' }}>
                <Search className="h-3 w-3 text-white" />
              </span>
              Feedback &amp; Support
            </button>
          </div>
        </div>

        {/* RIGHT — AI Demo Widget */}
        <div className="flex flex-col gap-0">
          {/* Step nav */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => setActiveStep(i)}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all"
                style={{
                  background: activeStep === i ? 'rgba(74,222,128,.35)' : 'rgba(255,255,255,.14)',
                  border: activeStep === i ? '1px solid rgba(74,222,128,.8)' : '1px solid rgba(255,255,255,.35)',
                  color: '#fff',
                  cursor: 'pointer',
                }}>
                {s}
              </button>
            ))}
          </div>

          {activeStep === 0 && <ScanStep />}
          {activeStep === 1 && <AnalyzeStep />}
          {activeStep === 2 && <InsightsStep />}
          {activeStep === 3 && <CoachStep />}
        </div>

      </div>
    </section>
  );
}