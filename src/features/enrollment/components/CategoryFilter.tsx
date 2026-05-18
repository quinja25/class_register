'use client';

import type { CourseCategory } from '../types/enrollment';

const CATEGORY_LABELS: Record<CourseCategory, string> = {
  development: '개발',
  design: '디자인',
  marketing: '마케팅',
  business: '비즈니스',
};

interface CategoryFilterProps {
  categories: string[];
  selected: CourseCategory | null;
  onChange: (category: CourseCategory | null) => void;
}

export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`px-4 py-1.5 min-h-[44px] rounded-full text-sm font-medium transition-colors ${
          selected === null
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
        }`}
      >
        전체
      </button>
      {categories.map((cat) => {
        const category = cat as CourseCategory;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`px-4 py-1.5 min-h-[44px] rounded-full text-sm font-medium transition-colors ${
              selected === category
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {CATEGORY_LABELS[category] ?? category}
          </button>
        );
      })}
    </div>
  );
}
