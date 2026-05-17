import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { inputCn, FieldError } from './FormField';

const DOMAIN_SUGGESTIONS: [string, string][] = [
  ['g', 'gmail.com'],
  ['n', 'naver.com'],
  ['d', 'daum.net'],
  ['k', 'kakao.com'],
  ['h', 'hanmail.net'],
  ['y', 'yahoo.com'],
];

function getSuggestion(value: string): string | null {
  const atIdx = value.lastIndexOf('@');
  if (atIdx === -1) return null;
  const afterAt = value.slice(atIdx + 1).toLowerCase();
  if (!afterAt) return null;

  for (const [, domain] of DOMAIN_SUGGESTIONS) {
    if (domain.startsWith(afterAt) && afterAt !== domain) {
      return value.slice(0, atIdx + 1) + domain;
    }
  }
  return null;
}

interface EmailFieldProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  registration: UseFormRegisterReturn;
  onBlur: () => void;
  defaultValue?: string;
  onComplete: (value: string) => void;
}

export function EmailField({
  label,
  required,
  placeholder,
  hint,
  error,
  registration,
  onBlur,
  defaultValue = '',
  onComplete,
}: EmailFieldProps) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const suggestion = getSuggestion(localValue);

  function acceptSuggestion(value: string) {
    setLocalValue(value);
    onComplete(value);
  }

  const reg = {
    ...registration,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      return registration.onChange(e);
    },
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      acceptSuggestion(suggestion);
      // Move focus to next focusable field after autocomplete
      const current = e.currentTarget;
      setTimeout(() => {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
          )
        );
        const idx = focusable.indexOf(current);
        if (idx !== -1 && idx < focusable.length - 1) {
          focusable[idx + 1].focus();
        }
      }, 0);
    }
  }

  const input = (
    <div className="relative">
      <input
        type="email"
        {...reg}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        aria-invalid={!!error}
        className={inputCn(!!error)}
        placeholder={placeholder}
      />
      {suggestion && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // prevent blur before click
            acceptSuggestion(suggestion);
          }}
          className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-600 transition-colors"
        >
          <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-500">
            Tab
          </kbd>
          <span>{suggestion}</span>
        </button>
      )}
    </div>
  );

  if (!label) {
    return (
      <div>
        {input}
        <FieldError message={error} />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {hint && <span className="ml-1 text-xs font-normal text-zinc-400">{hint}</span>}
      </label>
      {input}
      <FieldError message={error} />
    </div>
  );
}
