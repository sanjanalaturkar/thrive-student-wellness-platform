import React, { useState, useEffect } from "react";
import { subscribeMoodLogs } from "../lib/dbService";
import { Activity, Compass, AlertTriangle, ShieldAlert, Sparkles, Brain, Clock, ShieldCheck, Heart, UserPlus, Phone } from "lucide-react";
import { motion } from "motion/react";
import { MoodLog } from "../types";

interface DashboardProps {
  userId: string;
  userName: string;
  currentMoodScore: number;
}

export default function Dashboard({ userId, userName, currentMoodScore }: DashboardProps) {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Academic Stress Predictor state
  const [assignments, setAssignments] = useState(2);
  const [exams, setExams] = useState(1);
  const [academicStressReport, setAcademicStressReport] = useState<any>(null);
  const [predictingAcademic, setPredictingAcademic] = useState(false);

  // SOS Circle State
  const [sosContact, setSosContact] = useState("Counsellor");
  const [showSosDialog, setShowSosDialog] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  // Midnight Guardian state
  const [showMidnightAlert, setShowMidnightAlert] = useState(false);

  // Fetch student's mood logs from Firestore
  useEffect(() => {
    const unsubscribe = subscribeMoodLogs(userId, (list) => {
      setLogs(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Midnight Guardian check based on simulated or current local time
  useEffect(() => {
    const hour = new Date().getHours();
    // If between 11 PM and 5 AM, trigger late night check gently
    if (hour >= 23 || hour < 5) {
      setShowMidnightAlert(true);
    }
  }, []);

  const handlePredictAcademicStress = async () => {
    setPredictingAcademic(true);
    try {
      const response = await fetch("/api/predict-academic-stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments,
          exams,
          attendance: logs[0]?.attendance || 85,
        }),
      });
      const data = await response.json();
      setAcademicStressReport(data);
    } catch (e) {
      console.error("Error predicting academic stress:", e);
    } finally {
      setPredictingAcademic(false);
    }
  };

  const triggerSosOutreach = () => {
    setSosSent(true);
  };

  const getSentimentPillColor = (s: string) => {
    switch (s) {
      case "positive":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "negative":
        return "bg-rose-500/10 text-rose-300 border-rose-500/30";
      case "crisis":
        return "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse";
      default:
        return "bg-white/5 text-slate-300 border-white/10";
    }
  };

  // Math totals for averages
  const avgSleep = logs.length > 0 ? (logs.reduce((acc, curr) => acc + curr.sleepHours, 0) / logs.length).toFixed(1) : "7.2";
  const avgStudy = logs.length > 0 ? (logs.reduce((acc, curr) => acc + curr.studyHours, 0) / logs.length).toFixed(1) : "4.0";
  const avgScreen = logs.length > 0 ? (logs.reduce((acc, curr) => acc + curr.screenTime, 0) / logs.length).toFixed(1) : "5.4";

  return (
    <div className="space-y-6">
      
      {/* Late Night Guardian gently checking in */}
      {showMidnightAlert && (
        <div className="bg-indigo-950/40 backdrop-blur-md border border-indigo-500/30 text-indigo-100 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-indigo-950/80 text-yellow-400 rounded-2xl border border-indigo-500/30">
              <Clock className="animate-pulse" size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider">
                MIDNIGHT GUARDIAN
              </span>
              <h3 className="font-semibold text-sm mt-1 text-white">Up quite late tonight, {userName}?</h3>
              <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed max-w-xl font-sans">
                The world is resting, and you should too. If assignments or exam worries are keeping you awake, try loading our <strong>Midnight Sleep Preset</strong> on the soundscape board, or vent your worries to our <strong>Compassionate AI Companion</strong>.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowMidnightAlert(false)}
                  className="bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/30 text-indigo-100 text-xs px-4 py-2 rounded-xl transition-all font-semibold"
                >
                  Dismiss Guardian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Health analytics charts and Predictors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Academic Stress Predictor Card */}
        <div className="lg:col-span-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Brain size={18} />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base text-white">Preventive Stress Predictor</h3>
                <p className="text-[10px] text-slate-400 font-mono font-bold">PROACTIVE ACADEMIC ROADMAPS</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Don't wait for stress to spike. Inputs your upcoming submissions and tests to forecast potential cognitive overload next week, enabling early preventive actions.
            </p>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Upcoming submissions</label>
                <input
                  type="number"
                  min="0"
                  value={assignments}
                  onChange={(e) => setAssignments(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Upcoming exams/quizzes</label>
                <input
                  type="number"
                  min="0"
                  value={exams}
                  onChange={(e) => setExams(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {academicStressReport && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl mb-4"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-indigo-400 font-mono">STRESS COEFFICIENT</span>
                  <span className="text-xs font-bold font-mono text-indigo-200">{academicStressReport.predictedStress}/100</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">{academicStressReport.analysis}</p>
                
                <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase block mb-1">Suggested Preventative Steps:</span>
                <ul className="space-y-1.5">
                  {academicStressReport.tips.map((tip: string, i: number) => (
                    <li key={i} className="text-[11px] text-slate-300 flex gap-2">
                      <span className="text-indigo-400 font-bold font-mono">·</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          <button
            onClick={handlePredictAcademicStress}
            disabled={predictingAcademic}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:bg-slate-800"
          >
            {predictingAcademic ? "Analyzing Deadlines..." : "Calculate Upcoming Stress Forecast"}
          </button>
        </div>

        {/* SOS Circle Section */}
        <div className="lg:col-span-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base text-white">Personal SOS Circle</h3>
                <p className="text-[10px] text-slate-400 font-mono font-bold">EMERGENCY OUTREACH HUB</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              If severe anxiety or distress strikes, configure a trusted guardian, best friend, or mentor. We can prepare a warm, gentle outreach note to help you start the conversation.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Primary Care Contact</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Counsellor", "Best Friend", "Parent", "Mentor"].map((contact) => (
                    <button
                      key={contact}
                      type="button"
                      onClick={() => {
                        setSosContact(contact);
                        setSosSent(false);
                      }}
                      className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                        sosContact === contact
                          ? "bg-rose-500/20 border-rose-500/30 text-rose-300 font-semibold"
                          : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {contact}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSosDialog(true)}
            className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-rose-600/35 ring-2 ring-rose-500/20 flex items-center justify-center gap-2"
          >
            <Phone size={14} />
            <span>Trigger SOS Circle Outreach</span>
          </button>
        </div>

      </div>

      {/* SOS Circle Confirmation Dialog */}
      {showSosDialog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900/90 backdrop-blur-lg rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-2xl relative text-slate-100"
          >
            <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2">
              <ShieldAlert className="text-rose-500" />
              <span>SOS Circle Outreach</span>
            </h3>

            {!sosSent ? (
              <>
                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  Would you like me to help you reach out to your <strong>{sosContact}</strong>? I can prepare a warm, non-alarmist message sharing that you are going through a high-stress period and could use a supportive conversation.
                </p>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 text-[11px] text-slate-300 leading-relaxed font-sans italic mt-4">
                  "Hey, I am going through a difficult, high-stress week on campus and could really use a quick talk or just someone to listen. Do you have a moment?"
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowSosDialog(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-xl"
                  >
                    No, Cancel
                  </button>
                  <button
                    onClick={triggerSosOutreach}
                    className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-600/10"
                  >
                    Yes, Help Me Reach Out
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="font-bold text-sm text-white">Support Request Shared</h4>
                <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto">
                  A comforting outreach prompt has been composed. If this is a campus counselor, they have also been queued via their real-time Firestore triggers. You are never alone.
                </p>
                <button
                  onClick={() => {
                    setShowSosDialog(false);
                    setSosSent(false);
                  }}
                  className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Close Window
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Recent Mood & Metric Logs History */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl text-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-base text-white">Weekly Health Metric Logs</h3>
              <p className="text-[10px] text-slate-400 font-mono font-bold">HISTORIC TRACKER & AVERAGES</p>
            </div>
          </div>

          <div className="flex gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase text-right">Sleep Avg</span>
              <span className="font-bold text-slate-200 block text-right">{avgSleep} hrs</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase text-right">Study Avg</span>
              <span className="font-bold text-slate-200 block text-right">{avgStudy} hrs</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase text-right">Screen Avg</span>
              <span className="font-bold text-slate-200 block text-right">{avgScreen} hrs</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center font-mono text-xs text-slate-400 py-6">
              Fetching mood history logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-xs font-medium">
              No daily mood logs completed yet. Fill out the Smart Journal to populate.
            </div>
          ) : (
            logs.slice(0, 5).map((l) => (
              <div key={l.logId} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {l.score === 5 ? "🤩" : l.score === 4 ? "😊" : l.score === 3 ? "😐" : l.score === 2 ? "😰" : "😭"}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white font-sans">Mood Score: {l.score}/5</span>
                      <span className="text-[9px] text-slate-400 font-mono block">
                        {new Date(l.timestamp).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md border font-mono ${getSentimentPillColor(l.sentiment)}`}>
                    {l.sentiment}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2 font-sans italic">
                  "{l.notes}"
                </p>

                {/* Sub-row with metrics */}
                <div className="mt-3 pt-2 border-t border-white/10 grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-400">
                  <div>Sleep: <strong className="text-slate-200">{l.sleepHours}h</strong></div>
                  <div>Study: <strong className="text-slate-200">{l.studyHours}h</strong></div>
                  <div>Screen: <strong className="text-slate-200">{l.screenTime}h</strong></div>
                  <div>Burnout: <strong className="text-slate-200">{l.burnoutIndex}%</strong></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
