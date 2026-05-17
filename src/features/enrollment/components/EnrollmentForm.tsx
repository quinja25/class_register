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

function EnrollmentFormInner() {
  const { state } = useEnrollmentForm();

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
