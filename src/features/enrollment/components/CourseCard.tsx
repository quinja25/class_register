'use client';

import type { Course } from '../types/enrollment';

interface CourseCardProps {
  course: Course;
  selected: boolean;
  onSelect: (id: string) => void;
}

function getCapacityStatus(course: Course) {
  const remaining = course.maxCapacity - course.currentEnrollment;
  if (remaining === 0) return { type: 'full' as const, remaining };
  if (remaining <= 5) return { type: 'almost' as const, remaining };
  return { type: 'normal' as const, remaining };
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR') + '원';
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) => d.replace(/-/g, '.').slice(2); // "26.07.01"
  return `${fmt(start)} ~ ${fmt(end)}`;
}

export function CourseCard({ course, selected, onSelect }: CourseCardProps) {
  const { type, remaining } = getCapacityStatus(course);
  const isFull = type === 'full';

  return (
    <button
      type="button"
      disabled={isFull}
      onClick={() => onSelect(course.id)}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        isFull
          ? 'opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50'
          : selected
            ? 'border-blue-600 bg-blue-50 shadow-sm'
            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-semibold text-zinc-900 leading-snug">{course.title}</span>
        <div className="shrink-0">
          {type === 'full' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              마감
            </span>
          )}
          {type === 'almost' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
              마감 임박 ({remaining}석)
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-zinc-500 mb-3 line-clamp-2">{course.description}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 mb-3">
        <span>강사: {course.instructor}</span>
        <span>{formatDateRange(course.startDate, course.endDate)}</span>
        <span className="font-medium text-zinc-700">{formatPrice(course.price)}</span>
      </div>

      {/* Capacity bar */}
      {!isFull && (
        <div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                type === 'almost' ? 'bg-orange-400' : 'bg-blue-400'
              }`}
              style={{ width: `${(course.currentEnrollment / course.maxCapacity) * 100}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
