import React, { useState, useEffect, useRef } from "react";
import { Send, Volume2, VolumeX, Mic, Compass, Sparkles, Smile, MessageSquare, AlertTriangle, Moon } from "lucide-react";
import { motion } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant" | "model";
  text: string;
  timestamp: Date;
}

interface CompanionProps {
  initialMode?: "chat" | "vent" | "midnight";
  userName?: string;
  onCrisisDetected?: (triggerText: string) => void;
}

export default function Companion({ initialMode = "chat", userName = "Student", onCrisisDetected }: CompanionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello! I am your 24/7 AI Wellness Companion. I'm here to listen, support, and help you find calm in a demanding world. How are you holding up today?",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("English");
  const [mode, setMode] = useState<"chat" | "vent" | "midnight">(initialMode);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle mode adjustments
  useEffect(() => {
    setMode(initialMode);
    if (initialMode === "vent") {
      setMessages([
        {
          id: "vent-welcome",
          role: "assistant",
          text: "Vent Mode is active. Speak or type freely. I won't interrupt or offer any solutions. Take your time, get it all out.",
          timestamp: new Date(),
        }
      ]);
    } else if (initialMode === "midnight") {
      setMessages([
        {
          id: "midnight-welcome",
          role: "assistant",
          text: "Midnight Guardian is active. I noticed you are up quite late tonight. I'm here to keep you company and help soothe your mind. What's keeping you awake?",
          timestamp: new Date(),
        }
      ]);
    }
  }, [initialMode]);

  // Voice output (SpeechSynthesis)
  const speak = (text: string) => {
    if (!voiceEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select appropriate language code if possible
      if (language === "Hindi") utterance.lang = "hi-IN";
      else if (language === "Marathi") utterance.lang = "mr-IN";
      else utterance.lang = "en-US";

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis Error:", e);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    // Crisis keywords client-side quick check
    const lowerText = userMsg.text.toLowerCase();
    const crisisKeywords = ["hurt myself", "suicide", "end my life", "kill myself", "die", "self-harm", "hopeless", "can't go on"];
    const isCrisis = crisisKeywords.some((kw) => lowerText.includes(kw));

    if (isCrisis && onCrisisDetected) {
      onCrisisDetected(userMsg.text);
    }

    try {
      // Build proper request payload for our proxy API
      const response = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map((m) => ({ role: m.role, text: m.text })),
          language,
          mode,
        }),
      });

      const data = await response.json();
      if (data && data.text) {
        const assistantMsg: Message = {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          text: data.text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        speak(data.text);
      }
    } catch (err) {
      console.error("Error communicating with AI Wellness Companion:", err);
    } finally {
      setLoading(false);
    }
  };

  // Simulated Voice Input (Vent/Talk mode)
  const [isListening, setIsListening] = useState(false);
  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please try Chrome.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    
    if (language === "Hindi") rec.lang = "hi-IN";
    else if (language === "Marathi") rec.lang = "mr-IN";
    else rec.lang = "en-US";

    rec.onstart = () => setIsListening(true);
    rec.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputText(speechToText);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-xl flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-indigo-950/40 border-b border-white/10 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center relative">
            <Compass className="animate-spin text-white" size={18} style={{ animationDuration: "12s" }} />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">Companion</span>
              <span className="text-[9px] font-mono bg-white/20 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                {mode}
              </span>
            </div>
            <span className="text-[10px] text-indigo-200 block">AI Therapeutic Listener</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-[11px] rounded-lg px-2 py-1 font-medium focus:outline-hidden [&>option]:bg-slate-900"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिन्दी)</option>
            <option value="Marathi">Marathi (मराठी)</option>
            <option value="Spanish">Spanish (Español)</option>
          </select>

          {/* Voice Output Toggle */}
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (!voiceEnabled) {
                speak("Voice companion output activated.");
              } else {
                window.speechSynthesis.cancel();
              }
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              voiceEnabled ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 font-semibold" : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title="Read responses aloud"
          >
            {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Mode Quick Controls */}
      <div className="bg-white/5 border-b border-white/10 p-2 shrink-0 flex gap-2 justify-center">
        <button
          onClick={() => setMode("chat")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
            mode === "chat" ? "bg-white/10 text-white shadow-md border border-white/25 font-bold" : "text-slate-400 hover:text-slate-100"
          }`}
        >
          <MessageSquare size={13} />
          <span>Support Chat</span>
        </button>
        <button
          onClick={() => setMode("vent")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
            mode === "vent" ? "bg-white/10 text-white shadow-md border border-white/25 font-bold" : "text-slate-400 hover:text-slate-100"
          }`}
        >
          <Smile size={13} />
          <span>Rant & Vent</span>
        </button>
        <button
          onClick={() => setMode("midnight")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
            mode === "midnight" ? "bg-white/10 text-white shadow-md border border-white/25 font-bold" : "text-slate-400 hover:text-slate-100"
          }`}
        >
          <Moon size={13} />
          <span>Midnight Guard</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/[0.02]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo-600/80 border border-indigo-500/30 text-white rounded-br-none shadow-md"
                  : "bg-white/10 border border-white/10 text-white rounded-bl-none shadow-md"
              }`}
            >
              {m.text}
              <div
                className={`text-[9px] mt-1 text-right font-mono ${
                  m.role === "user" ? "text-indigo-200" : "text-slate-400"
                }`}
              >
                {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/10 text-slate-200 rounded-2xl rounded-bl-none p-3 shadow-md max-w-[82%] flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Formulating empathy...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Footer input form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex items-center gap-2 shrink-0 bg-white/5">
        {/* Voice Trigger button */}
        <button
          type="button"
          onClick={startVoiceInput}
          className={`p-2.5 rounded-full transition-all shrink-0 ${
            isListening ? "bg-rose-600 text-white animate-pulse" : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
          }`}
          title="Speech-to-text input"
        >
          <Mic size={16} />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            mode === "vent"
              ? "Vent freely, I'm just listening..."
              : mode === "midnight"
              ? "What's on your mind tonight?"
              : "Ask me anything, I'm here..."
          }
          className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 text-white placeholder:text-slate-500 rounded-full px-4 py-2 text-xs focus:outline-hidden"
        />

        <button
          type="submit"
          className="p-2.5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-full shrink-0 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
