import { Bell, Search, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { NotificationDropdown } from "./NotificationDropdown";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 min-h-16 max-h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-3 sm:px-6 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-1.5 sm:gap-4 flex-1 min-w-0">
        <SidebarTrigger className="-ml-1 sm:-ml-2 h-9 w-9 shrink-0 text-muted-foreground hover:text-accent hover:bg-accent/5 transition-colors" />

        {/* Mobile Logo */}
        <Link to="/" className="flex md:hidden items-center gap-2 transition-opacity hover:opacity-80 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm ring-1 ring-white/10">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-bold text-sm tracking-tight text-foreground truncate">TekConsult</span>
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Admin</span>
          </div>
        </Link>

        {/* Search */}
        {/* <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 w-full"
          />
        </div> */}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-success">System Online</span>
        </div>

        {/* Refresh */}
        {/* <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
        </Button> */}

        {/* Notifications */}
        <NotificationDropdown />
      </div>
    </header>
  );
}
