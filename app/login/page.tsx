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
  EyeOff,
  Building2,
  GraduationCap,
  Store,
  ChevronDown,
  Info,
  Search,
  AlertTriangle,
  AlertCircle,
  LogIn,
  Check,
  RotateCcw,
  Send,
  RefreshCw
} from "lucide-react";
import { PageLoader } from "@/components/PageLoader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { validateCollegeEmailPrefix } from "@/lib/email-validator";

interface InstitutionItem {
  id: string;
  name: string;
  code: string;
  emailDomain: string;
  tokenPrefix: string;
  campuses: string[];
  logo?: string | null;
}

export default function LoginPage() {
  const router = useRouter();

  // Multi-College Institutions List (for Register New Users modal)
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([
    {
      id: "kju",
      name: "Kristu Jayanti University",
      code: "KJU",
      emailDomain: "kristujayanti.com",
      tokenPrefix: "KJU",
      campuses: ["Central Campus", "Airport Road Campus"]
    },
    {
      id: "christ",
      name: "Christ (Deemed to be University)",
      code: "CU",
      emailDomain: "christuniversity.in",
      tokenPrefix: "CU",
      campuses: ["Central Campus (Hosur)", "Kengeri Campus", "Bannerghatta Road Campus", "Yeshwanthpur Campus"]
    },
    {
      id: "rvce",
      name: "RV College of Engineering",
      code: "RVCE",
      emailDomain: "rvce.edu.in",
      tokenPrefix: "RVCE",
      campuses: ["Mysore Road Main Campus"]
    }
  ]);

  // Main Unified Login States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<{ 
    active: boolean; 
    message: string; 
    submessage: string; 
    type: "auth" | "general" 
  } | null>(null);

  // Register New Users Modal States
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regCollegeId, setRegCollegeId] = useState("");
  const [regCollegeSearch, setRegCollegeSearch] = useState("");
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
  const [regUsername, setRegUsername] = useState("");
  const [regName, setRegName] = useState("");
  const [regCampus, setRegCampus] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regOtp, setRegOtp] = useState("");
  const [isRegOtpSent, setIsRegOtpSent] = useState(false);
  const [isSendingRegOtp, setIsSendingRegOtp] = useState(false);
  const [regOtpCooldown, setRegOtpCooldown] = useState(0);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regAlreadyRegistered, setRegAlreadyRegistered] = useState(false);
  const [isOtpInvalid, setIsOtpInvalid] = useState(false);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // OTP resend cooldown timer
  useEffect(() => {
    if (regOtpCooldown <= 0) return;
    const timer = setTimeout(() => setRegOtpCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [regOtpCooldown]);

  // Forgot Password / Reset Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [resetCollegeId, setResetCollegeId] = useState("kju");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [isResetOtpSent, setIsResetOtpSent] = useState(false);
  const [isSendingResetOtp, setIsSendingResetOtp] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // First-Time Stall Passcode Setup Modal States
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupUsername, setSetupUsername] = useState("");
  const [setupTempPasscode, setSetupTempPasscode] = useState("");
  const [setupNewPassword, setSetupNewPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);

  // Fetch institutions on mount
  useEffect(() => {
    fetch("/api/institutions")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.institutions && data.institutions.length > 0) {
          setInstitutions(data.institutions);
        }
      })
      .catch(err => console.log("Using default fallback institutions:", err.message));
  }, []);

  // Update register campus options when chosen college changes
  const selectedRegInstitution = regCollegeId ? institutions.find(i => i.id === regCollegeId) : undefined;
  const matchingColleges = institutions.filter((inst) =>
    !regCollegeSearch.trim() ||
    inst.name.toLowerCase().includes(regCollegeSearch.toLowerCase()) ||
    inst.code.toLowerCase().includes(regCollegeSearch.toLowerCase()) ||
    inst.id.toLowerCase().includes(regCollegeSearch.toLowerCase())
  );

  const regEmailValidation = selectedRegInstitution && regCollegeId && regUsername.trim()
    ? validateCollegeEmailPrefix(regUsername, selectedRegInstitution.emailDomain)
    : null;

  useEffect(() => {
    if (selectedRegInstitution && selectedRegInstitution.campuses && selectedRegInstitution.campuses.length > 0) {
      setRegCampus(selectedRegInstitution.campuses[0]);
    } else {
      setRegCampus("");
    }
  }, [regCollegeId, selectedRegInstitution]);

  // UNIFIED SMART LOGIN HANDLER
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both your identifier/username and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (!data.success) {
        setErrorMessage(data.error || "Authentication failed. Please verify your credentials.");
        return;
      }

      // Check if user requires password setup (first time vendor stall code)
      if (data.requiresPasswordSetup) {
        setSetupUsername(data.user.username);
        setSetupTempPasscode(password.trim());
        setShowSetupModal(true);
        return;
      }

      const user = data.user;
      const userRole = user.role;
      const instId = user.institutionId || (user.institution ? user.institution.id : "kju");
      const instName = user.institution ? user.institution.name : (institutions.find(i => i.id === instId)?.name || "Kristu Jayanti University");

      localStorage.setItem("campusbites_user_role", userRole);
      localStorage.setItem("campusbites_user_name", user.name || user.username);
      localStorage.setItem("campusbites_user_phone", user.email || user.username);
      localStorage.setItem("campusbites_student_reg", user.username);
      localStorage.setItem("campusbites_student_campus", user.campus || "Central Campus");
      localStorage.setItem("campusbites_selected_institution", instId);
      localStorage.setItem("campusbites_institution_name", instName);

      if (userRole === "VENDOR" && user.restaurantId) {
        localStorage.setItem("campusbites_vendor_restaurant_id", user.restaurantId);
        localStorage.setItem("campusbites_vendor_restaurant_name", user.restaurant?.name || "My Canteen Stall");
        localStorage.setItem("campusbites_vendor_stall_code", user.username);
      }

      setLoadingState({
        active: true,
        message: `Welcome back, ${user.name || user.username}! 🌟`,
        submessage: userRole === "VENDOR" 
          ? `Opening ${user.restaurant?.name || "Stall"} Dashboard...` 
          : userRole === "ADMIN" 
          ? "Opening University Administrator Portal..." 
          : `Entering ${instName} Canteen Hub...`,
        type: "auth"
      });

      setTimeout(() => {
        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "VENDOR") {
          router.push("/vendor/orders");
        } else {
          router.push("/student/dashboard");
        }
      }, 900);

    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Network or connection error. Please try again.");
    }
  };

  // Smart prefix input handler - strips @domain.com automatically
  const handleRegUsernameChange = (val: string) => {
    let clean = val;
    if (clean.includes("@")) {
      clean = clean.split("@")[0];
    }
    clean = clean.replace(/\s+/g, "");
    setRegUsername(clean);
  };

  // SEND REGISTRATION OTP
  const handleSendRegOtp = async () => {
    if (!regCollegeId || !selectedRegInstitution) {
      setRegError("Please search and select your registered College / University first.");
      return;
    }
    if (!regUsername.trim()) {
      setRegError("Please enter your official ID or name (before the @) first.");
      return;
    }

    const valResult = validateCollegeEmailPrefix(regUsername, selectedRegInstitution.emailDomain);
    if (!valResult.valid) {
      setRegError(valResult.error || "Please enter a valid official college ID or student roll number.");
      return;
    }

    setIsSendingRegOtp(true);
    setRegError(null);
    setRegSuccess(null);
    setRegAlreadyRegistered(false);
    setIsOtpInvalid(false);

    const emailDomain = selectedRegInstitution.emailDomain;
    const cleanPrefix = valResult.cleanPrefix;
    const targetEmail = `${cleanPrefix.toLowerCase()}@${emailDomain}`;

    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: targetEmail,
          username: cleanPrefix,
          purpose: "register"
        })
      });
      const data = await res.json();
      setIsSendingRegOtp(false);

      if (data.alreadyRegistered) {
        setRegAlreadyRegistered(true);
        setRegError(data.error || "This official ID or email is already registered on CampusBites.");
        return;
      }

      if (data.success) {
        setIsRegOtpSent(true);
        setRegOtpCooldown(60);
        setRegSuccess(`✓ 4-digit verification code sent to ${targetEmail}. Please check your inbox & Spam folder.`);
      } else {
        setRegError(data.error || "Failed to send OTP email. Please try again.");
      }
    } catch (e: any) {
      setIsSendingRegOtp(false);
      setRegError("Network error sending verification OTP. Please try again.");
    }
  };

  // SUBMIT REGISTER NEW USERS
  const handleRegisterNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegAlreadyRegistered(false);
    setIsOtpInvalid(false);

    if (!regCollegeId || !selectedRegInstitution) {
      setRegError("Please search and select your registered College / University first.");
      return;
    }
    if (!regUsername.trim() || !regPassword.trim()) {
      setRegError("Please enter your official ID and set a password.");
      return;
    }

    const valResult = validateCollegeEmailPrefix(regUsername, selectedRegInstitution.emailDomain);
    if (!valResult.valid) {
      setRegError(valResult.error || "Please enter a valid official college ID or student roll number.");
      return;
    }

    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters long.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match. Please verify.");
      return;
    }
    if (!isRegOtpSent) {
      setRegError("Please click 'Send Verification OTP' to verify your college email.");
      return;
    }
    if (!regOtp.trim()) {
      setIsOtpInvalid(true);
      setRegError("Please enter the 4-digit OTP code sent to your email.");
      return;
    }

    setIsSubmittingReg(true);
    setRegError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername.trim(),
          name: regName.trim() || regUsername.trim(),
          password: regPassword.trim(),
          otp: regOtp.trim(),
          campus: regCampus,
          institutionId: regCollegeId,
          role: "STUDENT"
        })
      });

      const data = await res.json();
      setIsSubmittingReg(false);

      if (data.alreadyRegistered) {
        setRegAlreadyRegistered(true);
        setRegError(data.error || "This official ID or email is already registered on CampusBites.");
        return;
      }

      if (data.invalidOtp) {
        setIsOtpInvalid(true);
        setRegError(data.error || "❌ Invalid OTP code entered. Please re-check or request a new code.");
        return;
      }

      if (data.success) {
        setShowRegisterModal(false);
        setSuccessMessage(`✓ Account created successfully for ${regUsername}! Signing you in...`);
        
        // Auto-login newly registered student/user
        const user = data.user;
        localStorage.setItem("campusbites_user_role", "STUDENT");
        localStorage.setItem("campusbites_user_name", user.name || user.username);
        localStorage.setItem("campusbites_user_phone", user.email);
        localStorage.setItem("campusbites_student_reg", user.username);
        localStorage.setItem("campusbites_student_campus", user.campus || regCampus);
        localStorage.setItem("campusbites_selected_institution", regCollegeId);
        localStorage.setItem("campusbites_institution_name", selectedRegInstitution?.name || "College");

        setLoadingState({
          active: true,
          message: `Welcome ${user.name || user.username}! 🎓`,
          submessage: `Loading ${selectedRegInstitution?.name || "Campus"} Canteen Hub...`,
          type: "auth"
        });
        setTimeout(() => router.push("/student/dashboard"), 1000);
      } else {
        setRegError(data.error || "Failed to register user.");
      }
    } catch (e: any) {
      setIsSubmittingReg(false);
      setRegError("Network error. Please try again.");
    }
  };

  // SEND FORGOT PASSWORD OTP
  const handleSendResetOtp = async () => {
    if (!resetInput.trim()) {
      setResetError("Please enter your Register Number or Email.");
      return;
    }
    setIsSendingResetOtp(true);
    setResetError(null);
    setResetSuccess(null);

    const selectedCollege = institutions.find(i => i.id === resetCollegeId) || institutions[0];
    const emailDomain = selectedCollege.emailDomain;
    const cleanId = resetInput.includes("@") ? resetInput.trim() : `${resetInput.trim().toLowerCase()}@${emailDomain}`;

    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanId })
      });
      const data = await res.json();
      setIsSendingResetOtp(false);

      if (data.success) {
        setIsResetOtpSent(true);
        setResetSuccess(`✓ 4-digit OTP verification code sent to ${cleanId}. Please check your inbox & Spam folder.`);
      } else {
        setResetError(data.error || "Failed to send reset OTP.");
      }
    } catch (e: any) {
      setIsSendingResetOtp(false);
      setResetError("Network error sending OTP. Please try again.");
    }
  };

  // SUBMIT PASSWORD RESET
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetInput.trim() || !resetPassword.trim() || !resetOtp.trim()) {
      setResetError("Please enter your email/ID, the OTP code received, and your new password.");
      return;
    }
    setIsSubmittingReset(true);
    setResetError(null);

    const selectedCollege = institutions.find(i => i.id === resetCollegeId) || institutions[0];
    const cleanId = resetInput.includes("@") ? resetInput.trim() : `${resetInput.trim().toLowerCase()}@${selectedCollege.emailDomain}`;

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanId,
          otp: resetOtp.trim(),
          newPassword: resetPassword.trim()
        })
      });

      const data = await res.json();
      setIsSubmittingReset(false);

      if (data.success) {
        setShowForgotModal(false);
        setSuccessMessage("✓ Password updated successfully! Please log in with your new password.");
        setUsername(resetInput.trim());
        setPassword("");
      } else {
        setResetError(data.error || "Failed to reset password. Please check the OTP.");
      }
    } catch (e: any) {
      setIsSubmittingReset(false);
      setResetError("Reset error: " + e.message);
    }
  };

  // SUBMIT VENDOR STALL PASSCODE SETUP
  const handleSetupVendorPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupNewPassword || setupNewPassword !== setupConfirmPassword) {
      setSetupError("Passwords do not match.");
      return;
    }
    setIsSubmittingSetup(true);
    setSetupError(null);

    try {
      const res = await fetch("/api/auth/setup-vendor-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: setupUsername,
          tempPasscode: setupTempPasscode,
          newPassword: setupNewPassword
        })
      });

      const data = await res.json();
      setIsSubmittingSetup(false);

      if (data.success) {
        setShowSetupModal(false);
        setSuccessMessage("✓ Stall password configured successfully! You can now sign in.");
        setUsername(setupUsername);
        setPassword(setupNewPassword);
      } else {
        setSetupError(data.error || "Failed to update password.");
      }
    } catch (e: any) {
      setIsSubmittingSetup(false);
      setSetupError("Setup error: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Theme Toggle in Header Corner */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* CampusBites Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-marigold/10 border border-marigold/30 text-marigold shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-marigold">
            CampusBites
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft font-semibold">
            Smart Universal Campus Canteen Ordering Platform
          </p>
        </div>

        {/* Unified Single Login Box */}
        <div className="bg-cardstock border border-ink/15 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-chili-soft border border-chili/30 text-chili text-xs font-bold animate-in fade-in flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-in fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Identifier Input */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-ink block text-[11px] uppercase tracking-wider">
                Email / Register No. / Stall ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-soft absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 21bcaf59, bamboos, or superadmin"
                  className="w-full bg-surface border border-ink/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-marigold focus:ring-1 focus:ring-marigold transition-all"
                  autoComplete="username"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-ink block text-[11px] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  suppressHydrationWarning
                  className="text-[11px] font-bold text-marigold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-soft absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-surface border border-ink/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-marigold focus:ring-1 focus:ring-marigold transition-all"
                  autoComplete="current-password"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  suppressHydrationWarning
                  className="absolute right-3.5 top-3 text-ink-soft hover:text-ink transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              suppressHydrationWarning
              className="w-full bg-marigold hover:bg-marigold-hover active:scale-[0.99] py-3 text-xs font-black text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to CampusBites</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register New Users Action */}
          <div className="pt-3 border-t border-ink/10 text-center space-y-2">
            <p className="text-xs text-ink-soft">
              New student or user without an account?
            </p>
            <button
              type="button"
              onClick={() => {
                setRegError(null);
                setRegSuccess(null);
                setRegAlreadyRegistered(false);
                setIsOtpInvalid(false);
                setRegCollegeSearch("");
                setIsCollegeDropdownOpen(false);
                setShowRegisterModal(true);
              }}
              suppressHydrationWarning
              className="w-full py-2.5 px-4 rounded-xl bg-surface hover:bg-cardstock-hover border border-ink/15 text-xs font-bold text-ink transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-marigold" />
              <span>Register New Users →</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p suppressHydrationWarning className="text-center text-[11px] text-ink-soft">
          Protected by CampusBites Universal Multi-College Auth &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* MODAL: REGISTER NEW USERS */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-cardstock border border-ink/20 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Register Modal Header */}
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h2 className="text-base font-black text-ink flex items-center gap-2 font-display">
                  <GraduationCap className="w-5 h-5 text-marigold" />
                  Register New User Account
                </h2>
                <p className="text-[11px] text-ink-soft">
                  Create your profile for campus canteens & pre-order access
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-ink-soft hover:text-ink font-bold text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Smart Guide for Already Registered Users */}
            {regAlreadyRegistered && (
              <div className="p-4 rounded-2xl bg-marigold/10 border-2 border-marigold/40 text-ink space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-marigold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-marigold" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-xs text-ink font-sans">Account Already Registered!</h4>
                    <p className="text-[11px] text-ink-soft font-sans leading-relaxed">
                      An account is already registered with this official ID (<strong>{regUsername.trim()}</strong>) or email. You do not need to register again!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setShowForgotModal(true);
                      setResetInput(regUsername.trim());
                      setResetCollegeId(regCollegeId);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-cardstock hover:bg-cardstock-hover border border-marigold/40 text-marigold font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setUsername(regUsername.trim());
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-marigold hover:bg-marigold-hover text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Go to Sign In</span>
                  </button>
                </div>
              </div>
            )}

            {regError && !regAlreadyRegistered && (
              <div className="p-3 rounded-xl bg-chili-soft border border-chili/30 text-chili text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Info className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterNewUser} className="space-y-4 text-xs">
              {/* 1. Searchable College / University Typeahead (No dropdown until typed) */}
              <div className="space-y-1 relative">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-ink block text-[11px]">
                    Select Your College / University *
                  </label>
                  {selectedRegInstitution && regCollegeId && regCollegeSearch.trim() ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected: {selectedRegInstitution.code}
                    </span>
                  ) : (
                    <span className="text-[10px] text-ink-soft font-semibold">Type to search</span>
                  )}
                </div>

                <div className="relative">
                  <Building2 className="w-4 h-4 text-marigold absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={regCollegeSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRegCollegeSearch(val);
                      setIsCollegeDropdownOpen(true);
                      const directMatch = institutions.find(i => 
                        i.name.toLowerCase() === val.toLowerCase() || 
                        i.code.toLowerCase() === val.toLowerCase() ||
                        i.id.toLowerCase() === val.toLowerCase()
                      );
                      if (directMatch) {
                        setRegCollegeId(directMatch.id);
                        if (directMatch.campuses && directMatch.campuses.length > 0) {
                          setRegCampus(directMatch.campuses[0]);
                        }
                      } else {
                        setRegCollegeId("");
                      }
                    }}
                    placeholder="Type college name (e.g. Kristu Jayanti, Christ, RVCE)..."
                    className="w-full bg-surface border border-ink/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-marigold font-bold font-sans"
                  />
                </div>

                {/* College Suggestions Dropdown — ONLY APPEARS WHEN USER HAS TYPED SOMETHING */}
                {isCollegeDropdownOpen && regCollegeSearch.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-cardstock border border-ink/20 rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-1.5 space-y-1">
                    {matchingColleges.length > 0 ? (
                      matchingColleges.map((inst) => (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => {
                            setRegCollegeId(inst.id);
                            setRegCollegeSearch(inst.name);
                            setIsCollegeDropdownOpen(false);
                            if (inst.campuses && inst.campuses.length > 0) {
                              setRegCampus(inst.campuses[0]);
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer ${
                            regCollegeId === inst.id
                              ? "bg-marigold/15 text-ink font-bold border border-marigold/30"
                              : "hover:bg-surface text-ink-soft hover:text-ink"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-surface border border-ink/10 flex items-center justify-center shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-marigold" />
                            </div>
                            <div>
                              <p className="font-bold text-ink font-sans">{inst.name}</p>
                              <p className="text-[10px] text-ink-soft font-sans">@{inst.emailDomain} · Code: {inst.code}</p>
                            </div>
                          </div>
                          {regCollegeId === inst.id && <Check className="w-4 h-4 text-marigold shrink-0" />}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 bg-chili-soft border border-chili/30 rounded-xl text-xs text-chili space-y-1">
                        <div className="flex items-center gap-1.5 font-bold font-sans">
                          <AlertTriangle className="w-4 h-4 text-chili shrink-0" />
                          <span>Unregistered College / University</span>
                        </div>
                        <p className="text-[11px] text-ink-soft font-sans leading-relaxed">
                          "{regCollegeSearch}" is not registered on CampusBites. Please contact your college administrator to onboard your institution.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Campus Location - ONLY VISIBLE ONCE A REGISTERED COLLEGE IS SELECTED */}
              {selectedRegInstitution && regCollegeId ? (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-ink block text-[11px]">
                      Campus Location *
                    </label>
                    <span className="text-[10px] text-ink-soft">
                      {selectedRegInstitution.campuses.length} Campuses Available
                    </span>
                  </div>
                  <select
                    value={regCampus}
                    onChange={(e) => setRegCampus(e.target.value)}
                    className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-marigold font-bold cursor-pointer font-sans"
                  >
                    {(selectedRegInstitution.campuses || ["Central Campus"]).map((camp, idx) => (
                      <option key={idx} value={camp}>
                        {camp}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* 3. Official College Email ID / Staff ID (Clean Modern Typography) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-ink block text-[11px]">
                    Official College Email ID / Staff ID *
                  </label>
                  <span className="text-[10px] text-ink-soft font-bold">Students & Staff</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <User className="w-4 h-4 text-ink-soft absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => {
                        handleRegUsernameChange(e.target.value);
                        setRegAlreadyRegistered(false);
                      }}
                      placeholder="e.g. stevin.b or 21bcaf59"
                      className="w-full bg-surface border border-ink/15 rounded-xl pl-10 pr-3 py-2.5 text-xs text-ink focus:outline-none focus:border-marigold font-bold font-sans placeholder-ink-soft/60"
                    />
                  </div>
                  <span className={`text-xs font-sans font-black px-3 py-2.5 rounded-xl shrink-0 tracking-wide ${
                    selectedRegInstitution && regCollegeId
                      ? "text-marigold bg-marigold/10 border border-marigold/30"
                      : "text-ink-soft bg-surface border border-ink/15"
                  }`}>
                    {selectedRegInstitution && regCollegeId ? `@${selectedRegInstitution.emailDomain}` : "@select-college"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-ink-soft flex-wrap gap-1">
                  <span className="text-ink-soft font-medium">Enter only prefix before @</span>
                  <span className="inline-flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-lg border border-ink/10 text-[11px] font-sans font-bold text-ink">
                    <Mail className="w-3.5 h-3.5 text-marigold" />
                    <span>Official Login:</span>
                    {selectedRegInstitution && regCollegeId ? (
                      <span className="text-marigold font-black">{regUsername ? regUsername.toLowerCase() : "id"}@{selectedRegInstitution.emailDomain}</span>
                    ) : (
                      <span className="text-ink-soft font-normal italic">Select college above first</span>
                    )}
                  </span>
                </div>

                {/* Live validation feedback for Official ID / Register Number */}
                {selectedRegInstitution && regCollegeId && regUsername.trim().length >= 3 && regEmailValidation && (
                  <div className="pt-0.5 animate-in fade-in">
                    {regEmailValidation.valid ? (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Valid {regEmailValidation.type === "STUDENT" ? "Student Register No." : "Staff / Faculty Email ID"}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-chili font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{regEmailValidation.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Email OTP Verification with Wrong OTP Highlight & Spam Notice */}
              <div className="space-y-2 p-3.5 bg-cardstock-hover/40 rounded-2xl border border-ink/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-ink text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-marigold" />
                    <span>Email OTP Verification *</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendRegOtp}
                    disabled={isSendingRegOtp || regOtpCooldown > 0 || !regUsername.trim()}
                    className="px-3 py-1.5 rounded-lg bg-marigold hover:bg-marigold-hover disabled:bg-cardstock disabled:text-ink-soft text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSendingRegOtp ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Mailbox & Sending OTP...</span>
                      </>
                    ) : regOtpCooldown > 0 ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend in {regOtpCooldown}s</span>
                      </>
                    ) : isRegOtpSent ? (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend Code</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>Send Verification OTP</span>
                      </>
                    )}
                  </button>
                </div>

                {isRegOtpSent && (
                  <div className="space-y-2 animate-in fade-in">
                    {/* Spam Folder Alert Notice */}
                    <div className="p-2.5 rounded-xl bg-marigold/10 border border-marigold/30 text-xs text-ink space-y-0.5">
                      <p className="text-[11px] text-ink leading-relaxed font-sans">
                        📬 4-digit code sent to <strong className="text-marigold font-bold">{regUsername.toLowerCase()}@{selectedRegInstitution?.emailDomain}</strong>.
                      </p>
                      <p className="text-[11px] text-ink-soft font-sans">
                        👉 <strong className="text-ink font-bold">Kindly check your Spam / Junk folder</strong> if you do not see it in your inbox!
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={regOtp}
                        onChange={(e) => {
                          setRegOtp(e.target.value.trim());
                          setIsOtpInvalid(false);
                          setRegError(null);
                        }}
                        placeholder="Enter 4-Digit OTP Code"
                        className={`w-full bg-surface border rounded-xl px-4 py-2.5 text-xs text-ink font-sans font-black tracking-widest text-center focus:outline-none transition-all ${
                          isOtpInvalid 
                            ? "border-chili ring-2 ring-chili/30 bg-chili-soft/20 text-chili placeholder-chili/60" 
                            : "border-ink/15 focus:border-marigold"
                        }`}
                      />
                      {isOtpInvalid && (
                        <div className="p-2.5 rounded-xl bg-chili-soft border border-chili/40 text-chili text-xs font-bold flex items-center gap-2 animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>❌ Incorrect OTP code entered. Please re-check the 4 digits or click "Resend Code".</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Full Name */}
              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">Full Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Stevin Joseph B"
                  className="w-full bg-surface border border-ink/15 rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:border-marigold font-bold font-sans"
                />
              </div>

              {/* 6. Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-ink block text-[11px]">Password *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-surface border border-ink/15 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-ink focus:outline-none focus:border-marigold font-sans font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-3 text-ink-soft hover:text-ink cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-ink block text-[11px]">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? "text" : "password"}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-surface border border-ink/15 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-ink focus:outline-none focus:border-marigold font-sans font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-2.5 top-3 text-ink-soft hover:text-ink cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingReg}
                className="w-full bg-marigold hover:bg-marigold-hover active:scale-[0.99] py-3 text-xs font-black text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isSubmittingReg ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Account & Signing In...</span>
                  </div>
                ) : (
                  <>
                    <span>Create User Account & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FORGOT PASSWORD */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-cardstock border border-ink/20 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h2 className="text-base font-black text-ink flex items-center gap-2 font-display">
                  <KeyRound className="w-5 h-5 text-marigold" />
                  Reset Your Password
                </h2>
                <p className="text-[11px] text-ink-soft">Enter your register number or student email</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-ink-soft hover:text-ink font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-chili-soft border border-chili/30 text-chili text-xs font-bold flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">Select College</label>
                <select
                  value={resetCollegeId}
                  onChange={(e) => setResetCollegeId(e.target.value)}
                  className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink font-bold focus:outline-none focus:border-marigold"
                >
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">Register Number or Email *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={resetInput}
                    onChange={(e) => setResetInput(e.target.value)}
                    placeholder="e.g. 21bcaf59"
                    className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleSendResetOtp}
                    disabled={isSendingResetOtp}
                    className="px-3 py-2 bg-surface hover:bg-cardstock-hover border border-ink/15 rounded-xl text-[11px] font-bold text-marigold shrink-0"
                  >
                    {isSendingResetOtp ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">Verification OTP Code (Demo: 1234)</label>
                <input
                  type="text"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="Enter 4-digit OTP (e.g. 1234)"
                  className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">New Password *</label>
                <input
                  type="password"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReset}
                className="w-full bg-marigold hover:bg-marigold-hover py-3 text-xs font-black text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmittingReset ? "Updating Password..." : "Reset Password & Return to Login"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FIRST TIME VENDOR STALL PASSCODE SETUP */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-cardstock border border-ink/20 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h2 className="text-base font-black text-ink flex items-center gap-2 font-display">
                  <Store className="w-5 h-5 text-marigold" />
                  Stall Password Setup
                </h2>
                <p className="text-[11px] text-ink-soft">Create a permanent password for stall: {setupUsername}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="text-ink-soft hover:text-ink font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            {setupError && (
              <div className="p-3 rounded-xl bg-chili-soft border border-chili/30 text-chili text-xs font-bold">
                {setupError}
              </div>
            )}

            <form onSubmit={handleSetupVendorPassword} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">New Permanent Password *</label>
                <input
                  type="password"
                  required
                  value={setupNewPassword}
                  onChange={(e) => setSetupNewPassword(e.target.value)}
                  placeholder="Create strong stall password"
                  className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="Repeat permanent password"
                  className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingSetup}
                className="w-full bg-marigold hover:bg-marigold-hover py-3 text-xs font-black text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmittingSetup ? "Saving Password..." : "Save Password & Enter Kitchen"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULL SCREEN ANIMATED WELCOME LOADER */}
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
