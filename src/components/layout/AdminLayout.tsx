import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-background flex flex-col min-h-svh">
        <AdminHeader />
        <div className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
