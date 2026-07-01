'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FunnelLayout from '@/components/marketing/FunnelLayout';

const BOOKING_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0mg8O-7Hx3fta-9QjsbhwgBKY5kk4b7tl8fiJOUwSd7g84dh23S2BatfWsDTbZsf6A8CqcnSkD?gv=true';

export default function ConfirmationPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const submitted = sessionStorage.getItem('funnel_submitted');
    if (!submitted) {
      router.replace('/apply');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <FunnelLayout>
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-12">
        {/* Confirmation header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-7 w-7 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
            Application received!
          </h1>
          <p className="text-lg text-slate-600">
            Now pick a time for your demo and we&apos;ll walk through Cohortle together.
          </p>
        </div>

        {/* Google Calendar booking */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Book your demo slot
          </h2>

          {/* Google Calendar Appointment Scheduling begin */}
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <iframe
              src={BOOKING_URL}
              title="Book a demo"
              style={{ border: 0 }}
              width="100%"
              height="600"
              frameBorder={0}
              className="block"
            />
          </div>
          {/* end Google Calendar Appointment Scheduling */}

          {/* Alternative contacts */}
          <div className="mt-4 text-sm text-slate-500 text-center space-y-1">
            <p>Can&apos;t see the calendar? Reach us directly:</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-2">
              <a
                href="https://wa.me/2347017522804"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-[#25D366] text-white px-4 py-2 text-sm font-semibold hover:bg-[#1ebe5d] transition-colors"
              >
                WhatsApp +234 701 752 2804
              </a>
              <a
                href="mailto:team@cohortle.com"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-white transition-colors"
              >
                team@cohortle.com
              </a>
            </div>
          </div>
        </div>

        {/* What to expect */}
        <div className="bg-[#F8F1FF] rounded-xl border border-[#ECDCFF] p-6 mb-6">
          <h2 className="text-base font-semibold text-[#391D65] mb-3">What to expect in your demo</h2>
          <ol className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="font-bold text-[#391D65]">1.</span>
              We&apos;ll start by understanding your programme — structure, participants, and goals.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#391D65]">2.</span>
              We&apos;ll walk through Cohortle live and show you how it fits your context.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#391D65]">3.</span>
              We&apos;ll define clear next steps together — whether that&apos;s onboarding or a pilot.
            </li>
          </ol>
        </div>

        {/* Prep checklist */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">
            To make the most of your demo, please prepare:
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-[#391D65] font-bold flex-shrink-0">→</span>
              A description of your current programme structure (weeks, sessions, content types)
            </li>
            <li className="flex gap-2">
              <span className="text-[#391D65] font-bold flex-shrink-0">→</span>
              Your biggest operational challenge right now
            </li>
            <li className="flex gap-2">
              <span className="text-[#391D65] font-bold flex-shrink-0">→</span>
              Your goals for the next cohort — what does success look like?
            </li>
          </ul>
        </div>
      </div>
    </FunnelLayout>
  );
}
