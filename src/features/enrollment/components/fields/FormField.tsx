export function inputCn(hasError: boolean): string {
  return [
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
    hasError
      ? 'border-red-400 bg-red-50 focus:border-red-500'
      : 'border-zinc-300 focus:border-blue-500',
  ].join(' ');
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}
