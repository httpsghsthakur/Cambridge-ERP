import { initials } from '../../utils/helpers';

const palettes = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-red-100 text-red-700',
  'bg-indigo-100 text-indigo-700',
];

const getPalette = (name = '') => {
  const idx = (name.charCodeAt(0) || 0) % palettes.length;
  return palettes[idx];
};

const sizes = {
  xs:  'w-6 h-6 text-[10px]',
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-12 h-12 text-base',
  xl:  'w-16 h-16 text-xl',
};

export default function Avatar({ name = '', size = 'sm', src, className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} ${getPalette(name)} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}>
      {initials(name)}
    </div>
  );
}