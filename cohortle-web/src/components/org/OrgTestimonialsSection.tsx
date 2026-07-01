'use client';

import React from 'react';

interface Testimonial {
  id: number;
  learner_name: string;
  learner_avatar?: string | null;
  programme_name?: string | null;
  quote: string;
  rating: number;
}

interface OrgTestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function OrgTestimonialsSection({ testimonials }: OrgTestimonialsSectionProps) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          What Our Learners Say
        </h2>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
          Hear from learners who have transformed their skills through our programmes
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Learner Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {testimonial.learner_avatar ? (
                  <img
                    src={testimonial.learner_avatar}
                    alt={testimonial.learner_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#391D65] flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.learner_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    {testimonial.learner_name}
                  </div>
                  {testimonial.programme_name && (
                    <div className="text-xs text-gray-500">
                      {testimonial.programme_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
