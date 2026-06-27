import React, { useState } from "react";
import { addMoodLog, getUserProfile, saveUserProfile, addHighRiskAlert } from "../lib/dbService";
import { Smile, Frown, Meh, AlertTriangle, CheckCircle, Sparkles, BookOpen, Clock, Play, GraduationCap } from "lucide-react";

interface SmartJournalProps {
  userId: string;
  onLogSaved: (moodScore: number, streak: number) => void;
}

export default function SmartJournal({ userId, onLogSaved }: SmartJournalProps) {
  const [mood, setMood] = useState<number>(3);
  const [notes, setNotes] = useState("");
  const [sleep, setSleep] = useState<number>(7);
  const [study, setStudy] = useState<number>(4);
  const [screen, setScreen] = useState<number>(5);
  const [attendance, setAttendance] = useState<number>(85);
  const [tags, setTags] = useState<string[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const availableTags = ["exams", "placement", "homesick", "friendship", "health", "achievement", "lecture"];

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSaveLog = async () => {
    if (!notes.trim()) {
      alert("Please write a small reflection or journal entry before saving.");
      return;
    }

    setSaving(true);
    try {
      // 1. Trigger backend Sentiment Analysis & Burnout Prediction in parallel
      const sentimentPromise = fetch("/api/analyze-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const burnoutPromise = fetch("/api/predict-burnout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sleepHours: sleep,
          studyHours: study,
          screenTime: screen,
          attendance: attendance,
          moodScore: mood,
        }),
      });

      const [sentimentRes, burnoutRes] = await Promise.all([sentimentPromise, burnoutPromise]);
      const sentimentData = await sentimentRes.json();
      const burnoutData = await burnoutRes.json();

      // Determine final variables
      const calculatedBurnout = burnoutData.burnoutIndex;
      const parsedSentiment = sentimentData.sentiment;
      const reflectionText = sentimentData.reflection;

      // 2. Save log record into Firestore `moodLogs` collection
      const logData = {
        userId,
        score: mood,
        notes,
        sentiment: parsedSentiment,
        sleepHours: sleep,
        studyHours: study,
        screenTime: screen,
        attendance: attendance,
        burnoutIndex: calculatedBurnout,
        timestamp: new Date().toISOString(),
        tags,
      };

      await addMoodLog(logData);

      // 3. Update User profile streak & metrics
      const userData = await getUserProfile(userId);
      let currentStreak = 1;

      if (userData) {
        currentStreak = (userData.streak || 0) + 1;
        
        // Push any badges if streak grows
        const currentBadges = userData.badges || [];
        if (currentStreak >= 3 && !currentBadges.includes("Consistent Tracker")) {
          currentBadges.push("Consistent Tracker");
        }
        if (mood === 5 && !currentBadges.includes("Pure Zen")) {
          currentBadges.push("Pure Zen");
        }

        await saveUserProfile(userId, {
          ...userData,
          streak: currentStreak,
          badges: currentBadges,
        });
      }

      // If crisis sentiment detected, save a Counselor High Risk Alert automatically
      if (parsedSentiment === "crisis") {
        await addHighRiskAlert({
          userId,
          studentName: userData ? userData.name || "Anonymous Student" : "Anonymous Student",
          department: userData ? userData.department || "General" : "General",
          timestamp: new Date().toISOString(),
          severity: "critical",
          status: "pending",
          reason: "AI Journal Crisis Marker detected.",
          contextNotes: notes,
        });
      }

      setAnalysisResult({
        burnoutIndex: calculatedBurnout,
        riskLevel: burnoutData.riskLevel,
        sentiment: parsedSentiment,
        reflection: reflectionText,
        tips: burnoutData.tips,
      });

      // Notify parent component
      onLogSaved(mood, currentStreak);
    } catch (e) {
      console.error("Error creating mood log:", e);
      alert("Failed to analyze or save mood log.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNotes("");
    setTags([]);
    setAnalysisResult(null);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl text-slate-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
          <BookOpen size={20} />
        </div>
        <div>
          <h3 className="font-sans font-semibold text-lg text-white">Smart Journal & Burnout Predictor</h3>
          <p className="text-xs text-slate-400 font-mono">Real-time Sentiment & Burnout Index Calculation</p>
        </div>
      </div>

      {!analysisResult ? (
        <div className="space-y-4">
          {/* Mood Rating Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 font-mono uppercase tracking-wider">
              How are you feeling right now?
            </label>
            <div className="flex justify-between max-w-xs mx-auto">
              {[
                { val: 1, label: "Tired/Down", icon: Frown, color: "text-rose-400 bg-rose-500/15 border-rose-500/30 hover:bg-rose-500/25" },
                { val: 2, label: "Stressed", icon: Frown, color: "text-amber-400 bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25" },
                { val: 3, label: "Neutral", icon: Meh, color: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30 hover:bg-cyan-500/25" },
                { val: 4, label: "Good", icon: Smile, color: "text-green-400 bg-green-500/15 border-green-500/30 hover:bg-green-500/25" },
                { val: 5, label: "Excellent", icon: Smile, color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25" },
              ].map((m) => {
                const IconComp = m.icon;
                const isSelected = mood === m.val;
                return (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => setMood(m.val)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? "ring-2 ring-indigo-500 scale-105 bg-white/10 border-white/20 text-white font-bold"
                        : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <IconComp size={24} className={isSelected ? m.color.split(" ")[0] : "text-slate-400"} />
                    <span className="text-[10px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Sleep (Hrs)</label>
              <input
                type="number"
                min="0"
                max="24"
                value={sleep}
                onChange={(e) => setSleep(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Study (Hrs)</label>
              <input
                type="number"
                min="0"
                max="24"
                value={study}
                onChange={(e) => setStudy(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Screen Time</label>
              <input
                type="number"
                min="0"
                max="24"
                value={screen}
                onChange={(e) => setScreen(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Attendance %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={attendance}
                onChange={(e) => setAttendance(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Journal Input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5 font-mono uppercase tracking-wider">
              Journal Entry & Reflections
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was your day? Write about your exam schedules, placement anxiety, friendships, or homesickness..."
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 text-white placeholder:text-slate-500 rounded-2xl p-4 text-xs focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Category Tags */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5 font-mono uppercase tracking-wider">
              Associated Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all uppercase tracking-wider ${
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white font-bold"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveLog}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:bg-slate-800"
          >
            {saving ? (
              <>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                <span>Running Prediction Engine & Saving...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Submit & Run AI Diagnostic</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Analysis Results Cards */
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <CheckCircle className="text-indigo-400" size={20} />
            <span className="text-xs font-semibold text-indigo-200 font-sans">
              AI Wellness Report generated successfully.
            </span>
          </div>

          {/* Burnout Meter Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                Predicted Burnout Index
              </span>
              <div className="relative flex items-center justify-center mb-2">
                <svg className="w-24 h-24 transform -rotate-95">
                  <circle cx="48" cy="48" r="40" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={analysisResult.riskLevel === "high" ? "#ef4444" : analysisResult.riskLevel === "moderate" ? "#f59e0b" : "#10b981"}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * analysisResult.burnoutIndex) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-bold font-mono text-white">{analysisResult.burnoutIndex}%</span>
                  <span className="block text-[8px] font-mono font-bold uppercase text-slate-400">{analysisResult.riskLevel} Risk</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 max-w-xs">{analysisResult.reflection}</p>
            </div>

            {/* Sentiment analysis & recommendations */}
            <div className="bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/30 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold block mb-1">
                  Custom AI Recommendations
                </span>
                <ul className="space-y-2 mt-2">
                  {analysisResult.tips.map((tip: string, i: number) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-200 leading-relaxed font-sans">
                      <span className="text-indigo-400 font-bold font-mono shrink-0">{i + 1}.</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {analysisResult.sentiment === "crisis" && (
                <div className="bg-rose-500/15 text-rose-200 p-2.5 rounded-xl border border-rose-500/30 flex items-start gap-2 text-[11px] mt-4">
                  <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Severe stress marker.</span> We've prioritized an optional escalation alert for counselor guidance. Reach out to the Emergency SOS bubble on your dashboard.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetForm}
            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl font-semibold text-xs transition-all"
          >
            Create Another Journal Entry
          </button>
        </div>
      )}
    </div>
  );
}
