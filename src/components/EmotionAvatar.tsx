import { motion } from "motion/react";
import { Leaf, Flame, Sparkles, Heart, Droplets } from "lucide-react";

interface EmotionAvatarProps {
  moodScore: number; // 1 to 5
  streak: number;
}

export default function EmotionAvatar({ moodScore, streak }: EmotionAvatarProps) {
  // Get plant status details based on moodScore
  const getPlantState = () => {
    switch (moodScore) {
      case 5:
        return {
          title: "Thriving Orchid",
          subtitle: "Full Bloom & Radiating Energy",
          colorClass: "text-emerald-500",
          leafColor: "#10b981",
          flowerColor: "#f43f5e",
          drooping: false,
          leavesCount: 8,
          scale: 1.1,
          statusText: "Your mental state is exceptionally healthy and vibrant. Keep spreading this positive frequency!",
          gradient: "from-emerald-400 to-teal-500",
          showFlowers: true,
          leavesStatus: "Thick, glossy and growing new shoots.",
          soilStatus: "Perfect moisture & nutrition."
        };
      case 4:
        return {
          title: "Growing Fern",
          subtitle: "Sprouting Healthy New Shoots",
          colorClass: "text-green-500",
          leafColor: "#34d399",
          flowerColor: "#fb7185",
          drooping: false,
          leavesCount: 6,
          scale: 1.0,
          statusText: "You are doing great! Your mental garden is showing steady growth and healthy resilience.",
          gradient: "from-green-400 to-emerald-400",
          showFlowers: false,
          leavesStatus: "Bright green and rising up.",
          soilStatus: "Well-hydrated."
        };
      case 3:
        return {
          title: "Resilient Aloe",
          subtitle: "Stable but Steady",
          colorClass: "text-cyan-500",
          leafColor: "#06b6d4",
          flowerColor: "#93c5fd",
          drooping: false,
          leavesCount: 5,
          scale: 0.9,
          statusText: "You are in a stable, neutral state. Keep practicing regular self-care to feed your roots.",
          gradient: "from-cyan-400 to-blue-400",
          showFlowers: false,
          leavesStatus: "Firm and maintaining form.",
          soilStatus: "Slightly dry but healthy."
        };
      case 2:
        return {
          title: "Thirsty Succulent",
          subtitle: "Slight Droop & Dehydration",
          colorClass: "text-amber-500",
          leafColor: "#f59e0b",
          flowerColor: "#fde047",
          drooping: true,
          leavesCount: 3,
          scale: 0.8,
          statusText: "Signs of stress are rising. Your mental plant is telling you it's time to take a break and recharge.",
          gradient: "from-amber-400 to-orange-400",
          showFlowers: false,
          leavesStatus: "Dull color, slightly curling down.",
          soilStatus: "Dry. Needs restorative sleep."
        };
      case 1:
      default:
        return {
          title: "Withered Bonsai",
          subtitle: "Dehydrated & Showing Exhaustion",
          colorClass: "text-rose-500",
          leafColor: "#b91c1c",
          flowerColor: "#ef4444",
          drooping: true,
          leavesCount: 1,
          scale: 0.7,
          statusText: "Critical burnout warning. Your plant is drying out. Please use Vent Mode or reach out to a counsellor.",
          gradient: "from-rose-500 to-red-600",
          showFlowers: false,
          leavesStatus: "Fallen leaves, extremely brittle.",
          soilStatus: "Parched. Requires immediate rest."
        };
    }
  };

  const state = getPlantState();

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col items-center text-slate-100">
      <div className="w-full flex justify-between items-center mb-4">
        <div>
          <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
            AI Emotion Avatar
          </span>
          <h3 className="font-sans font-semibold text-lg text-white mt-2">{state.title}</h3>
          <p className="text-xs text-slate-400 font-mono">{state.subtitle}</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            <Flame size={16} className="fill-orange-500 animate-pulse" />
            <span className="text-sm font-semibold font-mono">{streak}d Streak</span>
          </div>
        )}
      </div>

      {/* The Animated SVG Pot & Plant */}
      <div className="relative w-64 h-64 bg-black/20 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 mb-6 shadow-inner">
        <div className="absolute inset-0 bg-radial from-white/5 to-transparent opacity-40" />
        
        {/* Floating background bubbles showing health indicators */}
        <div className="absolute top-4 left-4 flex gap-1 items-center bg-white/5 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300">
          <Droplets size={12} className="text-blue-400" />
          <span>Moisture: {moodScore * 20}%</span>
        </div>
        <div className="absolute top-4 right-4 flex gap-1 items-center bg-white/5 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300">
          <Sparkles size={12} className="text-yellow-400" />
          <span>Vibe: {moodScore >= 4 ? "Brilliant" : moodScore === 3 ? "Neutral" : "Stressed"}</span>
        </div>

        <motion.svg
          width="160"
          height="180"
          viewBox="0 0 160 180"
          className="relative z-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: state.scale, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
        >
          {/* Stem/Branch (grows or droops) */}
          <motion.path
            d="M 80,140 Q 80,80 80,40"
            stroke="#78350f"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            animate={{
              d: state.drooping
                ? "M 80,140 Q 95,100 85,85 T 100,65" // Drooping stem path
                : "M 80,140 Q 75,90 80,35", // Tall straight stem path
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Leaves */}
          {/* Leaf 1 (Left low) */}
          {state.leavesCount >= 3 && (
            <motion.path
              d="M 80,110 C 60,105 45,115 45,115 C 45,115 55,95 80,110"
              fill={state.leafColor}
              animate={{
                d: state.drooping 
                  ? "M 80,110 C 65,115 55,130 55,130 C 55,130 60,110 80,110" // drooping leaf 1
                  : "M 80,110 C 60,105 45,115 45,115 C 45,115 55,95 80,110"
              }}
              transition={{ duration: 1.2 }}
            />
          )}

          {/* Leaf 2 (Right low) */}
          {state.leavesCount >= 4 && (
            <motion.path
              d="M 80,105 C 100,100 115,110 115,110 C 115,110 105,90 80,105"
              fill={state.leafColor}
              animate={{
                d: state.drooping 
                  ? "M 80,105 C 95,110 105,125 105,125 C 105,125 100,105 80,105" // drooping leaf 2
                  : "M 80,105 C 100,100 115,110 115,110 C 115,110 105,90 80,105"
              }}
              transition={{ duration: 1.2 }}
            />
          )}

          {/* Leaf 3 (Left mid) */}
          {state.leavesCount >= 5 && (
            <motion.path
              d="M 80,80 C 55,70 40,85 40,85 C 40,85 55,60 80,80"
              fill={state.leafColor}
              animate={{
                d: state.drooping 
                  ? "M 85,85 C 70,95 65,110 65,110 C 65,110 70,90 85,85"
                  : "M 80,80 C 55,70 40,85 40,85 C 40,85 55,60 80,80"
              }}
              transition={{ duration: 1.2 }}
            />
          )}

          {/* Leaf 4 (Right mid) */}
          {state.leavesCount >= 6 && (
            <motion.path
              d="M 80,75 C 105,65 120,80 120,80 C 120,80 105,55 80,75"
              fill={state.leafColor}
              animate={{
                d: state.drooping 
                  ? "M 85,85 C 100,95 105,110 105,110 C 105,110 100,90 85,85"
                  : "M 80,75 C 105,65 120,80 120,80 C 120,80 105,55 80,75"
              }}
              transition={{ duration: 1.2 }}
            />
          )}

          {/* Single minimal leaf for stressed state */}
          {state.leavesCount < 3 && (
            <motion.path
              d="M 85,85 C 70,100 60,115 60,115 C 60,115 70,95 85,85"
              fill="#b45309" // brown dead leaf
            />
          )}

          {/* Leaf 5 (Top sprout) */}
          {state.leavesCount >= 8 && (
            <motion.path
              d="M 80,35 C 70,20 80,5 80,5 C 80,5 90,20 80,35"
              fill={state.leafColor}
            />
          )}

          {/* Glowing flowers if thriving */}
          {state.showFlowers && (
            <>
              {/* Flower 1 */}
              <motion.circle
                cx="40"
                cy="85"
                r="6"
                fill={state.flowerColor}
                animate={{ scale: [0.9, 1.2, 0.9] }}
                transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
              />
              <motion.circle cx="40" cy="85" r="2" fill="#fef08a" />

              {/* Flower 2 */}
              <motion.circle
                cx="120"
                cy="80"
                r="6"
                fill={state.flowerColor}
                animate={{ scale: [1.2, 0.9, 1.2] }}
                transition={{ repeat: Infinity, duration: 3, delay: 1 }}
              />
              <motion.circle cx="120" cy="80" r="2" fill="#fef08a" />
            </>
          )}

          {/* Ceramic Pot */}
          <rect x="50" y="135" width="60" height="35" rx="4" fill="#334155" stroke="#475569" strokeWidth="2" />
          <polygon points="45,135 115,135 105,145 55,145" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Soil */}
          <ellipse cx="80" cy="138" rx="25" ry="3" fill="#451a03" />

          {/* Water Droplets Falling if being watered */}
          {moodScore >= 4 && (
            <motion.circle
              cx="80"
              cy="10"
              r="2"
              fill="#60a5fa"
              animate={{ cy: [10, 130], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          )}
        </motion.svg>

        {/* Dynamic decorative particle system to reflect mood vibe */}
        {moodScore === 5 && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping" />
            <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
            <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Wellness Insight Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white mb-2">
          <Heart size={14} className="text-rose-500 fill-rose-500" />
          <span>AVATAR INSIGHT</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">{state.statusText}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-left bg-white/5 p-2.5 rounded-lg border border-white/10">
          <div className="border-r border-white/10 pr-1 text-slate-400">
            <span className="block font-bold text-white mb-0.5">LEAVES</span>
            <span>{state.leavesStatus}</span>
          </div>
          <div className="pl-1 text-slate-400">
            <span className="block font-bold text-white mb-0.5">SOIL STATE</span>
            <span>{state.soilStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
