import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, Inbox, Archive, BarChart3, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "الرئيسية", href: "/", icon: LayoutDashboard },
  { name: "صندوق الوارد", href: "/inbox", icon: Inbox },
  { name: "إضافة مراسلة", href: "/add", icon: FileText },
  { name: "الأرشيف", href: "/archive", icon: Archive },
  { name: "التقارير", href: "/reports", icon: BarChart3 },
  { name: "الأقسام", href: "/departments", icon: Building2 },
  { name: "الموظفون", href: "/employees", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-l border-sidebar-border">
      <div className="flex h-16 items-center px-6 py-4 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight text-sidebar-primary">معهد دلتا العالي</h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div
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
    </div>
  );
}
