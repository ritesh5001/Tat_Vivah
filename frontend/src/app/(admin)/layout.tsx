import { Metadata } from "next";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminFooter } from "@/components/admin/AdminFooter";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <div className="mx-auto flex w-full max-w-[1600px]">
        <AdminSidebar />
        <main className="min-h-[calc(100vh-112px)] flex-1">{children}</main>
      </div>
      <AdminFooter />
    </div>
  );
}
