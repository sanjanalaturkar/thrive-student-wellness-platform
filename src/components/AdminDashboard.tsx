import { useState, useEffect } from "react";
import { subscribeHighRiskAlerts, resolveHighRiskAlert } from "../lib/dbService";
import { Shield, Users, Activity, Check, CheckCircle2, TrendingUp, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import { motion } from "motion/react";
import { HighRiskAlert } from "../types";

export default function AdminDashboard() {
  const [alerts, setAlerts] = useState<HighRiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");

  // Simulated heatmap data for department/years
  const heatmapData = [
    { department: "Computer Science", freshman: "Green", sophomore: "Yellow", junior: "Orange", senior: "Red" },
    { department: "Mechanical Eng", freshman: "Green", sophomore: "Green", junior: "Yellow", senior: "Orange" },
    { department: "Business School", freshman: "Green", sophomore: "Yellow", junior: "Yellow", senior: "Orange" },
    { department: "Humanities & Arts", freshman: "Green", sophomore: "Green", junior: "Green", senior: "Yellow" },
    { department: "Bio-Sciences", freshman: "Green", sophomore: "Yellow", junior: "Orange", senior: "Orange" },
  ];

  // Fetch High Risk Alerts in Real-time from Firestore
  useEffect(() => {
    const unsubscribe = subscribeHighRiskAlerts((fetchedAlerts) => {
      // Sort by critical severity and timestamp
      fetchedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAlerts(fetchedAlerts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resolveAlert = async (alertId: string) => {
    try {
      await resolveHighRiskAlert(alertId);
    } catch (e) {
      console.error("Error resolving alert:", e);
    }
  };

  const getHeatmapColor = (status: string) => {
    switch (status) {
      case "Red":
        return "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20";
      case "Orange":
        return "bg-orange-400 hover:bg-orange-500 text-white shadow-md shadow-orange-400/10";
      case "Yellow":
        return "bg-amber-300 hover:bg-amber-400 text-amber-950";
      case "Green":
      default:
        return "bg-emerald-400 hover:bg-emerald-500 text-white";
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  // Calculate analytics summaries
  const pendingCount = alerts.filter((a) => a.status === "pending").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" && a.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 text-white border border-white/10 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-300 font-mono bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 rounded-full uppercase tracking-wider">
            INSTITUTIONAL CONTROL
          </span>
          <h2 className="font-sans font-semibold text-2xl mt-3">Counsellor & Admin Portal</h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-lg font-sans">
            Early detection and preventive mental health analytics. Use heatmaps and AI-triggered alerts to proactively safeguard campus wellbeing.
          </p>
        </div>

        <div className="flex gap-4 font-mono">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[120px]">
            <span className="text-rose-400 text-[10px] uppercase font-bold block mb-1">Risk Triggers</span>
            <span className="text-2xl font-black text-rose-500">{pendingCount}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[120px]">
            <span className="text-yellow-400 text-[10px] uppercase font-bold block mb-1">Critical Priority</span>
            <span className="text-2xl font-black text-yellow-500">{criticalCount}</span>
          </div>
        </div>
      </div>

      {/* Grid Layout: Heatmap on left, alerts list on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Heatmap Section */}
        <div className="lg:col-span-7 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-base text-white">Campus Stress Heatmap</h3>
                  <p className="text-[10px] text-slate-400 font-mono font-bold">DEPARTMENT STRESS DISTRIBUTIONS</p>
                </div>
              </div>
              <TrendingUp size={16} className="text-indigo-400" />
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Real-time heat density of academic burnout indicators (Computer Science Seniors represent the highest stress pocket due to placement deadlines and final year submissions).
            </p>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2.5 font-bold text-slate-400 font-mono text-[10px] uppercase">Department</th>
                    <th className="py-2.5 font-bold text-slate-400 font-mono text-[10px] uppercase text-center">Freshman</th>
                    <th className="py-2.5 font-bold text-slate-400 font-mono text-[10px] uppercase text-center">Sophomore</th>
                    <th className="py-2.5 font-bold text-slate-400 font-mono text-[10px] uppercase text-center">Junior</th>
                    <th className="py-2.5 font-bold text-slate-400 font-mono text-[10px] uppercase text-center">Senior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {heatmapData.map((row) => (
                    <tr key={row.department} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-semibold text-white">{row.department}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-3 py-1.5 rounded-xl font-bold font-mono text-[9px] uppercase ${getHeatmapColor(row.freshman)}`}>
                          {row.freshman === "Green" ? "Low" : row.freshman}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-3 py-1.5 rounded-xl font-bold font-mono text-[9px] uppercase ${getHeatmapColor(row.sophomore)}`}>
                          {row.sophomore === "Yellow" ? "Mod" : row.sophomore}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-3 py-1.5 rounded-xl font-bold font-mono text-[9px] uppercase ${getHeatmapColor(row.junior)}`}>
                          {row.junior === "Orange" ? "High" : row.junior}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-3 py-1.5 rounded-xl font-bold font-mono text-[9px] uppercase ${getHeatmapColor(row.senior)}`}>
                          {row.senior === "Red" ? "Peak" : row.senior}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-6 grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
            <div className="border-r border-white/10">
              <span className="block font-bold text-emerald-400">LOW STRESS</span>
              <span className="text-slate-400">Stable, active, good sleep</span>
            </div>
            <div className="border-r border-white/10">
              <span className="block font-bold text-amber-400">MODERATE</span>
              <span className="text-slate-400">Climbing workloads</span>
            </div>
            <div>
              <span className="block font-bold text-rose-400">PEAK RISK</span>
              <span className="text-slate-400">Deadlines + sleep deficit</span>
            </div>
          </div>
        </div>

        {/* High Risk Alerts Pane Section */}
        <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col h-[460px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base text-white">High Risk Student Alerts</h3>
                <p className="text-[10px] text-slate-400 font-mono font-bold">SECURE COUNSELOR ACCESS</p>
              </div>
            </div>
            
            {/* Filter Pill switches */}
            <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-lg">
              <button
                onClick={() => setFilter("pending")}
                className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${
                  filter === "pending" ? "bg-white/10 text-white shadow-sm font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("resolved")}
                className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${
                  filter === "resolved" ? "bg-white/10 text-white shadow-sm font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* List of active triggers */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="h-full flex items-center justify-center font-mono text-xs text-slate-400">
                Loading campus firestore alerts...
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
                <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
                <span className="text-xs font-semibold">All quiet right now.</span>
                <span className="text-[10px] font-mono mt-0.5">No critical high-risk alerts detected.</span>
              </div>
            ) : (
              filteredAlerts.map((a) => (
                <div
                  key={a.alertId}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    a.status === "resolved"
                      ? "bg-white/5 border border-white/10 opacity-60"
                      : "bg-rose-500/5 border border-rose-500/20 shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {a.severity} RISK
                      </span>
                      <h4 className="text-xs font-bold text-white mt-2">{a.studentName}</h4>
                      <p className="text-[10px] font-mono text-slate-400">{a.department} • {a.status}</p>
                    </div>

                    {a.status === "pending" && (
                      <button
                        onClick={() => resolveAlert(a.alertId)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-md shadow-emerald-600/20"
                        title="Mark Resolved"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-2.5 bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="font-bold text-white block text-[10px] uppercase font-mono mb-1">Trigger Context:</span>
                    "{a.contextNotes}"
                  </p>
                  
                  <div className="text-[9px] text-slate-400 font-mono text-right mt-2">
                    Logged: {new Date(a.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
