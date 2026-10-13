"use client";
import {useEffect,useState} from "react";
export function SupabaseEpubPage({fileUrl,page,onError,onLoginRequired}:{fileUrl:string;page:number;onError:(message:string|null)=>void;onLoginRequired:()=>void}){
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
 return <div className="h-full w-full overflow-auto rounded-md bg-white p-6 shadow-sm sm:p-10" onContextMenu={e=>e.preventDefault()}>
  {text===null?<p role="status" className="text-sm text-slate-500">Préparation de la page {page}…</p>:
   <article className="mx-auto max-w-prose whitespace-pre-wrap font-serif text-[1.08rem] leading-8 text-slate-900">{text}</article>}
 </div>;
}
