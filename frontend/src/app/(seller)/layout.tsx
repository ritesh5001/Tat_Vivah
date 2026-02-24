import { SellerHeader } from "@/components/seller/SellerHeader";
import { SellerFooter } from "@/components/seller/SellerFooter";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SellerHeader />
      <main className="min-h-[calc(100vh-112px)]">{children}</main>
      <SellerFooter />
    </div>
  );
}
