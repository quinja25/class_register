'use client';

import { EnrollmentFormProvider } from '../context/EnrollmentFormContext';
import { useEnrollmentForm } from '../hooks/useEnrollmentForm';
import { StepIndicator } from './StepIndicator';
import { Step1CourseSelection } from '../steps/Step1CourseSelection';

function EnrollmentFormInner() {
  const { state } = useEnrollmentForm();

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 mb-8 text-center">수강 신청</h1>

        <div className="mb-10">
          <StepIndicator currentStep={state.step} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
          {state.step === 1 && <Step1CourseSelection />}
          {state.step === 2 && <div className="text-zinc-400">Step 2: 수강생 정보 (coming soon)</div>}
          {state.step === 3 && <div className="text-zinc-400">Step 3: 확인 및 제출 (coming soon)</div>}
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
