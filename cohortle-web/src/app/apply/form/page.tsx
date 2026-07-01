import FunnelLayout from '@/components/marketing/FunnelLayout';
import InterestForm from '@/components/funnel/InterestForm';

export const metadata = {
  title: 'Start a Partnership with Cohortle',
  description: 'Tell us about your programme and book a free demo.',
};

/**
 * Interest form page — /apply/form
 * Requirements: 3.1
 */
export default function ApplyFormPage() {
  return (
    <FunnelLayout>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#391D65] mb-2">
            Partner Application
          </h1>
          <p className="text-slate-600">
            Fill in the details below. You&apos;ll be able to book your demo slot on the next page.
          </p>
        </div>
        <InterestForm />
      </div>
    </FunnelLayout>
  );
}
