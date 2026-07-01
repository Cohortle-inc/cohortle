'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

const CATEGORIES = [
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'accelerator', label: 'Accelerator' },
  { value: 'incubator', label: 'Incubator' },
  { value: 'leadership', label: 'Leadership Programme' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'challenge', label: 'Innovation Challenge' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'ngo_training', label: 'NGO Training' },
  { value: 'other', label: 'Other' },
];

export default function NewOpportunityPage() {
  const { isLoading } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [highlights, setHighlights] = useState<string[]>(['', '', '']);
  // Tracks whether the publish button triggered the submit
  const publishIntentRef = useRef(false);

  const [form, setForm] = useState({
    title: '',
    organisation: '',
    category: 'fellowship',
    format: '',
    duration: '',
    price_info: '',
    description: '',
    thumbnail_url: '',
    apply_url: '',
    deadline: '',
    location: '',
    is_featured: false,
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateHighlight(index: number, value: string) {
    setHighlights((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const publishAfter = publishIntentRef.current;
    publishIntentRef.current = false; // reset

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        highlights: highlights.filter(Boolean),
        deadline: form.deadline || undefined,
        format: form.format || undefined,
      };

      // Use the proxy — auth token is in the httpOnly cookie, not localStorage
      const res = await fetch('/api/proxy/v1/api/admin/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || `Failed to create opportunity (${res.status}).`);
        return;
      }

      const created = await res.json();
      const newId = created.opportunity?.id ?? created.id;

      if (publishAfter && newId) {
        const pubRes = await fetch(`/api/proxy/v1/api/admin/opportunities/${newId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        });
        if (!pubRes.ok) {
          // Draft was created but publish failed — still redirect
          router.push('/admin/opportunities');
          return;
        }
      }

      router.push('/admin/opportunities');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin/opportunities')} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-950">New opportunity</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
              placeholder="e.g. Mandela Washington Fellowship"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organisation *</label>
            <input
              value={form.organisation}
              onChange={(e) => updateField('organisation', e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
              placeholder="e.g. IREX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={form.format}
              onChange={(e) => updateField('format', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
            >
              <option value="">Not specified</option>
              <option value="online">Online</option>
              <option value="in-person">In-person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <input
              value={form.duration}
              onChange={(e) => updateField('duration', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
              placeholder="e.g. 6 weeks"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price / Funding</label>
            <input
              value={form.price_info}
              onChange={(e) => updateField('price_info', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
              placeholder="e.g. Fully funded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
              placeholder="e.g. Washington D.C., USA"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Apply URL *</label>
            <input
              type="url"
              value={form.apply_url}
              onChange={(e) => updateField('apply_url', e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
              placeholder="https://..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
            <input
              type="url"
              value={form.thumbnail_url}
              onChange={(e) => updateField('thumbnail_url', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
              placeholder="https://..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
              placeholder="Brief description of the opportunity..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Highlights (up to 3)</label>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <input
                  key={i}
                  value={h}
                  onChange={(e) => updateHighlight(i, e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
                  placeholder={`Highlight ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => updateField('is_featured', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#391D65]"
              />
              <span className="text-sm font-medium text-gray-700">Feature this opportunity (appears at top of Discover)</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {/* type="submit" — triggers form validation, publishIntentRef stays false */}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[#391D65] hover:text-[#391D65] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save as draft'}
          </button>
          {/* Sets intent then submits the form — HTML5 validation still runs */}
          <button
            type="submit"
            disabled={saving}
            onClick={() => { publishIntentRef.current = true; }}
            className="px-5 py-2.5 rounded-md bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors disabled:opacity-60"
          >
            {saving ? 'Publishing...' : 'Save & Publish'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/opportunities')}
            className="px-5 py-2.5 rounded-md border border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
