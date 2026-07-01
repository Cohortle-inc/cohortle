/**
 * Dashboard Layout
 * Removes marketing header/footer for authenticated dashboard pages
 */

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
