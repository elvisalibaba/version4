"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

type Action="admin_publish"|"approve"|"request_changes"|"reject"|"publish"|"coming_soon"|"unpublish"|"archive"|"reset_draft"|"rights_clear"|"rights_review"|"rights_block";
type BookState={id:string;status:string;review_status:string;copyright_status:string;cover_url:string|null;file_url:string|null};
type Choice={id:Action;label:string;danger?:boolean;requiresNote?:boolean};

/**
 * Livre ajouté par l'équipe (import admin, sans auteur ou créé par un admin) : un seul bouton
 * « Valider et publier » + référence des droits obligatoire. Livre d'auteur : circuit habituel
 * (soumis → validé → publié).
 */
export function BookWorkflowControls({book,addedByAdmin=false}:{book:BookState;addedByAdmin?:boolean}){
 const router=useRouter();
 const [note,setNote]=useState("");
 const [rightsReference,setRightsReference]=useState("");
 const [busy,setBusy]=useState<Action|null>(null);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const quickPublish=addedByAdmin&&book.status!=="published"&&book.copyright_status!=="blocked";

 const options:Choice[]=[];
 if(quickPublish){
  if(book.status!=="archived")options.push({id:"archive",label:"Archiver"});
  options.push({id:"rights_block",label:"Bloquer les droits",danger:true,requiresNote:true});
 }else{
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
 }

 async function send(action:Action){
  setBusy(action);setError("");setMessage("");
  try{
   const res=await fetch(`/api/admin/books/${book.id}/transition`,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,note,rightsReference}),
   });
   const json=await res.json() as {message?:string};
   if(!res.ok)throw new Error(json.message??"Modification impossible");
   setMessage(action==="admin_publish"?"Livre validé et publié. Il est visible dans la librairie.":"Modification enregistrée et historisée.");
   setNote("");setRightsReference("");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Erreur lors de la mise à jour.");}
  finally{setBusy(null);}
 }
 async function perform(choice:Choice){
  if(choice.requiresNote&&!note.trim()){setError("Veuillez indiquer un motif ou une référence.");return;}
  if(choice.danger&&!window.confirm(`Confirmer : ${choice.label} ?`))return;
  await send(choice.id);
 }
 async function publishNow(){
  if(!rightsReference.trim()){setError("La référence des droits est obligatoire pour publier.");return;}
  if(!window.confirm("Valider les droits, approuver et publier ce livre maintenant ?"))return;
  await send("admin_publish");
 }

 return <section className="rounded-md border border-rule-strong bg-white p-5 sm:p-6">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h2 className="text-lg font-bold text-night-900">Validation et publication</h2>
   <span className="text-xs text-slate-500">{addedByAdmin?"Livre ajouté par l’équipe":"Livre soumis par un auteur"}</span>
  </div>
  <p className="mt-2 text-sm text-slate-600">Révision : <strong>{book.review_status}</strong> · Publication : <strong>{book.status}</strong> · Droits : <strong>{book.copyright_status}</strong></p>

  {quickPublish?<div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50/60 p-4">
   <label className="block text-sm font-semibold text-night-900">Référence des droits <span className="text-red-700">*</span>
    <input value={rightsReference} onChange={e=>setRightsReference(e.target.value)} maxLength={500} required
     className="mt-2 h-11 w-full rounded-md border border-rule-strong bg-white px-3 text-base font-normal sm:text-sm"
     placeholder="Contrat, autorisation de l’auteur, domaine public…"/>
   </label>
   <label className="mt-3 block text-sm font-semibold text-night-900">Note (facultative)
    <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000} rows={2} className="mt-2 w-full rounded-md border border-rule-strong bg-white p-3 text-base font-normal sm:text-sm"/>
   </label>
   <p className="mt-2 text-xs text-slate-600">Vérifie la couverture et le fichier dans le stockage, confirme les droits, approuve et publie en une seule opération.</p>
   <button type="button" disabled={busy!==null} onClick={()=>void publishNow()}
    className="mt-4 rounded-sm bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
    {busy==="admin_publish"?"Publication…":"Valider et publier"}
   </button>
  </div>:<label className="mt-5 block text-sm font-semibold">Motif, commentaire ou référence des droits
   <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000} rows={3} className="mt-2 w-full rounded-md border border-rule-strong bg-white p-3 text-base font-normal sm:text-sm" placeholder="Motif du refus, demande de corrections, référence de licence…"/>
  </label>}

  {options.length?<div className="mt-4 flex flex-wrap gap-2">
   {quickPublish?<p className="w-full text-xs font-semibold uppercase tracking-wide text-slate-500">Autres actions</p>:null}
   {options.map(choice=><button key={choice.id} type="button" disabled={busy!==null}
    onClick={()=>void perform(choice)}
    className={`rounded-sm px-4 py-2.5 text-sm font-bold disabled:opacity-50 ${choice.danger?"border border-red-200 bg-red-50 text-red-800":quickPublish?"border border-rule-strong bg-white text-night-900":"bg-night-900 text-white"}`}>
    {busy===choice.id?"Enregistrement…":choice.label}
   </button>)}
  </div>:null}
  {quickPublish&&options.some(o=>o.requiresNote)?<p className="mt-2 text-xs text-slate-500">« Bloquer les droits » utilise la note comme motif.</p>:null}
  {!options.length&&!quickPublish?<p className="mt-3 text-sm text-slate-500">Aucune action disponible pour cet état.</p>:null}
  {error?<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>:null}
  {message?<p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>:null}
 </section>;
}
