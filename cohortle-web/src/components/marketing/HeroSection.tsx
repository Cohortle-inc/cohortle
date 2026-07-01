'use client';

import Link from "next/link";
import {
  UsersThree,
  BookOpen,
  ChartLineUp,
} from "@phosphor-icons/react/dist/ssr";
import { trackCtaClick } from "@/lib/utils/analytics";

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-24">
      {/* Two-column layout: text + illustration */}
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left: copy */}
        <div className="flex-1 text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#F8F1FF] border border-[#ECDCFF] rounded-full px-4 py-1.5 text-sm font-medium text-[#391D65] mb-6">
            <span className="h-2 w-2 rounded-full bg-[#391D65] inline-block" />
            Run better learning cohorts
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900 mb-5">
            Strengthening learning{" "}
            <span className="text-[#391D65]">across Africa</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
            We partner with purpose-driven organisations to design, organise,
            and sustain effective learning programmes and communities.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              href="/apply"
              onClick={() => trackCtaClick('start_a_partnership', 'hero')}
              className="inline-flex items-center justify-center rounded-lg bg-[#391D65] text-white px-6 py-3.5 text-base font-semibold shadow-sm hover:bg-[#2d1750] hover:-translate-y-0.5 transition-all"
            >
              Start a Partnership
            </Link>
            <Link
              href="/apply/form"
              onClick={() => trackCtaClick('book_a_free_demo', 'hero')}
              className="inline-flex items-center justify-center rounded-lg border border-[#391D65] text-[#391D65] px-6 py-3.5 text-base font-semibold hover:bg-[#F8F1FF] transition-colors"
            >
              Book a Free Demo
            </Link>
          </div>
        </div>

        {/* Right: illustration */}
        <div className="flex-shrink-0 w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[460px]">
          <HeroIllustration />
        </div>
      </div>

      {/* Three value props */}
      <div className="mt-16 pt-10 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { icon: UsersThree, label: "Organise learners in one place" },
          { icon: BookOpen, label: "Deliver structured lessons" },
          { icon: ChartLineUp, label: "Track progress & grow your impact" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 text-slate-700">
            <div className="h-10 w-10 rounded-lg bg-[#F8F1FF] flex items-center justify-center flex-shrink-0">
              <Icon size={20} weight="duotone" className="text-[#391D65]" />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 420 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-auto drop-shadow-sm"
    >
      {/* Background card */}
      <rect x="10" y="10" width="400" height="340" rx="24" fill="#F8F1FF" />

      {/* Top bar accent */}
      <rect x="10" y="10" width="400" height="6" rx="3" fill="#391D65" opacity="0.15" />

      {/* Programme header card */}
      <rect x="30" y="36" width="240" height="110" rx="14" fill="white" />
      <rect x="30" y="36" width="240" height="6" rx="3" fill="#391D65" />
      <rect x="48" y="58" width="130" height="10" rx="5" fill="#391D65" opacity="0.15" />
      <rect x="48" y="76" width="90" height="8" rx="4" fill="#391D65" opacity="0.1" />
      {/* Progress bar */}
      <rect x="48" y="100" width="200" height="7" rx="3.5" fill="#ECDCFF" />
      <rect x="48" y="100" width="122" height="7" rx="3.5" fill="#391D65" />
      <text x="48" y="128" fontSize="10" fill="#391D65" fontWeight="600" opacity="0.8">61% complete</text>

      {/* Learner avatars — stacked, overlapping */}
      <circle cx="300" cy="68" r="24" fill="#391D65" />
      <circle cx="300" cy="59" r="10" fill="white" opacity="0.85" />
      <ellipse cx="300" cy="84" rx="14" ry="9" fill="white" opacity="0.85" />

      <circle cx="336" cy="68" r="24" fill="#5B3A9E" />
      <circle cx="336" cy="59" r="10" fill="white" opacity="0.85" />
      <ellipse cx="336" cy="84" rx="14" ry="9" fill="white" opacity="0.85" />

      <circle cx="372" cy="68" r="24" fill="#7C5CBF" />
      <circle cx="372" cy="59" r="10" fill="white" opacity="0.85" />
      <ellipse cx="372" cy="84" rx="14" ry="9" fill="white" opacity="0.85" />

      {/* Learner count badge */}
      <rect x="286" y="100" width="110" height="26" rx="13" fill="#391D65" />
      <text x="341" y="117" fontSize="10" fill="white" fontWeight="600" textAnchor="middle">24 learners</text>

      {/* Lesson rows */}
      <rect x="30" y="162" width="360" height="48" rx="12" fill="white" />
      <rect x="48" y="178" width="10" height="10" rx="3" fill="#391D65" />
      <rect x="66" y="178" width="110" height="9" rx="4.5" fill="#391D65" opacity="0.15" />
      <rect x="66" y="194" width="70" height="7" rx="3.5" fill="#391D65" opacity="0.08" />
      <rect x="348" y="180" width="30" height="9" rx="4.5" fill="#ECDCFF" />
      <text x="363" y="189" fontSize="8" fill="#391D65" fontWeight="600" textAnchor="middle">Done</text>

      <rect x="30" y="218" width="360" height="48" rx="12" fill="white" />
      <rect x="48" y="234" width="10" height="10" rx="3" fill="#391D65" opacity="0.35" />
      <rect x="66" y="234" width="140" height="9" rx="4.5" fill="#391D65" opacity="0.1" />
      <rect x="66" y="250" width="90" height="7" rx="3.5" fill="#391D65" opacity="0.06" />
      <rect x="348" y="236" width="30" height="9" rx="4.5" fill="#F1F5F9" />

      <rect x="30" y="274" width="360" height="48" rx="12" fill="white" />
      <rect x="48" y="290" width="10" height="10" rx="3" fill="#391D65" opacity="0.2" />
      <rect x="66" y="290" width="100" height="9" rx="4.5" fill="#391D65" opacity="0.08" />
      <rect x="66" y="306" width="60" height="7" rx="3.5" fill="#391D65" opacity="0.05" />

      {/* Mini chart in last row */}
      <rect x="310" y="284" width="12" height="22" rx="3" fill="#391D65" opacity="0.15" />
      <rect x="326" y="276" width="12" height="30" rx="3" fill="#391D65" opacity="0.3" />
      <rect x="342" y="268" width="12" height="38" rx="3" fill="#391D65" opacity="0.6" />
      <rect x="358" y="280" width="12" height="26" rx="3" fill="#391D65" opacity="0.25" />
    </svg>
  );
}
