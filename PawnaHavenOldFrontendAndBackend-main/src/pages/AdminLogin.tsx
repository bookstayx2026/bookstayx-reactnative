import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff, Loader2, Sparkles, Shield, SmartphoneNfc, ArrowLeft, Code2 } from "lucide-react";
import { adminPaths } from "@/lib/adminPaths";
import { isAdminDeveloperMode, startAdminDeveloperSession } from "@/lib/developerAccess";

type Step = "credentials" | "totp";

const AdminLogin = () => {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [tempToken, setTempToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const totpInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token || isAdminDeveloperMode()) {
      navigate(adminPaths.dashboard);
    }
    setIsCheckingAuth(false);
  }, [navigate]);

  useEffect(() => {
    if (step === "totp") {
      setTimeout(() => totpInputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success && result.requiresTOTP) {
        setTempToken(result.tempToken);
        setStep("totp");
      } else if (result.success) {
        localStorage.setItem("adminToken", result.data.token);
        if (result.data.refreshToken) localStorage.setItem("adminRefreshToken", result.data.refreshToken);
        localStorage.setItem("adminUser", JSON.stringify(result.data.admin));
        toast({ title: "Welcome back!", description: "Login successful." });
        navigate(adminPaths.dashboard);
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = totpCode.replace(/\s/g, "");
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code from your Authenticator app.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code: cleanCode }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("adminToken", result.data.token);
        if (result.data.refreshToken) localStorage.setItem("adminRefreshToken", result.data.refreshToken);
        localStorage.setItem("adminUser", JSON.stringify(result.data.admin));
        toast({ title: "Welcome back!", description: "Login successful." });
        navigate(adminPaths.dashboard);
      } else {
        toast({
          title: "Verification Failed",
          description: result.message || "Invalid code. Please try again.",
          variant: "destructive",
        });
        setTotpCode("");
        totpInputRef.current?.focus();
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
    setTempToken("");
    setTotpCode("");
  };

  const handleDeveloperAccess = () => {
    startAdminDeveloperSession();
    toast({
      title: "Developer preview enabled",
      description: "You are viewing the dashboard with local demo data.",
    });
    navigate(adminPaths.dashboard);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(193,155,74,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(193,155,74,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-gold-dark mb-6 shadow-gold-lg animate-pulse-glow">
            {step === "totp" ? (
              <SmartphoneNfc className="w-10 h-10 text-primary-foreground" />
            ) : (
              <Shield className="w-10 h-10 text-primary-foreground" />
            )}
          </div>
          <h1 className="font-display text-4xl font-semibold text-foreground mb-2">
            PawnaHavenCamp
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Admin Portal
            <Sparkles className="w-4 h-4 text-primary" />
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-3xl p-8 border border-border/50 shadow-card">
          {step === "credentials" ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-1">Welcome back</h2>
                <p className="text-sm text-muted-foreground">Sign in to manage your properties</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter admin Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-secondary/50 border-border/50 rounded-xl pl-4 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      disabled={isLoading}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter valid password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-secondary/50 border-border/50 rounded-xl pl-4 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-gold-dark hover:from-gold-dark hover:to-primary transition-all duration-500 shadow-gold hover:shadow-gold-lg transform hover:-translate-y-0.5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6" aria-hidden="true">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">Developer tools</span></div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleDeveloperAccess}
                className="w-full min-h-12 rounded-xl border-primary/40 bg-primary/5 text-foreground hover:bg-primary/10"
              >
                <Code2 className="w-5 h-5 mr-2 text-primary" />
                Open developer preview
              </Button>
              <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
                Read-only preview using local demo properties. No production admin token is created.
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-1">Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground">
                  Open Microsoft Authenticator and enter the 6-digit code for PawnaHavenCamp.
                </p>
              </div>

              <form onSubmit={handleVerifyTotp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="totp" className="text-sm font-medium text-foreground">
                    Authenticator Code
                  </Label>
                  <div className="relative group">
                    <Input
                      id="totp"
                      ref={totpInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9 ]*"
                      maxLength={7}
                      placeholder="000 000"
                      value={totpCode}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                        setTotpCode(raw);
                      }}
                      className="h-14 bg-secondary/50 border-border/50 rounded-xl text-center text-3xl tracking-[0.4em] font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      disabled={isLoading}
                      autoComplete="one-time-code"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Code refreshes every 30 seconds
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-gold-dark hover:from-gold-dark hover:to-primary transition-all duration-500 shadow-gold hover:shadow-gold-lg transform hover:-translate-y-0.5"
                  disabled={isLoading || totpCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Verify & Sign In
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors pt-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </button>
              </form>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-center text-xs text-muted-foreground">
              Secure admin access • Protected by encryption
            </p>
          </div>
        </div>

        {/* Back to site link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors elegant-underline"
          >
            ← Back to website
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
