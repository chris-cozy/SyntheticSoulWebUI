// src/InsightsPanel.tsx
import NeonRadar from "./NeonRadar";
import NeonEmotionRadar from "./NeonEmotionRadar";
import { useState } from "react";

type ScalarDim = { description?: string; value: number; min?: number; max?: number };
type PersonalityMatrix = Record<string, ScalarDim>;
type EmotionMatrix = Record<string, ScalarDim>;

export default function InsightsPanel({
  personality,
  emotions,
  latestThought,
}: {
  personality?: PersonalityMatrix;
  emotions?: EmotionMatrix;
  latestThought: string;
}) {
    const [pView, setPView] = useState<"bars"|"radar">(localStorage.getItem("agentPanel.view") as any || "radar");
    const [eView, setEView] = useState<"bars"|"radar">(localStorage.getItem("agentPanel.emoView") as any || "bars");

    const setPV = (v:"bars"|"radar") => { setPView(v); localStorage.setItem("agentPanel.view", v); }
    const setEV = (v:"bars"|"radar") => { setEView(v); localStorage.setItem("agentPanel.emoView", v); }

    return (
        <div className="flex h-full flex-col gap-3">
        {/* Personality */}
        {personality && (
            <section className="rounded-2xl border border-emerald-400/30 bg-black/50 p-3">
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-emerald-400/80">
                    <span>personality matrix</span>
                    <div className="flex overflow-hidden rounded border border-emerald-700/30">
                        <button className={`px-2 py-0.5 ${pView==="bars"?"bg-emerald-900/40 text-emerald-200":"text-emerald-300/70"}`} onClick={()=>setPV("bars")}>bars</button>
                        <button className={`px-2 py-0.5 border-l border-emerald-700/30 ${pView==="radar"?"bg-emerald-900/40 text-emerald-200":"text-emerald-300/70"}`} onClick={()=>setPV("radar")}>radar</button>
                    </div>
                </div>
                {pView==="radar" ? (
                <NeonRadar title="personality" dims={Object.entries(personality).map(([k,v]:any)=>({label:k,value:v?.value,min:v?.min,max:v?.max}))} />
                ) : (
                    <div className="grid grid-cols-1 gap-2 mt-2">
                        {Object.entries(personality).map(([k,v]:any)=>(
                        <div key={k} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">
                            <span className="truncate">{k.replace(/_/g," ")}</span>
                            <span className="text-emerald-400/70 tabular-nums">{Math.round(v?.value??0)}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded bg-emerald-900/30">
                            <div className="h-2 rounded bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-600 [animation:barflow_3s_ease-in-out_infinite]" style={{width:`${Math.max(0,Math.min(100,((v?.value-(v?.min??0))/((v?.max??100)-(v?.min??0)||1))*100))}%`}} />
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </section>
        )}
        
        
        {/* Emotions */}
        {emotions && (
            <section className="rounded-2xl border border-emerald-400/30 bg-black/50 p-3">
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-emerald-400/80">
                <span>emotional status</span>
                <div className="flex overflow-hidden rounded border border-emerald-700/30">
                    <button className={`px-2 py-0.5 ${eView==="bars"?"bg-emerald-900/40 text-emerald-200":"text-emerald-300/70"}`} onClick={()=>setEV("bars")}>bars</button>
                    <button className={`px-2 py-0.5 border-l border-emerald-700/30 ${eView==="radar"?"bg-emerald-900/40 text-emerald-200":"text-emerald-300/70"}`} onClick={()=>setEV("radar")}>radar</button>
                </div>
            </div>
            {eView==="radar" ? (
                <NeonEmotionRadar title="emotions"
                    dims={["joy","love","surprise","anger","fear","sadness","disgust"].filter(k=>k in emotions).map((k:any)=>({label:k,value:(emotions as any)[k]?.value,min:(emotions as any)[k]?.min,max:(emotions as any)[k]?.max}))} />
            ) : (
                <div className="grid grid-cols-1 gap-2 mt-2">
                    {Object.entries(emotions).map(([k,v]:any)=>(
                    <div key={k} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">
                        <span className="truncate">{k}</span>
                        <span className="text-emerald-400/70 tabular-nums">{Math.round(v?.value??0)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded bg-emerald-900/30">
                        <div className="h-2 rounded bg-gradient-to-r from-emerald-400 to-cyan-400 [animation:barflow_3s_ease-in-out_infinite]" style={{width:`${Math.max(0,Math.min(100,((v?.value-(v?.min??0))/((v?.max??100)-(v?.min??0)||1))*100))}%`}} />
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </section>
        )}
        <section className="rounded-2xl border border-orange-400/40 bg-black/60 p-3 text-orange-200">
            <div className="mb-1 text-[11px] md:text-[12px] lg:text-sm uppercase tracking-widest text-orange-300/80">
            latest thought
            </div>
            <p className="text-[12px] md:text-[13px] lg:text-[16px] lg:text-sm leading-relaxed">
            {latestThought || "No recent thought."}
            </p>
        </section>
    </div>
    );
}
