'use client';

import { useState } from 'react';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'fellowship', label: 'Fellowships' },
  { value: 'accelerator', label: 'Accelerators' },
  { value: 'bootcamp', label: 'Bootcamps' },
  { value: 'scholarship', label: 'Scholarships' },
  { value: 'leadership', label: 'Leadership Programmes' },
  { value: 'challenge', label: 'Innovation Challenges' },
  { value: 'ngo_training', label: 'NGO Training' },
];

export function OpportunityAlertsForm() {
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/proxy/v1/api/funnel/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'discover_alerts',
          metadata: { category: category || 'all' },
        }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
        setCategory('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <section className="bg-[#391D65]/5 border border-[#391D65]/20 rounded-xl p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-[#391D65]/10 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-[#391D65]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-950">You&apos;re on the list</h3>
        <p className="mt-1 text-sm text-gray-600">We&apos;ll send you new opportunities as they&apos;re added.</p>
      </section>
    );
  }

  return (
    <section className="bg-[#391D65]/5 border border-[#391D65]/20 rounded-xl p-6">
      <h2 className="text-base font-semibold text-gray-950 mb-1">Get new opportunities in your inbox</h2>
      <p className="text-sm text-gray-600 mb-4">New fellowships, bootcamps, and programmes added weekly.</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          className="flex-1 rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65] bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 py-2.5 rounded-md bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors disabled:opacity-60"
        >
          {status === 'loading' ? 'Subscribing...' : 'Get alerts'}
        </button>
      </form>

      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">Something went wrong. Please try again.</p>
      )}
    </section>
  );
}
