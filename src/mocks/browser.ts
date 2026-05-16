import { setupWorker } from 'msw/browser';
import { courseHandlers } from './handlers/courseHandlers';
import { enrollmentHandlers } from './handlers/enrollmentHandlers';

export const worker = setupWorker(...courseHandlers, ...enrollmentHandlers);
