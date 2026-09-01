"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Lock, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";
import { RESTAURANT_ACCOUNTS } from "@/lib/restaurants-data";
import { PageLoader } from "@/components/PageLoader";

export default function LoginPage() {
  const router = useRouter();
  
  // Auth Modes
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER" | "FORGOT">("LOGIN");

  // Login States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<{ active: boolean; message: string; submessage: string; type: "auth" | "general" } | null>(null);

  // Student Registration States
  const [registerRegNumber, setRegisterRegNumber] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerOtp, setRegisterOtp] = useState("");
  const [registerCampus, setRegisterCampus] = useState("Airport Road Campus");
  const [isRegisterOtpSent, setIsRegisterOtpSent] = useState(false);

  // Forgot Password / Reset Flow States
  const [resetRegNumber, setResetRegNumber] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  // First-time vendor setup states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);

  // Direct Username & Password Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username/register number and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoadingState({
      active: true,
      message: "Authenticating Credentials",
      submessage: "Verifying identity against campus security directory...",
      type: "auth"
    });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        if (data.requiresPasswordSetup) {
          setLoadingState(null);
          setSetupUsername(data.user.username);
          setShowSetupModal(true);
          return;
        }
        
        setLoadingState({
          active: true,
          message: "Access Granted",
          submessage: `Welcome back, ${data.user.name || data.user.username}! Synchronizing active session & routing to portal...`,
          type: "auth"
        });
        
        // Save sessions
        localStorage.setItem("campusbites_user_role", data.user.role);
        localStorage.setItem("campusbites_user_phone", data.user.email); // email identifier
        localStorage.setItem("campusbites_student_reg", data.user.username);
        localStorage.setItem("campusbites_user_name", data.user.name || data.user.username);
        localStorage.setItem("campusbites_student_campus", data.user.campus || "Airport Road Campus");

        if (data.user.role === "VENDOR") {
          localStorage.setItem("campusbites_active_vendor_id", data.user.username);
          setTimeout(() => router.push("/vendor/dashboard"), 1200);
        } else if (data.user.role === "ADMIN") {
          setTimeout(() => router.push("/admin"), 1200);
        } else {
          setTimeout(() => router.push("/student/dashboard"), 1200);
        }
      } else {
        setLoadingState(null);
        setErrorMessage(data.error || "Authentication failed. Please verify credentials.");
      }
    } catch (err: any) {
      setLoadingState(null);
      setIsLoading(false);
      setErrorMessage("Network error connecting to database: " + err.message);
    }
  };

  // Student First-Time Registration OTP Dispatcher
  const handleSendRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerRegNumber.trim()) {
      setErrorMessage("Please enter your Student Register Number.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = `${registerRegNumber.trim()}@kristujayanti.com`;

    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setIsRegisterOtpSent(true);
        setSuccessMessage(`📧 Professional verification OTP email dispatched to ${email}! Check inbox.`);
      } else {
        setErrorMessage(data.error || "Failed to send verification email");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Connection error: " + err.message);
    }
  };

  // Student First-Time Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerOtp || !registerPassword) {
      setErrorMessage("Please enter the verification OTP and choose a password.");
      return;
    }
    if (registerPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerRegNumber.trim(),
          password: registerPassword.trim(),
          otp: registerOtp.trim(),
          campus: registerCampus
        })
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setSuccessMessage("🎉 Account registered successfully! Please log in with your credentials.");
        setAuthMode("LOGIN");
        setUsername(registerRegNumber);
        setPassword(registerPassword);
        // Clear registration fields
        setRegisterRegNumber("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
        setRegisterOtp("");
        setIsRegisterOtpSent(false);
      } else {
        setErrorMessage(data.error || "Registration failed.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Registration error: " + err.message);
    }
  };

  // Forgot Password: Send Reset OTP
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetRegNumber.trim()) {
      setErrorMessage("Please enter your Student Register Number.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = `${resetRegNumber.trim()}@kristujayanti.com`;

    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setIsOtpSent(true);
        setSuccessMessage(`📧 Professional HTML OTP email dispatched to ${email}! Check inbox.`);
      } else {
        setErrorMessage(data.error || "Failed to send reset email");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Reset connection error: " + err.message);
    }
  };

  // Forgot Password: Verify OTP & Reset
  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || !resetPassword) {
      setErrorMessage("Please fill out the OTP code and new password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = `${resetRegNumber.trim()}@kristujayanti.com`;

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: resetOtp,
          newPassword: resetPassword
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setSuccessMessage("✓ Password updated successfully! Please log in with your new password.");
        setAuthMode("LOGIN");
        setIsOtpSent(false);
        setUsername(resetRegNumber);
        setPassword(resetPassword);
      } else {
        setErrorMessage(data.error || "Reset failed.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Reset verification error: " + err.message);
    }
  };

  const handleSetupPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPassword.length < 6) {
      setSetupError("Password must be at least 6 characters long.");
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setSetupError("Passwords do not match.");
      return;
    }

    setSetupError(null);
    setSetupSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/setup-vendor-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: setupUsername, newPassword: setupPassword })
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setSetupSuccess("🎉 Password set successfully! You can now log in using your new password.");
        setTimeout(() => {
          setShowSetupModal(false);
          setSetupPassword("");
          setSetupConfirmPassword("");
          setSuccessMessage("✓ Setup complete. Please log in using your new password.");
        }, 2000);
      } else {
        setSetupError(data.error || "Failed to save password.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setSetupError("Network error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col justify-center items-center p-4 py-8 relative overflow-hidden">
      {/* Live ambient glowing backlights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      <div className="glass-panel w-full max-w-md rounded-3xl border-slate-800 bg-slate-900/95 p-6 sm:p-8 space-y-6 shadow-2xl border relative z-10">
        
        {/* Logo and Kristu Jayanti Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 mx-auto shadow-lg shadow-orange-500/35 relative overflow-hidden group">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-orange-400">
              <Mail className="w-8 h-8 animate-pulse" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Kristu Jayanti University</h1>
          <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">CampusBites Canteen Hub</p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
            {successMessage}
          </div>
        )}

        {/* ================= MODE 1: LOGIN ================= */}
        {authMode === "LOGIN" && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-300">Username / Register Number</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 26bcaf59 (Student) or vendor-1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-xs focus:outline-none focus:border-orange-500 font-medium tracking-wide transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-300">Account Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-white text-xs focus:outline-none focus:border-orange-500 font-medium tracking-wide transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary-gradient py-3.5 text-xs font-extrabold text-white rounded-xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <span>{isLoading ? "Validating Credentials..." : "Authenticate & Access Portal →"}</span>
            </button>

            <div className="flex justify-between items-center pt-2 text-[11px] font-bold text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("REGISTER");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="hover:text-orange-400 transition-colors"
              >
                Register Student Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("FORGOT");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="hover:text-orange-400 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE 2: REGISTER ================= */}
        {authMode === "REGISTER" && (
          <form onSubmit={isRegisterOtpSent ? handleRegisterSubmit : handleSendRegisterOtp} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-300">Student Register Number</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="text"
                  required
                  disabled={isRegisterOtpSent}
                  value={registerRegNumber}
                  onChange={(e) => setRegisterRegNumber(e.target.value)}
                  placeholder="e.g. 26bcaf59"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-xs focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-300">Choose Campus Location</label>
              <select
                disabled={isRegisterOtpSent}
                value={registerCampus}
                onChange={(e) => setRegisterCampus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-orange-500 font-extrabold"
              >
                <option value="Central Campus">Kristu Jayanti University (Central Campus)</option>
                <option value="Airport Road Campus">Kristu Jayanti University (Airport Road Campus)</option>
              </select>
            </div>

            {isRegisterOtpSent && (
              <>
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">Enter 4-Digit Email OTP</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={registerOtp}
                    onChange={(e) => setRegisterOtp(e.target.value)}
                    placeholder="4-digit OTP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">Choose Secure Password</label>
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary-gradient py-3.5 text-xs font-extrabold text-white rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <span>{isRegisterOtpSent ? "Confirm Registration" : "Send Verification OTP Email"}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("LOGIN");
                  setIsRegisterOtpSent(false);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE 3: FORGOT PASSWORD ================= */}
        {authMode === "FORGOT" && (
          <form onSubmit={isOtpSent ? handleVerifyAndResetPassword : handleSendResetOtp} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-300">Student Register Number</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="text"
                  required
                  disabled={isOtpSent}
                  value={resetRegNumber}
                  onChange={(e) => setResetRegNumber(e.target.value)}
                  placeholder="e.g. 26bcaf59"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-xs focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>
            </div>

            {isOtpSent && (
              <>
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">Enter 4-Digit Email OTP</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="4-digit OTP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">New Password</label>
                  <input
                    type="password"
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary-gradient py-3.5 text-xs font-extrabold text-white rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <span>{isOtpSent ? "Reset & Update Password" : "Send Verification OTP Email"}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("LOGIN");
                  setIsOtpSent(false);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FIRST-TIME VENDOR PASSWORD SETUP MODAL */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-orange-400" /> First-Time Vendor Setup
              </h3>
              <button 
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your account has been verified using the registration passcode! Please configure your permanent login password below.
            </p>

            {setupError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold">
                ⚠️ {setupError}
              </div>
            )}

            {setupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                ✓ {setupSuccess}
              </div>
            )}

            <form onSubmit={handleSetupPasswordSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-300">Canteen Stall ID</label>
                <input
                  type="text"
                  disabled
                  value={setupUsername}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-300">New Password *</label>
                <input
                  type="password"
                  required
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-300">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary-gradient py-3 text-xs font-bold text-white rounded-xl shadow-lg mt-2 flex items-center justify-center gap-1.5"
              >
                <span>Save Password & Complete Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {loadingState && (
        <PageLoader 
          message={loadingState.message} 
          submessage={loadingState.submessage} 
          type={loadingState.type} 
        />
      )}
    </div>
  );
}
