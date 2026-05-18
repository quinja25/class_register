'use client';

import { useEffect, useRef, useState } from 'react';
import { EnrollmentFormProvider } from '../context/EnrollmentFormContext';
import { useEnrollmentForm } from '../hooks/useEnrollmentForm';
import { StepIndicator } from './StepIndicator';
import { Step1CourseSelection } from '../steps/Step1CourseSelection';
import { Step2EnrolleeInfo } from '../steps/Step2EnrolleeInfo';
import { Step3Confirmation } from '../steps/Step3Confirmation';

function CompletionScreen() {
  const { state, dispatch } = useEnrollmentForm();
  const result = state.result!;
  const course = state.selectedCourse;
  const step2 = state.step2;
  const isGroup = step2?.type === 'group';

  const enrolledAt = new Date(result.enrolledAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="py-4 space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">수강 신청이 완료되었습니다!</h2>
          {step2?.name && (
            <p className="text-sm text-zinc-500 mt-1">{step2.name}님의 신청이 접수되었습니다.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 divide-y divide-zinc-100">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-zinc-500">신청 번호</span>
          <span className="font-mono font-semibold text-zinc-800 bg-white px-2 py-0.5 rounded border border-zinc-200 text-xs">
            {result.enrollmentId}
          </span>
        </div>
        {course && (
          <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-zinc-500 flex-shrink-0">강의</span>
            <span className="text-zinc-800 font-medium text-right">{course.title}</span>
          </div>
        )}
        {isGroup && (
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-zinc-500">신청 유형</span>
            <span className="text-zinc-800">단체 신청</span>
          </div>
        )}
        {step2?.name && (
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-zinc-500">신청자</span>
            <span className="text-zinc-800">{step2.name}</span>
          </div>
        )}
        {isGroup && step2?.type === 'group' && (
          <>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-zinc-500">단체명</span>
              <span className="text-zinc-800">{step2.organizationName}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-zinc-500">총 신청 인원</span>
              <span className="text-zinc-800">{step2.headCount + 1}명 <span className="text-zinc-400 text-xs">(대표자 포함)</span></span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-zinc-500">상태</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            result.status === 'confirmed'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {result.status === 'confirmed' ? '신청 확정' : '검토 중'}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-zinc-500">신청 일시</span>
          <span className="text-zinc-600">{enrolledAt}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: 'RESET' })}
        className="w-full px-6 py-2.5 rounded-lg border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        새로운 신청하기
      </button>
    </div>
  );
}

function DraftRestoreBanner() {
  const { restoreDraft, dismissDraft } = useEnrollmentForm();

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-blue-800">
        <span>📋</span>
        <span>이전에 작성하던 신청서가 있습니다.</span>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={restoreDraft}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          이어서 작성
        </button>
        <button
          type="button"
          onClick={dismissDraft}
          className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
        >
          새로 시작
        </button>
      </div>
    </div>
  );
}

function EnrollmentFormInner() {
  const { state, dispatch, hasDraft } = useEnrollmentForm();
  const prevStepRef = useRef(state.step);
  const [animKey, setAnimKey] = useState(0);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (state.step === prevStepRef.current) return;
    const isForward = state.step > prevStepRef.current;
    setAnimClass(isForward ? 'step-slide-forward' : 'step-slide-back');
    setAnimKey(k => k + 1);
    prevStepRef.current = state.step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.step]);

  if (state.result) {
    return (
      <div className="min-h-screen bg-zinc-50 py-4 sm:py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 sm:p-8">
            <CompletionScreen />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-4 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 mb-8 text-center">수강 신청</h1>

        {/* Show draft restore banner only before any data is entered in this session */}
        {hasDraft && !state.step1 && <DraftRestoreBanner />}

        <div className="mb-10">
          <StepIndicator
            currentStep={state.step}
            onStepClick={(step) => dispatch({ type: 'GO_TO_STEP', payload: step })}
          />
        </div>

        <div key={animKey} className={`bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 sm:p-8 ${animClass}`}>
          {state.step === 1 && <Step1CourseSelection />}
          {state.step === 2 && <Step2EnrolleeInfo />}
          {state.step === 3 && <Step3Confirmation />}
        </div>
      </div>
    </div>
  );
}

export function EnrollmentForm() {
  return (
    <EnrollmentFormProvider>
      <EnrollmentFormInner />
    </EnrollmentFormProvider>
  );
}
