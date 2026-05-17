import type { UseFormRegisterReturn } from 'react-hook-form';
import { inputCn, FieldError } from './FormField';

interface TextFieldProps {
  label: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
  hint?: string;
  error?: string;
  registration: UseFormRegisterReturn;
  onBlur: () => void;
}

export function TextField({
  label,
  required,
  type = 'text',
  placeholder,
  hint,
  error,
  registration,
  onBlur,
}: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {hint && <span className="ml-1 text-xs font-normal text-zinc-400">{hint}</span>}
      </label>
      <input
        type={type}
        {...registration}
        onBlur={onBlur}
        aria-invalid={!!error}
        className={inputCn(!!error)}
        placeholder={placeholder}
      />
      <FieldError message={error} />
    </div>
  );
}
