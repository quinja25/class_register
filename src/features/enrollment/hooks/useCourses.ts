import { useQuery } from '@tanstack/react-query';
import type { CourseCategory, CourseListResponse } from '@/features/enrollment/types/enrollment';

async function fetchCourses(category?: CourseCategory): Promise<CourseListResponse> {
  const url = category ? `/api/courses?category=${category}` : '/api/courses';
  const res = await fetch(url);
  if (!res.ok) throw new Error('강의 목록을 불러오지 못했습니다.');
  return res.json();
}

export function useCourses(category?: CourseCategory) {
  return useQuery({
    queryKey: ['courses', category ?? 'all'],
    queryFn: () => fetchCourses(category),
  });
}
