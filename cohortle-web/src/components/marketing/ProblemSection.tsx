import {
  WarningCircle,
  Wrench,
  UserMinus,
  ChartBar,
} from "@phosphor-icons/react/dist/ssr";

const painPoints = [
  {
    Icon: WarningCircle,
    title: "Unclear structure and delivery",
    description:
      "Programmes lack a defined learning journey. Participants don't know what to expect, and facilitators spend more time managing confusion than teaching.",
  },
  {
    Icon: Wrench,
    title: "Fragmented tools and processes",
    description:
      "WhatsApp for announcements, spreadsheets for tracking, email for resources. Stitching five tools together creates gaps and wastes time.",
  },
  {
    Icon: UserMinus,
    title: "Low learner engagement over time",
    description:
      "Without structure and visibility, participants quietly disengage. By the time you notice, it's too late to intervene.",
  },
  {
    Icon: ChartBar,
    title: "Limited tracking of outcomes",
    description:
      "Funders and stakeholders want evidence of impact. But when data is scattered, telling the story of your programme becomes a project in itself.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Illustration */}
          <div className="flex-shrink-0 w-full max-w-xs mx-auto lg:mx-0">
            <ProblemIllustration />
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#391D65] uppercase tracking-wider mb-3">
              The Challenge
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Good intentions alone are not enough.
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Across Africa, education is happening everywhere — outside
              classrooms, across communities, online, and through purpose-driven
              programmes. Yet many of these programmes struggle with:
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              {painPoints.map(({ Icon, title, description }) => (
                <div key={title} className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={18} weight="duotone" className="text-[#391D65]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">
                      {title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-slate-500 text-sm border-l-2 border-[#391D65] pl-4">
              Learning needs structure, support, and continuity to create
              lasting impact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemIllustration() {
  return (
    <svg
      viewBox="0 0 280 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-auto"
    >
      {/* Scattered tools illustration */}
      <rect x="10" y="10" width="260" height="280" rx="16" fill="#FFF7ED" />

      {/* WhatsApp-like bubble */}
      <rect x="30" y="30" width="140" height="50" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="44" y="44" width="80" height="8" rx="4" fill="#94A3B8" />
      <rect x="44" y="58" width="50" height="6" rx="3" fill="#CBD5E1" />
      <circle cx="160" cy="55" r="12" fill="#22C55E" opacity="0.2" />

      {/* Spreadsheet-like */}
      <rect x="110" y="100" width="140" height="70" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="110" y="100" width="140" height="18" rx="10" fill="#F1F5F9" />
      <line x1="150" y1="100" x2="150" y2="170" stroke="#E2E8F0" strokeWidth="1" />
      <line x1="190" y1="100" x2="190" y2="170" stroke="#E2E8F0" strokeWidth="1" />
      <line x1="110" y1="130" x2="250" y2="130" stroke="#E2E8F0" strokeWidth="1" />
      <line x1="110" y1="150" x2="250" y2="150" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="120" y="135" width="22" height="6" rx="3" fill="#CBD5E1" />
      <rect x="158" y="135" width="22" height="6" rx="3" fill="#CBD5E1" />
      <rect x="120" y="155" width="22" height="6" rx="3" fill="#CBD5E1" />

      {/* Email-like */}
      <rect x="20" y="110" width="80" height="55" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <path d="M20 122 L60 140 L100 122" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
      <rect x="30" y="148" width="50" height="6" rx="3" fill="#E2E8F0" />

      {/* Arrows showing chaos */}
      <path d="M100 55 L110 100" stroke="#FCA5A5" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#arrow)" />
      <path d="M60 165 L110 155" stroke="#FCA5A5" strokeWidth="2" strokeDasharray="4 3" />

      {/* Warning triangle */}
      <path d="M120 210 L140 175 L160 210 Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <rect x="138" y="188" width="4" height="12" rx="2" fill="#F59E0B" />
      <circle cx="140" cy="205" r="2" fill="#F59E0B" />

      {/* Disconnected dots */}
      <circle cx="50" cy="240" r="6" fill="#ECDCFF" />
      <circle cx="100" cy="255" r="6" fill="#ECDCFF" />
      <circle cx="160" cy="240" r="6" fill="#ECDCFF" />
      <circle cx="220" cy="255" r="6" fill="#ECDCFF" />
      <line x1="56" y1="240" x2="94" y2="255" stroke="#ECDCFF" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="106" y1="255" x2="154" y2="240" stroke="#ECDCFF" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="166" y1="240" x2="214" y2="255" stroke="#ECDCFF" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  );
}
