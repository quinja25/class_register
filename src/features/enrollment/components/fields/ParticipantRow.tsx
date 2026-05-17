import type { UseFormRegisterReturn } from 'react-hook-form';
import { inputCn, FieldError } from './FormField';
import { EmailField } from './EmailField';

interface ParticipantRowProps {
  index: number;
  nameRegistration: UseFormRegisterReturn;
  emailRegistration: UseFormRegisterReturn;
  onBlurName: () => void;
  onBlurEmail: () => void;
  nameError?: string;
  emailError?: string;
  applicantEmail?: string;
  currentEmail?: string;
  emailDefaultValue?: string;
  onCompleteEmail: (value: string) => void;
}

export function ParticipantRow({
  index,
  nameRegistration,
  emailRegistration,
  onBlurName,
  onBlurEmail,
  nameError,
  emailError,
  applicantEmail,
  currentEmail,
  emailDefaultValue = '',
  onCompleteEmail,
}: ParticipantRowProps) {
  const isSameAsApplicant =
    !emailError &&
    !!applicantEmail &&
    !!currentEmail &&
    currentEmail.toLowerCase() === applicantEmail.toLowerCase();

  return (
    <div className="flex items-start gap-2">
      <span className="mt-2.5 w-5 flex-shrink-0 text-right text-xs text-zinc-400">
        {index + 1}
      </span>
      <div className="flex-1">
        <input
          {...nameRegistration}
          onBlur={onBlurName}
          aria-invalid={!!nameError}
          className={inputCn(!!nameError)}
          placeholder="이름"
        />
        <FieldError message={nameError} />
      </div>
      <div className="flex-1">
        <EmailField
          registration={emailRegistration}
          onBlur={onBlurEmail}
          placeholder="이메일"
          error={emailError}
          defaultValue={emailDefaultValue}
          onComplete={onCompleteEmail}
        />
        {isSameAsApplicant && (
          <p className="mt-0.5 text-xs text-amber-600">대표 신청자와 동일한 이메일입니다</p>
        )}
      </div>
    </div>
  );
}
