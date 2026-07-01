'use client';

import React, { useState } from 'react';

interface OrgVideoIntroSectionProps {
  videoUrl: string;
  organisationName: string;
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const videoId = u.hostname.includes('youtu.be')
        ? u.pathname.slice(1)
        : u.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
    // Vimeo
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function OrgVideoIntroSection({ videoUrl, organisationName }: OrgVideoIntroSectionProps) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) return null;

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Meet {organisationName}
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Watch our introduction to learn more about what we do
        </p>

        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-black aspect-video">
          {!playing ? (
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center group"
              aria-label="Play introduction video"
            >
              {/* Thumbnail overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#391D65]/80 to-[#5B3A8F]/80" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors border-2 border-white/50">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-lg">Watch Introduction</span>
              </div>
            </button>
          ) : (
            <iframe
              src={`${embedUrl}&autoplay=1`}
              title={`${organisationName} introduction video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          )}
        </div>
      </div>
    </section>
  );
}
