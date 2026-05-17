'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray, type Resolver, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step2Schema, type Step2Values, type GroupStep2Values } from '../schemas/step2Schema';
import { useEnrollmentForm } from '../hooks/useEnrollmentForm';
import { GroupToIndividualDialog } from '../components/GroupToIndividualDialog';
import { TextField } from '../components/fields/TextField';
import { TextAreaField } from '../components/fields/TextAreaField';
import { ParticipantRow } from '../components/fields/ParticipantRow';
import { inputCn, FieldError } from '../components/fields/FormField';

// Flat form type to avoid discriminated union conflicts with RHF.
// Zod resolver still validates against step2Schema at submit time.
type Step2FormData = {
  type: 'personal' | 'group';
  name: string;
  email: string;
  phone: string;
  motivation?: string;
  organizationName?: string;
  headCount?: number;
  participants: { name: string; email: string }[];
  contactPerson?: string;
};

function hasGroupData(values: Step2FormData): boolean {
  return !!(
    values.organizationName ||
    values.contactPerson ||
    (values.headCount !== undefined && !isNaN(values.headCount) && values.headCount !== 2) ||
    values.participants.some(p => p.name || p.email)
  );
}

export function Step2EnrolleeInfo() {
  const { state, dispatch } = useEnrollmentForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const enrollmentType = state.step1?.enrollmentType ?? 'personal';
  const remaining = state.selectedCourse
    ? state.selectedCourse.maxCapacity - state.selectedCourse.currentEnrollment
    : Infinity;
  // 본인이 1석 차지하므로 단체 인원 최대 = 잔여 - 1 (최대 10명 제한 유지)
  const maxHeadCount = remaining === Infinity ? 10 : Math.min(10, remaining - 1);

  const saved = state.step2 as (Step2FormData & Partial<GroupStep2Values>) | null;
  const defaultValues: Step2FormData = {
    type: saved?.type ?? enrollmentType,
    name: saved?.name ?? '',
    email: saved?.email ?? '',
    phone: saved?.phone ?? '',
    motivation: saved?.motivation ?? '',
    // always initialize group fields so they are registered even when type='personal'
    organizationName: saved?.organizationName ?? '',
    headCount: saved?.headCount ?? 2,
    participants: saved?.participants ?? (enrollmentType === 'group'
      ? [{ name: '', email: '' }, { name: '', email: '' }]
      : []),
    contactPerson: saved?.contactPerson ?? '',
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    trigger,
    getValues,
    control,
    formState: { errors },
  } = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema) as Resolver<Step2FormData>,
    defaultValues,
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'participants' });

  const currentType = watch('type');
  const headCount = watch('headCount');
  const applicantEmail = watch('email');
  const participants = watch('participants');
  const groupErrors = errors as FieldErrors<GroupStep2Values>;

  // Sync participants array length with headCount
  useEffect(() => {
    if (currentType !== 'group') return;
    const count = Math.min(Math.max(Number(headCount) || 2, 2), maxHeadCount);
    if (count > fields.length) {
      for (let i = fields.length; i < count; i++) {
        append({ name: '', email: '' }, { shouldFocus: false });
      }
    } else if (count < fields.length) {
      remove(Array.from({ length: fields.length - count }, (_, i) => fields.length - 1 - i));
    }
  }, [headCount, currentType, fields.length, maxHeadCount]);

  function handleTypeClick(newType: 'personal' | 'group') {
    if (newType === currentType) return;
    if (newType === 'personal' && hasGroupData(getValues())) {
      setDialogOpen(true);
      return;
    }
    setValue('type', newType);
  }

  function handleDialogConfirm() {
    setValue('organizationName', '');
    setValue('headCount', 2);
    setValue('contactPerson', '');
    replace([]);
    setValue('type', 'personal');
    setDialogOpen(false);
  }

  function scrollToFirstError() {
    // Defer until after React re-renders with aria-invalid attributes applied
    setTimeout(() => {
      const el = formRef.current?.querySelector('[aria-invalid="true"]') as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 0);
  }

  function onSubmit(data: Step2FormData) {
    if (currentType === 'group' && (data.headCount ?? 0) > maxHeadCount) {
      setError('headCount', {
        type: 'manual',
        message: `잔여 정원 부족으로 최대 ${maxHeadCount}명까지 신청 가능합니다`,
      });
      scrollToFirstError();
      return;
    }
    dispatch({ type: 'SET_STEP2', payload: data as Step2Values });
    dispatch({ type: 'GO_TO_STEP', payload: 3 });
  }

  return (
    <>
      <GroupToIndividualDialog
        open={dialogOpen}
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialogOpen(false)}
      />

      <form ref={formRef} onSubmit={handleSubmit(onSubmit, scrollToFirstError)} noValidate>
        <input type="hidden" {...register('type')} />

        <div className="space-y-6">
          {/* Type selector */}
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-2">신청 유형</p>
            <div className="flex gap-3">
              {(
                [
                  ['personal', '개인 신청', '혼자 수강 신청합니다'],
                  ['group', '단체 신청', '2~10명이 함께 신청합니다'],
                ] as const
              ).map(([t, label, desc]) => (
                <label
                  key={t}
                  className={[
                    'flex-1 flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors',
                    currentType === t ? 'border-blue-600 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300',
                  ].join(' ')}
                  onClick={() => handleTypeClick(t)}
                >
                  <input
                    type="radio"
                    checked={currentType === t}
                    readOnly
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{label}</p>
                    <p className="text-xs text-zinc-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Common fields */}
          <div className="space-y-4">
            <TextField
              label="이름"
              required
              placeholder="홍길동"
              error={errors.name?.message}
              registration={register('name')}
              onBlur={() => trigger('name')}
            />
            <TextField
              label="이메일"
              required
              type="email"
              placeholder="example@email.com"
              error={errors.email?.message}
              registration={register('email')}
              onBlur={() => trigger('email')}
            />
            <TextField
              label="전화번호"
              required
              type="tel"
              placeholder="010-1234-5678"
              error={errors.phone?.message}
              registration={register('phone')}
              onBlur={() => trigger('phone')}
            />
            <TextAreaField
              label="수강 동기"
              hint="(선택, 최대 300자)"
              placeholder="수강 동기를 입력해주세요"
              maxLength={300}
              error={errors.motivation?.message}
              registration={register('motivation')}
              onBlur={() => trigger('motivation')}
            />
          </div>

          {/* Group-only fields */}
          {currentType === 'group' && (
            <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-800">단체 신청 정보</p>
                {remaining !== Infinity && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    maxHeadCount <= 2
                      ? 'bg-red-100 text-red-600'
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    최대 {maxHeadCount}명 신청 가능
                  </span>
                )}
              </div>

              <TextField
                label="단체명"
                required
                placeholder="(주)회사명"
                error={groupErrors.organizationName?.message}
                registration={register('organizationName')}
                onBlur={() => trigger('organizationName')}
              />

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  신청 인원수 <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs font-normal text-zinc-400">(2~{maxHeadCount}명)</span>
                </label>
                <select
                  {...register('headCount', { setValueAs: (v) => Number(v) })}
                  aria-invalid={!!groupErrors.headCount}
                  className={inputCn(!!groupErrors.headCount) + ' w-32 cursor-pointer'}
                >
                  {Array.from({ length: maxHeadCount - 1 }, (_, i) => i + 2).map((n) => (
                    <option key={n} value={String(n)}>{n}명</option>
                  ))}
                </select>
                <FieldError message={groupErrors.headCount?.message} />
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700 mb-2">
                  참가자 명단 <span className="text-red-500">*</span>
                </p>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <ParticipantRow
                      key={field.id}
                      index={index}
                      nameRegistration={register(`participants.${index}.name`)}
                      emailRegistration={register(`participants.${index}.email`)}
                      onBlurName={() => trigger(`participants.${index}.name`)}
                      onBlurEmail={() => trigger(`participants.${index}.email`)}
                      nameError={groupErrors.participants?.[index]?.name?.message}
                      emailError={groupErrors.participants?.[index]?.email?.message}
                      applicantEmail={applicantEmail}
                      currentEmail={participants?.[index]?.email}
                    />
                  ))}
                </div>
              </div>

              <TextField
                label="담당자 연락처"
                required
                type="tel"
                placeholder="010-1234-5678"
                error={groupErrors.contactPerson?.message}
                registration={register('contactPerson')}
                onBlur={() => trigger('contactPerson')}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 1 })}
              className="px-6 py-2.5 rounded-lg border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              이전
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
