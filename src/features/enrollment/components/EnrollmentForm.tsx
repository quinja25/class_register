'use client';

import { EnrollmentFormProvider } from '../context/EnrollmentFormContext';
import { useEnrollmentForm } from '../hooks/useEnrollmentForm';
import { StepIndicator } from './StepIndicator';
import { Step1CourseSelection } from '../steps/Step1CourseSelection';
import { Step2EnrolleeInfo } from '../steps/Step2EnrolleeInfo';
import { Step3Confirmation } from '../steps/Step3Confirmation';

function CompletionScreen({ enrollmentId }: { enrollmentId: string }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="text-4xl">✓</div>
      <h2 className="text-xl font-bold text-zinc-900">수강 신청이 완료되었습니다</h2>
      <p className="text-sm text-zinc-500">신청 번호: <span className="font-mono font-semibold text-zinc-800">{enrollmentId}</span></p>
    </div>
  );
}

function DraftRestoreBanner() {
  const { restoreDraft, dismissDraft } = useEnrollmentForm();

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
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
  const { state, hasDraft } = useEnrollmentForm();

  if (state.result) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
            <CompletionScreen enrollmentId={state.result.enrollmentId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 mb-8 text-center">수강 신청</h1>

        {/* Show draft restore banner only before any data is entered in this session */}
        {hasDraft && !state.step1 && <DraftRestoreBanner />}

        <div className="mb-10">
          <StepIndicator currentStep={state.step} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
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
