export function inputCn(hasError: boolean): string {
  return [
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2',
    hasError
      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
      : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20',
  ].join(' ');
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}
