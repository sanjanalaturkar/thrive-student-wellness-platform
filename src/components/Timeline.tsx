import { useState } from "react";
import { GitCommit, TrendingUp, Calendar, Sparkles, Smile, MessageSquare, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

export default function Timeline() {
  const [selectedMonth, setSelectedMonth] = useState("April");

  // Growth journey timeline data
  const journey = [
    {
      month: "January",
      moodLabel: "Motivated & Driven",
      moodScore: 4.2,
      burnoutIndex: 25,
      description: "Began the semester with clear morning routines, high attendance, and fresh energy. Kept stress levels in check through focus audio chimes.",
      milestone: "🏆 Cleared 'Daily Routine' Streak of 14 Days",
      tags: ["#goals", "#morningFlow", "#focus"]
    },
    {
      month: "February",
      moodLabel: "Exam Stress Peaks",
      moodScore: 2.8,
      burnoutIndex: 65,
      description: "Midterms piled up. Sleep average fell to 5.2 hours. Used Buddy Match to share exam concerns with 81 matching students.",
      milestone: "🤝 Linked up with an Anonymous Exam prep buddy",
      tags: ["#midterms", "#allNighters", "#resilience"]
    },
    {
      month: "March",
      moodLabel: "Critical Burnout Signs",
      moodScore: 1.9,
      burnoutIndex: 82,
      description: "Experienced academic withdrawal. Attendance dropped to 72%. AI Counselor successfully triggered a custom 'No-Study restorative weekend'.",
      milestone: "🌲 Completed 10 Hours of Focus Soundscape Therapy",
      tags: ["#burnoutAlert", "#restoration", "#selfCare"]
    },
    {
      month: "April",
      moodLabel: "Recovery & Steady Mind",
      moodScore: 3.9,
      burnoutIndex: 38,
      description: "Successfully recovered stable sleep rhythms and mood levels. Re-established class attendance to 88% and felt stronger mental stamina.",
      milestone: "🌱 Plant grew into a fully flowering 'Thriving Orchid'",
      tags: ["#recovery", "#balance", "#mindfulness"]
    }
  ];

  const activeData = journey.find((j) => j.month === selectedMonth) || journey[3];

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl text-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
          <Calendar size={20} />
        </div>
        <div>
          <h3 className="font-sans font-semibold text-lg text-white">My Emotional Journey</h3>
          <p className="text-xs text-slate-400 font-mono">Dynamic Academic Life Timeline</p>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-6 leading-relaxed">
        Trace your historical mental wellness milestones. Click on any past semester phase below to observe your growth, stress adjustments, and key victories.
      </p>

      {/* Timeline Nav Bar (Months/Phases) */}
      <div className="relative flex justify-between items-center mb-6 px-2">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
        {journey.map((phase) => {
          const isSelected = selectedMonth === phase.month;
          return (
            <button
              key={phase.month}
              onClick={() => setSelectedMonth(phase.month)}
              className="relative z-10 flex flex-col items-center group cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-500 text-white scale-110 shadow-md shadow-indigo-600/25"
                    : "bg-slate-900 border-white/10 text-slate-400 group-hover:border-white/20 group-hover:text-white"
                }`}
              >
                <GitCommit size={14} />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider font-mono mt-2 transition-all ${
                  isSelected ? "text-indigo-400 font-extrabold scale-105" : "text-slate-400"
                }`}
              >
                {phase.month}
              </span>
            </button>
          );
        })}
      </div>

      {/* Month detail pane card */}
      <motion.div
        key={selectedMonth}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-5"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3 mb-4">
          <div>
            <span className="text-[10px] font-bold text-indigo-300 font-mono bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {activeData.moodLabel}
            </span>
            <h4 className="text-base font-bold text-white mt-1.5">{activeData.month} Journey Node</h4>
          </div>
          
          <div className="flex gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Avg Mood</span>
              <span className="font-bold text-white">{activeData.moodScore}/5.0</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Burnout Index</span>
              <span className="font-bold text-white">{activeData.burnoutIndex}%</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-sans mb-4">
          {activeData.description}
        </p>

        {/* Milestone Callout */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 mb-3 flex items-center gap-2 text-indigo-200 font-medium text-xs font-sans">
          <Sparkles size={14} className="text-indigo-400 animate-pulse" />
          <span>{activeData.milestone}</span>
        </div>

        {/* Tags list */}
        <div className="flex gap-1.5 flex-wrap">
          {activeData.tags.map((t) => (
            <span key={t} className="text-[10px] font-mono text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
              {t}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
