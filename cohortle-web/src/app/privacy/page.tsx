import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Cohortle collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "14 April 2026";

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[#F8F1FF] border-b border-[#ECDCFF]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-12">
          <p className="text-sm font-semibold text-[#391D65] uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
        <p className="text-slate-600 text-lg leading-relaxed mb-10">
          Cohortle (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
          This policy explains what personal data we collect, why we collect it, and how we use and
          protect it when you use our platform at{" "}
          <a href="https://cohortle.com" className="text-[#391D65] hover:underline">cohortle.com</a>.
        </p>

        <Section title="1. Who We Are">
          <p>
            Cohortle provides purpose-built infrastructure for non-formal, cohort-based learning.
            We work with organisations across Africa and beyond to design, organise, and sustain
            effective learning programmes.
          </p>
          <p>
            If you have questions about this policy, contact us at{" "}
            <a href="mailto:team@cohortle.com" className="text-[#391D65] hover:underline">team@cohortle.com</a>.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data</strong> — name, email address, and password (hashed) when you register.</li>
            <li><strong>Profile data</strong> — optional bio, LinkedIn URL, and profile avatar you choose to add.</li>
            <li><strong>Learning data</strong> — lesson completions, quiz attempts, streaks, and programme progress.</li>
            <li><strong>Usage data</strong> — pages visited, features used, and device/browser information collected via analytics tools.</li>
            <li><strong>Communications</strong> — messages you send us via email or interest forms on the site.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <p>We use your data to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create and manage your account and learning experience.</li>
            <li>Track your progress and award achievements.</li>
            <li>Send transactional emails (e.g. password resets, welcome emails).</li>
            <li>Improve the platform through aggregated, anonymised analytics.</li>
            <li>Respond to your enquiries and support requests.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="4. Legal Basis for Processing">
          <p>We process your data on the following legal bases:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contract</strong> — processing necessary to provide the service you signed up for.</li>
            <li><strong>Legitimate interests</strong> — improving the platform and preventing fraud.</li>
            <li><strong>Consent</strong> — where you have explicitly opted in (e.g. marketing communications).</li>
            <li><strong>Legal obligation</strong> — where required by applicable law.</li>
          </ul>
        </Section>

        <Section title="5. Cookies and Analytics">
          <p>
            We use cookies and similar technologies to keep you logged in and to understand how the
            platform is used. We use Google Analytics and Umami for anonymised usage analytics. You
            can disable cookies in your browser settings, though some features may not work correctly.
          </p>
        </Section>

        <Section title="6. Third-Party Services">
          <p>We use trusted third-party services to operate the platform, including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Resend</strong> — for transactional email delivery.</li>
            <li><strong>Google OAuth</strong> — for optional sign-in with Google.</li>
            <li><strong>Google Drive</strong> — for optional content integration by programme conveners.</li>
            <li><strong>Cloudflare</strong> — for CDN, DNS, and security.</li>
          </ul>
          <p>Each provider processes data only as necessary to deliver their service and is bound by their own privacy policies.</p>
        </Section>

        <Section title="7. Data Retention">
          <p>
            We retain your personal data for as long as your account is active or as needed to provide
            services. If you delete your account, we will delete or anonymise your personal data within
            30 days, except where we are required to retain it by law.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to or restrict certain processing.</li>
            <li>Data portability.</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:team@cohortle.com" className="text-[#391D65] hover:underline">team@cohortle.com</a>.
          </p>
        </Section>

        <Section title="9. Data Security">
          <p>
            We use industry-standard security measures including encrypted connections (HTTPS), hashed
            passwords, and access controls to protect your data. No method of transmission over the
            internet is 100% secure, but we take reasonable steps to protect your information.
          </p>
        </Section>

        <Section title="10. Children's Privacy">
          <p>
            Cohortle is not directed at children under 16. We do not knowingly collect personal data
            from children. If you believe a child has provided us with personal data, please contact
            us and we will delete it promptly.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this policy from time to time. We will notify you of significant changes by
            email or by posting a notice on the platform. Continued use of Cohortle after changes take
            effect constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            For any privacy-related questions or requests, contact us at{" "}
            <a href="mailto:team@cohortle.com" className="text-[#391D65] hover:underline">team@cohortle.com</a>.
          </p>
        </Section>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 text-sm text-slate-500">
          <Link href="/terms" className="text-[#391D65] hover:underline font-medium">
            Read our Terms of Service →
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
