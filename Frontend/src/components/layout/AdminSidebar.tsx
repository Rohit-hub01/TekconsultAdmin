import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FolderTree,
  Radio,
  Wallet,
  ArrowDownToLine,
  AlertTriangle,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Consultants", href: "/consultants", icon: UserCheck },
  { name: "Users", href: "/users", icon: Users },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Live Sessions", href: "/sessions", icon: Radio },
  { name: "Wallets", href: "/wallets", icon: Wallet },
  { name: "Withdrawals", href: "/withdrawals", icon: ArrowDownToLine },
  { name: "Disputes", href: "/disputes", icon: AlertTriangle },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full items-center gap-3 overflow-hidden rounded-md p-2 text-left h-12 transition-all group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                <Shield className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-base leading-tight text-white group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-2xl">TekConsult</span>
                <span className="truncate text-xs">Admin Panel</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild size="lg" isActive={isActive} tooltip={item.name} className="gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
                      <NavLink to={item.href} onClick={handleNavClick}>
                        <item.icon className="size-6 shrink-0" />
                        <span className="text-base font-medium group-data-[collapsible=icon]:hidden">{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-3 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
              onClick={() => {
                handleNavClick();
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
              }}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary shrink-0">
                <span className="text-sm font-bold">A</span>
              </div>
              <div className="grid flex-1 text-left text-base leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold">Admin</span>
                <span className="truncate text-xs">admin@tekconsult.in</span>
              </div>
              <LogOut className="ml-auto size-5 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
