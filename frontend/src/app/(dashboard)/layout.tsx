import { PublicSiteChrome } from "@/components/layout/PublicSiteChrome";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicSiteChrome>{children}</PublicSiteChrome>;
}
