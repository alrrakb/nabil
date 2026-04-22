import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, Inbox, Archive, BarChart3, Building2, Users, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const allNavigation = [
  { name: "الرئيسية", href: "/", icon: LayoutDashboard, roles: ["admin", "supervisor", "employee"] },
  { name: "صندوق الوارد", href: "/inbox", icon: Inbox, roles: ["admin", "supervisor", "employee"] },
  { name: "إضافة مراسلة", href: "/add", icon: FileText, roles: ["admin", "supervisor", "employee"] },
  { name: "الأرشيف", href: "/archive", icon: Archive, roles: ["admin", "supervisor"] },
  { name: "التقارير", href: "/reports", icon: BarChart3, roles: ["admin", "supervisor"] },
  { name: "الأقسام", href: "/departments", icon: Building2, roles: ["admin"] },
  { name: "الموظفون", href: "/employees", icon: Users, roles: ["admin"] },
];

const roleLabels: Record<string, string> = {
  admin: "مدير",
  supervisor: "مشرف",
  employee: "موظف",
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const navigation = allNavigation.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-l border-sidebar-border transition-transform duration-300",
        "lg:relative lg:inset-auto lg:z-auto lg:translate-x-0",
        open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-6 py-4 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight text-sidebar-primary">معهد دلتا العالي</h1>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} onClick={onClose}>
                <div
                  data-testid={`nav-${item.href.replace("/", "") || "home"}`}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile footer */}
      {user && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-semibold text-sm shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{roleLabels[user.role] ?? user.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 justify-start gap-2 text-xs text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
            onClick={signOut}
            data-testid="button-signout"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      )}
    </aside>
  );
}
