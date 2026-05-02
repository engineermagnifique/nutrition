import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const config = {
  success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon_cls: 'text-green-500' },
  error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon_cls: 'text-red-500' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon_cls: 'text-yellow-500' },
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon_cls: 'text-blue-500' },
};

export default function Alert({ type = 'info', message, onClose, className = '' }) {
  if (!message) return null;
  const { icon: Icon, bg, border, text, icon_cls } = config[type];
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bg} ${border} ${className}`}>
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${icon_cls}`} />
      <p className={`flex-1 text-sm ${text}`}>{message}</p>
      {onClose && (
        <button onClick={onClose} className={`${text} opacity-70 hover:opacity-100`}>
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
