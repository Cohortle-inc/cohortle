import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Reusable labelled section wrapper for the interest form.
 * Requirements: 3.1
 */
export default function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-[#391D65] mb-4 pb-2 border-b border-slate-200">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
