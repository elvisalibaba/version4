"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

type Action="approve"|"request_changes"|"reject"|"publish"|"coming_soon"|"unpublish"|"archive"|"reset_draft"|"rights_clear"|"rights_review"|"rights_block";
type BookState={id:string;status:string;review_status:string;copyright_status:string;cover_url:string|null;file_url:string|null};
type Choice={id:Action;label:string;danger?:boolean;requiresNote?:boolean};
export function BookWorkflowControls({book}:{book:BookState}){
 const router=useRouter();
 const [note,setNote]=useState("");
 const [busy,setBusy]=useState<Action|null>(null);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const options:Choice[]=[];
 if(book.review_status==="submitted"){
  options.push({id:"approve",label:"Valider le livre"});
  options.push({id:"request_changes",label:"Demander des corrections",requiresNote:true});
  options.push({id:"reject",label:"Refuser",danger:true,requiresNote:true});
 }
 if(book.review_status==="approved"&&book.copyright_status==="clear"){
  if(book.status!=="published")options.push({id:"publish",label:"Publier"});
  if(book.status!=="coming_soon")options.push({id:"coming_soon",label:"À paraître"});
 }
 if(book.status==="published"||book.status==="coming_soon")options.push({id:"unpublish",label:"Dépublier",danger:true});
 if(book.status!=="archived")options.push({id:"archive",label:"Archiver"});
 if(book.status!=="published"&&book.review_status!=="draft")options.push({id:"reset_draft",label:"Remettre en brouillon"});
 if(book.copyright_status!=="clear")options.push({id:"rights_clear",label:"Confirmer les droits",requiresNote:true});
 if(book.copyright_status!=="review")options.push({id:"rights_review",label:"Droits à vérifier",danger:true});
 if(book.copyright_status!=="blocked")options.push({id:"rights_block",label:"Bloquer les droits",danger:true,requiresNote:true});
 async function perform(choice:Choice){
  if(choice.requiresNote&&!note.trim()){setError("Veuillez indiquer un motif ou une référence.");return;}
  if(choice.danger&&!window.confirm(`Confirmer : ${choice.label} ?`))return;
  setBusy(choice.id);setError("");setMessage("");
  try{
   const res=await fetch(`/api/admin/books/${book.id}/transition`,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:choice.id,note}),
   });
   const json=await res.json() as {message?:string};
   if(!res.ok)throw new Error(json.message??"Modification impossible");
   setMessage("Modification enregistrée et historisée.");
   setNote("");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Erreur lors de la mise à jour.");}
  finally{setBusy(null);}
 }
 return <section className="rounded-md border border-rule-strong bg-white p-5 sm:p-6">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h2 className="text-lg font-bold text-night-900">Validation et publication</h2>
   <span className="text-xs text-slate-500">Réservé aux administrateurs</span>
  </div>
  <p className="mt-2 text-sm text-slate-600">Révision : <strong>{book.review_status}</strong> · Publication : <strong>{book.status}</strong> · Droits : <strong>{book.copyright_status}</strong></p>
  <p className="mt-2 text-xs text-slate-500">Pour publier, le livre doit être approuvé, avoir des droits confirmés, une couverture et un fichier présent dans le stockage privé.</p>
  <label className="mt-5 block text-sm font-semibold">Motif, commentaire ou référence des droits
   <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000} rows={3} className="mt-2 w-full rounded-md border border-rule-strong bg-white p-3 text-sm font-normal" placeholder="Motif du refus, demande de corrections, référence de licence…"/>
  </label>
  <div className="mt-4 flex flex-wrap gap-2">
   {options.map(choice=><button key={choice.id} type="button" disabled={busy!==null}
    onClick={()=>void perform(choice)}
    className={`rounded-sm px-4 py-2.5 text-sm font-bold disabled:opacity-50 ${choice.danger?"border border-red-200 bg-red-50 text-red-800":"bg-night-900 text-white"}`}>
    {busy===choice.id?"Enregistrement…":choice.label}
   </button>)}
  </div>
  {!options.length?<p className="mt-3 text-sm text-slate-500">Aucune action disponible pour cet état.</p>:null}
  {error?<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>:null}
  {message?<p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>:null}
 </section>;
}
