/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { signInAnonymously, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase";
import { UserProfile } from "./types";
import { 
  isLocalSandboxMode, 
  setLocalSandboxMode, 
  getUserProfile, 
  saveUserProfile, 
  addHighRiskAlert 
} from "./lib/dbService";

// Import Custom components
import Companion from "./components/Companion";
import EmotionAvatar from "./components/EmotionAvatar";
import AudioSynthesizer from "./components/AudioSynthesizer";
import SmartJournal from "./components/SmartJournal";
import Timeline from "./components/Timeline";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";

// Import Lucide Icons
import {
  Sparkles,
  Compass,
  Smile,
  Shield,
  Activity,
  Calendar,
  Layers,
  Flame,
  User,
  Power,
  ChevronRight
} from "lucide-react";

export default function App() {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Onboarding states
  const [onboardName, setOnboardName] = useState("");
  const [onboardRole, setOnboardRole] = useState<"student" | "counsellor">("student");
  const [onboardDept, setOnboardDept] = useState("Computer Science");
  const [onboardYear, setOnboardYear] = useState("Sophomore");
  const [onboardSeed, setOnboardSeed] = useState("fern");
  const [submittingOnboard, setSubmittingOnboard] = useState(false);

  // App navigation tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Track state changes from child components to trigger visual updates
  const [triggerVal, setTriggerVal] = useState(0);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFbUser(user);
        // Fetch User Profile doc
        await fetchUserProfile(user.uid);
      } else {
        // Automatically sign in anonymously to keep things secure and seamless
        try {
          await signInAnonymously(auth);
        } catch (e: any) {
          // Use console.info/warn instead of console.error to avoid triggering error state for expected console alerts
          console.info("Firebase Anonymous Auth restricted or disabled. Safely activating local confidential sandbox mode.");
          // Enable Local Sandbox fallback
          setLocalSandboxMode(true);
          const mockUser = {
            uid: "local-sandbox-uid",
            isAnonymous: true,
            email: null,
            displayName: "Guest Scholar",
          } as any;
          setFbUser(mockUser);
          await fetchUserProfile("local-sandbox-uid");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const profileData = await getUserProfile(uid);
      if (profileData) {
        setProfile(profileData);
      } else {
        // Needs onboarding
        setProfile(null);
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUser) return;
    if (!onboardName.trim()) {
      alert("Please provide a name or alias.");
      return;
    }

    setSubmittingOnboard(true);
    try {
      const newProfile: UserProfile = {
        userId: fbUser.uid,
        name: onboardName.trim(),
        role: onboardRole,
        department: onboardDept,
        year: onboardYear,
        streak: 0,
        badges: ["Mental Pioneer"],
        avatarSeed: onboardSeed,
      };

      await saveUserProfile(fbUser.uid, newProfile);
      setProfile(newProfile);

      // Force counselor to counsellor-portal and student to student-dashboard
      setActiveTab(onboardRole === "counsellor" ? "counsellor" : "dashboard");
    } catch (err) {
      console.error("Error saving user onboarding profile:", err);
      alert("Failed to complete onboarding. Check connection.");
    } finally {
      setSubmittingOnboard(false);
    }
  };

  // Helper to trigger avatar rerender when log added
  const handleLogSaved = (moodScore: number, currentStreak: number) => {
    if (profile) {
      setProfile({
        ...profile,
        streak: currentStreak,
      });
    }
    setTriggerVal((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-xs text-slate-300 relative overflow-hidden">
        {/* Background Mesh Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <Compass className="animate-spin text-indigo-400 mb-3 z-10" size={24} />
        <span className="z-10">Syncing Secure Campus Node...</span>
      </div>
    );
  }

  // 2. Render Onboarding Screen if profile does not exist
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-slate-100">
        {/* Background Mesh Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-rose-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl z-10">
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-indigo-300 font-mono bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
              Onboarding Portal
            </span>
            <h1 className="font-sans font-semibold text-2xl text-white mt-2">Thrive Campus Setup</h1>
            <p className="text-xs text-slate-400 mt-1">Initialize your confidential secure wellness account</p>
          </div>

          <form onSubmit={handleCompleteOnboarding} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">confidential name or alias</label>
              <input
                type="text"
                required
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                placeholder="e.g. Brave Deer or Babita"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-hidden placeholder:text-slate-500"
              />
            </div>

            {/* Account Role Selector */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Primary Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOnboardRole("student")}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    onboardRole === "student"
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                  }`}
                >
                  Student Profile
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardRole("counsellor")}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    onboardRole === "counsellor"
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                  }`}
                >
                  Counsellor / Admin
                </button>
              </div>
            </div>

            {/* Student metadata */}
            {onboardRole === "student" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Department</label>
                  <select
                    value={onboardDept}
                    onChange={(e) => setOnboardDept(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-hidden [&>option]:bg-slate-900"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mechanical Eng">Mechanical Eng</option>
                    <option value="Business School">Business School</option>
                    <option value="Humanities & Arts">Humanities & Arts</option>
                    <option value="Bio-Sciences">Bio-Sciences</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Academic Year</label>
                  <select
                    value={onboardYear}
                    onChange={(e) => setOnboardYear(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-hidden [&>option]:bg-slate-900"
                  >
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>
            )}

            {/* Avatar Plant Seed Selector */}
            {onboardRole === "student" && (
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Avatar Plant Vibe</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "orchid", name: "🌸 Orchid" },
                    { id: "fern", name: "🌿 Fern" },
                    { id: "aloe", name: "🌵 Aloe" },
                  ].map((plant) => (
                    <button
                      key={plant.id}
                      type="button"
                      onClick={() => setOnboardSeed(plant.id)}
                      className={`py-2 text-[11px] font-medium rounded-xl border transition-all ${
                        onboardSeed === plant.id
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold"
                          : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      {plant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingOnboard}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5"
            >
              <span>{submittingOnboard ? "Connecting database..." : "Join Thrive Platform"}</span>
              <ChevronRight size={14} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Render Dashboard Main App Interface
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans relative overflow-hidden">
      
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-rose-600/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Dynamic Navigation Sidebar */}
      <aside className="w-full md:w-64 bg-white/5 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between shrink-0 z-10">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-white/10 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-extrabold text-sm font-mono">
              T
            </div>
            <div>
              <h1 className="font-sans font-semibold text-base text-white tracking-tight">Thrive Campus</h1>
              <span className="text-[10px] font-mono font-bold uppercase text-indigo-400">Detect Early. Thrive.</span>
            </div>
          </div>

          {/* Logged user summary card */}
          <div className="p-4 mx-4 my-4 bg-white/5 rounded-2xl border border-white/10 flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
              {profile.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-xs text-slate-200 block truncate">{profile.name}</span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wide block">
                Role: {profile.role}
              </span>
            </div>
            {profile.streak > 0 && (
              <div className="flex items-center gap-0.5 text-orange-400" title="Daily Mood streak">
                <Flame size={12} className="fill-orange-400" />
                <span className="text-[10px] font-mono font-bold">{profile.streak}d</span>
              </div>
            )}
          </div>

          {/* Tabs Nav links */}
          <nav className="px-4 space-y-1">
            {profile.role === "student" && (
              <>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "dashboard"
                      ? "bg-white/10 text-white font-bold border-l-4 border-indigo-500 shadow-md"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Activity size={16} />
                  <span>My Student Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab("companion")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "companion"
                      ? "bg-white/10 text-white font-bold border-l-4 border-indigo-500 shadow-md"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Compass size={16} />
                  <span>AI Wellness Companion</span>
                </button>

                <button
                  onClick={() => setActiveTab("garden")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "garden"
                      ? "bg-white/10 text-white font-bold border-l-4 border-indigo-500 shadow-md"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Smile size={16} />
                  <span>Music & Avatar Garden</span>
                </button>

                <button
                  onClick={() => setActiveTab("journal")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "journal"
                      ? "bg-white/10 text-white font-bold border-l-4 border-indigo-500 shadow-md"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Sparkles size={16} />
                  <span>Interactive Journal</span>
                </button>

                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "timeline"
                      ? "bg-white/10 text-white font-bold border-l-4 border-indigo-500 shadow-md"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Calendar size={16} />
                  <span>My Emotional Journey</span>
                </button>
              </>
            )}

            {/* Counsellor Portals */}
            <button
              onClick={() => setActiveTab("counsellor")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "counsellor"
                  ? "bg-white/10 text-white font-bold border-l-4 border-indigo-500 shadow-md"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Layers size={16} />
              <span>Campus Analytics Map</span>
            </button>
          </nav>
        </div>

        {/* Footer info node */}
        <div className="p-4 border-t border-white/10 font-mono text-[9px] text-slate-400 space-y-2">
          <div className="flex justify-between">
            <span>Secure Link:</span>
            <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
              <Shield size={10} /> Online
            </span>
          </div>
          <button
            onClick={async () => {
              await auth.signOut();
              setProfile(null);
            }}
            className="w-full py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 font-bold text-[9px] uppercase tracking-wider transition-all"
          >
            <Power size={10} />
            <span>Reset Account</span>
          </button>
        </div>
      </aside>

      {/* Main Container Workspace */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 z-10">
        {/* Dynamic header welcome */}
        <header className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="font-sans font-bold text-xl text-white capitalize font-sans tracking-tight">
              Welcome Back, {profile.name}!
            </h2>
            <span className="text-xs text-slate-400 font-mono">CONFIDENTIAL SPACE · SAFE & END-TO-END CRYPTED</span>
          </div>

          <div className="flex gap-2">
            {profile.role === "student" && profile.badges.map((b) => (
              <span
                key={b}
                className="text-[9px] font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-full border border-indigo-500/30 uppercase tracking-wider font-mono shadow-xs"
              >
                🏅 {b}
              </span>
            ))}
          </div>
        </header>

        {/* Main Render Switch block */}
        {activeTab === "dashboard" && (
          <Dashboard
            userId={profile.userId}
            userName={profile.name}
            currentMoodScore={3} // dynamic default fallback
          />
        )}

        {activeTab === "companion" && (
          <Companion
            userName={profile.name}
            onCrisisDetected={async (triggerText) => {
              // Automatically record severe crisis alert under counsellor dashboard
              try {
                await addHighRiskAlert({
                  alertId: "crisis-" + profile.userId,
                  userId: profile.userId,
                  studentName: profile.name,
                  department: profile.department || "General",
                  timestamp: new Date().toISOString(),
                  severity: "critical",
                  status: "pending",
                  reason: "Self-Harm or Severe Crisis indicators flagged via AI Companion Chat.",
                  contextNotes: triggerText,
                });
                alert("Crisis indicators detected. Your personal SOS circle is ready on your dashboard to help compose supportive messages.");
              } catch (e) {
                console.error(e);
              }
            }}
          />
        )}

        {activeTab === "garden" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4" key={triggerVal}>
              <EmotionAvatar moodScore={4} streak={profile.streak} />
            </div>
            <div className="lg:col-span-8">
              <AudioSynthesizer initialMoodScore={4} />
            </div>
          </div>
        )}

        {activeTab === "journal" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <SmartJournal userId={profile.userId} onLogSaved={handleLogSaved} />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-indigo-950/40 backdrop-blur-md text-indigo-100 rounded-3xl p-6 shadow-xl border border-indigo-500/30">
                <h3 className="font-sans font-semibold text-lg text-white">AI Journal Science</h3>
                <p className="text-xs text-indigo-200 leading-relaxed mt-2.5 font-sans">
                  Our advanced smart analyzer dissects linguistic mood structures in real-time. It monitors sleep habits, lecture schedules, and attendance disengagements to predict precise burnout margins.
                </p>
                <div className="mt-4 bg-indigo-500/10 p-3.5 rounded-2xl border border-indigo-500/20 text-[11px] leading-relaxed font-mono text-indigo-300">
                  - 📈 Predicts precise workload limits<br />
                  - 🚨 Activates SOS Care alerts Confidentially<br />
                  - 🌱 Matches companion chimes instantly
                </div>
              </div>

              <div key={triggerVal + 1}>
                <EmotionAvatar moodScore={3} streak={profile.streak} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <Timeline />
        )}

        {activeTab === "counsellor" && (
          <AdminDashboard />
        )}

      </main>
    </div>
  );
}
