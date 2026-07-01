import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions governing your use of Cohortle.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "14 April 2026";

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[#F8F1FF] border-b border-[#ECDCFF]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-12">
          <p className="text-sm font-semibold text-[#391D65] uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
        <p className="text-slate-600 text-lg leading-relaxed mb-10">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Cohortle (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) at{" "}
          <a href="https://cohortle.com" className="text-[#391D65] hover:underline">cohortle.com</a>.
          By creating an account or using the platform, you agree to these Terms. If you do not agree,
          please do not use Cohortle.
        </p>

        <Section title="1. About Cohortle">
          <p>
            Cohortle is a learning management platform for non-formal, cohort-based learning. It enables
            organisations (&quot;Conveners&quot;) to create and manage learning programmes, and individuals
            (&quot;Learners&quot;) to enrol in and participate in those programmes.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 16 years old to use Cohortle. By using the platform, you confirm that
            you meet this requirement. If you are using Cohortle on behalf of an organisation, you confirm
            that you have authority to bind that organisation to these Terms.
          </p>
        </Section>

        <Section title="3. Accounts">
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate and complete registration information.</li>
            <li>Keep your password secure and not share it with others.</li>
            <li>Notify us immediately at <a href="mailto:team@cohortle.com" className="text-[#391D65] hover:underline">team@cohortle.com</a> if you suspect unauthorised access.</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the platform for any unlawful purpose or in violation of applicable laws.</li>
            <li>Upload or transmit content that is harmful, offensive, defamatory, or infringes the rights of others.</li>
            <li>Attempt to gain unauthorised access to any part of the platform or its systems.</li>
            <li>Interfere with or disrupt the integrity or performance of the platform.</li>
            <li>Scrape or extract data from the platform without our prior written consent.</li>
            <li>Impersonate any person or entity or misrepresent your affiliation.</li>
          </ul>
        </Section>

        <Section title="5. Content">
          <p><strong>Your content.</strong> You retain ownership of content you upload to Cohortle. By uploading content, you grant Cohortle a non-exclusive, worldwide, royalty-free licence to host, display, and deliver that content as necessary to operate the platform.</p>
          <p><strong>Our content.</strong> All platform software, design, and documentation is owned by Cohortle and protected by intellectual property laws. You may not copy, modify, or distribute it without our written permission.</p>
          <p><strong>Content standards.</strong> You are solely responsible for the content you upload. We reserve the right to remove content that violates these Terms or that we deem harmful to the community.</p>
        </Section>

        <Section title="6. Convener Responsibilities">
          <p>If you use Cohortle as a Convener, you are responsible for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ensuring your programme content complies with applicable laws and does not infringe third-party rights.</li>
            <li>Obtaining any necessary consents from Learners you invite to your programme.</li>
            <li>Managing your programme in a manner that is fair and respectful to Learners.</li>
          </ul>
        </Section>

        <Section title="7. Privacy">
          <p>
            Your use of Cohortle is also governed by our{" "}
            <Link href="/privacy" className="text-[#391D65] hover:underline">Privacy Policy</Link>,
            which is incorporated into these Terms by reference.
          </p>
        </Section>

        <Section title="8. Third-Party Integrations">
          <p>
            Cohortle integrates with third-party services such as Google Drive and Google OAuth. Your use
            of those services is subject to their respective terms and privacy policies. We are not
            responsible for the practices of third-party services.
          </p>
        </Section>

        <Section title="9. Availability and Changes">
          <p>We aim to keep Cohortle available at all times but do not guarantee uninterrupted access. We may modify, suspend, or discontinue any part of the platform at any time with reasonable notice where possible.</p>
          <p>We may update these Terms from time to time. We will notify you of material changes by email or via the platform. Continued use after changes take effect constitutes acceptance of the updated Terms.</p>
        </Section>

        <Section title="10. Disclaimers">
          <p>
            Cohortle is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or
            implied. We do not warrant that the platform will be error-free, secure, or meet your specific requirements.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Cohortle shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising from your use of or inability to use the platform.
            Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months
            preceding the claim.
          </p>
        </Section>

        <Section title="12. Termination">
          <p>
            You may stop using Cohortle and delete your account at any time. We may suspend or terminate your
            access if you breach these Terms or if we decide to discontinue the service, with reasonable notice
            where possible.
          </p>
        </Section>

        <Section title="13. Governing Law">
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes
            arising from these Terms shall be subject to the exclusive jurisdiction of the courts
            of Nigeria.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:team@cohortle.com" className="text-[#391D65] hover:underline">team@cohortle.com</a>.
          </p>
        </Section>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 text-sm text-slate-500">
          <Link href="/privacy" className="text-[#391D65] hover:underline font-medium">
            Read our Privacy Policy →
          </Link>
          <Link href="/" className="hover:text-slate-700">Back to home</Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
