'use client';

/**
 * LogoPulse — branded full-page loading state.
 * Shows the Cohortle wordmark with a gentle pulse animation.
 * Use for full-page / full-screen loading moments.
 */

interface LogoPulseProps {
  /** Optional message shown below the logo */
  message?: string;
}

export function LogoPulse({ message }: LogoPulseProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      role="status"
      aria-label={message ?? 'Loading'}
    >
      {/* Outer glow ring */}
      <div className="relative flex items-center justify-center mb-6">
        <span
          className="absolute inline-flex h-20 w-20 rounded-full bg-[#ECDCFF] opacity-60"
          style={{ animation: 'cohortle-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite' }}
          aria-hidden="true"
        />
        {/* Logo mark — stylised "C" built from brand colours */}
        <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#391D65]"
          style={{ animation: 'cohortle-pulse 1.6s ease-in-out infinite' }}
        >
          <span className="text-white text-2xl font-bold select-none" aria-hidden="true">C</span>
        </div>
      </div>

      {/* Wordmark */}
      <span
        className="text-[#391D65] text-xl font-semibold tracking-wide select-none"
        style={{ animation: 'cohortle-fade 1.6s ease-in-out infinite' }}
        aria-hidden="true"
      >
        Cohortle
      </span>

      {/* Optional contextual message */}
      {message && (
        <p className="mt-3 text-sm text-gray-500">{message}</p>
      )}

      <span className="sr-only">{message ?? 'Loading, please wait…'}</span>

      <style>{`
        @keyframes cohortle-ping {
          0%   { transform: scale(0.8); opacity: 0.6; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes cohortle-pulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes cohortle-fade {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/**
 * Inline variant — smaller, no fixed overlay.
 * Drop-in replacement for the old LoadingSpinner in page-level loading states.
 */
export function LogoPulseInline({ message }: LogoPulseProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16"
      role="status"
      aria-label={message ?? 'Loading'}
    >
      <div className="relative flex items-center justify-center mb-4">
        <span
          className="absolute inline-flex h-14 w-14 rounded-full bg-[#ECDCFF] opacity-60"
          style={{ animation: 'cohortle-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite' }}
          aria-hidden="true"
        />
        <div
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#391D65]"
          style={{ animation: 'cohortle-pulse 1.6s ease-in-out infinite' }}
        >
          <span className="text-white text-base font-bold select-none" aria-hidden="true">C</span>
        </div>
      </div>
      {message && <p className="text-sm text-gray-500">{message}</p>}
      <span className="sr-only">{message ?? 'Loading…'}</span>

      <style>{`
        @keyframes cohortle-ping {
          0%   { transform: scale(0.8); opacity: 0.6; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes cohortle-pulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.08); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
