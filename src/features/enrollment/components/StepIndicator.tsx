'use client';

import type { Step } from '../context/enrollmentReducer';

const STEPS = [
  { number: 1, label: '강의 선택' },
  { number: 2, label: '수강생 정보' },
  { number: 3, label: '확인 및 제출' },
] as const;

interface StepIndicatorProps {
  currentStep: Step;
  onStepClick?: (step: Step) => void;
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <ol className="flex items-center w-full">
      {STEPS.map(({ number, label }, index) => {
        const isDone = number < currentStep;
        const isActive = number === currentStep;
        const isClickable = isDone && !!onStepClick;

        const circle = (
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
              isDone
                ? 'bg-blue-600 border-blue-600 text-white'
                : isActive
                  ? 'bg-white border-blue-600 text-blue-600'
                  : 'bg-white border-zinc-300 text-zinc-400'
            } ${isClickable ? 'hover:bg-blue-700 hover:border-blue-700' : ''}`}
          >
            {isDone ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              number
            )}
          </div>
        );

        return (
          <li
            key={number}
            className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
          >
            <div className="flex flex-col items-center gap-1">
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(number as Step)}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  aria-label={`${label}로 돌아가기`}
                >
                  {circle}
                </button>
              ) : (
                circle
              )}
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-blue-600' : isDone ? 'text-zinc-600' : 'text-zinc-400'
                } ${isClickable ? 'cursor-pointer hover:text-blue-600' : ''}`}
                onClick={isClickable ? () => onStepClick(number as Step) : undefined}
              >
                {label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${
                  isDone ? 'bg-blue-600' : 'bg-zinc-200'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
