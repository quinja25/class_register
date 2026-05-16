import { http, HttpResponse } from 'msw';
import { mockCourseListResponse } from '@/mocks/data/courses';
import type { CourseCategory } from '@/features/enrollment/types/enrollment';

export const courseHandlers = [
  http.get('/api/courses', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') as CourseCategory | null;

    if (category && category !== null) {
      const filtered = {
        ...mockCourseListResponse,
        courses: mockCourseListResponse.courses.filter(
          (course) => course.category === category
        ),
      };
      return HttpResponse.json(filtered);
    }

    return HttpResponse.json(mockCourseListResponse);
  }),
];
