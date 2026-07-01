import {
  PencilSimple,
  UserPlus,
  ChartLineUp,
} from "@phosphor-icons/react/dist/ssr";

const steps = [
  {
    Icon: PencilSimple,
    number: 1,
    title: "Design your programme",
    description:
      "Build your curriculum — weeks, sessions, content, and learning objectives. Give participants a clear structure from the moment they join.",
  },
  {
    Icon: UserPlus,
    number: 2,
    title: "Invite your cohort",
    description:
      "Share an enrolment link or code. Participants join, get immediate access to the programme, and can see exactly where they are in the journey.",
  },
  {
    Icon: ChartLineUp,
    number: 3,
    title: "Run it with confidence",
    description:
      "Track progress, see who needs support, and measure outcomes — all in one place. Focus on the people, not the spreadsheets.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Get your programme running in three steps — and keep it running
            without the chaos.
          </p>
        </div>

        {/* Steps with connecting line */}
        <div className="relative">
          {/* Connector line (desktop only) */}
          <div className="hidden sm:block absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-0.5 bg-[#ECDCFF]" />

          <div className="flex flex-col sm:flex-row gap-8 sm:gap-10">
            {steps.map(({ Icon, number, title, description }, i) => (
              <div key={number} className="flex-1 relative">
                {/* Mobile: vertical connector between steps */}
                {i < steps.length - 1 && (
                  <div className="sm:hidden absolute left-10 top-20 w-0.5 h-8 bg-[#ECDCFF]" />
                )}
                <div className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 text-left sm:text-center">
                  <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-[#F8F1FF] border-2 border-[#ECDCFF] flex flex-col items-center justify-center relative z-10">
                    <Icon size={28} weight="duotone" className="text-[#391D65]" />
                    <span className="text-xs font-bold text-[#391D65] mt-1">
                      Step {number}
                    </span>
                  </div>
                  <div className="sm:mt-5">
                    <h3 className="text-base font-semibold text-slate-900 mb-2">
                      {title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
