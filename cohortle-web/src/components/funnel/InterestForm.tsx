'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/ui/FormInput';
import FormSection from './FormSection';
import { submitLead, type ProgrammeType } from '@/lib/api/funnel';
import { trackFunnelSubmit } from '@/lib/utils/analytics';

interface FormFields {
  organisation_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  programme_type: ProgrammeType | '';
  participant_count: string;
  current_tools: string;
  pain_points: string;
  cohort_start_date: string;
}

interface FormErrors {
  organisation_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  programme_type?: string;
}

const PROGRAMME_TYPES: { value: ProgrammeType; label: string }[] = [
  { value: 'fellowship', label: 'Fellowship Programme' },
  { value: 'training', label: 'NGO Training Programme' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'community', label: 'Community-Led Programme' },
  { value: 'other', label: 'Other' },
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Multi-section interest form for the marketing funnel.
 * Requirements: 3.1–3.10
 */
export default function InterestForm() {
  const router = useRouter();

  const [fields, setFields] = useState<FormFields>({
    organisation_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    programme_type: '',
    participant_count: '',
    current_tools: '',
    pain_points: '',
    cohort_start_date: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as the user types
    if (name in errors) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};

    if (!fields.organisation_name.trim()) {
      errs.organisation_name = 'Organisation name is required.';
    }
    if (!fields.contact_name.trim()) {
      errs.contact_name = 'Contact name is required.';
    }
    if (!fields.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!isValidEmail(fields.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!fields.programme_type) {
      errs.programme_type = 'Please select a programme type.';
    }
    if (!fields.phone.trim()) {
      errs.phone = 'WhatsApp / phone number is required.';
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await submitLead({
        organisation_name: fields.organisation_name.trim(),
        contact_name: fields.contact_name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim() || undefined,
        website: fields.website.trim() || undefined,
        programme_type: fields.programme_type as ProgrammeType,
        participant_count: fields.participant_count
          ? parseInt(fields.participant_count, 10)
          : undefined,
        current_tools: fields.current_tools.trim() || undefined,
        pain_points: fields.pain_points.trim() || undefined,
        cohort_start_date: fields.cohort_start_date.trim() || undefined,
      });

      trackFunnelSubmit(fields.programme_type);
      sessionStorage.setItem('funnel_submitted', 'true');
      router.push('/apply/confirmation');
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again or email us at team@cohortle.com.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Top-level API error banner */}
      {apiError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {apiError}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <FormSection title="Basic Info">
        <FormInput
          label="Organisation Name"
          name="organisation_name"
          value={fields.organisation_name}
          onChange={handleChange}
          error={errors.organisation_name}
          required
          autoComplete="organization"
        />
        <FormInput
          label="Contact Person Full Name"
          name="contact_name"
          value={fields.contact_name}
          onChange={handleChange}
          error={errors.contact_name}
          required
          autoComplete="name"
        />
        <FormInput
          label="Email Address"
          name="email"
          type="email"
          value={fields.email}
          onChange={handleChange}
          error={errors.email}
          required
          autoComplete="email"
        />
        <FormInput
          label="WhatsApp / Phone Number"
          name="phone"
          type="tel"
          value={fields.phone}
          onChange={handleChange}
          error={errors.phone}
          required
          autoComplete="tel"
        />
        <FormInput
          label="Website or Social Media Link"
          name="website"
          type="url"
          value={fields.website}
          onChange={handleChange}
          placeholder="https://"
          autoComplete="url"
        />
      </FormSection>

      {/* Section 2: Programme Info */}
      <FormSection title="Programme Info">
        <div className="mb-4">
          <label
            htmlFor="programme_type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Programme Type <span className="text-red-500">*</span>
          </label>
          <select
            id="programme_type"
            name="programme_type"
            value={fields.programme_type}
            onChange={handleChange}
            required
            aria-invalid={!!errors.programme_type}
            aria-describedby={errors.programme_type ? 'programme_type-error' : undefined}
            className={`w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
              errors.programme_type
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
          >
            <option value="">Select a programme type…</option>
            {PROGRAMME_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
          {errors.programme_type && (
            <p id="programme_type-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.programme_type}
            </p>
          )}
        </div>

        <FormInput
          label="Estimated Number of Participants"
          name="participant_count"
          type="number"
          min="1"
          value={fields.participant_count}
          onChange={handleChange}
          placeholder="e.g. 30"
        />

        <div className="mb-4">
          <label
            htmlFor="current_tools"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Current Tools Used
          </label>
          <textarea
            id="current_tools"
            name="current_tools"
            value={fields.current_tools}
            onChange={handleChange}
            rows={3}
            placeholder="e.g. WhatsApp, Google Sheets, Notion…"
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>
      </FormSection>

      {/* Section 3: Pain Points */}
      <FormSection title="Pain Points">
        <div className="mb-4">
          <label
            htmlFor="pain_points"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            What challenges are you currently facing with your programme?
          </label>
          <textarea
            id="pain_points"
            name="pain_points"
            value={fields.pain_points}
            onChange={handleChange}
            rows={5}
            placeholder="Tell us about your biggest operational challenges…"
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>
      </FormSection>

      {/* Section 4: Readiness */}
      <FormSection title="Readiness">
        <FormInput
          label="When is your next cohort starting?"
          name="cohort_start_date"
          value={fields.cohort_start_date}
          onChange={handleChange}
          placeholder="e.g. March 2026 or a specific date"
        />
      </FormSection>

      {/* Section 5: Demo Scheduling — removed from form, handled on confirmation page */}

      <div className="mt-8">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 bg-[#391D65] text-white font-semibold rounded-lg hover:bg-[#2d1750] focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
        <p className="mt-3 text-sm text-slate-500">
          After submitting, you&apos;ll be able to book your demo slot on the next page.
        </p>
      </div>
    </form>
  );
}
