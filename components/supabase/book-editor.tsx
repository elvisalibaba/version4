"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BookDraft = {
  id?: string;
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  author_display_name?: string | null;
  publisher?: string | null;
  isbn?: string | null;
  language?: string | null;
  price?: number | string;
  categories?: string[];
  tags?: string[];
  cover_url?: string | null;
  file_url?: string | null;
};

export function SupabaseBookEditor({ book, area }: { book?: BookDraft; area: "admin" | "author" }) {
  const router=useRouter();
  const [title,setTitle]=useState(book?.title??"");
  const [subtitle,setSubtitle]=useState(book?.subtitle??"");
  const [description,setDescription]=useState(book?.description??"");
  const [author,setAuthor]=useState(book?.author_display_name??"");
  const [publisher,setPublisher]=useState(book?.publisher??"");
  const [isbn,setIsbn]=useState(book?.isbn??"");
  const [language,setLanguage]=useState(book?.language??"fr");
  const [price,setPrice]=useState(String(book?.price??0));
  const [categories,setCategories]=useState((book?.categories??[]).join(", "));
  const [tags,setTags]=useState((book?.tags??[]).join(", "));
  const [cover,setCover]=useState<File|null>(null);
  const [document,setDocument]=useState<File|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const inputStyle="h-11 w-full rounded-md border border-rule bg-white px-3 text-sm text-night-900 focus:border-night-900 outline-none";
  async function upload(file:File,kind:"covers"|"files",userId:string,bookId:string) {
    if (file.size>80*1024*1024) throw new Error("Fichier trop volumineux (maximum 80 Mo).");
    const extension=file.name.split(".").pop()?.toLowerCase()??"";
    if(kind==="covers" && !["jpg","jpeg","png","webp"].includes(extension))
      throw new Error("Couverture : JPG, PNG ou WebP uniquement.");
    if(kind==="files" && !["pdf","epub"].includes(extension))
      throw new Error("Livre : PDF ou EPUB uniquement.");
    const path=`${kind}/${userId}/${bookId}/${crypto.randomUUID()}.${extension}`;
    const client=createClient();
    const {error:uploadError}=await client.storage.from("books").upload(path,file,{
      cacheControl:"3600",
      contentType: kind==="covers" ? file.type || "image/jpeg" : extension==="pdf" ? "application/pdf" : "application/epub+zip",
      upsert:false,
    });
    if(uploadError)throw new Error(uploadError.message);
    return path;
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!title.trim())return;
    setLoading(true);setError("");setMessage("");
    try{
      const client=createClient();
      const {data:{user}}=await client.auth.getUser();
      if(!user)throw new Error("Reconnectez-vous à votre compte.");
      const payload={title,subtitle,description,author_display_name:author,publisher,isbn,language,price:Number(price),
        categories:categories.split(",").map(s=>s.trim()).filter(Boolean),
        tags:tags.split(",").map(s=>s.trim()).filter(Boolean)};
      const saved=await fetch(book?.id?`/api/supabase/books/${book.id}`:"/api/supabase/books",{
        method:book?.id?"PATCH":"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload),
      });
      const result=await saved.json();
      if(!saved.ok)throw new Error(result.message??"Enregistrement impossible.");
      const id=book?.id??result.id as string;
      const assets:Record<string,string>={};
      if(cover)assets.cover_url=await upload(cover,"covers",user.id,id);
      if(document){
        assets.file_url=await upload(document,"files",user.id,id);
        assets.file_format=document.name.toLowerCase().endsWith(".pdf")?"pdf":"epub";
      }
      if(Object.keys(assets).length){
        const synced=await fetch(`/api/supabase/books/${id}`,{
          method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(assets)
        });
        const detail=await synced.json();
        if(!synced.ok)throw new Error(detail.message??"Fichier importé mais référencement impossible.");
      }
      setMessage("Brouillon et fichiers enregistrés dans Supabase.");
      router.refresh();
      router.push(area==="admin"?"/admin/books":"/dashboard/author/books");
    }catch(caught){
      setError(caught instanceof Error?caught.message:"Erreur inattendue lors de l'enregistrement.");
    }finally{setLoading(false);}
  }
  return <form onSubmit={submit} className="space-y-5 rounded-md border border-rule bg-white p-5 sm:p-8">
    <p className="text-sm text-slate-600">Enregistrez le titre en brouillon. Sa publication nécessite la validation des droits et de l'équipe éditoriale.</p>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="space-y-1 text-sm font-semibold">Titre *
        <input className={inputStyle} required maxLength={250} value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <label className="space-y-1 text-sm font-semibold">Sous-titre
        <input className={inputStyle} maxLength={250} value={subtitle} onChange={e=>setSubtitle(e.target.value)}/></label>
      <label className="space-y-1 text-sm font-semibold">Nom de l'auteur / mention
        <input className={inputStyle} maxLength={250} placeholder="Sans auteur, collectif, institution…" value={author} onChange={e=>setAuthor(e.target.value)}/></label>
      <label className="space-y-1 text-sm font-semibold">Maison d'édition
        <input className={inputStyle} maxLength={250} value={publisher} onChange={e=>setPublisher(e.target.value)}/></label>
      <label className="space-y-1 text-sm font-semibold">ISBN
        <input className={inputStyle} maxLength={30} value={isbn} onChange={e=>setIsbn(e.target.value)}/></label>
      <label className="space-y-1 text-sm font-semibold">Langue
        <input className={inputStyle} value={language} onChange={e=>setLanguage(e.target.value)}/></label>
      <label className="space-y-1 text-sm font-semibold">Prix (USD)
        <input type="number" step="0.01" min="0" max="100000000" className={inputStyle} value={price} onChange={e=>setPrice(e.target.value)}/></label>
      <label className="space-y-1 text-sm font-semibold">Catégories (virgules)
        <input className={inputStyle} value={categories} onChange={e=>setCategories(e.target.value)}/></label>
      <label className="space-y-1 text-sm font-semibold">Étiquettes (virgules)
        <input className={inputStyle} value={tags} onChange={e=>setTags(e.target.value)}/></label>
    </div>
    <label className="block space-y-1 text-sm font-semibold">Description
      <textarea rows={5} className="w-full rounded-md border border-rule bg-white p-3 font-normal" value={description} onChange={e=>setDescription(e.target.value)}/></label>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block space-y-2 text-sm font-semibold">Couverture (PNG, JPG, WebP)
        <input className="block w-full text-sm font-normal" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={e=>setCover(e.target.files?.[0]??null)}/></label>
      <label className="block space-y-2 text-sm font-semibold">Fichier du livre (PDF ou EPUB, privé)
        <input className="block w-full text-sm font-normal" type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" onChange={e=>setDocument(e.target.files?.[0]??null)}/></label>
    </div>
    {error?<p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>:null}
    {message?<p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">{message}</p>:null}
    <button type="submit" disabled={loading} className="rounded-sm bg-night-900 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
      {loading?"Enregistrement…":"Enregistrer le brouillon"}</button>
  </form>;
}
