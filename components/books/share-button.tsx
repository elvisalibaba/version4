"use client";
import {useState} from "react";
import {Check,Copy,MessageCircle,Share2} from "lucide-react";
export function ShareButton({title,bookId}:{title:string;bookId?:string}){
 const [open,setOpen]=useState(false);
 const [copied,setCopied]=useState(false);
 const url=()=>bookId?window.location.origin+"/book/"+encodeURIComponent(bookId):window.location.href.split("?")[0];
 const description=()=>"Découvrez « "+title+" » sur HolisticBooks. Lisez les dix premières pages gratuitement, sans compte !";
 async function copy(){
  try{await navigator.clipboard.writeText(url());setCopied(true);setTimeout(()=>setCopied(false),2200);}catch{setCopied(false)}
 }
 function whatsapp(){window.open("https://wa.me/?text="+encodeURIComponent(description()+"\n"+url()),"_blank","noopener,noreferrer");}
 async function native(){if(!navigator.share)return;try{await navigator.share({title,text:description(),url:url()});}catch{/* share cancelled */}}
 return <div className="relative">
  <button type="button" onClick={()=>setOpen(x=>!x)} aria-expanded={open}
   className="inline-flex h-10 items-center gap-2 rounded-sm border border-rule-strong bg-white px-3.5 text-sm font-semibold text-night-900 transition hover:border-night-900">
   <Share2 aria-hidden="true" className="h-4 w-4"/> Partager
  </button>
  {open?<div className="absolute left-0 top-12 z-30 w-64 rounded-md border border-rule-strong bg-white p-2 shadow-xl">
   <p className="px-3 pb-2 pt-1 text-xs font-semibold text-slate-500">Partager ce livre</p>
   <button type="button" onClick={whatsapp} className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold hover:bg-emerald-50"><MessageCircle className="h-4 w-4 text-emerald-700"/> WhatsApp</button>
   <button type="button" onClick={()=>void copy()} className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold hover:bg-paper">{copied?<Check className="h-4 w-4 text-emerald-700"/>:<Copy className="h-4 w-4"/>} {copied?"Lien copié":"Copier le lien"}</button>
   <button type="button" onClick={()=>void native()} className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold hover:bg-paper"><Share2 className="h-4 w-4"/> Autres applications</button>
  </div>:null}
 </div>;
}
