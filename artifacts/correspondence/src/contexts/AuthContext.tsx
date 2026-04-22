import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "supervisor" | "employee";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId: string | null;
  departmentName: string | null;
  employeeId: string;
}

interface AuthContextValue {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Wraps the Supabase query in a 6-second race so a slow/paused project
// never leaves the app in a permanent loading or "account not found" state.
async function fetchEmployeeProfile(email: string): Promise<AuthUser | null> {
  console.log("[Auth] fetchEmployeeProfile → START for:", email);

  const queryPromise = supabase
    .from("employees")
    .select("id, full_name, email, role, department_id, departments(name)")
    .eq("email", email)
    .single();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("[Auth] fetchEmployeeProfile TIMED OUT after 6s")), 6000)
  );

  try {
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error("[Auth] fetchEmployeeProfile → DB ERROR:", error.message, "| code:", error.code);
      return null;
    }
    if (!data) {
      console.warn("[Auth] fetchEmployeeProfile → NO ROW found for email:", email);
      return null;
    }

    console.log("[Auth] fetchEmployeeProfile → SUCCESS, role:", data.role);
    return {
      id: email,
      email: data.email,
      name: data.full_name,
      role: data.role as UserRole,
      departmentId: data.department_id,
      departmentName: (data.departments as unknown as { name: string } | null)?.name ?? null,
      employeeId: data.id,
    };
  } catch (err) {
    console.error("[Auth] fetchEmployeeProfile → THREW:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const initDone = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      console.log("[Auth] initAuth → START");

      try {
        console.log("[Auth] Calling supabase.auth.getSession()...");
        const { data: { session: storedSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[Auth] getSession ERROR:", error.message);
          throw error;
        }
        if (cancelled) return;

        console.log("[Auth] getSession → OK. Session present:", !!storedSession);
        setSession(storedSession);

        if (storedSession?.user?.email) {
          console.log("[Auth] Calling fetchEmployeeProfile...");
          const profile = await fetchEmployeeProfile(storedSession.user.email);
          if (cancelled) return;
          console.log("[Auth] fetchEmployeeProfile complete. Profile found:", !!profile);
          setUser(profile);
        } else {
          console.log("[Auth] No session, setting user to null");
          setUser(null);
        }
      } catch (err) {
        console.error("[Auth] initAuth caught error:", err);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) {
          console.log("[Auth] initAuth → setting loading = false");
          initDone.current = true;
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("[Auth] onAuthStateChange event:", event);

      // INITIAL_SESSION is already handled by initAuth above — skip it to avoid
      // a duplicate fetchEmployeeProfile call on every page load.
      if (event === "INITIAL_SESSION") return;
      if (cancelled) return;

      // SIGNED_IN fires on page reload (session restored from localStorage) as well
      // as on a real user login. During the initial load, initAuth is already
      // fetching the profile — skip here to avoid a redundant parallel query that
      // times out and potentially clobbers the result.
      if (event === "SIGNED_IN" && !initDone.current) {
        console.log("[Auth] SIGNED_IN during initial load — initAuth is handling it, skipping");
        return;
      }

      // TOKEN_REFRESHED only updates the token — the user identity hasn't changed.
      // Update the session object but do NOT re-fetch the profile; that would race
      // against initAuth and could wipe a valid user with a null if the profile
      // query is still in-flight.
      if (event === "TOKEN_REFRESHED") {
        console.log("[Auth] TOKEN_REFRESHED — updating session only, skipping profile re-fetch");
        setSession(newSession);
        return;
      }

      setSession(newSession);

      if (newSession?.user?.email) {
        console.log("[Auth] onAuthStateChange → fetching profile for event:", event);
        if (!cancelled) setProfileLoading(true);
        try {
          const profile = await fetchEmployeeProfile(newSession.user.email);
          if (!cancelled) {
            console.log("[Auth] onAuthStateChange → profile fetch done. Found:", !!profile);
            if (profile) {
              // Got a valid profile — always update.
              setUser(profile);
            } else {
              // Fetch returned null: could be a transient DB timeout inside
              // fetchEmployeeProfile, or the row genuinely doesn't exist.
              // Never drop an already-loaded profile mid-session; only clear
              // if the user was never populated (e.g. a fresh SIGNED_IN).
              setUser((prev) => prev ?? null);
            }
          }
        } catch (err) {
          console.error("[Auth] onAuthStateChange profile fetch error:", err);
          // Network / unexpected error — preserve whatever profile we already
          // have so a transient glitch never kicks the user out mid-session.
          if (!cancelled) setUser((prev) => prev ?? null);
        } finally {
          if (!cancelled) setProfileLoading(false);
        }
      } else {
        console.log("[Auth] onAuthStateChange → no session, clearing user");
        if (!cancelled) {
          setUser(null);
          setProfileLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
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
    try {
      await supabase.auth.signOut();
    } catch {
      // Supabase call may fail (network/paused project) — clear local state regardless
    }
    setUser(null);
    setSession(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, profileLoading, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
