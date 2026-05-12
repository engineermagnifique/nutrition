import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, CheckCheck, ChevronDown, AlertTriangle, Info, X } from 'lucide-react';
import { alertsService } from '../../services/alerts.service';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

const ACCENT   = '#F59B6B';
const ACCENT_D = '#E8754A';
const BG       = '#FCE4CF';
const TINT = {
  peach:  { bg: '#FFE5D1', border: '#FFD0AE', text: '#9A4B1F', icon: '#E8754A' },
  mint:   { bg: '#D7F2E1', border: '#A8E2BC', text: '#1F5C36', icon: '#2E7D32' },
  sky:    { bg: '#D9ECFA', border: '#B0D5F1', text: '#1A4D7A', icon: '#1565C0' },
  lilac:  { bg: '#EADCF7', border: '#D2BCEA', text: '#4B2B7A', icon: '#7c3aed' },
  butter: { bg: '#FFF1C9', border: '#FFE08F', text: '#7A5800', icon: '#d97706' },
};

const SEV_TINT = {
  critical: TINT.peach,
  high:     TINT.peach,
  medium:   TINT.butter,
  low:      TINT.mint,
  info:     TINT.sky,
};

const alertTypeLabel = {
  health_risk:   'Health Risk',
  abnormal_data: 'Abnormal Data',
  medication:    'Medication',
  goal_missed:   'Goal Missed',
  recommendation:'Recommendation',
};

// ─── Single alert row ─────────────────────────────────────────────────────────

function AlertItem({ alert, onMarkRead }) {
  const sev  = SEV_TINT[alert.severity] || TINT.sky;
  const read = alert.is_read;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      style={{
        background: read ? '#fffdf9' : sev.bg,
        border: `1px solid ${read ? '#F0E6D2' : sev.border}`,
        borderRadius: 14,
        padding: '14px 18px',
        opacity: read ? 0.75 : 1,
        transition: 'opacity .2s',
      }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{
          flexShrink: 0, marginTop: 2,
          width: 32, height: 32, borderRadius: 8,
          background: read ? '#FBF4EA' : sev.bg,
          border: `1px solid ${read ? '#F0E6D2' : sev.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {read
            ? <BellOff size={15} color="#c4a882" />
            : <Bell size={15} color={sev.text} />
          }
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#2a1f14' }}>{alert.title}</p>
            <span style={{
              fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20,
              background: sev.bg, color: sev.text, border:`1px solid ${sev.border}`,
              textTransform:'capitalize',
            }}>
              {alert.severity}
            </span>
            {alert.alert_type && (
              <span style={{
                fontSize:11, padding:'2px 8px', borderRadius:20,
                background:'#FBF4EA', color:'#a8967f', border:'1px solid #F0E6D2',
              }}>
                {alertTypeLabel[alert.alert_type] || alert.alert_type}
              </span>
            )}
          </div>
          <p style={{ margin:'0 0 6px', fontSize:13, color:'#2a1f14', lineHeight:1.6 }}>{alert.message}</p>
          <p style={{ margin:0, fontSize:11, color:'#a8967f' }}>{format(parseISO(alert.created_at), 'MMM d, yyyy · h:mm a')}</p>
        </div>

        {!read && (
          <button
            onClick={() => onMarkRead(alert.id)}
            style={{
              flexShrink:0, fontSize:12, color: ACCENT_D, fontWeight:600,
              background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap',
              fontFamily:"'DM Sans',sans-serif", padding:'4px 8px', borderRadius:6,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#FBF4EA'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            Mark read
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section toggle ───────────────────────────────────────────────────────────

function Section({ label, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display:'flex', alignItems:'center', gap:8, marginBottom:10,
          background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", padding:0,
        }}
      >
        <span style={{ fontSize:11, fontWeight:700, color:'#a8967f', textTransform:'uppercase', letterSpacing:'0.07em' }}>
          {label}
        </span>
        {count > 0 && (
          <span style={{ fontSize:11, fontWeight:700, background: TINT.peach.bg, color: TINT.peach.text, border:`1px solid ${TINT.peach.border}`, padding:'1px 7px', borderRadius:20 }}>
            {count}
          </span>
        )}
        <ChevronDown size={14} color="#a8967f" style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s', marginLeft:'auto' }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="sec"
            initial={{ opacity:0, height:0 }}
            animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }}
            style={{ overflow:'hidden' }}
          >
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UserAlerts() {
  const qc = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsService.getAlerts().then((r) => r.data?.results ?? []),
  });

  const markRead = useMutation({
    mutationFn: (id) => alertsService.markRead(id),
    onSuccess: () => qc.invalidateQueries(['alerts']),
  });

  const markAllRead = useMutation({
    mutationFn: () => alertsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries(['alerts']),
  });

  const unread = alerts.filter((a) => !a.is_read);
  const read   = alerts.filter((a) => a.is_read);

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', height:'100%', fontFamily:"'DM Sans',sans-serif", background: BG, padding:14, boxSizing:'border-box' }}>
      <style>{`@keyframes alSpin{to{transform:rotate(360deg)}}`}</style>

      {/* Panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#fff', borderRadius:24, border:'1px solid rgba(255,255,255,0.9)', boxShadow:'0 4px 24px rgba(180,120,60,0.08)' }}>

        {/* Topbar */}
        <div style={{ background:'#fff', padding:'18px 26px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F5ECE1', flexShrink:0, gap:12, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:'#2a1f14' }}>Alerts</h1>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'#a8967f' }}>
              {unread.length > 0
                ? `${unread.length} unread alert${unread.length !== 1 ? 's' : ''}`
                : 'All alerts read'}
            </p>
          </div>
          {unread.length > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              style={{
                display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px',
                background:'#FBF4EA', color: ACCENT_D, border:`1.5px solid #F0E6D2`,
                borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                opacity: markAllRead.isPending ? 0.6 : 1,
              }}
            >
              {markAllRead.isPending
                ? <div style={{ width:14, height:14, border:'2px solid #F0E6D2', borderTopColor: ACCENT_D, borderRadius:'50%', animation:'alSpin 0.7s linear infinite' }} />
                : <CheckCheck size={14} />
              }
              Mark All Read
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:18 }}>

          {isLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
              <div style={{ width:32, height:32, border:`3px solid #F0E6D2`, borderTopColor: ACCENT_D, borderRadius:'50%', animation:'alSpin 0.8s linear infinite' }} />
            </div>
          ) : alerts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 24px', background:'#FBF4EA', borderRadius:16, border:'1px solid #F0E6D2', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <div style={{ width:64, height:64, borderRadius:16, background:'#F5ECE1', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Bell size={28} color="#c4a882" />
              </div>
              <p style={{ margin:0, fontSize:15, fontWeight:600, color:'#2a1f14' }}>No alerts yet</p>
              <p style={{ margin:0, fontSize:13, color:'#a8967f' }}>You'll be notified here about important health updates.</p>
            </div>
          ) : (
            <>
              {unread.length > 0 && (
                <Section label="Unread" count={unread.length} defaultOpen={true}>
                  <AnimatePresence>
                    {unread.map((a) => (
                      <AlertItem key={a.id} alert={a} onMarkRead={(id) => markRead.mutate(id)} />
                    ))}
                  </AnimatePresence>
                </Section>
              )}

              {read.length > 0 && (
                <Section label="Read" count={0} defaultOpen={unread.length === 0}>
                  <AnimatePresence>
                    {read.map((a) => (
                      <AlertItem key={a.id} alert={a} onMarkRead={(id) => markRead.mutate(id)} />
                    ))}
                  </AnimatePresence>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
