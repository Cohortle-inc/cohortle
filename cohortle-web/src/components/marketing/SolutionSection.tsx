import {
  Layout,
  UsersThree,
  Eye,
  Handshake,
} from "@phosphor-icons/react/dist/ssr";

const pillars = [
  {
    Icon: Layout,
    title: "Design your programme",
    description:
      "Build a structured curriculum with weeks, sessions, and content. Give your cohort a clear journey from day one.",
  },
  {
    Icon: UsersThree,
    title: "Run your cohorts",
    description:
      "Manage enrolments, track attendance, and keep participants on the same page — without chasing people across channels.",
  },
  {
    Icon: Eye,
    title: "See what's happening",
    description:
      "Know who's engaged, who's falling behind, and where your programme needs attention — in real time.",
  },
  {
    Icon: Handshake,
    title: "Sustain quality across cohorts",
    description:
      "Completion rates, engagement data, and learning outcomes all in one place. Tell the story of your impact with confidence.",
  },
];

export default function SolutionSection() {
  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-[#391D65] uppercase tracking-wider mb-3">
            What We Do
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Cohortle works with purpose-driven organisations
            <br className="hidden sm:block" />
            to improve how learning is designed and delivered
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We support nonprofits, universities, training hubs, and community
            organisations to run structured, outcome-driven learning programmes
            that go beyond attendance and lead to real impact.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-10">
          {pillars.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-4 p-5 sm:p-6 rounded-xl bg-[#F8F1FF] border border-[#ECDCFF]"
            >
              <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <Icon size={20} weight="duotone" className="text-[#391D65]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  {title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mission statement */}
        <div className="bg-[#391D65] rounded-2xl p-8 text-center text-white">
          <p className="text-xl font-medium leading-relaxed max-w-2xl mx-auto">
            &ldquo;Most platforms were built for courses and lectures. Cohortle is
            built for programmes — structured journeys where people grow
            together.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
