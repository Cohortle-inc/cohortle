import {
  Star,
  Buildings,
  Rocket,
  TreeStructure,
} from "@phosphor-icons/react/dist/ssr";

const useCases = [
  {
    Icon: Star,
    type: "Nonprofits & Foundations",
    description:
      "Capacity building, skills development, and staff training for organisations that need to track learning outcomes and report to funders.",
  },
  {
    Icon: Buildings,
    type: "University Centres & Innovation Hubs",
    description:
      "Student innovation hubs and university centres running structured cohort programmes for emerging leaders and researchers.",
  },
  {
    Icon: Rocket,
    type: "Training Providers",
    description:
      "Structured cohort journeys for professionals and entrepreneurs — with sessions, milestones, and mentor touchpoints built in.",
  },
  {
    Icon: TreeStructure,
    type: "Community Learning Organisations",
    description:
      "Peer education networks, learning circles, and grassroots programmes that need structure without losing the human, community feel.",
  },
];

export default function UseCasesSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Content */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#391D65] uppercase tracking-wider mb-3">
              Who We Work With
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Partners that care deeply about{" "}
              <span className="text-[#391D65]">learning outcomes</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              We partner with organisations that run cohort-based or structured
              learning programmes and are open to improving how learning is
              delivered.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              {useCases.map(({ Icon, type, description }) => (
                <div
                  key={type}
                  className="bg-white rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-lg bg-[#F8F1FF] flex items-center justify-center flex-shrink-0">
                      <Icon size={18} weight="duotone" className="text-[#391D65]" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {type}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="flex-shrink-0 w-full max-w-xs mx-auto lg:mx-0">
            <PartnersIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnersIllustration() {
  return (
    <svg
      viewBox="0 0 280 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-auto"
    >
      <rect x="10" y="10" width="260" height="300" rx="16" fill="#F8F1FF" />

      {/* Central hub */}
      <circle cx="140" cy="160" r="36" fill="#391D65" />
      <circle cx="140" cy="148" r="14" fill="white" opacity="0.85" />
      <ellipse cx="140" cy="176" rx="20" ry="12" fill="white" opacity="0.85" />

      {/* Connecting lines */}
      <line x1="104" y1="160" x2="60" y2="100" stroke="#ECDCFF" strokeWidth="2" />
      <line x1="104" y1="160" x2="60" y2="220" stroke="#ECDCFF" strokeWidth="2" />
      <line x1="176" y1="160" x2="220" y2="100" stroke="#ECDCFF" strokeWidth="2" />
      <line x1="176" y1="160" x2="220" y2="220" stroke="#ECDCFF" strokeWidth="2" />
      <line x1="140" y1="124" x2="140" y2="60" stroke="#ECDCFF" strokeWidth="2" />

      {/* Satellite nodes */}
      {/* Top */}
      <circle cx="140" cy="50" r="22" fill="white" stroke="#ECDCFF" strokeWidth="1.5" />
      <rect x="130" y="42" width="20" height="4" rx="2" fill="#391D65" opacity="0.3" />
      <rect x="128" y="50" width="24" height="4" rx="2" fill="#391D65" opacity="0.2" />
      <rect x="132" y="58" width="16" height="4" rx="2" fill="#391D65" opacity="0.15" />

      {/* Top-left */}
      <circle cx="50" cy="90" r="22" fill="white" stroke="#ECDCFF" strokeWidth="1.5" />
      <rect x="40" y="82" width="20" height="4" rx="2" fill="#391D65" opacity="0.3" />
      <rect x="38" y="90" width="24" height="4" rx="2" fill="#391D65" opacity="0.2" />
      <rect x="42" y="98" width="16" height="4" rx="2" fill="#391D65" opacity="0.15" />

      {/* Bottom-left */}
      <circle cx="50" cy="230" r="22" fill="white" stroke="#ECDCFF" strokeWidth="1.5" />
      <rect x="40" y="222" width="20" height="4" rx="2" fill="#391D65" opacity="0.3" />
      <rect x="38" y="230" width="24" height="4" rx="2" fill="#391D65" opacity="0.2" />
      <rect x="42" y="238" width="16" height="4" rx="2" fill="#391D65" opacity="0.15" />

      {/* Top-right */}
      <circle cx="230" cy="90" r="22" fill="white" stroke="#ECDCFF" strokeWidth="1.5" />
      <rect x="220" y="82" width="20" height="4" rx="2" fill="#391D65" opacity="0.3" />
      <rect x="218" y="90" width="24" height="4" rx="2" fill="#391D65" opacity="0.2" />
      <rect x="222" y="98" width="16" height="4" rx="2" fill="#391D65" opacity="0.15" />

      {/* Bottom-right */}
      <circle cx="230" cy="230" r="22" fill="white" stroke="#ECDCFF" strokeWidth="1.5" />
      <rect x="220" y="222" width="20" height="4" rx="2" fill="#391D65" opacity="0.3" />
      <rect x="218" y="230" width="24" height="4" rx="2" fill="#391D65" opacity="0.2" />
      <rect x="222" y="238" width="16" height="4" rx="2" fill="#391D65" opacity="0.15" />

      {/* Africa continent silhouette (simplified) */}
      <path
        d="M130 270 C120 265 115 255 118 245 C121 235 128 232 132 228 C136 224 138 218 140 215 C142 218 144 224 148 228 C152 232 159 235 162 245 C165 255 160 265 150 270 Z"
        fill="#391D65"
        opacity="0.12"
      />
    </svg>
  );
}
