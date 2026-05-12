import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import readyBg from '../../assets/ready.png';

export default function ReadySection() {
  return (
    <section className="bg-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex justify-center">

        {/* 4/5 width card */}
        <div
          className="relative overflow-hidden rounded-3xl w-full"
          style={{
            maxWidth: '100%',
          }}
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${readyBg})` }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-primary-900/10" />

          {/* Content */}
          <div className="relative px-6 sm:px-10 lg:px-16 py-16 sm:py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full mb-5 sm:mb-6">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              Powered by Nutritionx AI
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 sm:mb-6 leading-tight">
              Ready to Transform<br />
              <span className="text-yellow-300">Elderly Nutrition Care?</span>
            </h2>

            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Join 80+ care institutions across East Africa already using NutritionX AI to deliver
              smarter, personalised nutrition — and make every meal count.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-900 font-semibold px-6 sm:px-8 py-3 rounded-xl hover:bg-yellow-300 hover:text-primary-900 transition-all duration-200 shadow-lg shadow-black/20"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-6 sm:px-8 py-3 rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                Talk to Our Team
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}