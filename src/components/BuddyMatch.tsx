import React, { useState, useEffect } from "react";
import { Users, Shield, MessageCircle, AlertCircle, Heart, Check, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

export default function BuddyMatch() {
  const [concern, setConcern] = useState("Placement Anxiety");
  const [matchCount, setMatchCount] = useState(43);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  // Concern choices
  const concerns = [
    { name: "Placement Anxiety", baseCount: 43, icon: "💼" },
    { name: "Exam Stress", baseCount: 81, icon: "📝" },
    { name: "Homesickness", baseCount: 28, icon: "🏡" },
    { name: "Relationship Blues", baseCount: 19, icon: "💔" },
    { name: "First-Year Transition", baseCount: 34, icon: "🎓" }
  ];

  // Set randomized matching counts on concern change
  useEffect(() => {
    const selected = concerns.find((c) => c.name === concern);
    if (selected) {
      setMatchCount(selected.baseCount + Math.floor(Math.random() * 6) - 3);
    }
    setJoined(false);
    setMessages([]);
  }, [concern]);

  // Load mock dynamic anonymous conversations to demonstrate AI-moderated peer-to-peer discussion
  const handleJoinGroup = () => {
    setJoined(true);
    let initialMsgs: any[] = [];
    if (concern === "Placement Anxiety") {
      initialMsgs = [
        { id: 1, alias: "Brave Lion", text: "The coding rounds are so intense. I'm struggling to clear the second round.", time: "10m ago" },
        { id: 2, alias: "Calm River", text: "Me too! But remember, mock interviews help. We can group-practice.", time: "8m ago" },
        { id: 3, alias: "Spunky Fox", text: "Honestly, 43 of us here means we are all in this boat. Let's solve LeetCode together.", time: "5m ago" }
      ];
    } else if (concern === "Exam Stress") {
      initialMsgs = [
        { id: 1, alias: "Silent Owl", text: "Three exams back-to-back is cruel. My brain is completely fried.", time: "12m ago" },
        { id: 2, alias: "Echo Wave", text: "Has anyone summarized Chapter 5 of ElectroMagnetism? I'm panicking.", time: "9m ago" },
        { id: 3, alias: "Gentle Deer", text: "Take it easy! Here's a link to the study guide. We've got this guys.", time: "2m ago" }
      ];
    } else {
      initialMsgs = [
        { id: 1, alias: "Swift Hawk", text: "Missing my mom's home cooking so much. Fast food on campus is exhausting.", time: "15m ago" },
        { id: 2, alias: "Cozy Koala", text: "The hostels feel so quiet at night. I call home twice a day.", time: "11m ago" },
        { id: 3, alias: "Mellow Panda", text: "It gets better after the first semester! Try joining the sports club, it distracts you nicely.", time: "3m ago" }
      ];
    }
    setMessages(initialMsgs);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // AI Moderation implementation (prevent bullying, toxic language, cursing)
    const toxicWords = ["hate you", "loser", "stupid", "die", "kill", "idiot", "jerk", "bully"];
    const containsToxic = toxicWords.some((w) => inputText.toLowerCase().includes(w));

    if (containsToxic) {
      setModerationWarning("⚠️ Flagged by AI Moderation: Please keep our peer support community kind and respectful. Bullying/toxic content is strictly blocked.");
      return;
    }

    setModerationWarning(null);
    const newMsg = {
      id: messages.length + 1,
      alias: "You (Anonymous Student)",
      text: inputText,
      time: "Just now"
    };

    setMessages([...messages, newMsg]);
    setInputText("");

    // Simulate an anonymous buddy responding empathically after 1.5 seconds
    setTimeout(() => {
      const buddies = ["Warm Koala", "Quiet Panther", "Bright Eagle", "Caring Dolphin"];
      const responses = [
        "That's so true. Thanks for sharing.",
        "Completely agree! We have to hold each other up.",
        "I feel exact same way. Let's meet at the campus square library block tomorrow for combined prep?",
        "Don't worry, we are thriving together."
      ];
      
      const reply = {
        id: messages.length + 2,
        alias: buddies[Math.floor(Math.random() * buddies.length)],
        text: responses[Math.floor(Math.random() * responses.length)],
        time: "Just now"
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl text-slate-100">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-lg text-white font-sans">Buddy Match & Support Group</h3>
            <p className="text-xs text-slate-400 font-mono">Anonymous Peer-to-Peer Healing Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider font-mono">
          <Shield size={12} />
          <span>AI Moderated</span>
        </div>
      </div>

      {!joined ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            You don't have to carry your stress alone. Select your current academic or personal challenge to view other campus peers battling the same struggles in complete anonymity.
          </p>

          {/* Concerns Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {concerns.map((c) => (
              <button
                key={c.name}
                onClick={() => setConcern(c.name)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  concern === c.name
                    ? "bg-white/10 border-white/25 text-white scale-[1.02] shadow-md font-bold"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </div>
                {concern === c.name && <Check size={14} className="text-indigo-400" />}
              </button>
            ))}
          </div>

          {/* Match Counter Display */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
            <h4 className="text-3xl font-black text-indigo-400 font-mono animate-pulse">{matchCount}</h4>
            <p className="text-xs font-bold text-indigo-200 mt-1">Students on campus are facing {concern} right now</p>
            <p className="text-[10px] text-indigo-300 font-mono mt-0.5 uppercase tracking-wider">Ready to connect anonymously</p>
          </div>

          <button
            onClick={handleJoinGroup}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Join Anonymous Peer Support Room
          </button>
        </div>
      ) : (
        /* Joined Anonymous Support Chatroom */
        <div className="space-y-4">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex justify-between items-center text-xs">
            <span className="font-semibold text-white font-sans">Concern Block: #{concern}</span>
            <span className="font-mono text-[10px] text-slate-400 font-bold">{matchCount} Active Members</span>
          </div>

          {/* Group Chat Bubble list */}
          <div className="h-56 bg-black/20 border border-white/10 rounded-2xl overflow-y-auto p-4 space-y-3">
            {messages.map((m) => {
              const isMe = m.alias.includes("You");
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <span className="text-[9px] font-bold text-slate-400 mb-0.5 font-mono uppercase tracking-wider">
                    {m.alias} • {m.time}
                  </span>
                  <div
                    className={`rounded-2xl p-2.5 text-xs max-w-[85%] ${
                      isMe ? "bg-indigo-600/80 border border-indigo-500/30 text-white rounded-tr-none shadow-md" : "bg-white/10 text-white border border-white/10 rounded-tl-none shadow-md"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bullying Moderation Warning */}
          {moderationWarning && (
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-200 rounded-xl text-xs flex gap-2">
              <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{moderationWarning}</span>
            </div>
          )}

          {/* Input Panel */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Contribute kind and validating words to your peers..."
              className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 text-white placeholder:text-slate-500 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
            >
              Post
            </button>
          </form>

          {/* Leave Button */}
          <button
            onClick={() => setJoined(false)}
            className="w-full py-1.5 text-center text-xs text-slate-400 font-bold hover:text-slate-200 transition-all font-mono uppercase tracking-wider"
          >
            Leave Chatroom
          </button>
        </div>
      )}
    </div>
  );
}
