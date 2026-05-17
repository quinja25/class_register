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
  onChangeFormat?: (value: string) => string;
  action?: { label: string; onClick: () => void };
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
  onChangeFormat,
  action,
}: TextFieldProps) {
  const reg = onChangeFormat
    ? {
        ...registration,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          const formatted = onChangeFormat(e.target.value);
          e.target.value = formatted;
          return registration.onChange(e);
        },
      }
    : registration;

  return (
    <div>
      <label className="flex items-baseline justify-between text-sm font-medium text-zinc-700 mb-1">
        <span>
          {label}
          {required && <span className="text-red-500"> *</span>}
          {hint && <span className="ml-1 text-xs font-normal text-zinc-400">{hint}</span>}
        </span>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="text-xs font-normal text-blue-600 hover:underline"
          >
            {action.label}
          </button>
        )}
      </label>
      <input
        type={type}
        {...reg}
        onBlur={onBlur}
        aria-invalid={!!error}
        className={inputCn(!!error)}
        placeholder={placeholder}
      />
      <FieldError message={error} />
    </div>
  );
}
