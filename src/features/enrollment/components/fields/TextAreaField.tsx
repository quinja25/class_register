import type { UseFormRegisterReturn } from 'react-hook-form';
import { inputCn, FieldError } from './FormField';

interface TextAreaFieldProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  rows?: number;
  maxLength?: number;
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
  error,
  registration,
  onBlur,
}: TextAreaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {hint && <span className="ml-1 text-xs font-normal text-zinc-400">{hint}</span>}
      </label>
      <textarea
        {...registration}
        onBlur={onBlur}
        aria-invalid={!!error}
        rows={rows}
        maxLength={maxLength}
        className={inputCn(!!error) + ' resize-none'}
        placeholder={placeholder}
      />
      <FieldError message={error} />
    </div>
  );
}
