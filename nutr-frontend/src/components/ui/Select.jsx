import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { label, error, hint, className = '', required, children, placeholder, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-800 focus:border-primary-800 ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
});

export default Select;
