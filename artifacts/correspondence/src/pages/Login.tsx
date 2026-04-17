import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
    } else {
      setLocation("/");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f1e3d 0%, #1a2e5a 50%, #0d3b6e 100%)" }}
    >
      {/* Decorative background circles */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #14b8a6, transparent)" }}
      />
      <div
        className="absolute bottom-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-4"
      >
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/95">
          <CardHeader className="pb-4 pt-8 px-8 text-center">
            {/* Logo area */}
            <div className="flex justify-center mb-4">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #1a2e5a, #14b8a6)" }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="6" width="18" height="3" rx="1.5" fill="white" opacity="0.9" />
                  <rect x="4" y="12" width="14" height="3" rx="1.5" fill="white" opacity="0.7" />
                  <rect x="4" y="18" width="10" height="3" rx="1.5" fill="white" opacity="0.5" />
                  <circle cx="24" cy="22" r="6" fill="#14b8a6" />
                  <path d="M21 22l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Cairo, sans-serif" }}>
              معهد دلتا العالي
            </h1>
            <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "Cairo, sans-serif" }}>
              نظام إدارة المراسلات الداخلية
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@delta.edu.eg"
                    className="pr-10 text-right"
                    dir="ltr"
                    data-testid="input-email"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10 text-right"
                    data-testid="input-password"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
                  data-testid="login-error"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-base"
                style={{ background: "linear-gradient(135deg, #1a2e5a, #0d3b6e)" }}
                disabled={loading}
                data-testid="button-login"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                للمساعدة تواصل مع إدارة تقنية المعلومات
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-white/40 mt-6">
          © {new Date().getFullYear()} معهد دلتا العالي — جميع الحقوق محفوظة
        </p>
      </motion.div>
    </div>
  );
}
