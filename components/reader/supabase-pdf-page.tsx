"use client";
import {useEffect,useRef,useState} from "react";

type Props={fileUrl:string;pageNumber:number;scale:number;onError:(message:string|null)=>void};
export function SupabasePdfPage({fileUrl,pageNumber,scale,onError}:Props){
 const canvasRef=useRef<HTMLCanvasElement|null>(null);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let cancelled=false;
  let renderTask:{cancel:()=>void}|undefined;
  let task:{destroy:()=>Promise<void>}|undefined;
  async function load(){
   setLoading(true);
   try{
    const response=await fetch(fileUrl+(fileUrl.includes("?")?"&":"?")+"page="+pageNumber,{cache:"no-store"});
    if(!response.ok){
      const payload=await response.json().catch(()=>({error:"Impossible d'ouvrir cette page."}));
      throw new Error(payload.error??"Lecture impossible");
    }
    const buffer=await response.arrayBuffer();
    if(cancelled)return;
    const pdfjs=await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc="/pdf.worker.min.mjs";
    const loadingTask=pdfjs.getDocument({data:new Uint8Array(buffer),isEvalSupported:false,useSystemFonts:true});
    task=loadingTask;
    const doc=await loadingTask.promise;
    if(cancelled)return;
    const page=await doc.getPage(1);
    if(cancelled)return;
    const viewport=page.getViewport({scale:Math.max(0.75,Math.min(2.2,scale))*1.35});
    const canvas=canvasRef.current;
    if(!canvas)return;
    canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    const ctx=canvas.getContext("2d",{alpha:false});
    if(!ctx)throw new Error("Affichage PDF incompatible avec ce navigateur.");
    renderTask=page.render({canvas,canvasContext:ctx,viewport});
    await (renderTask as ReturnType<typeof page.render>).promise;
    if(!cancelled)setLoading(false);
   }catch(error){
    if(!cancelled){setLoading(false);onError(error instanceof Error?error.message:"Page PDF indisponible.");}
   }
  }
  void load();
  return ()=>{cancelled=true;renderTask?.cancel();void task?.destroy();};
 },[fileUrl,pageNumber,scale,onError]);
 return <div className="relative flex min-h-[240px] justify-center bg-white">
  {loading?<p className="absolute inset-x-0 top-10 text-center text-sm text-slate-500" role="status">Chargement de la page {pageNumber}…</p>:null}
  <canvas ref={canvasRef} aria-label={"Page PDF "+pageNumber} className="h-auto max-w-full bg-white" style={{objectFit:"contain"}}/>
 </div>;
}
