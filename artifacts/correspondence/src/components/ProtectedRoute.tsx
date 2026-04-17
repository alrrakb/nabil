import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-destructive">غير مصرح بالوصول</h2>
          <p className="text-muted-foreground text-sm">
            ليس لديك صلاحية الوصول إلى هذه الصفحة.
          </p>
          <p className="text-muted-foreground text-xs">
            دورك الحالي: <strong>{user.role === "admin" ? "مدير" : user.role === "supervisor" ? "مشرف" : "موظف"}</strong>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
