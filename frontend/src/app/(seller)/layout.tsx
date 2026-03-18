import { Metadata } from "next";
import { SellerHeader } from "@/components/seller/SellerHeader";
import { SellerFooter } from "@/components/seller/SellerFooter";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SellerHeader />
      <main className="min-h-[calc(100vh-112px)]">{children}</main>
      <SellerFooter />
    </div>
  );
}
