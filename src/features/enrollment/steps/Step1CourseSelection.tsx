'use client';

import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step1Schema, type Step1Values } from '../schemas/step1Schema';
import { useEnrollmentForm } from '../hooks/useEnrollmentForm';
import { useCourses } from '../hooks/useCourses';
import { CategoryFilter } from '../components/CategoryFilter';
import { CourseCard } from '../components/CourseCard';
import { EnrollmentTypeSelector } from '../components/EnrollmentTypeSelector';
import type { Course, CourseCategory } from '../types/enrollment';

function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-zinc-200 p-4 animate-pulse">
      <div className="h-4 bg-zinc-200 rounded w-2/3 mb-2" />
      <div className="h-3 bg-zinc-200 rounded w-full mb-1" />
      <div className="h-3 bg-zinc-200 rounded w-4/5 mb-3" />
      <div className="flex gap-4">
        <div className="h-3 bg-zinc-200 rounded w-16" />
        <div className="h-3 bg-zinc-200 rounded w-24" />
        <div className="h-3 bg-zinc-200 rounded w-16" />
      </div>
    </div>
  );
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR') + '원';
}

function SelectedCourseSummary({ course }: { course: Course }) {
  const fmt = (d: string) => d.replace(/-/g, '.').slice(2);
  return (
    <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm">
      <span className="text-blue-500 text-base">✓</span>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        <span className="font-semibold text-blue-900">{course.title}</span>
        <span className="text-blue-700">{formatPrice(course.price)}</span>
        <span className="text-blue-600">{fmt(course.startDate)} ~ {fmt(course.endDate)}</span>
      </div>
    </div>
  );
}

export function Step1CourseSelection() {
  const { state, dispatch } = useEnrollmentForm();
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  const courseListRef = useRef<HTMLDivElement>(null);
  const enrollmentTypeRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useCourses(selectedCategory ?? undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: state.step1 ?? undefined,
  });

  const selectedCourseId = watch('selectedCourseId');
  const enrollmentType = watch('enrollmentType');

  // Keep a full unfiltered course list for the selected course summary
  const { data: allData } = useCourses(undefined);
  const selectedCourse = (allData?.courses ?? allCourses).find(c => c.id === selectedCourseId);

  const scrollAndFocus = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  function onInvalid() {
    if (errors.selectedCourseId) {
      scrollAndFocus(courseListRef);
    } else if (errors.enrollmentType) {
      scrollAndFocus(enrollmentTypeRef);
    }
  }

  function onSubmit(data: Step1Values) {
    if (selectedCourse) {
      dispatch({ type: 'SET_SELECTED_COURSE', payload: selectedCourse });
    }
    dispatch({ type: 'SET_STEP1', payload: data });
    dispatch({ type: 'GO_TO_STEP', payload: 2 });
  }

  const categories = data?.categories ?? [];

  const courses = [...(data?.courses ?? [])].sort((a, b) => {
    const priority = (c: Course) => {
      const remaining = c.maxCapacity - c.currentEnrollment;
      if (remaining === 0) return 2;
      if (remaining <= 5) return 1;
      return 0;
    };
    const p = priority(a) - priority(b);
    if (p !== 0) return p;
    return a.startDate.localeCompare(b.startDate);
  });
  const hasCourseError = !!errors.selectedCourseId;

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <div className="space-y-6">

        {/* Selected course summary strip */}
        {selectedCourse && (
          <SelectedCourseSummary course={selectedCourse} />
        )}

        {/* Category filter */}
        <div>
          <h2 className="text-base font-semibold text-zinc-900 mb-3">강의 선택</h2>
          {!isLoading && categories.length > 0 && (
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />
          )}
        </div>

        {/* Course list */}
        <div
          ref={courseListRef}
          className={`space-y-3 rounded-xl transition-colors ${hasCourseError ? 'outline outline-2 outline-red-400 outline-offset-4' : ''}`}
        >
          {isLoading && (
            <>
              <CourseCardSkeleton />
              <CourseCardSkeleton />
              <CourseCardSkeleton />
            </>
          )}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              강의 목록을 불러오지 못했습니다. 페이지를 새로고침해주세요.
            </div>
          )}

          {!isLoading && !isError && courses.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400">
              해당 카테고리에 강의가 없습니다.
            </div>
          )}

          {!isLoading && courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              selected={selectedCourseId === course.id}
              onSelect={(id) => setValue('selectedCourseId', id, { shouldValidate: true })}
            />
          ))}
        </div>

        {hasCourseError && (
          <p className="text-xs text-red-500">{errors.selectedCourseId?.message}</p>
        )}

        {/* Enrollment type */}
        <div ref={enrollmentTypeRef}>
          <EnrollmentTypeSelector
            register={register}
            error={errors.enrollmentType}
          />
          {enrollmentType === 'group' && selectedCourse && (() => {
            const remaining = selectedCourse.maxCapacity - selectedCourse.currentEnrollment;
            if (remaining >= 10) return null;
            return (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>
                  선택한 강의의 잔여 정원이 <strong>{remaining}석</strong>입니다.
                  다음 단계에서 신청 인원을 {remaining}명 이하로 입력해주세요.
                </span>
              </div>
            );
          })()}
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            다음
          </button>
        </div>
      </div>
    </form>
  );
}
