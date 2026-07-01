import { Quotes } from "@phosphor-icons/react/dist/ssr";

export default function SocialProofSection() {
  return (
    <section className="py-20 bg-[#F8F1FF]">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <p className="text-sm font-semibold text-[#391D65] uppercase tracking-wider mb-4">
          Early partners
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          Built with the people who need it most
        </h2>
        <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
          Cohortle is being built in close partnership with a small group of
          organisations running real programmes. Their feedback shapes every
          feature we build.
        </p>

        {/* Partner reference */}
        <div className="inline-flex items-center gap-4 bg-white rounded-xl border border-[#ECDCFF] px-6 py-5 mb-12">
          <div className="h-12 w-12 rounded-full bg-[#391D65] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            W
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900 text-base">WLIMP</p>
            <p className="text-slate-500 text-sm">
              A fellowship programme for emerging leaders — our first partner
              and the programme that shaped Cohortle&apos;s design.
            </p>
          </div>
        </div>

        {/* Testimonial placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-2xl mx-auto">
          <Quotes
            size={32}
            weight="fill"
            className="text-[#ECDCFF] mx-auto mb-4"
          />
          <p className="text-slate-500 italic text-lg leading-relaxed">
            &ldquo;We&apos;re gathering feedback from our early partners. Their
            experience will be shared here soon.&rdquo;
          </p>
          <p className="mt-4 text-sm text-slate-400">— Early partner, WLIMP</p>
        </div>
      </div>
    </section>
  );
}
