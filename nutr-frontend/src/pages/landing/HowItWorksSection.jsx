import { UserPlus, ClipboardList, Brain, TrendingUp } from 'lucide-react';
import RecoveryStorySection from './RecoverySection';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Register Your Institution',
    description: 'Care institutions register and onboard elderly residents. Each resident gets a secure profile linked to your facility.',
    color: 'text-primary-800',
    bg: 'bg-primary-50',
  },
  {
    number: '02',
    icon: ClipboardList,
    title: 'Log Daily Health Data',
    description: 'Track weight, meals, and medical conditions daily. Our intuitive interface makes data entry quick and accurate.',
    color: 'text-secondary-800',
    bg: 'bg-secondary-50',
  },
  {
    number: '03',
    icon: Brain,
    title: 'AI Generates Insights',
    description: 'Our AI engine analyzes health patterns and generates personalized nutrition recommendations and diet plans.',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Monitor & Improve',
    description: 'Track progress with predictive analytics, receive smart alerts, and continually improve resident health outcomes.',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary-800 uppercase tracking-wide mb-2">Simple Process</p>
          <RecoveryStorySection/>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How NutritionX AI Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From registration to actionable insights in four simple steps. Our platform is designed for busy care professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gray-200 z-0" style={{ width: 'calc(100% - 2rem)' }} />
              )}
              <div className="relative z-10 text-center">
                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${step.bg} mb-4`}>
                  <step.icon className={`h-8 w-8 ${step.color}`} />
                </div>
                <div className="text-4xl font-black text-gray-100 mb-2">{step.number}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
