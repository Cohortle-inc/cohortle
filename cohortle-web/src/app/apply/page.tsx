import Link from 'next/link';
import FunnelLayout from '@/components/marketing/FunnelLayout';
import { CheckCircle, ArrowRight } from '@phosphor-icons/react/dist/ssr';

/**
 * Pre-form landing page — qualifies visitors before they reach the interest form.
 * Requirements: 2.1, 2.2, 2.3
 */
export default function ApplyPage() {
  return (
    <FunnelLayout>
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
          Start a Partnership with Cohortle
        </h1>
        <p className="text-lg text-slate-600 mb-10">
          We&apos;re working with a small group of organisations to build the right product together.
          If you run a cohort-based programme and want a better way to manage it, this is for you.
        </p>

        {/* Who it's for */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Who this is for</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              'NGOs and nonprofits running training programmes',
              'Fellowship and leadership development programmes',
              'Bootcamps and accelerators',
              'Community-led learning initiatives',
            ].map((item) => (
              <li key={item} className="flex gap-2 items-start">
                <ArrowRight size={16} weight="bold" className="text-[#391D65] mt-1 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What you get */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">What you&apos;ll get</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              'Early access to the Cohortle platform',
              'Hands-on onboarding support',
              'Direct input into the product roadmap',
              'Partner pricing when we launch publicly',
            ].map((item) => (
              <li key={item} className="flex gap-2 items-start">
                <CheckCircle size={18} weight="duotone" className="text-[#391D65] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3-step process */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">How it works</h2>
          <ol className="space-y-4">
            {[
              { step: '1', title: 'Submit Form', desc: 'Tell us about your programme and book a demo slot.' },
              { step: '2', title: 'Review', desc: 'We review your application and confirm the demo.' },
              { step: '3', title: 'Demo Session', desc: 'We walk through Cohortle together and define next steps.' },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-[#391D65] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-slate-600 text-sm">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Link
          href="/apply/form"
          className="inline-flex items-center gap-2 justify-center rounded-lg bg-[#391D65] text-white px-6 py-3.5 text-base font-semibold shadow hover:-translate-y-0.5 transition"
        >
          Continue to Application
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    </FunnelLayout>
  );
}
