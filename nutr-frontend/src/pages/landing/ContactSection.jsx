import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setStatus('success');
    setForm({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary-800 uppercase tracking-wide mb-2">Get In Touch</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about NutritionX AI? Our team is here to help you get started.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Send us a message</h3>
            {status === 'success' && (
              <Alert type="success" message="Thank you! We'll get back to you within 24 hours." className="mb-4" />
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" placeholder="Your name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input type="email" label="Email Address" placeholder="you@example.com" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <Input label="Subject" placeholder="How can we help?" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <Textarea label="Message" placeholder="Tell us more about your needs..." rows={5} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <Button type="submit" loading={loading} className="w-full sm:w-auto gap-2">
                <Send className="h-4 w-4" /> Send Message
              </Button>
            </form>
          </div>

          <div id="help">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
            <div className="space-y-6">
              {[
                { icon: Mail, title: 'Email Us', detail: 'support@nutritionxai.com', sub: 'We reply within 24 hours' },
                { icon: Phone, title: 'Call Us', detail: '+250 788 000 000', sub: 'Mon–Fri, 8am–6pm CAT' },
                { icon: MapPin, title: 'Visit Us', detail: 'KG 7 Ave, Kigali, Rwanda', sub: 'By appointment only' },
              ].map(({ icon: Icon, title, detail, sub }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary-800" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{title}</h4>
                    <p className="text-gray-700">{detail}</p>
                    <p className="text-sm text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div id="about" className="mt-8 p-6 bg-primary-50 rounded-2xl border border-primary-100">
              <h4 className="font-semibold text-primary-900 mb-2">About NutritionX AI</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Built by health technology researchers at the University of Rwanda, NutritionX AI addresses the critical gap in elderly nutrition management across East African care institutions. Our mission is to improve quality of life through intelligent, data-driven nutrition care.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
