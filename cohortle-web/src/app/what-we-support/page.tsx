"use client";

export default function WhatWeSupportPage() {
  return (
    <main className="max-w-7xl mt-20 mx-auto px-5 sm:px-8 lg:px-16">
      {/* INTRO */}
      <section className="py-24 max-w-4xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
          What We Support
        </h1>

        <p className="text-lg text-gray-700 mb-4">
          Cohortle supports organisations delivering structured, outcome-driven
          non-formal and digital education programmes.
        </p>

        <p className="text-lg text-gray-700">
          We are most effective when working with programmes that run over time,
          involve real cohorts of learners, and are designed to create lasting
          impact.
        </p>
      </section>

      {/* PROGRAMME TYPES */}
      <section className="py-20 space-y-32">
        {/* Fellowship & Leadership */}
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              🎓 Fellowship & Leadership Programmes
            </h2>

            <p className="text-lg text-gray-700 mb-4">
              We support organisations running leadership, civic, policy, or
              professional fellowships that involve:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>Clearly defined cohorts</li>
              <li>Structured learning journeys</li>
              <li>Facilitation and peer learning</li>
              <li>Reflection and outcome tracking</li>
            </ul>

            <p className="mt-4 text-lg text-gray-700">
              These programmes benefit from stronger structure, continuity
              across cohorts, and improved learner engagement.
            </p>
          </div>

          <div aria-hidden className="aspect-square rounded-2xl bg-slate-100" />
        </div>

        {/* Digital Skills */}
        <div className="grid gap-12 lg:grid-cols-2 items-center lg:grid-flow-col-dense">
          <div className="lg:col-start-2">
            <h2 className="text-2xl font-semibold mb-4">
              💻 Digital Skills & Workforce Development Programmes
            </h2>

            <p className="text-lg text-gray-700 mb-4">
              We work with organisations delivering digital skills,
              employability, and workforce-readiness programmes, including:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>Tech and digital skills training</li>
              <li>Career transition or upskilling initiatives</li>
              <li>Youth employability programmes</li>
            </ul>

            <p className="mt-4 text-lg text-gray-700">
              Our focus is on helping teams organise learning, support learners
              over time, and improve completion and outcomes.
            </p>
          </div>

          <div
            aria-hidden
            className="aspect-square rounded-2xl bg-slate-100 lg:col-start-1"
          />
        </div>

        {/* Clubs & Communities */}
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              🧑🏽‍🤝‍🧑🏽 Clubs, Communities & Learning Circles
            </h2>

            <p className="text-lg text-gray-700 mb-4">
              We support learning communities that go beyond one-off events,
              such as:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>Tech or innovation clubs</li>
              <li>Girls’ and youth learning communities</li>
              <li>Campus or community-based learning circles</li>
            </ul>

            <p className="mt-4 text-lg text-gray-700">
              These programmes work best when there is clear structure, regular
              engagement, and defined goals for members.
            </p>
          </div>

          <div aria-hidden className="aspect-square rounded-2xl bg-slate-100" />
        </div>

        {/* University-Based */}
        <div className="grid gap-12 lg:grid-cols-2 items-center lg:grid-flow-col-dense">
          <div className="lg:col-start-2">
            <h2 className="text-2xl font-semibold mb-4">
              🏫 University-Based Programmes
            </h2>

            <p className="text-lg text-gray-700 mb-4">
              We partner with university centres and student-facing units
              running:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>Entrepreneurship and innovation programmes</li>
              <li>Skills and career development initiatives</li>
              <li>Structured extracurricular learning programmes</li>
            </ul>

            <p className="mt-4 text-lg text-gray-700">
              Our role is to help organise delivery, strengthen facilitation,
              and improve consistency across cohorts or academic cycles.
            </p>
          </div>

          <div
            aria-hidden
            className="aspect-square rounded-2xl bg-slate-100 lg:col-start-1"
          />
        </div>

        {/* Nonprofit */}
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              🌍 Nonprofit & Community Learning Initiatives
            </h2>

            <p className="text-lg text-gray-700 mb-4">
              We support nonprofits and foundations delivering learning as part
              of their mission, especially programmes focused on:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>Youth development</li>
              <li>Leadership and civic engagement</li>
              <li>Social impact and community capacity-building</li>
            </ul>

            <p className="mt-4 text-lg text-gray-700">
              We help these organisations strengthen programme delivery and
              retain learning across cohorts.
            </p>
          </div>

          <div aria-hidden className="aspect-square rounded-2xl bg-slate-100" />
        </div>
      </section>

      {/* WHAT WE LOOK FOR & WHAT WE DON’T SUPPORT */}
      <section className="py-24 max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* WHAT WE LOOK FOR */}
          <div>
            <h2 className="text-3xl font-bold mb-6">
              What We Typically Look For
            </h2>

            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>A defined programme goal or outcome</li>
              <li>A cohort-based or structured format</li>
              <li>A named programme lead or coordinator</li>
              <li>A duration of several weeks or more</li>
              <li>Openness to learning and improving over time</li>
            </ul>
          </div>

          {/* WHAT WE DON’T SUPPORT */}
          <div>
            <h2 className="text-3xl font-bold mb-6">
              What We Don’t Support{" "}
              <span className="font-normal">(For Now)</span>
            </h2>

            <p className="text-lg text-gray-700 mb-4">
              To stay focused and effective, we typically do not support:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>One-off workshops or short events</li>
              <li>Unstructured learning groups with no clear outcomes</li>
              <li>Course marketplaces or content-only initiatives</li>
              <li>Programmes where Cohortle is expected to run operations</li>
            </ul>

            <p className="mt-4 text-lg text-gray-700">
              This is not about exclusion — it’s about fit.
            </p>
          </div>
        </div>
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
