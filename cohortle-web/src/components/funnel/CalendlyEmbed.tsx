'use client';

import React from 'react';

/**
 * Google Calendar appointment scheduling embed.
 */
export default function GoogleCalendarEmbed() {
  return (
    <div>
      {/* Google Calendar Appointment Scheduling begin */}
      <iframe
        src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0mg8O-7Hx3fta-9QjsbhwgBKY5kk4b7tl8fiJOUwSd7g84dh23S2BatfWsDTbZsf6A8CqcnSkD?gv=true"
        style={{ border: 0 }}
        width="100%"
        height="600"
        frameBorder={0}
        title="Book a demo"
      />
      {/* end Google Calendar Appointment Scheduling */}

      {/* Fallback contacts */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="mb-3">
          Can&apos;t see the calendar? Reach us directly:
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://wa.me/2347017522804"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[#25D366] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#1ebe5d] transition-colors"
          >
            WhatsApp +234 701 752 2804
          </a>
          <a
            href="mailto:team@cohortle.com"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-700 px-5 py-2.5 text-sm font-medium hover:bg-white transition-colors"
          >
            team@cohortle.com
          </a>
        </div>
      </div>
    </div>
  );
}
