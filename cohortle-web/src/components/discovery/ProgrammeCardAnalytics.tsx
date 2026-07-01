'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/utils/analytics';

interface ProgrammeCardAnalyticsProps {
  href: string;
  programmeId: number;
  programmeName: string;
  actionType: 'apply' | 'view_org';
  children: React.ReactNode;
  className?: string;
}

export function ProgrammeCardAnalytics({
  href,
  programmeId,
  programmeName,
  actionType,
  children,
  className,
}: ProgrammeCardAnalyticsProps) {
  const handleClick = () => {
    trackEvent('discover_programme_click', {
      programme_id: programmeId,
      programme_name: programmeName,
      action_type: actionType,
      destination: href,
    });
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
