import type { UseFormRegisterReturn } from 'react-hook-form';
import { inputCn, FieldError } from './FormField';

interface TextAreaFieldProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  rows?: number;
  maxLength?: number;
  charCount?: number;
  error?: string;
  registration: UseFormRegisterReturn;
  onBlur: () => void;
}

export function TextAreaField({
  label,
  required,
  placeholder,
  hint,
  rows = 3,
  maxLength,
  charCount,
  error,
  registration,
  onBlur,
}: TextAreaFieldProps) {
  const showCounter = maxLength !== undefined && charCount !== undefined;
  const nearLimit = showCounter && charCount >= maxLength * 0.9;

  return (
    <div>
      <label className="flex items-baseline justify-between text-sm font-medium text-zinc-700 mb-1">
        <span>
          {label}
          {required && <span className="text-red-500"> *</span>}
          {hint && <span className="ml-1 text-xs font-normal text-zinc-400">{hint}</span>}
        </span>
        {showCounter && (
          <span className={`text-xs font-normal tabular-nums ${nearLimit ? 'text-orange-500' : 'text-zinc-400'}`}>
            {charCount}/{maxLength}
          </span>
        )}
      </label>
      <textarea
        {...registration}
        onBlur={onBlur}
        aria-invalid={!!error}
        rows={rows}
        className={inputCn(!!error) + ' resize-none'}
        placeholder={placeholder}
      />
      <FieldError message={error} />
    </div>
  );
}
