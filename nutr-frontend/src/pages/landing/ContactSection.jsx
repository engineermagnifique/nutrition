import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email us',
    detail: 'support@nutritionxai.com',
    sub: 'We reply within 24 hours',
    bg: '#EAF3DE',
    color: '#27500A',
  },
  {
    icon: Phone,
    title: 'Call us',
    detail: '+250 790 879 872',
    sub: 'Mon–Fri, 8am–6pm CAT',
    bg: '#E6F1FB',
    color: '#0C447C',
  },
  {
    icon: MapPin,
    title: 'Visit us',
    detail: 'KG 7 Ave, Kigali, Rwanda',
    sub: 'By appointment only',
    bg: '#EEEDFE',
    color: '#3C3489',
  },
];

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ responsive breakpoint
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setStatus('success');
    setForm({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  return (
    <section
      id="contact"
      style={{
        background: '#fff',
        padding: isMobile ? '60px 0' : '88px 0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: isMobile ? '0 20px' : '0 32px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: '#3B6D11',
              marginBottom: 10,
            }}
          >
            Get in touch
          </p>
          <h2
            style={{
              fontSize: isMobile ? 26 : 34,
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.22,
              marginBottom: 12,
            }}
          >
            Contact us
          </h2>
          <p
            style={{
              fontSize: 16,
              color: '#6b7280',
              maxWidth: 460,
              lineHeight: 1.7,
              margin: '0 auto',
            }}
          >
            Have questions about NutritionX AI? Our team is here to help you get started.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.1fr) minmax(0,0.9fr)',
            gap: isMobile ? 32 : 52,
            alignItems: 'start',
          }}
        >

          {/* LEFT */}
          <div
            style={{
              background: '#fff',
              border: '0.5px solid #e5e7eb',
              borderRadius: 16,
              padding: isMobile ? '24px 20px' : '36px 32px',
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 24 }}>
              Send us a message
            </h3>

            {status === 'success' && (
              <Alert
                type="success"
                message="Thank you! We'll get back to you within 24 hours."
                style={{ marginBottom: 16 }}
              />
            )}

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <Input
                  label="Full name"
                  placeholder="Your name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Input
                  label="Subject"
                  placeholder="How can we help?"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <Textarea
                  label="Message"
                  placeholder="Tell us more about your needs…"
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <Button type="submit" loading={loading} className="gap-2">
                <Send className="h-4 w-4" /> Send message
              </Button>
            </form>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 24 }}>
              Contact information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {contactInfo.map(({ icon: Icon, title, detail, sub, bg, color }) => (
                <div
                  key={title}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    background: '#fafafa',
                    border: '0.5px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '16px 18px',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{title}</div>
                    <div style={{ fontSize: 14, color: '#374151' }}>{detail}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              id="about"
              style={{
                background: '#EAF3DE',
                border: '0.5px solid #C0DD97',
                borderRadius: 14,
                padding: isMobile ? '18px' : '22px',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#27500A' }}>
                About NutritionX AI
              </span>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75 }}>
                Built by health technology researchers at the University of Rwanda...
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}