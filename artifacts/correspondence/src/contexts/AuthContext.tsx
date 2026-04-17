import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "supervisor" | "employee";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId: number | null;
  departmentName: string | null;
  employeeId: number;
}

interface AuthContextValue {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchEmployeeProfile(email: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("id, name, email, role, department_id, departments(name)")
    .eq("email", email)
    .single();

  if (error || !data) return null;

  return {
    id: email,
    email: data.email,
    name: data.name,
    role: data.role as UserRole,
    departmentId: data.department_id,
    departmentName: (data.departments as unknown as { name: string } | null)?.name ?? null,
    employeeId: data.id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        const profile = await fetchEmployeeProfile(session.user.email);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        const profile = await fetchEmployeeProfile(session.user.email);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
      }
      if (error.message.includes("Email not confirmed")) {
        return { error: "يرجى تأكيد البريد الإلكتروني أولاً" };
      }
      return { error: "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مجدداً" };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
