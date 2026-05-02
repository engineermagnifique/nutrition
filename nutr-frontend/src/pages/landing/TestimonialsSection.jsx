import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Dr. Amara Diallo',
    title: 'Medical Director, Kigali Care Home',
    body: 'NutritionX AI transformed how we manage our 120 residents\' nutrition. The AI recommendations are remarkably accurate, and our staff saves hours every week on manual tracking.',
    rating: 5,
    initials: 'AD',
  },
  {
    name: 'Nurse Grace Uwimana',
    title: 'Head Caregiver, Sunrise Elderly Center',
    body: 'The alert system caught a critical nutritional deficiency in one of our residents before it became serious. This platform is genuinely life-saving. I recommend it to every care institution.',
    rating: 5,
    initials: 'GU',
  },
  {
    name: 'Mr. Jean-Pierre Habimana',
    title: 'Elderly Resident, 78 years',
    body: 'My caregivers use NutritionX AI to plan my meals, and I have felt so much better in the past six months. My weight is stable and my doctor is very pleased with my health progress.',
    rating: 5,
    initials: 'JH',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary-800 uppercase tracking-wide mb-2">Real Stories</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trusted by care institutions and loved by the communities they serve.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
              <Quote className="h-8 w-8 text-primary-200 mb-4" />
              <p className="text-gray-700 leading-relaxed flex-1 mb-6">"{t.body}"</p>
              <div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary-800 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.title}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '80+', label: 'Care Institutions' },
            { value: '2,400+', label: 'Elderly Users' },
            { value: '94%', label: 'AI Accuracy Rate' },
            { value: '40%', label: 'Better Health Outcomes' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <p className="text-3xl font-bold text-primary-800">{value}</p>
              <p className="text-sm text-gray-600 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
