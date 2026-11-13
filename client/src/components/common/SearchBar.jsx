import { useState } from 'react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounce = 400,
  className = '',
}) {
  const [timer, setTimer] = useState(null);

  const handleChange = (e) => {
    const val = e.target.value;
    clearTimeout(timer);
    setTimer(setTimeout(() => onChange(val), debounce));
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </div>
      <input
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
      />
    </div>
  );
}