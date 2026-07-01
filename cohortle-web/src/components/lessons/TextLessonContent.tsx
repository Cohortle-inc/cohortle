'use client';

import { sanitizeHtml } from '@/lib/utils/sanitize';

interface TextLessonContentProps {
  title: string;
  htmlContent: string;
}

export function TextLessonContent({ title, htmlContent }: TextLessonContentProps) {
  // Sanitize HTML to prevent XSS attacks
  const sanitizedContent = sanitizeHtml(htmlContent);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Title prominently displayed above content */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
        {title}
      </h1>

      {/* Rich text content with responsive Tailwind typography styles */}
      <div 
        className="prose prose-base sm:prose-lg lg:prose-xl max-w-none 
                   prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mb-4
                   prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                   prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                   prose-strong:text-gray-900 prose-strong:font-semibold
                   prose-ul:my-4 prose-ol:my-4 prose-li:text-gray-700
                   prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic
                   prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                   prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                   prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
                   prose-table:border-collapse prose-th:bg-gray-100 prose-th:p-2 prose-td:p-2 prose-td:border"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  );
}
