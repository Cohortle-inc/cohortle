import type { Metadata } from 'next';
import HeroSection from "@/components/marketing/HeroSection";
import ProblemSection from "@/components/marketing/ProblemSection";
import SolutionSection from "@/components/marketing/SolutionSection";
import UseCasesSection from "@/components/marketing/UseCasesSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";

export const metadata: Metadata = {
  title: 'Cohortle — Cohort-Based Learning Infrastructure',
  description: 'Purpose-built infrastructure for non-formal, cohort-based learning. Empower educators and learners with tools designed for collaborative, community-driven education.',
};
import SocialProofSection from "@/components/marketing/SocialProofSection";
import FinalCtaSection from "@/components/marketing/FinalCtaSection";

export default function Page() {
  return (
    <main>
      {/* Hero — full width section, container inside */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16">
        <HeroSection />
      </div>

      <ProblemSection />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16">
        <SolutionSection />
      </div>

      <UseCasesSection />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16">
        <HowItWorksSection />
      </div>

      <SocialProofSection />
      <FinalCtaSection />
    </main>
  );
}
