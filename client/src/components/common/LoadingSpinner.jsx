export default function LoadingSpinner({ size = 'md', text = '', fullPage = false }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin`}
        style={{ borderWidth: 3 }} />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}