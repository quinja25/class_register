'use client';

import type { UseFormRegister, FieldError } from 'react-hook-form';
import type { Step1Values } from '../schemas/step1Schema';

interface EnrollmentTypeSelectorProps {
  register: UseFormRegister<Step1Values>;
  error?: FieldError;
}

const OPTIONS = [
  {
    value: 'personal' as const,
    label: '개인 신청',
    description: '혼자 수강 신청합니다',
  },
  {
    value: 'group' as const,
    label: '단체 신청',
    description: '2~10명이 함께 신청합니다',
  },
];

export function EnrollmentTypeSelector({ register, error }: EnrollmentTypeSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-700 mb-2">신청 유형</p>
      <div className="flex gap-3">
        {OPTIONS.map(({ value, label, description }) => (
          <label
            key={value}
            className="flex-1 flex items-start gap-3 rounded-xl border-2 border-zinc-200 p-4 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition-colors"
          >
            <input
              type="radio"
              value={value}
              {...register('enrollmentType')}
              className="mt-0.5 accent-blue-600"
            />
            <div>
              <p className="text-sm font-semibold text-zinc-900">{label}</p>
              <p className="text-xs text-zinc-500">{description}</p>
            </div>
          </label>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error.message}</p>}
    </div>
  );
}
