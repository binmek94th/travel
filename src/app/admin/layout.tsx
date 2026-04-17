import type { Metadata } from "next";
import AdminSidebar from "@/src/components/admin/AdminSidebar";
import AdminTopbar  from "@/src/components/admin/AdminTopbar";

export const metadata: Metadata = { title: "Admin — Tizitaw Ethiopia" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-60 min-h-screen">
        <AdminTopbar />
        <main className="flex-1 p-7">{children}</main>
      </div>
    </div>
  );
}
