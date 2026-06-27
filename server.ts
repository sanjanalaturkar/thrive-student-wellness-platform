import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Dynamic Gemini API client builder that forwards headers to respect API key restrictions
function getAI(req?: express.Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY environment variable is not set. Using local rule-based fallback.");
    return null;
  }

  // To support API keys with HTTP Referrer restrictions in server-side context,
  // we extract the client's referrer or origin, or construct one using the request host.
  let referer = "";
  if (req) {
    referer = req.get("Referer") || req.get("Origin") || "";
    if (!referer && req.get("host")) {
      referer = `https://${req.get("host")}/`;
    }
  }

  const headers: Record<string, string> = {
    "User-Agent": "aistudio-build",
  };

  if (referer) {
    headers["Referer"] = referer;
  }

  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers,
    },
  });
}

// 1. AI Wellness Companion (supports standard, vent, and midnight modes + multilingualism)
app.post("/api/companion", async (req, res) => {
  const { messages, language = "English", mode = "chat" } = req.body;
  const ai = getAI(req);

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  // Build system prompt based on mode
  let systemInstruction = "You are a compassionate, empathetic, and professional student wellness counselor. ";
  if (mode === "vent") {
    systemInstruction += "The student is in 'Vent Mode' and just wants to rant or express their feelings. DO NOT offer any unsolicited advice, solutions, or lists of tips. Listen with absolute warmth, validate their feelings deeply, and summarize what you understood about their emotional state in 2-3 soothing, highly understanding sentences.";
  } else if (mode === "midnight") {
    systemInstruction += "It is late at night (past midnight). Respond in a very soft, calming, soothing tone. Gently acknowledge that they are up late, ask how they are holding up, and offer a short relaxing word or a tiny breathing prompt to help them wind down and rest.";
  } else {
    systemInstruction += "Give brief, comforting responses (2-4 sentences max). Be human, warm, and conversational. Encourage them gently. Under no circumstance should you prescribe medical advice or sound clinical. If severe trauma or self-harm is mentioned, recommend using their emergency support tools gently.";
  }

  systemInstruction += ` Please respond in ${language}.`;

  // Format messages for @google/genai SDK
  // SDK expects: { contents: [{ role: 'user', parts: [{ text: '...' }] }] }
  const contents = messages.map((m) => ({
    role: m.role === "assistant" || m.role === "model" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  if (!ai) {
    // Fallback response when API key is missing
    let fallbackText = "I'm here for you, always. It takes courage to share how you feel. Let's take a deep breath together. Tell me more, I'm listening.";
    if (mode === "vent") {
      const lastMsg = messages[messages.length - 1]?.text || "";
      fallbackText = `I hear you loud and clear, and I'm holding space for you. It sounds like you've been carrying a heavy weight lately: "${lastMsg.slice(0, 80)}...". Thank you for venting to me. Your feelings are completely valid.`;
    } else if (mode === "midnight") {
      fallbackText = "Hey, I noticed you're up late. The world is quiet right now, and it's okay to let go of today's worries. How are you feeling tonight? Just remember, you've done enough for today.";
    }
    return res.json({ text: fallbackText });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 350,
      }
    });

    res.json({ text: response.text || "I'm here for you. Tell me more." });
  } catch (error: any) {
    console.error("Gemini companion error:", error);
    res.status(500).json({ error: "Failed to generate wellness response." });
  }
});

// 2. Smart Journal Sentiment Analysis & Crisis Detection
app.post("/api/analyze-journal", async (req, res) => {
  const { notes } = req.body;
  if (!notes || typeof notes !== "string") {
    return res.status(400).json({ error: "Notes string is required." });
  }

  const ai = getAI(req);

  if (!ai) {
    // Basic local rule fallback
    const lower = notes.toLowerCase();
    let sentiment: "positive" | "neutral" | "negative" | "crisis" = "neutral";
    let score = 50;
    let reflection = "Thank you for journaling today. Putting your thoughts into words is a wonderful step towards mindfulness.";

    if (lower.includes("hurt") || lower.includes("suicide") || lower.includes("end it") || lower.includes("die") || lower.includes("kill myself") || lower.includes("self-harm")) {
      sentiment = "crisis";
      score = 5;
      reflection = "I'm so concerned about you. Please know that you are not alone and there are people who want to support you right now. Let's connect you with care.";
    } else if (lower.includes("happy") || lower.includes("great") || lower.includes("awesome") || lower.includes("proud") || lower.includes("excited")) {
      sentiment = "positive";
      score = 85;
      reflection = "It is so beautiful to read about your happy moments today! Savor this joy and let it fuel your journey.";
    } else if (lower.includes("sad") || lower.includes("stressed") || lower.includes("anxious") || lower.includes("tired") || lower.includes("hate") || lower.includes("worried")) {
      sentiment = "negative";
      score = 25;
      reflection = "I hear the pain and stress in your words today. It is completely okay to feel down. Go gentle on yourself, you are doing the best you can.";
    }

    return res.json({ sentiment, score, reflection });
  }

  try {
    const prompt = `Analyze the sentiment of this student's journal entry. Determine if the text contains clear indicators of extreme distress, self-harm, suicidal ideation, or crisis.
Output JSON only with the following fields:
- sentiment: must be one of "positive", "neutral", "negative", "crisis" (use "crisis" only if there are explicit or strong implicit self-harm/suicide/extreme despair warnings)
- score: an integer from 0 (extreme crisis) to 100 (complete euphoria)
- reflection: A short (1-2 sentences), highly empathetic, personalized, non-judgmental wellness response directly addressing their written feelings.

Journal entry:
"${notes}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      sentiment: parsed.sentiment || "neutral",
      score: parsed.score !== undefined ? parsed.score : 50,
      reflection: parsed.reflection || "Thank you for sharing your thoughts in your journal."
    });
  } catch (error) {
    console.error("Journal analysis error:", error);
    res.status(500).json({ error: "Failed to analyze journal." });
  }
});

// 3. Burnout Prediction Engine (Calculates Burnout Index & generates tips)
app.post("/api/predict-burnout", async (req, res) => {
  const { sleepHours = 7, studyHours = 4, screenTime = 5, attendance = 85, moodScore = 3 } = req.body;

  // Let's build a smart math base index
  // High study hours (>8) + low sleep (<6) = highest risk
  // Low attendance (<75) = withdrawal indicator
  // High screen time (>8) = screen fatigue
  let baseIndex = 40;

  // Study hours impact
  if (studyHours > 8) baseIndex += 20;
  else if (studyHours > 6) baseIndex += 10;
  else if (studyHours < 2) baseIndex += 5; // potential disengagement

  // Sleep impact
  if (sleepHours < 5) baseIndex += 25;
  else if (sleepHours < 7) baseIndex += 12;
  else if (sleepHours > 9) baseIndex -= 5;

  // Screen time impact
  if (screenTime > 8) baseIndex += 15;
  else if (screenTime > 6) baseIndex += 7;

  // Attendance impact
  if (attendance < 75) baseIndex += 15;
  else if (attendance > 90) baseIndex -= 10;

  // Mood impact
  if (moodScore === 1) baseIndex += 20;
  else if (moodScore === 2) baseIndex += 10;
  else if (moodScore === 4) baseIndex -= 10;
  else if (moodScore === 5) baseIndex -= 20;

  // Clamp to 0-100
  const burnoutIndex = Math.max(5, Math.min(95, baseIndex));
  const riskLevel = burnoutIndex > 75 ? "high" : burnoutIndex > 45 ? "moderate" : "low";

  const ai = getAI(req);

  if (!ai) {
    // Fallback description
    let description = "Your energy levels are balanced. Maintain your healthy sleep patterns and continue taking regular study breaks.";
    let tips = [
      "Keep aiming for 7-8 hours of sound sleep.",
      "Integrate 10-minute active walks during long study blocks.",
      "Establish a winding-down screen-free routine 30 minutes before bed."
    ];

    if (riskLevel === "high") {
      description = "You are exhibiting critical indicators of severe academic burnout and physical exhaustion. Your high study load, combined with sleep deficits and class disengagement, requires immediate preventive self-care.";
      tips = [
        "Declare a strict 'No-Study Evening' to give your brain complete rest.",
        "Set a firm screen-time limit of 6 hours and swap social media for a relaxing nature walk.",
        "Reach out to a peer support group or your campus counselor to share your current workload load."
      ];
    } else if (riskLevel === "moderate") {
      description = "Your stress levels are climbing, suggesting moderate exhaustion. You are managing your classes well, but sleep and relaxation are taking a back seat.";
      tips = [
        "Try the 50/10 study method: 50 minutes of focused studying, then a 10-minute screen-free pause.",
        "Prioritize raising your average sleep to at least 7 hours.",
        "Spend 5 minutes tonight with a custom soundscape to quieten your mind."
      ];
    }

    return res.json({ burnoutIndex, riskLevel, description, tips });
  }

  try {
    const prompt = `Act as an expert academic psychologist. We have calculated a student's Burnout Index as ${burnoutIndex}/100 (Risk: ${riskLevel}) based on:
- Sleep: ${sleepHours} hours/day
- Studying: ${studyHours} hours/day
- Screen Time: ${screenTime} hours/day
- Class Attendance: ${attendance}%
- Average Mood Score: ${moodScore}/5

Generate a highly personalized JSON analysis with:
- description: A warm, deeply insightful 2-sentence explanation of what is causing their current burnout score.
- tips: Array of exactly 3 highly actionable, innovative, and concrete wellness exercises/tips to immediately lower their stress.

Output JSON only. Do not wrap in markdown or any other text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      burnoutIndex,
      riskLevel,
      description: parsed.description || `Your burnout risk is currently ${riskLevel}.`,
      tips: parsed.tips || ["Take regular breaks", "Ensure sufficient sleep", "Limit late-night screen use"]
    });
  } catch (error) {
    console.error("Burnout analysis error:", error);
    // Return calculated index with default text in case of parsing error
    res.json({
      burnoutIndex,
      riskLevel,
      description: `Based on your metrics, you are experiencing ${riskLevel} burnout potential. Let's make sure to balance sleep with your class assignments.`,
      tips: ["Try to squeeze in 30 minutes more sleep.", "Use Vent Mode to voice out lingering worries.", "Try custom focus ambience."]
    });
  }
});

// 4. Academic Stress Predictor (Preventive instead of reactive)
app.post("/api/predict-academic-stress", async (req, res) => {
  const { assignments = 1, exams = 0, attendance = 85 } = req.body;

  let pressureScore = 20;
  pressureScore += assignments * 15;
  pressureScore += exams * 30;
  if (attendance < 75) pressureScore += 15;

  const predictedStress = Math.max(10, Math.min(95, pressureScore));
  const ai = getAI(req);

  if (!ai) {
    let analysis = `With ${assignments} submissions and ${exams} exams, your academic workload is highly manageable.`;
    let tips = ["Do a 5-minute review of topics each morning.", "Plan your week with clear time blocks."];

    if (predictedStress > 65) {
      analysis = `Warning: High stress predicted next week due to ${exams} upcoming exams and ${assignments} submissions. Proactive planning is crucial now to protect your mental health.`;
      tips = [
        "Break heavy study materials into bite-sized 20-minute daily targets.",
        "Book a focus soundscape slot to increase your consolidation rate.",
        "Say 'no' to extra non-urgent tasks this week to buffer your energy."
      ];
    } else if (predictedStress > 35) {
      analysis = `Moderate stress predicted. Your submissions are building up, but with quick adjustments, you can navigate this comfortably.`;
      tips = [
        "Create an immediate prioritization list (High, Medium, Low intensity).",
        "Maintain normal social activities to help release study pressure."
      ];
    }

    return res.json({ predictedStress, analysis, tips });
  }

  try {
    const prompt = `Act as an academic coach. A student has ${assignments} assignments/submissions due, ${exams} exams next week, and class attendance is ${attendance}%.
Our Stress Predictor expects next week's stress to hit ${predictedStress}/100.
Generate a JSON output:
- analysis: A 2-sentence encouraging predictive advisory warning them gently about the upcoming peak and offering insight.
- tips: Exactly 3 clever, highly practical study-life balance actions they should take this week to PREVENT burnout before the stress spike.

Output JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      predictedStress,
      analysis: parsed.analysis || "Moderate academic pressure predicted. Planning ahead will keep you calm.",
      tips: parsed.tips || ["Review assignment specs early", "Stay hydrated", "Take quick walks between study blocks"]
    });
  } catch (error) {
    console.error("Academic stress prediction error:", error);
    res.json({
      predictedStress,
      analysis: "Academic pressure is predicted to rise due to upcoming deadlines. Proactive organization will help you breeze through.",
      tips: ["Create a checklist", "Adopt the Pomodoro technique", "Wind down with focus music"]
    });
  }
});

// 5. Custom Soundscape Selector
app.post("/api/soundscape", (req, res) => {
  const { moodScore = 3 } = req.body;

  // Let's create beautiful soundscapes based on mood score
  // moodScore: 1 (severe stress), 2 (stressed/sad), 3 (neutral), 4 (happy), 5 (euphoric)
  let rain = 20;
  let piano = 50;
  let ocean = 30;
  let forest = 20;
  let wind = 10;
  let description = "Balanced Harmony: A soothing mix of acoustic piano, gentle rain, and comforting ocean currents designed to center your focus.";

  if (moodScore === 1) {
    // Crisis or maximum stress: need absolute, slow, comforting, quiet sounds
    rain = 60;
    piano = 30; // Soft slow ambient keys
    ocean = 50; // Deep ocean breathing
    forest = 40; // Soft wind chimes and rustling leaves
    wind = 40;
    description = "Safe Sanctuary: A deeply grounding, low-frequency soundscape. Warm, rhythmic ocean tides and heavy, comforting rain designed to soothe a high-adrenaline fight-or-flight response.";
  } else if (moodScore === 2) {
    // Sad or moderately anxious
    rain = 40;
    piano = 70; // Melancholic but comforting piano
    ocean = 20;
    forest = 50; // Calming forest bird notes
    wind = 20;
    description = "Healing Meadow: Gentle piano notes intertwined with quiet forest whispers and soft raindrops to bring reassurance and clear mental clouds.";
  } else if (moodScore === 4) {
    // Joyful, motivated
    rain = 10;
    piano = 60; // Light, brighter tempo piano
    ocean = 40;
    forest = 60; // Energetic rustling and bird calls
    wind = 10;
    description = "Creative Sunrise: A bright, uplifting mix of rustling forest leaves, morning birds, and bright acoustic piano to inspire active study and creative flows.";
  } else if (moodScore === 5) {
    // Highly energized
    rain = 0;
    piano = 40;
    ocean = 70; // Grand, active ocean waves
    forest = 80;
    wind = 30;
    description = "Infinite Horizon: A majestic soundscape featuring soaring forest ambient winds and waves, amplifying your clarity, happiness, and motivation.";
  }

  res.json({ rain, piano, ocean, forest, wind, description });
});

// Serve static assets in production, otherwise Vite middleware handles it
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started at http://localhost:${PORT}`);
  });
}

startServer();
