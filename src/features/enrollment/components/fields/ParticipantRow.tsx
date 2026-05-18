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
  emailDefaultValue = '',
  onCompleteEmail,
}: ParticipantRowProps) {

  return (
    <div className="flex items-start gap-2">
      <span className="mt-2.5 w-5 flex-shrink-0 text-right text-xs text-zinc-400">
        {index + 1}
      </span>
      <div className="flex flex-col sm:flex-row flex-1 gap-2">
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
      </div>
      </div>
    </div>
  );
}
