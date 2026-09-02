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
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const [registerName, setRegisterName] = useState("");
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

  // First-time STUDENT setup: same idea as vendor setup, but OTP-gated since
  // every student starts on the same shared default password.
  const [showStudentFirstLoginModal, setShowStudentFirstLoginModal] = useState(false);
  const [firstLoginEmail, setFirstLoginEmail] = useState("");
  const [firstLoginOtp, setFirstLoginOtp] = useState("");
  const [firstLoginPassword, setFirstLoginPassword] = useState("");
  const [firstLoginConfirmPassword, setFirstLoginConfirmPassword] = useState("");
  const [firstLoginError, setFirstLoginError] = useState<string | null>(null);
  const [firstLoginSuccess, setFirstLoginSuccess] = useState<string | null>(null);
  const [isResendingFirstLoginOtp, setIsResendingFirstLoginOtp] = useState(false);

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
          if (data.user.role === "VENDOR") {
            setSetupUsername(data.user.username);
            setShowSetupModal(true);
          } else {
            // Students share a default password, so first login is OTP-gated:
            // fire the verification email immediately and open the reset modal.
            setFirstLoginEmail(data.user.email);
            setShowStudentFirstLoginModal(true);
            setIsResendingFirstLoginOtp(true);
            fetch("/api/auth/send-email-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: data.user.email })
            })
              .then(res => res.json())
              .then(otpData => {
                setIsResendingFirstLoginOtp(false);
                if (!otpData.success) {
                  setFirstLoginError(otpData.error || "Failed to send verification email.");
                }
              })
              .catch(err => {
                setIsResendingFirstLoginOtp(false);
                setFirstLoginError("Failed to send verification email: " + err.message);
              });
          }
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
          const redirectTo = (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("redirect")) || "/student/dashboard";
          setTimeout(() => router.push(redirectTo), 1200);
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
    if (!registerName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
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
          name: registerName.trim(),
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

  const handleResendFirstLoginOtp = async () => {
    setIsResendingFirstLoginOtp(true);
    setFirstLoginError(null);
    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: firstLoginEmail })
      });
      const data = await res.json();
      setIsResendingFirstLoginOtp(false);
      if (data.success) {
        setFirstLoginSuccess(`Verification code resent to ${firstLoginEmail}.`);
      } else {
        setFirstLoginError(data.error || "Failed to resend verification email.");
      }
    } catch (err: any) {
      setIsResendingFirstLoginOtp(false);
      setFirstLoginError("Network error: " + err.message);
    }
  };

  const handleStudentFirstLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstLoginPassword.length < 6) {
      setFirstLoginError("Password must be at least 6 characters long.");
      return;
    }
    if (firstLoginPassword !== firstLoginConfirmPassword) {
      setFirstLoginError("Passwords do not match.");
      return;
    }

    setFirstLoginError(null);
    setFirstLoginSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: firstLoginEmail,
          otp: firstLoginOtp.trim(),
          newPassword: firstLoginPassword
        })
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setFirstLoginSuccess("Password set successfully! You can now log in using your new password.");
        setTimeout(() => {
          setShowStudentFirstLoginModal(false);
          setFirstLoginOtp("");
          setFirstLoginPassword("");
          setFirstLoginConfirmPassword("");
          setSuccessMessage("Setup complete. Please log in using your new password.");
        }, 2000);
      } else {
        setFirstLoginError(data.error || "Failed to verify code and save password.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setFirstLoginError("Network error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-center items-center p-4 py-8 relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="card-surface w-full max-w-md p-6 sm:p-8 space-y-6 relative z-10">

        {/* Logo and Kristu Jayanti Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded bg-surface border border-ink/15 mx-auto flex items-center justify-center text-marigold">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Kristu Jayanti University</h1>
          <p className="text-xs text-marigold font-bold uppercase tracking-wider">CampusBites Canteen Hub</p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded bg-chili-soft border border-chili/30 text-chili text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded bg-sage-soft border border-sage/30 text-sage text-xs font-bold text-center">
            {successMessage}
          </div>
        )}

        {/* ================= MODE 1: LOGIN ================= */}
        {authMode === "LOGIN" && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-ink-soft">Username / Register Number</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-ink-soft absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 26bcaf59 (Student) or vendor-1"
                  className="w-full bg-paper border border-ink/15 rounded pl-10 pr-4 py-3 text-ink text-xs focus:outline-none focus:border-marigold font-medium tracking-wide transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-ink-soft">Account Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-ink-soft absolute left-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-paper border border-ink/15 rounded pl-10 pr-10 py-3 text-ink text-xs focus:outline-none focus:border-marigold font-medium tracking-wide transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-marigold hover:bg-marigold-hover py-3.5 text-xs font-bold text-white rounded flex items-center justify-center gap-2 transition-colors"
            >
              <span>{isLoading ? "Validating Credentials..." : "Authenticate & Access Portal →"}</span>
            </button>

            <div className="flex justify-between items-center pt-2 text-[11px] font-bold text-ink-soft">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("REGISTER");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="hover:text-marigold transition-colors"
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
                className="hover:text-marigold transition-colors"
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
              <label className="font-bold text-ink-soft">Student Register Number</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-ink-soft absolute left-3.5" />
                <input
                  type="text"
                  required
                  disabled={isRegisterOtpSent}
                  value={registerRegNumber}
                  onChange={(e) => setRegisterRegNumber(e.target.value)}
                  placeholder="e.g. 26bcaf59"
                  className="w-full bg-paper border border-ink/15 rounded pl-10 pr-4 py-3 text-ink text-xs focus:outline-none focus:border-marigold font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-ink-soft">Choose Campus Location</label>
              <select
                disabled={isRegisterOtpSent}
                value={registerCampus}
                onChange={(e) => setRegisterCampus(e.target.value)}
                className="w-full bg-paper border border-ink/15 rounded p-3 text-ink text-xs focus:outline-none focus:border-marigold font-bold"
              >
                <option value="Central Campus">Kristu Jayanti University (Central Campus)</option>
                <option value="Airport Road Campus">Kristu Jayanti University (Airport Road Campus)</option>
              </select>
            </div>

            {isRegisterOtpSent && (
              <>
                <div className="space-y-1.5">
                  <label className="font-bold text-ink-soft">Enter 4-Digit Email OTP</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={registerOtp}
                    onChange={(e) => setRegisterOtp(e.target.value)}
                    placeholder="4-digit OTP"
                    className="w-full bg-paper border border-ink/15 rounded p-3 text-center text-lg font-mono font-bold tracking-widest text-ink focus:outline-none focus:border-marigold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-ink-soft">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-ink-soft absolute left-3.5" />
                    <input
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="e.g. Aditya Sharma"
                      className="w-full bg-paper border border-ink/15 rounded pl-10 pr-4 py-3 text-ink text-xs focus:outline-none focus:border-marigold font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-ink-soft">Choose Secure Password</label>
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-paper border border-ink/15 rounded p-3 text-ink text-xs focus:outline-none focus:border-marigold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-ink-soft">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-paper border border-ink/15 rounded p-3 text-ink text-xs focus:outline-none focus:border-marigold"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-marigold hover:bg-marigold-hover py-3.5 text-xs font-bold text-white rounded flex items-center justify-center gap-2 transition-colors"
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
                className="text-[11px] text-ink-soft hover:text-ink transition-colors"
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
              <label className="font-bold text-ink-soft">Student Register Number</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-ink-soft absolute left-3.5" />
                <input
                  type="text"
                  required
                  disabled={isOtpSent}
                  value={resetRegNumber}
                  onChange={(e) => setResetRegNumber(e.target.value)}
                  placeholder="e.g. 26bcaf59"
                  className="w-full bg-paper border border-ink/15 rounded pl-10 pr-4 py-3 text-ink text-xs focus:outline-none focus:border-marigold font-bold"
                />
              </div>
            </div>

            {isOtpSent && (
              <>
                <div className="space-y-1.5">
                  <label className="font-bold text-ink-soft">Enter 4-Digit Email OTP</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="4-digit OTP"
                    className="w-full bg-paper border border-ink/15 rounded p-3 text-center text-lg font-mono font-bold tracking-widest text-ink focus:outline-none focus:border-marigold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-ink-soft">New Password</label>
                  <input
                    type="password"
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full bg-paper border border-ink/15 rounded p-3 text-ink text-xs focus:outline-none focus:border-marigold"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-marigold hover:bg-marigold-hover py-3.5 text-xs font-bold text-white rounded flex items-center justify-center gap-2 transition-colors"
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
                className="text-[11px] text-ink-soft hover:text-ink transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FIRST-TIME VENDOR PASSWORD SETUP MODAL */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="card-surface w-full max-w-md p-6 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-dashed border-ink/15 pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-marigold" /> First-Time Vendor Setup
              </h3>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-ink-soft hover:text-ink"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-ink-soft leading-relaxed">
              Your account has been verified using the registration passcode! Please configure your permanent login password below.
            </p>

            {setupError && (
              <div className="p-3 rounded bg-chili-soft border border-chili/30 text-chili text-[10px] font-bold">
                {setupError}
              </div>
            )}

            {setupSuccess && (
              <div className="p-3 rounded bg-sage-soft border border-sage/30 text-sage text-[10px] font-bold">
                {setupSuccess}
              </div>
            )}

            <form onSubmit={handleSetupPasswordSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-ink-soft">Canteen Stall ID</label>
                <input
                  type="text"
                  disabled
                  value={setupUsername}
                  className="w-full bg-cardstock border border-ink/15 rounded p-2.5 text-ink-soft cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink-soft">New Password *</label>
                <input
                  type="password"
                  required
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink-soft">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-marigold hover:bg-marigold-hover py-3 text-xs font-bold text-white rounded mt-2 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Save Password & Complete Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FIRST-TIME STUDENT LOGIN: OTP-gated password reset */}
      {showStudentFirstLoginModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="card-surface w-full max-w-md p-6 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-dashed border-ink/15 pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-marigold" /> Set Your Password
              </h3>
              <button
                onClick={() => setShowStudentFirstLoginModal(false)}
                className="text-ink-soft hover:text-ink"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-ink-soft leading-relaxed">
              This is your first login. We've sent a verification code to <strong className="text-ink">{firstLoginEmail}</strong> — enter it below along with your new permanent password.
            </p>

            {firstLoginError && (
              <div className="p-3 rounded bg-chili-soft border border-chili/30 text-chili text-[10px] font-bold">
                {firstLoginError}
              </div>
            )}

            {firstLoginSuccess && (
              <div className="p-3 rounded bg-sage-soft border border-sage/30 text-sage text-[10px] font-bold">
                {firstLoginSuccess}
              </div>
            )}

            <form onSubmit={handleStudentFirstLoginSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-ink-soft">Enter 4-Digit Email OTP</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={firstLoginOtp}
                  onChange={(e) => setFirstLoginOtp(e.target.value)}
                  placeholder="4-digit OTP"
                  className="w-full bg-paper border border-ink/15 rounded p-3 text-center text-lg font-mono font-bold tracking-widest text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink-soft">New Password *</label>
                <input
                  type="password"
                  required
                  value={firstLoginPassword}
                  onChange={(e) => setFirstLoginPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink-soft">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={firstLoginConfirmPassword}
                  onChange={(e) => setFirstLoginConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-marigold hover:bg-marigold-hover py-3 text-xs font-bold text-white rounded mt-2 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Verify & Save Password</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResendFirstLoginOtp}
                disabled={isResendingFirstLoginOtp}
                className="w-full text-[11px] font-bold text-ink-soft hover:text-marigold transition-colors text-center"
              >
                {isResendingFirstLoginOtp ? "Resending..." : "Didn't get a code? Resend it"}
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
