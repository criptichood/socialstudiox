/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { Loader2, BrainCircuit, BookOpen, Atom, ScrollText, Dna, Microscope, Globe, Compass } from 'lucide-react';

interface LoadingProps {
  status: string;
  step: number;
  facts?: string[];
}

/**
 * ANIMATION & INTERACTIVE EXPERIENCE SUGGESTIONS:
 * 
 * To make this generation animation look even more unique and high-fidelity:
 * 1. PERSISTENT VECTOR CANVAS DRAWING: We can implement an HTML Canvas background that softly renders randomized wireframe models
 *    or circuit board paths, representing the dynamic construction of the diagram.
 * 2. SOUND DESIGN ACCENTS: If permitted, add subtle, low-frequency atmospheric hums or micro-beeps on state changes.
 * 3. CUSTOM SVG SCHEMATIC EXPLOSION: When transitioning steps, we could explode an SVG schematic overlay into micro-nodes,
 *    stretching outward to form the backdrop of the active infographic.
 * 4. USER CHRONOLOGICAL LOGS: Integrate a side-scrolling tech log terminal (e.g. "[SECURE] Connecting to standard Google Knowledge Graph...")
 *    to reinforce real-time data integration.
 */

const Loading: React.FC<LoadingProps> = ({ status, step, facts = [] }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  
  useEffect(() => {
    if (facts.length > 0) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % facts.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [facts]);

  // A mix of Icons and Text flying into the center
  const FlyingItem = ({ delay, position, type, content }: { delay: number, position: number, type: 'icon' | 'text', content: any }) => {
    const startLeft = position % 2 === 0 ? '-20%' : '120%';
    const startTop = `${(position * 7) % 100}%`;
    
    return (
      <div 
        className={`absolute flex items-center justify-center font-bold opacity-0 select-none ${type === 'text' ? 'text-cyan-600 dark:text-cyan-400 text-[10px] md:text-xs tracking-[0.2em] bg-white/80 dark:bg-slate-900/80 border border-cyan-500/30 px-2 py-0.5 md:px-3 md:py-1 rounded shadow-[0_0_10px_rgba(6,182,212,0.3)] backdrop-blur-sm' : 'text-amber-500 dark:text-amber-400'}`}
        style={{
          animation: `implode 2.5s infinite ease-in ${delay}s`,
          top: startTop,
          left: startLeft,
          zIndex: 10,
        }}
      >
        {type === 'icon' ? React.createElement(content, { className: "w-5 h-5 md:w-6 md:h-6 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" }) : content}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto mt-8 p-6 md:p-8 min-h-[350px] md:min-h-[500px] overflow-hidden rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-md transition-colors">
      
      <style>{`
        @keyframes implode {
          0% { transform: scale(1) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: scale(0.1) rotate(360deg); opacity: 0; top: 40%; left: 50%; }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes pulse-core {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); transform: scale(1); }
          70% { box-shadow: 0 0 0 30px rgba(6, 182, 212, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); transform: scale(1); }
        }
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      {/* THE QUANTUM SCHEMATIC CORE */}
      <div className="relative z-20 mb-10 md:mb-16 scale-[0.65] md:scale-125 mt-4 md:mt-10 flex items-center justify-center">
        {/* Outer tech circles and compass rings */}
        <div className="absolute w-64 h-64 border border-dashed border-cyan-500/20 dark:border-cyan-500/10 rounded-full animate-[spin-slow_24s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_cyan]"></div>
        </div>
        <div className="absolute w-52 h-52 border border-purple-500/30 rounded-full animate-[spin-reverse_12s_linear_infinite]"></div>
        <div className="absolute w-40 h-40 border-2 border-dashed border-cyan-400/30 rounded-full animate-[spin-slow_8s_linear_infinite]"></div>
        
        {/* Glowing Center Orb with laser line */}
        <div className="relative bg-white/50 dark:bg-white/10 p-1.5 rounded-full shadow-[0_0_60px_rgba(6,182,212,0.45)] animate-[pulse-core_2s_infinite]">
           <div className="bg-slate-950 p-4 rounded-full flex items-center justify-center w-24 h-24 relative overflow-hidden border border-cyan-500/60 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-20"></div>
              
              <BrainCircuit className="w-12 h-12 text-cyan-400 filter drop-shadow-[0_0_12px_cyan] animate-pulse relative z-10" />
              
              {/* Laser sweep line */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                <div className="absolute w-full h-1 bg-cyan-400/70 blur-[1px] animate-[scan-laser_2s_linear_infinite]"></div>
              </div>
           </div>
        </div>

        {/* Flying Particles IN to the core */}
        <div className="absolute top-1/2 left-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
           <FlyingItem content={BookOpen} type="icon" delay={0} position={1} />
           <FlyingItem content="HISTORY" type="text" delay={0.2} position={2} />
           <FlyingItem content={Microscope} type="icon" delay={0.5} position={3} />
           <FlyingItem content="SCIENCE" type="text" delay={0.7} position={4} />
           <FlyingItem content={Atom} type="icon" delay={1.0} position={5} />
           <FlyingItem content="FACTS" type="text" delay={1.2} position={6} />
           <FlyingItem content={Globe} type="icon" delay={1.5} position={7} />
           <FlyingItem content="DATA" type="text" delay={1.7} position={8} />
           <FlyingItem content={Compass} type="icon" delay={2.0} position={9} />
           <FlyingItem content={ScrollText} type="icon" delay={2.2} position={10} />
        </div>
      </div>

      {/* Glassmorphic Fact / Status Display */}
      <div className="relative z-30 w-full max-w-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-white/10 text-center flex flex-col items-center transition-all duration-500">
        
        {/* Status header badge */}
        <div className="flex items-center gap-3 mb-5 px-4 py-1.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 border border-cyan-500/20">
            {step === 1 && <Globe className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin" />}
            {step === 2 && <Atom className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />}
            {step >= 3 && <Microscope className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-bounce" />}
            <h3 className="text-cyan-700 dark:text-cyan-400 font-bold text-[10px] md:text-xs tracking-[0.25em] uppercase font-display">
              {status}
            </h3>
        </div>

        {/* Grounded Fact display carousel */}
        <div className="flex-1 flex items-center justify-center min-h-[90px] md:min-h-[110px] px-4 w-full">
            {facts.length > 0 ? (
            <div key={currentFactIndex} className="animate-in slide-in-from-bottom-2 fade-in duration-500 max-w-xl">
                <p className="text-base md:text-xl text-slate-800 dark:text-slate-100 font-serif-display leading-relaxed italic">
                "{facts[currentFactIndex]}"
                </p>
            </div>
            ) : (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 italic font-light text-sm md:text-base">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                <span>Initializing Social Studio X Workspace...</span>
            </div>
            )}
        </div>
        
        {/* Tech Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 mt-6 rounded-full overflow-hidden border border-slate-200/40 dark:border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 transition-all duration-1000 ease-out relative overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.8)]"
              style={{ width: `${step * 25 + 10}%` }}
            >
                <div className="absolute inset-0 bg-white/50 animate-[shimmer_1s_infinite]"></div>
            </div>
        </div>

        {/* Interactive Progress Blueprint Checklist */}
        <div className="mt-6 w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-left pt-6 border-t border-slate-100 dark:border-white/5">
          {[
            { id: 1, label: "Search Grounding", desc: "Consulting web databases" },
            { id: 2, label: "Node Extraction", desc: "Isolating key factual rules" },
            { id: 3, label: "Aesthetic Blueprint", desc: "Formulating design instructions" },
            { id: 4, label: "Visual Synthesis", desc: "Generating high-fidelity canvas" }
          ].map((item) => {
            const isCompleted = step > item.id;
            const isActive = step === item.id;
            return (
              <div 
                key={item.id} 
                className={`p-3 rounded-2xl border transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : isActive 
                      ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-400 animate-pulse scale-[1.01]' 
                      : 'bg-slate-50/50 dark:bg-slate-950/20 border-transparent text-slate-400 dark:text-slate-600/70'
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border ${
                    isCompleted 
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-500 font-extrabold' 
                      : isActive 
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' 
                        : 'border-slate-300 dark:border-slate-800'
                  }`}>
                    {isCompleted ? "✓" : item.id}
                  </span>
                  <span>{item.label}</span>
                </div>
                <p className="text-[8px] md:text-[9px] font-medium opacity-75 mt-1 leading-normal">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
          @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
          }
      `}</style>

    </div>
  );
};

export default Loading;
