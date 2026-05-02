import { useEffect, useRef, useState } from 'react';

/* ─── Data ───────────────────────────────────────────────────── */
const AVATARS = [
  {
    initials: 'MA',
    color: '#bbf7d0',
    name: 'Maya A.',
    title: 'Nutritional recovery',
    sub: 'Fatigue & iron deficiency · 28 days',
    score: '+42%',
    scoreLabel: 'energy level',
    steps: ['Feeling sick', 'Scan meal', 'AI analysis', 'Recovered'],
    stepColors: [
      { bg: 'rgba(239,68,68,.25)',   border: 'rgba(239,68,68,.6)',   icon: '#fca5a5' },
      { bg: 'rgba(251,191,36,.25)',  border: 'rgba(251,191,36,.6)',  icon: '#fde68a' },
      { bg: 'rgba(96,165,250,.25)',  border: 'rgba(96,165,250,.6)',  icon: '#93c5fd' },
      { bg: 'rgba(74,222,128,.25)',  border: 'rgba(74,222,128,.6)',  icon: '#4ade80' },
    ],
    scenes: [
      {
        fig: 'sick', figColor: '#fca5a5',
        title: 'Maya feels fatigued & low energy',
        desc: 'Persistent tiredness, poor concentration. Iron levels below optimal. Missing key micronutrients from daily meals.',
        badge: 'Low iron detected',
        badgeBg: 'rgba(239,68,68,.25)', badgeBorder: 'rgba(239,68,68,.5)', badgeText: '#fca5a5',
      },
      {
        fig: 'scan', figColor: '#fde68a',
        title: 'NutriVision scans her lunch',
        desc: 'She photographs her salad. AI instantly detects spinach, chickpeas, lemon — but flags low iron and B12 in the meal.',
        badge: 'Scanning nutrients…',
        badgeBg: 'rgba(251,191,36,.2)', badgeBorder: 'rgba(251,191,36,.5)', badgeText: '#fde68a',
      },
      {
        fig: 'eat', figColor: '#93c5fd',
        title: 'Personalized meal plan generated',
        desc: 'AI recommends iron-rich additions: lean beef, dark leafy greens, vitamin C pairings to boost absorption.',
        badge: 'Plan ready',
        badgeBg: 'rgba(96,165,250,.2)', badgeBorder: 'rgba(96,165,250,.5)', badgeText: '#bfdbfe',
      },
      {
        fig: 'well', figColor: '#4ade80',
        title: 'Maya is thriving after 28 days',
        desc: 'Energy levels up 42%. Lab results confirm iron back to normal. Mood, focus, and sleep all dramatically improved.',
        badge: '✓ Full recovery',
        badgeBg: 'rgba(74,222,128,.25)', badgeBorder: 'rgba(74,222,128,.6)', badgeText: '#bbf7d0',
      },
    ],
  },
  {
    initials: 'DJ',
    color: '#86efac',
    name: 'David J.',
    title: 'Gut health & immunity',
    sub: 'Digestive issues & inflammation · 21 days',
    score: '+67%',
    scoreLabel: 'gut health',
    steps: ['Gut pain', 'Scan meals', 'AI coaching', 'Balanced'],
    stepColors: [
      { bg: 'rgba(239,68,68,.25)',   border: 'rgba(239,68,68,.6)',   icon: '#fca5a5' },
      { bg: 'rgba(251,191,36,.25)',  border: 'rgba(251,191,36,.6)',  icon: '#fde68a' },
      { bg: 'rgba(96,165,250,.25)',  border: 'rgba(96,165,250,.6)',  icon: '#93c5fd' },
      { bg: 'rgba(74,222,128,.25)',  border: 'rgba(74,222,128,.6)',  icon: '#4ade80' },
    ],
    scenes: [
      {
        fig: 'sick', figColor: '#fca5a5',
        title: 'David struggles with bloating & pain',
        desc: 'Frequent bloating, inflammation markers high. Diet was high in ultra-processed foods lacking fiber and probiotics.',
        badge: 'Gut distress detected',
        badgeBg: 'rgba(239,68,68,.25)', badgeBorder: 'rgba(239,68,68,.5)', badgeText: '#fca5a5',
      },
      {
        fig: 'scan', figColor: '#fde68a',
        title: 'AI scans every meal for 5 days',
        desc: 'NutriVision tracks patterns across multiple meals, identifying triggers: excess sugar, low fiber, missing prebiotics.',
        badge: 'Pattern analysis…',
        badgeBg: 'rgba(251,191,36,.2)', badgeBorder: 'rgba(251,191,36,.5)', badgeText: '#fde68a',
      },
      {
        fig: 'eat', figColor: '#93c5fd',
        title: 'NutriCoach guides daily habits',
        desc: 'Chat-based coaching introduces fermented foods, soluble fiber, and anti-inflammatory spices into every meal.',
        badge: 'Coaching active',
        badgeBg: 'rgba(96,165,250,.2)', badgeBorder: 'rgba(96,165,250,.5)', badgeText: '#bfdbfe',
      },
      {
        fig: 'well', figColor: '#4ade80',
        title: "David's gut health restored in 21 days",
        desc: 'Bloating gone. Inflammation down 67%. Microbiome diversity improved. Feels lighter and more energetic.',
        badge: '✓ Gut balanced',
        badgeBg: 'rgba(74,222,128,.25)', badgeBorder: 'rgba(74,222,128,.6)', badgeText: '#bbf7d0',
      },
    ],
  },
];

/* ─── Step icon SVGs ─────────────────────────────────────────── */
const StepIcon = ({ index, color }) => {
  const icons = [
    <svg key={0} viewBox="0 0 26 26" fill="none" width="22" height="22">
      <circle cx="13" cy="10" r="5" stroke={color} strokeWidth="1.8"/>
      <path d="M6 22c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="18" cy="6" r="3" fill="rgba(239,68,68,.5)" stroke="rgba(239,68,68,.8)" strokeWidth="1"/>
      <path d="M17 5.5L19 7.5M19 5.5L17 7.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
    </svg>,
    <svg key={1} viewBox="0 0 26 26" fill="none" width="22" height="22">
      <rect x="4" y="6" width="18" height="14" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M4 11h18" stroke={color} strokeWidth="1.5" strokeDasharray="2 2"/>
      <circle cx="13" cy="16" r="2" stroke={color} strokeWidth="1.5"/>
      <path d="M8 6V4M18 6V4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    <svg key={2} viewBox="0 0 26 26" fill="none" width="22" height="22">
      <path d="M9 4v4a4 4 0 008 0V4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M5 10h16l-1.5 10H6.5L5 10z" stroke={color} strokeWidth="1.8"/>
      <path d="M10 14h6M11 17h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    <svg key={3} viewBox="0 0 26 26" fill="none" width="22" height="22">
      <circle cx="13" cy="13" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M9 13l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  ];
  return icons[index] || null;
};

/* ─── Figure SVG components ──────────────────────────────────── */
const FigureSick = ({ color }) => (
  <svg width="72" height="90" viewBox="0 0 72 90" fill="none" style={{ animation: 'rstSickWobble 1.4s ease-in-out infinite', transformOrigin: '50% 90%' }}>
    <circle cx="36" cy="18" r="13" fill={`${color}33`} stroke={color} strokeWidth="1.5"/>
    <circle cx="31" cy="16" r="1.5" fill={color}/>
    <circle cx="41" cy="16" r="1.5" fill={color}/>
    <path d="M30 23 Q36 20 42 23" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M28 15 Q30 12 33 14" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M44 15 Q42 12 39 14" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <rect x="28" y="31" width="16" height="26" rx="6" fill={`${color}22`} stroke={color} strokeWidth="1.3"/>
    <path d="M22 42 Q18 45 20 50" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M50 42 Q54 45 52 50" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M32 57 Q34 68 32 78" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M40 57 Q38 68 40 78" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="47" cy="10" r="4" fill="rgba(239,68,68,.4)" stroke="rgba(239,68,68,.8)" strokeWidth="1"/>
    <text x="47" y="13.5" textAnchor="middle" fontSize="7" fill="white" fontWeight="700">!</text>
  </svg>
);

const FigureScan = ({ color }) => (
  <svg width="72" height="90" viewBox="0 0 72 90" fill="none" style={{ animation: 'rstEatBounce 0.9s ease-in-out infinite', transformOrigin: '50% 90%' }}>
    <circle cx="36" cy="18" r="13" fill={`${color}33`} stroke={color} strokeWidth="1.5"/>
    <circle cx="31" cy="16" r="1.5" fill={color}/>
    <circle cx="41" cy="16" r="1.5" fill={color}/>
    <path d="M30 22 Q36 26 42 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="28" y="31" width="16" height="26" rx="6" fill={`${color}22`} stroke={color} strokeWidth="1.3"/>
    <path d="M44 36 L58 30 L62 38 L48 44Z" fill="rgba(251,191,36,.25)" stroke="rgba(251,191,36,.7)" strokeWidth="1.2"/>
    <path d="M22 42 Q18 45 20 50" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M32 57 Q34 68 32 78" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M40 57 Q38 68 40 78" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="46" y="26" width="20" height="18" rx="3" fill="rgba(251,191,36,.2)" stroke="rgba(251,191,36,.6)" strokeWidth="1" style={{ animation: 'rstScanPulse 1.2s ease-in-out infinite' }}/>
    <path d="M48 31h16M48 35h16M48 39h10" stroke="rgba(251,191,36,.8)" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const FigureEat = ({ color }) => (
  <svg width="72" height="90" viewBox="0 0 72 90" fill="none" style={{ animation: 'rstEatBounce 0.9s ease-in-out infinite', transformOrigin: '50% 90%' }}>
    <circle cx="36" cy="18" r="13" fill={`${color}33`} stroke={color} strokeWidth="1.5"/>
    <circle cx="31" cy="16" r="1.5" fill={color}/>
    <circle cx="41" cy="16" r="1.5" fill={color}/>
    <path d="M30 22 Q36 27 42 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="28" y="31" width="16" height="26" rx="6" fill={`${color}22`} stroke={color} strokeWidth="1.3"/>
    <path d="M44 40 Q52 36 56 42" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="58" cy="40" r="6" fill={`${color}33`} stroke={color} strokeWidth="1.2"/>
    <path d="M55 40 Q58 36 61 40" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M22 42 Q18 45 20 50" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M32 57 Q34 68 32 78" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M40 57 Q38 68 40 78" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const FigureWell = ({ color }) => (
  <svg width="72" height="90" viewBox="0 0 72 90" fill="none" style={{ animation: 'rstWellJump 1.6s ease-in-out infinite', transformOrigin: '50% 90%' }}>
    <circle cx="36" cy="18" r="13" fill={`${color}33`} stroke={color} strokeWidth="1.5"/>
    <circle cx="31" cy="16" r="1.5" fill={color}/>
    <circle cx="41" cy="16" r="1.5" fill={color}/>
    <path d="M29 21 Q36 28 43 21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="28" y="31" width="16" height="26" rx="6" fill={`${color}22`} stroke={color} strokeWidth="1.3"/>
    <path d="M22 38 Q16 32 20 26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M50 38 Q56 32 52 26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M32 57 Q34 65 30 76" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M40 57 Q38 65 42 76" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <g style={{ animation: 'rstStarSpin 3s linear infinite', transformOrigin: '54px 10px' }}>
      <path d="M54 6l1.5 3.5L59 10l-3.5 1.5L54 15l-1.5-3.5L49 10l3.5-1.5z" fill={color} opacity=".9"/>
    </g>
    <g style={{ animation: 'rstStarSpin 4s linear infinite reverse', transformOrigin: '20px 8px' }}>
      <path d="M20 5l1 2.5L23.5 8l-2.5 1L20 11.5l-1-2.5L16.5 8l2.5-1z" fill={color} opacity=".6"/>
    </g>
  </svg>
);

const FIGURE_MAP = { sick: FigureSick, scan: FigureScan, eat: FigureEat, well: FigureWell };

/* ─── Main component ─────────────────────────────────────────── */
export default function RecoveryStorySection() {
  const [avIdx, setAvIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const av = AVATARS[avIdx];

  const goToStep = (s) => {
    setVisible(false);
    setTimeout(() => { setStep(s); setVisible(true); }, 200);
  };

  const scheduleNext = (currentStep, currentAv) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const nextStep = currentStep + 1;
      if (nextStep >= AVATARS[currentAv].steps.length) {
        const nextAv = (currentAv + 1) % AVATARS.length;
        setAvIdx(nextAv);
        setStep(0);
        setVisible(false);
        setTimeout(() => setVisible(true), 200);
      } else {
        goToStep(nextStep);
      }
    }, 3200);
  };

  useEffect(() => {
    scheduleNext(step, avIdx);
    return () => clearTimeout(timerRef.current);
  }, [step, avIdx]);

  const handleAvatarClick = (idx) => {
    clearTimeout(timerRef.current);
    setAvIdx(idx);
    setStep(0);
    setVisible(false);
    setTimeout(() => setVisible(true), 200);
  };

  const handleStepClick = (s) => {
    clearTimeout(timerRef.current);
    goToStep(s);
  };

  const FigComponent = FIGURE_MAP[av.scenes[step].fig];
  const scene = av.scenes[step];

  return (
    <section style={{
      background: 'linear-gradient(120deg, #14532d 0%, #15803d 45%, #16a34a 100%)',
      padding: '28px 48px 36px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes rstSickWobble { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
        @keyframes rstEatBounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes rstWellJump   { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} 60%{transform:translateY(-3px)} }
        @keyframes rstScanPulse  { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes rstStarSpin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rstFadeUp     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .rst-scene-in { animation: rstFadeUp .35s ease forwards; }
      `}</style>

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(120deg, rgba(20,83,45,.9) 0%, rgba(21,128,61,.8) 40%, rgba(22,163,74,.55) 100%)',
      }}/>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto' }}>
        {/* Section label */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>
          Real stories · AI-powered recovery journeys
        </p>

        {/* Card */}
        <div style={{
          borderRadius: 18, padding: '20px 24px',
          background: 'rgba(0,0,0,.42)', border: '1px solid rgba(74,222,128,.35)',
        }}>
          {/* Top row: avatars + meta + score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            {/* Overlapping avatars */}
            <div style={{ display: 'flex', position: 'relative', height: 48 }}>
              {AVATARS.map((a, i) => (
                <button key={i} onClick={() => handleAvatarClick(i)} style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: a.color,
                  border: `2px solid ${avIdx === i ? '#4ade80' : 'rgba(255,255,255,.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#14532d',
                  cursor: 'pointer',
                  transform: avIdx === i ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: avIdx === i ? '0 0 0 3px rgba(74,222,128,.25)' : 'none',
                  transition: 'all .3s',
                  position: 'relative', zIndex: AVATARS.length - i,
                  marginLeft: i === 0 ? 0 : -10,
                }}>
                  {a.initials}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{av.name} — {av.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{av.sub}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#4ade80' }}>{av.score}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)' }}>{av.scoreLabel}</div>
            </div>
          </div>

          {/* Step timeline */}
          <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', marginBottom: 18 }}>
            {av.steps.map((label, i) => {
              const done = i < step;
              const active = i === step;
              const sc = av.stepColors[i];
              return (
                <div key={i} onClick={() => handleStepClick(i)} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  cursor: 'pointer', position: 'relative',
                }}>
                  {/* Connector line */}
                  {i < av.steps.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 26, left: '50%', width: '100%', height: 2,
                      background: done ? 'rgba(74,222,128,.5)' : 'rgba(255,255,255,.1)',
                      transition: 'background .4s', zIndex: 0,
                    }}/>
                  )}
                  {/* Icon circle */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: done ? 'rgba(74,222,128,.35)' : sc.bg,
                    border: `2px solid ${done ? 'rgba(74,222,128,.8)' : active ? sc.border : sc.border.replace('.6', '.2')}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1, marginBottom: 6,
                    transition: 'all .4s',
                    boxShadow: active ? `0 0 12px ${sc.border}` : 'none',
                  }}>
                    <StepIcon index={i} color={done ? '#4ade80' : active ? sc.icon : 'rgba(255,255,255,.3)'}/>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: active ? 700 : 600, textAlign: 'center',
                    color: done ? '#4ade80' : active ? '#fff' : 'rgba(255,255,255,.4)',
                    transition: 'color .4s',
                  }}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Scene */}
          <div style={{
            borderRadius: 12, background: 'rgba(0,0,0,.3)',
            border: '1px solid rgba(255,255,255,.1)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 18,
            minHeight: 110,
          }}>
            <div className={visible ? 'rst-scene-in' : ''} style={{ flexShrink: 0, opacity: visible ? 1 : 0, transition: 'opacity .2s' }}>
              <FigComponent color={scene.figColor}/>
            </div>
            <div className={visible ? 'rst-scene-in' : ''} style={{ opacity: visible ? 1 : 0, transition: 'opacity .2s' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{scene.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.68)', lineHeight: 1.55 }}>{scene.desc}</div>
              <span style={{
                display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20, letterSpacing: '.04em', textTransform: 'uppercase',
                background: scene.badgeBg, border: `1px solid ${scene.badgeBorder}`, color: scene.badgeText,
              }}>{scene.badge}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2, background: '#4ade80',
                width: `${((step + 1) / av.steps.length) * 100}%`,
                transition: 'width .4s ease',
              }}/>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', minWidth: 60, textAlign: 'right' }}>
              Step {step + 1} / {av.steps.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}