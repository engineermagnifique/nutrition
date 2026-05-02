import Spinner from './Spinner';

const variants = {
  primary: 'bg-primary-800 hover:bg-primary-900 text-white shadow-sm',
  secondary: 'bg-secondary-800 hover:bg-secondary-900 text-white shadow-sm',
  outline: 'border border-primary-800 text-primary-800 hover:bg-primary-50',
  outlineSecondary: 'border border-secondary-800 text-secondary-800 hover:bg-secondary-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
};
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-800 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  );
}
