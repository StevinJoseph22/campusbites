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
  Info
} from "lucide-react";
import { PageLoader } from "@/components/PageLoader";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const [regCollegeId, setRegCollegeId] = useState("kju");
  const [regUsername, setRegUsername] = useState("");
  const [regName, setRegName] = useState("");
  const [regCampus, setRegCampus] = useState("Central Campus");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [isRegOtpSent, setIsRegOtpSent] = useState(false);
  const [isSendingRegOtp, setIsSendingRegOtp] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

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
  const selectedRegInstitution = institutions.find(i => i.id === regCollegeId) || institutions[0];
  useEffect(() => {
    if (selectedRegInstitution && selectedRegInstitution.campuses && selectedRegInstitution.campuses.length > 0) {
      setRegCampus(selectedRegInstitution.campuses[0]);
    }
  }, [regCollegeId, institutions]);

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
      const instName = user.institution?.name || (instId === "kju" ? "Kristu Jayanti University" : "Campus");
      const userDisplayName = user.name || user.username;

      // Save user session in localStorage
      localStorage.setItem("campusbites_user_role", userRole);
      localStorage.setItem("campusbites_user_name", userDisplayName);
      localStorage.setItem("campusbites_user_phone", user.email || user.username);
      localStorage.setItem("campusbites_student_reg", user.username);
      localStorage.setItem("campusbites_student_campus", user.campus || "Central Campus");
      localStorage.setItem("campusbites_selected_institution", instId);
      localStorage.setItem("campusbites_institution_name", instName);

      if (userRole === "VENDOR") {
        const stallId = user.restaurant?.id || (user.email ? user.email.split("@")[0] : user.username);
        localStorage.setItem("campusbites_active_vendor_id", stallId);
        if (user.restaurant) {
          localStorage.setItem("campusbites_active_vendor_data", JSON.stringify(user.restaurant));
        }
      }

      // Smart Role-Based Welcome Screen & Redirection
      if (userRole === "SUPER_ADMIN") {
        setLoadingState({
          active: true,
          message: "Welcome Super Admin! 🛡️",
          submessage: "Loading Multi-College SaaS Control Center...",
          type: "auth"
        });
        setTimeout(() => router.push("/admin"), 1000);
      } else if (userRole === "ADMIN") {
        setLoadingState({
          active: true,
          message: `Welcome ${instName} Admin! 🏛️`,
          submessage: "Loading University Administration Dashboard...",
          type: "auth"
        });
        setTimeout(() => router.push("/admin"), 1000);
      } else if (userRole === "VENDOR") {
        setLoadingState({
          active: true,
          message: `Welcome ${userDisplayName}! 🍳`,
          submessage: "Loading Kitchen Order Terminal & Menu...",
          type: "auth"
        });
        setTimeout(() => router.push("/vendor/dashboard"), 1000);
      } else {
        // STUDENT
        setLoadingState({
          active: true,
          message: `Welcome ${userDisplayName}! 🎓`,
          submessage: `Loading ${instName} Canteen Hub...`,
          type: "auth"
        });
        setTimeout(() => router.push("/student/dashboard"), 1000);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Network or connection error. Please try again.");
    }
  };

  // SEND REGISTRATION OTP
  const handleSendRegOtp = async () => {
    if (!regUsername.trim()) {
      setRegError("Please enter your Register Number or Student ID first.");
      return;
    }
    setIsSendingRegOtp(true);
    setRegError(null);
    setRegSuccess(null);

    const emailDomain = selectedRegInstitution.emailDomain;
    const cleanReg = regUsername.includes("@") ? regUsername.split("@")[0].trim() : regUsername.trim();
    const targetEmail = `${cleanReg.toLowerCase()}@${emailDomain}`;

    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      setIsSendingRegOtp(false);

      if (data.success) {
        setIsRegOtpSent(true);
        setRegSuccess(`✓ OTP code generated for ${targetEmail}. (Check inbox or use default demo 1234)`);
      } else {
        setRegError(data.error || "Failed to send OTP email.");
      }
    } catch (e: any) {
      setIsSendingRegOtp(false);
      setRegError("Failed to generate OTP. You can proceed with password creation.");
    }
  };

  // SUBMIT REGISTER NEW USERS
  const handleRegisterNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword.trim()) {
      setRegError("Please fill in all required fields.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match.");
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
          otp: regOtp.trim() || "1234",
          campus: regCampus,
          institutionId: regCollegeId,
          role: "STUDENT"
        })
      });

      const data = await res.json();
      setIsSubmittingReg(false);

      if (data.success) {
        setShowRegisterModal(false);
        setSuccessMessage(`✓ Account created successfully for ${regUsername}! Signing you in...`);
        
        // Auto-login newly registered student
        const user = data.user;
        localStorage.setItem("campusbites_user_role", "STUDENT");
        localStorage.setItem("campusbites_user_name", user.name || user.username);
        localStorage.setItem("campusbites_user_phone", user.email);
        localStorage.setItem("campusbites_student_reg", user.username);
        localStorage.setItem("campusbites_student_campus", user.campus || regCampus);
        localStorage.setItem("campusbites_selected_institution", regCollegeId);
        localStorage.setItem("campusbites_institution_name", selectedRegInstitution.name);

        setLoadingState({
          active: true,
          message: `Welcome ${user.name || user.username}! 🎓`,
          submessage: `Loading ${selectedRegInstitution.name} Canteen Hub...`,
          type: "auth"
        });
        setTimeout(() => router.push("/student/dashboard"), 1000);
      } else {
        setRegError(data.error || "Failed to register user.");
      }
    } catch (e: any) {
      setIsSubmittingReg(false);
      setRegError("Registration error: " + e.message);
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
        setResetSuccess(`✓ OTP code generated for ${cleanId}. (Default demo code: 1234)`);
      } else {
        setResetError(data.error || "Failed to send reset OTP.");
      }
    } catch (e: any) {
      setIsSendingResetOtp(false);
      setResetError("Failed to send OTP. You may use demo code 1234.");
    }
  };

  // SUBMIT PASSWORD RESET
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetInput.trim() || !resetPassword.trim()) {
      setResetError("Please fill in all required fields.");
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
          otp: resetOtp.trim() || "1234",
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
        setResetError(data.error || "Failed to reset password.");
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
                  className="text-[11px] font-bold text-marigold hover:underline"
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-ink-soft hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
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
                setShowRegisterModal(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-surface hover:bg-cardstock-hover border border-ink/15 text-xs font-bold text-ink transition-colors flex items-center justify-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4 text-marigold" />
              <span>Register New Users →</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-ink-soft">
          Protected by CampusBites Universal Multi-College Auth &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* MODAL: REGISTER NEW USERS */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-cardstock border border-ink/20 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h2 className="text-base font-black text-ink flex items-center gap-2 font-display">
                  <GraduationCap className="w-5 h-5 text-marigold" />
                  Register New User Account
                </h2>
                <p className="text-[11px] text-ink-soft">
                  Create your student profile and access your college canteens
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-ink-soft hover:text-ink font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-chili-soft border border-chili/30 text-chili text-xs font-bold flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterNewUser} className="space-y-3.5 text-xs">
              {/* College Selection */}
              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">Select Your College / University *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-marigold absolute left-3 top-2.5" />
                  <select
                    value={regCollegeId}
                    onChange={(e) => setRegCollegeId(e.target.value)}
                    className="w-full bg-surface border border-ink/15 rounded-xl pl-9 pr-8 py-2 text-xs text-ink font-bold focus:outline-none focus:border-marigold"
                  >
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} (@{inst.emailDomain})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-soft absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Campus Location */}
              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">Campus Location *</label>
                <select
                  value={regCampus}
                  onChange={(e) => setRegCampus(e.target.value)}
                  className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold font-bold"
                >
                  {(selectedRegInstitution.campuses || ["Central Campus"]).map((camp, idx) => (
                    <option key={idx} value={camp}>
                      {camp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Register Number / Student ID */}
              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">Student Register Number *</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <User className="w-4 h-4 text-ink-soft absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. 21bcaf59 or 24mca102"
                      className="w-full bg-surface border border-ink/15 rounded-xl pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold font-mono font-bold"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-ink-soft bg-surface border border-ink/10 px-2.5 py-2 rounded-xl">
                    @{selectedRegInstitution.emailDomain}
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-extrabold text-ink block text-[11px]">Full Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-ink block text-[11px]">Password *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-ink block text-[11px]">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-surface border border-ink/15 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-marigold"
                  />
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
                    <span>Registering Account...</span>
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
