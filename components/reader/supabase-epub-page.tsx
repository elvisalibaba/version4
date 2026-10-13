"use client";
import {useEffect,useState} from "react";
export function SupabaseEpubPage({fileUrl,page,onError,onLoginRequired,fontSize=105,theme="light",lineHeight=1.7}:{fileUrl:string;page:number;onError:(message:string|null)=>void;onLoginRequired:()=>void;fontSize?:number;theme?:"light"|"sepia"|"dark";lineHeight?:number}){
 const [text,setText]=useState<string|null>(null);
 useEffect(()=>{
  let cancelled=false;
  async function run(){
   setText(null);
   try{
    const res=await fetch(fileUrl+(fileUrl.includes("?")?"&":"?")+"page="+page,{cache:"no-store"});
    if(res.status===401){if(!cancelled)onLoginRequired();return;}
    const data=await res.json();
    if(!res.ok)throw new Error(data.error??"Impossible de charger ce chapitre.");
    if(!cancelled)setText(typeof data.text==="string"?data.text:"");
   }catch(e){if(!cancelled)onError(e instanceof Error?e.message:"Erreur de lecture EPUB.");}
  }
  void run();
  return ()=>{cancelled=true;};
 },[fileUrl,page,onError,onLoginRequired]);
 return <div className={`h-full w-full overflow-auto rounded-lg p-4 shadow-sm sm:p-8 lg:p-12 ${theme==="dark"?"bg-slate-900 text-slate-100":theme==="sepia"?"bg-amber-50 text-amber-950":"bg-white text-slate-900"}`} onContextMenu={e=>e.preventDefault()}>
  {text===null?<p role="status" className="text-sm text-slate-500">Préparation de la page {page}…</p>:
   <article style={{fontSize:`${fontSize}%`,lineHeight}} className="mx-auto max-w-[74ch] whitespace-pre-wrap font-serif">{text}</article>}
 </div>;
}
