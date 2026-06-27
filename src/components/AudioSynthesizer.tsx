import { useState, useEffect, useRef } from "react";
import { Play, Pause, Music, Volume2, CloudRain, TreePine, Waves, HelpCircle, Sparkles } from "lucide-react";

interface AudioSynthesizerProps {
  initialMoodScore?: number;
}

export default function AudioSynthesizer({ initialMoodScore = 3 }: AudioSynthesizerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumes, setVolumes] = useState({
    rain: 20,
    piano: 50,
    ocean: 30,
    forest: 20,
    wind: 15,
  });

  const [preset, setPreset] = useState("Balanced");
  const [description, setDescription] = useState("Balanced Harmony: Soft acoustic keys combined with gentle rain and beach waves to quieten your thoughts.");

  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<{ [key: string]: GainNode }>({});
  const synthesizerIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load soundscape preset based on initialMoodScore on mount
  useEffect(() => {
    applyMoodSoundscape(initialMoodScore);
  }, [initialMoodScore]);

  // Handle Preset changes
  const applyPreset = (presetName: string) => {
    setPreset(presetName);
    let newVols = { rain: 20, piano: 50, ocean: 30, forest: 20, wind: 15 };
    let desc = "";

    switch (presetName) {
      case "Focus & Study":
        newVols = { rain: 10, piano: 60, ocean: 10, forest: 40, wind: 10 };
        desc = "Study Consolidator: Steady ambient tones and bright keys to amplify focus, recall speed, and cognitive clarity.";
        break;
      case "Stress Release":
        newVols = { rain: 60, piano: 30, ocean: 45, forest: 10, wind: 30 };
        desc = "Safe Sanctuary: Rhythmic low frequencies. Heavy rain and deep ocean tides designed to soothe high-tension states.";
        break;
      case "Midnight Sleep":
        newVols = { rain: 40, piano: 20, ocean: 60, forest: 5, wind: 50 };
        desc = "Restorative Winding: Low volume deep wave oscillations to ease sleep entry and encourage overnight restoration.";
        break;
      case "Creative Spark":
        newVols = { rain: 0, piano: 70, ocean: 30, forest: 70, wind: 20 };
        desc = "Uplifting Flow: Lively birds and cheerful major scales. Highly effective for mood elevation and brainstorming.";
        break;
      default:
        newVols = { rain: 20, piano: 50, ocean: 30, forest: 20, wind: 15 };
        desc = "Balanced Harmony: Gentle rain, calming keys, and forest atmosphere for general reflection.";
    }

    setVolumes(newVols);
    setDescription(desc);

    // Update active gain nodes if audio is playing
    if (isPlaying) {
      Object.keys(newVols).forEach((key) => {
        const node = gainNodesRef.current[key];
        if (node && audioCtxRef.current) {
          const targetVol = (newVols as any)[key] / 100;
          node.gain.setTargetAtTime(targetVol, audioCtxRef.current.currentTime, 0.2);
        }
      });
    }
  };

  const applyMoodSoundscape = async (score: number) => {
    try {
      const response = await fetch("/api/soundscape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodScore: score }),
      });
      const data = await response.json();
      if (data && !data.error) {
        const vols = {
          rain: data.rain,
          piano: data.piano,
          ocean: data.ocean,
          forest: data.forest,
          wind: data.wind,
        };
        setVolumes(vols);
        setDescription(data.description);
        setPreset(`Mood-Matched (${score}/5)`);

        if (isPlaying) {
          Object.keys(vols).forEach((key) => {
            const node = gainNodesRef.current[key];
            if (node && audioCtxRef.current) {
              const targetVol = (vols as any)[key] / 100;
              node.gain.setTargetAtTime(targetVol, audioCtxRef.current.currentTime, 0.2);
            }
          });
        }
      }
    } catch (e) {
      console.error("Error matching soundscape:", e);
    }
  };

  // Web Audio Synth Initialization
  const startAudio = () => {
    if (isPlaying) return;

    // Create AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // 1. Create Rain Synthesizer (White noise)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Rain Source
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    // Lowpass filter to make it sound like gentle rain
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "lowpass";
    rainFilter.frequency.setValueAtTime(800, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(volumes.rain / 100, ctx.currentTime);
    gainNodesRef.current["rain"] = rainGain;

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(ctx.destination);
    rainSource.start();

    // 2. Create Ocean Waves (Periodic modulation of noise)
    const oceanSource = ctx.createBufferSource();
    oceanSource.buffer = noiseBuffer;
    oceanSource.loop = true;

    const oceanFilter = ctx.createBiquadFilter();
    oceanFilter.type = "bandpass";
    oceanFilter.frequency.setValueAtTime(350, ctx.currentTime);
    oceanFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    const oceanGain = ctx.createGain();
    oceanGain.gain.setValueAtTime(volumes.ocean / 100, ctx.currentTime);
    gainNodesRef.current["ocean"] = oceanGain;

    // Wave modulator (Oscillates volume slowly every 6 seconds)
    const modulator = ctx.createOscillator();
    modulator.frequency.setValueAtTime(0.15, ctx.currentTime); // 0.15Hz = ~6.6 seconds period
    const modulatorGain = ctx.createGain();
    modulatorGain.gain.setValueAtTime(0.2, ctx.currentTime); // modulation depth

    modulator.connect(modulatorGain);
    modulatorGain.connect(oceanGain.gain); // modulate the gain directly

    oceanSource.connect(oceanFilter);
    oceanFilter.connect(oceanGain);
    oceanGain.connect(ctx.destination);
    
    modulator.start();
    oceanSource.start();

    // 3. Create Wind Rumbling
    const windSource = ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.setValueAtTime(120, ctx.currentTime);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(volumes.wind / 100, ctx.currentTime);
    gainNodesRef.current["wind"] = windGain;

    // Modulate wind a bit
    const windMod = ctx.createOscillator();
    windMod.frequency.setValueAtTime(0.08, ctx.currentTime);
    const windModGain = ctx.createGain();
    windModGain.gain.setValueAtTime(0.15, ctx.currentTime);
    windMod.connect(windModGain);
    windModGain.connect(windGain.gain);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(ctx.destination);

    windMod.start();
    windSource.start();

    // 4. Create Forest Ambient (Random high pitched chirping bird-synthesizer)
    const forestGain = ctx.createGain();
    forestGain.gain.setValueAtTime(volumes.forest / 100, ctx.currentTime);
    gainNodesRef.current["forest"] = forestGain;
    forestGain.connect(ctx.destination);

    // 5. Create Piano Synthesizer (Periodic warm scale sequencer)
    const pianoGain = ctx.createGain();
    pianoGain.gain.setValueAtTime(volumes.piano / 100, ctx.currentTime);
    gainNodesRef.current["piano"] = pianoGain;
    pianoGain.connect(ctx.destination);

    // Sequence Melodic progressions
    // Pentatonic scale frequencies: C4, D4, E4, G4, A4, C5, D5
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    let noteIndex = 0;

    synthesizerIntervalRef.current = setInterval(() => {
      if (!ctx || ctx.state === "suspended") return;

      const now = ctx.currentTime;

      // Play soft warm piano note
      if (Math.random() < 0.7) {
        // Select random scale note
        const freq = notes[Math.floor(Math.random() * notes.length)];
        
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        // Soft sine wave mixed with triangle for physical resonance
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        // Soft Attack, Long Decay envelope
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.12, now + 0.1); // Attack
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5); // Slow Decay

        osc.connect(oscGain);
        oscGain.connect(pianoGain);
        osc.start(now);
        osc.stop(now + 3.8);
      }

      // Play a tiny bird-like tweet in Forest Gain
      if (Math.random() < 0.4) {
        const tweetOsc = ctx.createOscillator();
        const tweetGain = ctx.createGain();

        tweetOsc.type = "sine";
        const baseFreq = 1800 + Math.random() * 500;
        tweetOsc.frequency.setValueAtTime(baseFreq, now);
        // Pitch sweep
        tweetOsc.frequency.exponentialRampToValueAtTime(baseFreq + 300, now + 0.15);

        tweetGain.gain.setValueAtTime(0, now);
        tweetGain.gain.linearRampToValueAtTime(0.02, now + 0.02);
        tweetGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        tweetOsc.connect(tweetGain);
        tweetGain.connect(forestGain);
        tweetOsc.start(now);
        tweetOsc.stop(now + 0.25);
      }

    }, 1800);

    setIsPlaying(true);
    drawVisualizer();
  };

  const stopAudio = () => {
    if (!isPlaying) return;

    if (synthesizerIntervalRef.current) {
      clearInterval(synthesizerIntervalRef.current);
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsPlaying(false);
  };

  // Volume slider handler
  const handleVolumeChange = (type: string, value: number) => {
    const updated = { ...volumes, [type]: value };
    setVolumes(updated);

    const node = gainNodesRef.current[type];
    if (node && audioCtxRef.current) {
      node.gain.setTargetAtTime(value / 100, audioCtxRef.current.currentTime, 0.15);
    }
  };

  // Soundscape Oscillating Visualizer
  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Render layered translucent waves depending on active volumes
      const waveLayers = [
        { color: "rgba(99, 102, 241, 0.15)", speed: 0.02, amp: volumes.piano * 0.3, freq: 0.015 },
        { color: "rgba(59, 130, 246, 0.12)", speed: 0.035, amp: volumes.rain * 0.25, freq: 0.03 },
        { color: "rgba(14, 165, 233, 0.1)", speed: 0.015, amp: volumes.ocean * 0.4, freq: 0.01 },
      ];

      waveLayers.forEach((layer) => {
        ctx.beginPath();
        ctx.fillStyle = layer.color;
        
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 5) {
          const y = height / 2 + Math.sin(x * layer.freq + time * layer.speed) * layer.amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      });

      time += 1;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  useEffect(() => {
    if (!isPlaying && canvasRef.current) {
      // Clear visualizer to silent straight line
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
    }
  }, [isPlaying]);

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Music size={20} />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-lg text-white">Mood Soundscape Generator</h3>
            <p className="text-xs text-slate-400 font-mono">Live Web Audio API Synthesis</p>
          </div>
        </div>
        <button
          onClick={isPlaying ? stopAudio : startAudio}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all ${
            isPlaying
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
          }`}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          <span>{isPlaying ? "Stop Therapy" : "Generate Audio"}</span>
        </button>
      </div>

      {/* Visualizer Canvas */}
      <div className="w-full h-16 bg-black/20 border border-white/10 rounded-2xl overflow-hidden relative mb-5 flex items-center justify-center">
        <canvas ref={canvasRef} width="360" height="64" className="w-full h-full" />
        {!isPlaying && (
          <span className="absolute text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Sparkles size={12} className="text-indigo-400 animate-pulse" /> Click 'Generate Audio' to synthesize live healing frequencies.
          </span>
        )}
      </div>

      {/* Preset Selectors */}
      <div className="mb-5">
        <span className="text-xs font-semibold text-slate-400 block mb-2 font-mono uppercase tracking-wider">
          Wellness Soundscape Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {["Balanced", "Focus & Study", "Stress Release", "Midnight Sleep", "Creative Spark"].map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                preset === p
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold"
                  : "bg-white/5 border border-white/10 hover:border-white/20 text-slate-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Volume Sliders */}
      <div className="space-y-4 border-t border-white/10 pt-4 mb-4">
        <span className="text-xs font-semibold text-slate-400 block font-mono uppercase tracking-wider">
          Custom Mix Board
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Piano */}
          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Volume2 size={16} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>Ambient Piano</span>
                <span className="font-mono text-slate-400">{volumes.piano}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volumes.piano}
                onChange={(e) => handleVolumeChange("piano", parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Rain */}
          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <CloudRain size={16} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>White Rain</span>
                <span className="font-mono text-slate-400">{volumes.rain}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volumes.rain}
                onChange={(e) => handleVolumeChange("rain", parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Ocean */}
          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <Waves size={16} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>Ocean Currents</span>
                <span className="font-mono text-slate-400">{volumes.ocean}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volumes.ocean}
                onChange={(e) => handleVolumeChange("ocean", parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Forest */}
          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <TreePine size={16} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>Forest Birds & rustle</span>
                <span className="font-mono text-slate-400">{volumes.forest}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volumes.forest}
                onChange={(e) => handleVolumeChange("forest", parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Therapist Description */}
      <div className="bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/20 flex gap-3 text-indigo-200 leading-relaxed text-xs">
        <HelpCircle size={18} className="text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Music Therapy Science:</span> {description}
        </div>
      </div>
    </div>
  );
}
