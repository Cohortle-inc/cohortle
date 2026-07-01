'use client';

import { useEffect } from 'react';

interface OrgLiveChatProps {
  propertyId: string;
  widgetId: string;
}

/**
 * Injects the Tawk.to live chat widget for the organisation page.
 * Conveners configure their Tawk.to Property ID and Widget ID in settings.
 * The widget is removed on unmount to avoid leaking across pages.
 */
export default function OrgLiveChat({ propertyId, widgetId }: OrgLiveChatProps) {
  useEffect(() => {
    if (!propertyId || !widgetId) return;

    // Tawk.to global config
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.id = 'tawk-script';
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.head.appendChild(script);

    return () => {
      // Clean up on unmount
      const existing = document.getElementById('tawk-script');
      if (existing) existing.remove();
      // Hide widget if API is available
      try {
        (window as any).Tawk_API?.hideWidget?.();
      } catch {}
    };
  }, [propertyId, widgetId]);

  return null; // Widget renders itself via the script
}
