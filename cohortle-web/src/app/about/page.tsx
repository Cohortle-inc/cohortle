"use client";

import Image from "next/image";

// import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="max-w-7xl  mx-auto px-5 sm:px-8 lg:px-16">
      {/* ABOUT COHORTLE */}
      <section className="py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              About Cohortle
            </h2>

            <p className="text-lg text-gray-700 mb-4">
              Cohortle is a mission-driven initiative focused on strengthening
              non-formal and digital education across Africa.
            </p>

            <p className="text-lg text-gray-700">
              We work with purpose-driven organisations to improve how learning
              programmes are designed, delivered, and sustained — especially
              outside traditional classrooms.
            </p>
          </div>

          {/* Image (reused) */}
          <div>
            <Image
              src="/images/about.png"
              alt="Illustration representing Cohortle's mission to strengthen non-formal education"
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </section>

      {/* WHY COHORTLE EXISTS */}
      <section className="py-20 max-w-4xl">
        <h2 className="text-3xl font-bold mb-6">Why Cohortle Exists</h2>

        <div className="space-y-4 text-lg text-gray-700">
          <p>
            Across Africa, nonprofits, universities, training hubs, and
            community organisations are running learning programmes that shape
            skills, leadership, and opportunity.
          </p>

          <p>
            Yet many of these programmes face similar challenges: unclear
            structure, fragmented delivery, low engagement, and limited ability
            to track or improve outcomes over time.
          </p>

          <p className="font-medium text-gray-900">
            Cohortle exists to help organisations organise learning better — so
            programmes are easier to run, learners stay engaged, and impact can
            grow from one cohort to the next.
          </p>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          {/* Image (same one, flipped visually by layout) */}
          <div className="lg:order-2">
            <Image
              src="/images/about.png"
              alt="Illustration showing Cohortle's approach to supporting learning programmes"
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Text */}
          <div className="lg:order-1">
            <h2 className="text-3xl font-bold mb-6">What We Do</h2>

            <p className="text-lg text-gray-700 mb-4">
              We partner with organisations to strengthen their learning
              initiatives by:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>Improving programme structure and cohort design</li>
              <li>Supporting effective delivery and facilitation</li>
              <li>
                Helping teams reflect on outcomes and improve future cohorts
              </li>
            </ul>

            <p className="mt-4 text-lg text-gray-700">
              Our focus is on building capacity within organisations — not
              replacing their teams or running programmes on their behalf.
            </p>
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="py-20 max-w-4xl">
        <h2 className="text-3xl font-bold mb-6">How We Work</h2>

        <div className="space-y-4 text-lg text-gray-700">
          <p>Cohortle takes a partnership-first approach.</p>

          <p>
            Depending on the organisation and its needs, our work may involve
            guidance, frameworks, hands-on support, and — where appropriate —
            digital tools that support structured learning.
          </p>

          <p className="font-medium text-gray-900">
            The work always starts with the programme and the people behind it.
          </p>
        </div>
      </section>
      {/* WHO WE WORK WITH */}
      <section className="py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Who We Work With</h2>

            <p className="text-lg text-gray-700 mb-4">
              We work with organisations committed to learning and long-term
              impact, including:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>Nonprofits and foundations</li>
              <li>University centres and student innovation hubs</li>
              <li>Training providers and community learning organisations</li>
            </ul>

            <p className="mt-4 text-lg text-gray-700">
              Our partners typically run cohort-based or structured learning
              programmes and care deeply about learner outcomes.
            </p>
          </div>

          {/* Image reuse */}
          <div>
            <Image
              src="/images/about.png"
              alt="Illustration depicting organizations Cohortle partners with across Africa"
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </section>
      {/* OUR BELIEF */}
      <section className="py-20 max-w-4xl">
        <h2 className="text-3xl font-bold mb-6">Our Belief</h2>

        <p className="text-lg text-gray-700 mb-4">
          We believe that education outside the classroom plays a critical role
          in Africa’s future.
        </p>

        <p className="text-lg text-gray-700 font-medium">
          When organisations are supported to run learning programmes clearly
          and intentionally, communities grow stronger and impact compounds over
          time.
        </p>
      </section>

      {/* EMAIL CTA */}
      <section
        id="cta"
        className="py-12 mb-8 sm:py-16 flex flex-col items-center text-center bg-gray-50 rounded border"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Start a Conversation
        </h2>
        <p className="text-lg text-slate-600 max-w-xl mb-8">
          If you’re running a learning programme — or planning to — we’d love to
          discuss how we can support your work.
        </p>
        <a
          href="mailto:team@cohortle.com"
          className="inline-flex items-center rounded-md bg-[#391D65] text-white px-5 py-3 font-semibold shadow-cta hover:-translate-y-0.5 transition"
        >
          Start a Partnership
        </a>
      </section>
    </main>
  );
}
