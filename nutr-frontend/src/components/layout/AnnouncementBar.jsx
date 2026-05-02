import { useState } from 'react';
import { X, Megaphone } from 'lucide-react';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="bg-primary-800 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm relative">
        <Megaphone className="h-4 w-4 flex-shrink-0" />
        <span>
          <strong>New:</strong> NutritionX AI now provides weekly predictive health insights for elderly users.{' '}
          <a href="#how-it-works" className="underline font-medium hover:text-primary-100">Learn more →</a>
        </span>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-0 p-1 hover:bg-primary-700 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
