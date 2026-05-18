'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step3Schema, type Step3Values } from '../schemas/step3Schema';
import { useEnrollmentForm } from '../hooks/useEnrollmentForm';
import { useEnrollment } from '../hooks/useEnrollment';
import { TermsModal } from '../components/TermsModal';
import type { GroupStep2Values } from '../schemas/step2Schema';
import type { EnrollmentRequest } from '../types/enrollment';

const CATEGORY_LABELS: Record<string, string> = {
  development: '개발',
  design: '디자인',
  marketing: '마케팅',
  business: '비즈니스',
};

const ERROR_MESSAGES: Record<string, { message: string; action?: { label: string; step: 1 | 2 } }> = {
  COURSE_FULL: {
    message: '선택하신 강의의 정원이 마감되었습니다.',
    action: { label: '다른 강의 선택하기', step: 1 },
  },
  DUPLICATE_ENROLLMENT: {
    message: '이미 신청한 강의입니다. 이메일 주소를 확인해주세요.',
    action: { label: '이메일 수정하기', step: 2 },
  },
  INVALID_INPUT: {
    message: '입력 정보에 문제가 있습니다.',
    action: { label: '입력 정보 다시 확인하기', step: 2 },
  },
  UNKNOWN_ERROR: {
    message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
};

function formatPrice(p: number) {
  return p.toLocaleString('ko-KR') + '원';
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) => d.replace(/-/g, '.').slice(2);
  return `${fmt(start)} ~ ${fmt(end)}`;
}

function SectionCard({ title, onEdit, children }: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          수정 →
        </button>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-28 flex-shrink-0 text-zinc-500">{label}</span>
      <span className="text-zinc-900 break-all">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="my-3 border-t border-zinc-100" />;
}

export function Step3Confirmation() {
  const { state, dispatch } = useEnrollmentForm();
  const { mutate, isPending, error, reset: resetMutation } = useEnrollment();
  const [termsOpen, setTermsOpen] = useState(false);

  const step1 = state.step1;
  const step2 = state.step2;

  if (!step1 || !step2) return null;

  const isGroup = step2.type === 'group';
  const groupData = isGroup ? (step2 as GroupStep2Values) : null;
  const course = state.selectedCourse;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: state.step3 ?? { agreedToTerms: false as unknown as true },
  });

  function buildRequest(terms: Step3Values): EnrollmentRequest {
    // null guard at render time ensures step1/step2 are non-null when this is called
    const s1 = state.step1!;
    const s2 = state.step2!;
    const gd = s2.type === 'group' ? (s2 as GroupStep2Values) : null;

    const applicant = {
      name: s2.name,
      email: s2.email,
      phone: s2.phone,
      ...(s2.motivation ? { motivation: s2.motivation } : {}),
    };

    if (gd) {
      return {
        courseId: s1.selectedCourseId,
        type: 'group',
        applicant,
        group: {
          organizationName: gd.organizationName,
          headCount: gd.headCount,
          participants: gd.participants,
          contactPerson: gd.contactPerson,
        },
        agreedToTerms: terms.agreedToTerms,
      };
    }

    return {
      courseId: s1.selectedCourseId,
      type: 'personal',
      applicant,
      agreedToTerms: terms.agreedToTerms,
    };
  }

  function onSubmit(terms: Step3Values) {
    dispatch({ type: 'SET_STEP3', payload: terms });
    resetMutation();
    mutate(buildRequest(terms), {
      onSuccess: (result) => {
        dispatch({ type: 'SET_RESULT', payload: result });
      },
    });
  }

  const apiError = error?.code
    ? (ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES.UNKNOWN_ERROR)
    : null;


  return (
    <>
    <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-4">

        {/* API error banner */}
        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
            <p className="text-red-700 font-medium">{apiError.message}</p>
            {apiError.action && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'GO_TO_STEP', payload: apiError.action!.step })}
                className="mt-2 inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold underline underline-offset-2"
              >
                {apiError.action.label} →
              </button>
            )}
          </div>
        )}

        {/* Course summary */}
        <SectionCard
          title="선택 강의"
          onEdit={() => dispatch({ type: 'GO_TO_STEP', payload: 1 })}
        >
          {course ? (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-zinc-900">{course.title}</p>
              <p className="text-xs text-zinc-500">
                {CATEGORY_LABELS[course.category] ?? course.category} · {course.instructor}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-zinc-600 pt-0.5">
                <span>{formatPrice(course.price)}</span>
                <span>{formatDateRange(course.startDate, course.endDate)}</span>
              </div>
            </div>
          ) : (
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-200" />
          )}
        </SectionCard>

        {/* Enrollee info summary */}
        <SectionCard
          title="신청자 정보"
          onEdit={() => dispatch({ type: 'GO_TO_STEP', payload: 2 })}
        >
          <div className="space-y-2">
            <InfoRow label="신청 유형" value={isGroup ? '단체 신청' : '개인 신청'} />
            <InfoRow label="이름" value={step2.name} />
            <InfoRow label="이메일" value={step2.email} />
            <InfoRow label="전화번호" value={step2.phone} />
            <InfoRow label="수강 동기" value={step2.motivation} />
          </div>

          {isGroup && groupData && (
            <>
              <Divider />
              <p className="text-xs font-semibold text-zinc-600 mb-2">단체 정보</p>
              <div className="space-y-2">
                <InfoRow label="단체명" value={groupData.organizationName} />
                <InfoRow label="총 신청 인원" value={`${groupData.headCount + 1}명 (대표자 포함)`} />
                <InfoRow label="담당자 연락처" value={groupData.contactPerson} />
              </div>

              {groupData.participants.length > 0 && (
                <>
                  <Divider />
                  <p className="text-xs font-semibold text-zinc-600 mb-2">참가자 명단</p>
                  <div className="space-y-1.5">
                    {groupData.participants.map((p, i) => (
                      <div key={i} className="flex gap-3 text-xs text-zinc-700">
                        <span className="w-4 flex-shrink-0 text-zinc-400">{i + 1}</span>
                        <span className="w-20 flex-shrink-0">{p.name}</span>
                        <span className="text-zinc-500">{p.email}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </SectionCard>

        {/* Terms */}
        <div className="px-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('agreedToTerms')}
              className="mt-0.5 h-4 w-4 accent-blue-600"
            />
            <span className="text-sm text-zinc-700">
              이용약관에 동의합니다
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="ml-1.5 text-xs text-blue-600 hover:underline"
              >
                전문 보기
              </button>
            </span>
          </label>
          {errors.agreedToTerms && (
            <p className="mt-1.5 text-xs text-red-500">{errors.agreedToTerms.message}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 2 })}
            className="px-6 py-2.5 rounded-lg border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            이전
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isPending && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {isPending ? '제출 중...' : '제출하기'}
          </button>
        </div>

      </div>
    </form>
    </>
  );
}
