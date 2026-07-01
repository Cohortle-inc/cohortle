'use client';

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { trackCtaClick } from "@/lib/utils/analytics";

export default function FinalCtaSection() {
  return (
    <section className="py-20 bg-[#391D65] text-white">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Copy */}
          <div className="flex-1 text-center lg:text-left">
            <p className="text-purple-300 text-sm font-semibold uppercase tracking-wider mb-4">
              Start a Conversation
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to run better learning programmes?
            </h2>
            <p className="text-lg text-purple-200 mb-8 leading-relaxed">
              If you&apos;re running a learning programme — or planning to — we&apos;d
              love to discuss your programme and how we can support you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/apply"
                onClick={() => trackCtaClick('start_a_partnership', 'footer_cta')}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white text-[#391D65] px-7 py-3.5 text-base font-semibold hover:bg-purple-50 transition shadow"
              >
                Start a Partnership
                <ArrowRight size={18} weight="bold" />
              </Link>
              <Link
                href="/apply/form"
                onClick={() => trackCtaClick('book_a_free_demo', 'footer_cta')}
                className="inline-flex items-center justify-center rounded-md border border-purple-400 text-white px-7 py-3.5 text-base font-semibold hover:bg-white/10 transition"
              >
                Book a Free Demo
              </Link>
            </div>
            <p className="mt-6 text-sm text-purple-300">
              Early partners get hands-on onboarding support and direct input
              into the product roadmap.
            </p>
          </div>

          {/* Illustration */}
          <div className="flex-shrink-0 w-full max-w-xs">
            <CtaIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaIllustration() {
  return (
    <svg
      viewBox="0 0 260 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-auto opacity-90"
    >
      {/* Handshake / partnership illustration */}
      <circle cx="130" cy="130" r="110" fill="white" opacity="0.06" />
      <circle cx="130" cy="130" r="80" fill="white" opacity="0.06" />

      {/* Left hand */}
      <rect x="40" y="115" width="80" height="30" rx="15" fill="white" opacity="0.2" />
      <rect x="40" y="105" width="20" height="20" rx="10" fill="white" opacity="0.25" />
      <rect x="55" y="100" width="20" height="20" rx="10" fill="white" opacity="0.25" />
      <rect x="70" y="98" width="20" height="20" rx="10" fill="white" opacity="0.25" />
      <rect x="85" y="100" width="20" height="20" rx="10" fill="white" opacity="0.25" />

      {/* Right hand */}
      <rect x="140" y="115" width="80" height="30" rx="15" fill="white" opacity="0.2" />
      <rect x="200" y="105" width="20" height="20" rx="10" fill="white" opacity="0.25" />
      <rect x="185" y="100" width="20" height="20" rx="10" fill="white" opacity="0.25" />
      <rect x="170" y="98" width="20" height="20" rx="10" fill="white" opacity="0.25" />
      <rect x="155" y="100" width="20" height="20" rx="10" fill="white" opacity="0.25" />

      {/* Clasped centre */}
      <circle cx="130" cy="130" r="18" fill="white" opacity="0.3" />
      <circle cx="130" cy="130" r="10" fill="white" opacity="0.4" />

      {/* Stars / sparkles */}
      <circle cx="80" cy="70" r="4" fill="white" opacity="0.4" />
      <circle cx="180" cy="70" r="4" fill="white" opacity="0.4" />
      <circle cx="60" cy="180" r="3" fill="white" opacity="0.3" />
      <circle cx="200" cy="180" r="3" fill="white" opacity="0.3" />
      <circle cx="130" cy="50" r="5" fill="white" opacity="0.35" />
      <circle cx="130" cy="210" r="5" fill="white" opacity="0.35" />

      {/* Africa outline (simplified) */}
      <path
        d="M118 195 C108 188 103 175 106 163 C109 151 118 147 122 142 C126 137 128 130 130 127 C132 130 134 137 138 142 C142 147 151 151 154 163 C157 175 152 188 142 195 C138 200 122 200 118 195 Z"
        fill="white"
        opacity="0.15"
      />
    </svg>
  );
}
