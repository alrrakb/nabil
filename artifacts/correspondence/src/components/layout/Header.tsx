import { Bell, User, Shield, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const roleConfig = {
  admin: { label: "مدير", icon: Shield, variant: "destructive" as const },
  supervisor: { label: "مشرف", icon: UserCheck, variant: "default" as const },
  employee: { label: "موظف", icon: User, variant: "secondary" as const },
};

export function Header() {
  const { user, signOut } = useAuth();
  const roleInfo = user ? (roleConfig[user.role] ?? roleConfig.employee) : null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold tracking-tight">نظام إدارة المراسلات الداخلية</h2>
        {user && roleInfo && (
          <Badge variant={roleInfo.variant} className="text-xs gap-1 hidden sm:flex">
            <roleInfo.icon className="h-3 w-3" />
            {roleInfo.label}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-muted"
              data-testid="button-user-menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                {user?.name?.charAt(0) ?? <User className="h-4 w-4" />}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{user?.name ?? "المستخدم"}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.departmentName && (
              <>
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  القسم: {user.departmentName}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={signOut}
              data-testid="menu-signout"
            >
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
