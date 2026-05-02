import { NavLink } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function Sidebar({ links, onNavigate }) {
  return (
    <aside className="flex flex-col h-full bg-gray-900 text-white w-64">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
        <div className="h-8 w-8 bg-primary-800 rounded-lg flex items-center justify-center">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-lg">NutritionX<span className="text-primary-400">AI</span></span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
