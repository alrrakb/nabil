import { Bell, User, Shield, UserCheck, Menu } from "lucide-react";
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
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const roleConfig = {
  admin: { label: "مدير", icon: Shield, variant: "destructive" as const },
  supervisor: { label: "مشرف", icon: UserCheck, variant: "default" as const },
  employee: { label: "موظف", icon: User, variant: "secondary" as const },
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const roleInfo = user ? (roleConfig[user.role] ?? roleConfig.employee) : null;
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useListNotifications(
    { userId: user?.employeeId ?? "" },
    { query: { enabled: !!user?.employeeId, refetchInterval: 30000 } }
  );

  const markRead = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ userId: user?.employeeId ?? "" }) });
      },
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          data-testid="button-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h2 className="text-base md:text-lg font-semibold tracking-tight">نظام إدارة المراسلات الداخلية</h2>
        {user && roleInfo && (
          <Badge variant={roleInfo.variant} className="text-xs gap-1 hidden sm:flex">
            <roleInfo.icon className="h-3 w-3" />
            {roleInfo.label}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto text-right">
            <DropdownMenuLabel className="text-sm font-semibold text-right">الإشعارات</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">لا توجد إشعارات</div>
            ) : (
              notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className={`flex flex-col items-end gap-0.5 px-3 py-2 cursor-pointer ${!notif.isRead ? "bg-muted/60" : ""}`}
                  onClick={() => {
                    if (!notif.isRead) markRead.mutate({ id: notif.id });
                  }}
                >
                  <div className="flex w-full items-center justify-end gap-2">
                    {!notif.isRead && <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />}
                    <span className="font-medium text-sm">{notif.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">{notif.message}</span>
                  {notif.createdAt && (
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(notif.createdAt).toLocaleString("ar-EG")}
                    </span>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
          <DropdownMenuContent align="end" className="w-56 text-right">
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="flex flex-col gap-0.5 text-right">
                <span className="font-semibold">{user?.name ?? "المستخدم"}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            {user?.departmentName && (
              <>
                <DropdownMenuItem disabled className="text-xs text-muted-foreground text-right px-2 py-1.5 flex justify-end">
                  القسم: {user.departmentName}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
              </>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer text-right px-2 py-2 font-medium flex justify-end"
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
