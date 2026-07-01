"use client";

import Image from "next/image";

// import Image from "next/image";

export default function AboutPage() {
    return (
        <main className="max-w-7xl mt-20 mx-auto px-5 sm:px-8 lg:px-16">
            {/* 1) HERO */}
            <section className="pb-12 sm:pb-16 lg:pb-20">
                <div className="flex gap-6 sm:gap-0 flex-wrap lg:flex-nowrap justify-center sm:justify-between items-center">
                    <div className="max-w-lg">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.02]">
                            Join Better Cohorts. Delivering Real Learning🚀
                        </h1>

                        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
                            Cohortle gives learners the tools to participate, track progress, and grow within non-formal education programmes. Whether you&apos;re part of a leadership cohort, training programme, or community initiative.
                        </p>

                        <div className="mt-6 flex flex-col sm:flex-row gap-4">
                            {/* Android Download */}
                            <a
                                href="/cohortle.apk"
                                download
                                className="inline-flex items-center rounded-md bg-[#391D65] text-white px-5 py-3 font-semibold shadow-cta"
                            >
                                Download App
                            </a>
                        </div>
                    </div>

                    <div aria-hidden className="grid place-items-center">
                        <div className="w-full">
                            <Image
                                src="/images/download.svg"
                                alt="Cohortle App Preview"
                                width={0}
                                height={0}
                                sizes="100vw"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}