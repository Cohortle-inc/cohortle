'use client';

/**
 * Conditional Layout Component
 * Shows marketing header/footer only on public pages
 * Dashboard pages get their own layout with learner navigation
 */

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { LearnerNavBar } from './navigation/LearnerNavBar';
import { EmailVerificationBanner } from './auth/EmailVerificationBanner';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Routes that should NOT show marketing header/footer
  const learnerRoutes = [
    '/dashboard',
    '/programmes',
    '/lessons',
    '/profile',
  ];

  // Convener routes have their own layout
  const convenerRoutes = ['/convener'];

  // Funnel routes use FunnelLayout (their own minimal header/footer)
  const funnelRoutes = ['/apply'];

  // Org pages have their own complete layout (OrgHeader + OrgFooter)
  const orgRoutes = ['/org'];

  // Admin and internal pages have their own layout
  const adminRoutes = ['/admin', '/internal'];

  const isLearnerRoute = learnerRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  const isConvenerRoute = convenerRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  const isFunnelRoute = funnelRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  const isOrgRoute = orgRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  // Show learner navigation for learner routes
  if (isLearnerRoute && !isConvenerRoute) {
    return (
      <>
        <LearnerNavBar />
        <EmailVerificationBanner />
        {children}
      </>
    );
  }

  // Convener pages handle their own layout
  if (isConvenerRoute) {
    return (
      <>
        <EmailVerificationBanner />
        {children}
      </>
    );
  }

  // Funnel pages use FunnelLayout — render children directly, no marketing chrome
  if (isFunnelRoute) {
    return <>{children}</>;
  }

  // Org pages have their own OrgHeader + OrgFooter — no marketing chrome
  if (isOrgRoute) {
    return <>{children}</>;
  }

  // Admin and internal pages have their own layout — no marketing chrome
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Show marketing layout for public pages
  return (
    <>
      <Header />
      <EmailVerificationBanner />
      {children}
      <Footer />
    </>
  );
}
