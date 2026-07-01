import React from "react";
import Link from "next/link";

const Hero: React.FC = () => {
  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-hero-background" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-60 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black_60%,transparent_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 backdrop-blur-[2px] bg-gradient-to-b from-transparent via-[rgba(233,238,255,0.5)] to-[rgba(202,208,230,0.6)]" />
      </div>

      {/* HERO */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-28 pb-10 md:pt-36">
        <div className="text-center">
          <h1 className="mx-auto max-w-3xl text-4xl md:text-6xl md:leading-tight font-bold text-foreground tracking-tight">
            Tired of losing your lessons in a sea of chats?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg text-foreground/80">
            Cohortle takes your online learning group from messy WhatsApp
            scrolls to a clear, organized space where learners actually learn.
          </p>

          {/* Subtle “device” mock without external images */}
          <div className="relative mx-auto mt-12 max-w-3xl">
            <div className="mx-auto h-64 w-full rounded-2xl border border-border/60 bg-white/70 backdrop-blur shadow-[0_30px_70px_rgba(16,24,40,0.10)]">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                <span className="ml-3 text-xs text-foreground/50">
                  Cohortle · Lesson 1 — Getting Started
                </span>
              </div>
              <div className="grid h-[calc(16rem-40px)] grid-cols-3 gap-4 p-4 text-left">
                <div className="col-span-2 rounded-xl border border-border/60 bg-white/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                    Lesson
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    Welcome & Orientation
                  </h3>
                  <p className="mt-2 text-sm text-foreground/70 line-clamp-3">
                    No more endless scrolling — lessons are in order, resources
                    attached, and discussion tied neatly right here.
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-white/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                    Resources
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="truncate">📄 Orientation.pdf</li>
                    <li className="truncate">🔗 Cohort rules &amp; flow</li>
                    <li className="truncate">🎥 Intro video</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* glow */}
            <div className="pointer-events-none absolute -inset-x-10 -bottom-6 h-24 blur-2xl bg-purple-400/20" />
          </div>
        </div>
      </div>

      {/* The Struggle is Real */}
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:py-14">
        <div className="rounded-2xl border border-border/60 bg-white/70 px-6 py-8 backdrop-blur">
          <h2 className="text-2xl md:text-3xl font-bold">
            The Struggle is Real
          </h2>
          <ul className="mt-5 grid gap-3 text-foreground/80 md:grid-cols-3">
            <li className="rounded-xl border border-border/50 bg-white/70 p-4">
              New members miss all the good stuff you shared weeks ago.
            </li>
            <li className="rounded-xl border border-border/50 bg-white/70 p-4">
              Important lessons get buried under “Good morning” messages.
            </li>
            <li className="rounded-xl border border-border/50 bg-white/70 p-4">
              Nobody can find that PDF you sent… again.
            </li>
          </ul>
        </div>
      </div>

      {/* Here's the Fix */}
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:py-14">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-2xl md:text-3xl font-bold">Here’s the Fix</h2>
            <p className="mt-3 text-foreground/80">
              Cohortle is where your lessons, resources, and discussions finally
              make sense.
            </p>
          </div>
          <div className="md:col-span-2 grid gap-4">
            <FeatureCard
              title="Lessons stay in order"
              desc="No more scrolling."
            />
            <FeatureCard
              title="All resources in one place"
              desc="Easy to find, anytime."
            />
            <FeatureCard
              title="Community threads"
              desc="Discussions stay tied to the lesson they belong to."
            />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:py-14">
        <h2 className="text-2xl md:text-3xl font-bold">
          How It Works (3 Steps)
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          <StepCard
            number={1}
            title="Create your cohort"
            desc="Start with 1 free learning group."
          />
          <StepCard
            number={2}
            title="Add your lessons & resources"
            desc="PDFs, videos, links — all in one place."
          />
          <StepCard
            number={3}
            title="Track & engage learners"
            desc="Progress tracking, discussions, and reminders keep learning alive."
          />
        </ol>
      </div>

      {/* Why Learners Will Thank You */}
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:py-14">
        <div className="rounded-2xl border border-border/60 bg-white/70 p-6 md:p-10 backdrop-blur">
          <h2 className="text-2xl md:text-3xl font-bold">
            Why Your Learners Will Thank You
          </h2>
          <p className="mt-4 max-w-3xl text-foreground/80">
            Because they’ll spend less time hunting for info… and more time
            learning, asking questions, and actually making progress.
          </p>
          <div className="mt-6">
            <Link
              href="/early-birds"
              className="inline-flex items-center gap-1 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-gradient-to-b from-purple-500 to-purple-600 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:translate-y-[-1px] transition-all"
            >
              Join the Early Birds <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Line CTA */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-2 pb-16 md:pb-24">
        <div className="text-center">
          <p className="text-lg md:text-xl font-medium">
            Your learners deserve more than a chat group.
          </p>
          <Link
            href="/early-birds"
            className="mt-5 inline-flex items-center gap-1 rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-b from-purple-500 to-purple-600 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:translate-y-[-1px] transition-all"
          >
            Join the Early Birds <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

/* --------- Small presentational helpers --------- */
const FeatureCard = ({ title, desc }: { title: string; desc: string }) => (
  <div className="rounded-xl border border-border/60 bg-white/70 p-5 backdrop-blur">
    <h3 className="font-semibold">{title}</h3>
    <p className="mt-1 text-foreground/80 text-sm">{desc}</p>
  </div>
);

const StepCard = ({
  number,
  title,
  desc,
}: {
  number: number;
  title: string;
  desc: string;
}) => (
  <li className="group relative rounded-2xl border border-border/60 bg-white/70 p-5 backdrop-blur">
    <div className="absolute -top-3 left-5 flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-white text-sm font-semibold shadow-sm">
      {number}
    </div>
    <h3 className="mt-3 font-semibold">{title}</h3>
    <p className="mt-1 text-sm text-foreground/80">{desc}</p>
    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-purple-300/60" />
  </li>
);

export default Hero;
