// Public smoke test. Never prints a book's pages or credentials.
const base = "https://wgsvzhhzsmioihjwcwcs.supabase.co/functions/v1/holistic-reader-page";
const samples = [
  { id: "8a701e21-6636-4468-8b53-d827bf2ce409", kind: "pdf" },
  { id: "cb44dcaf-112a-4765-a155-bb9a1deb75fe", kind: "epub" },
];
const visit = async (id, params = {}) => {
  const u = new URL(base);
  u.searchParams.set("bookId", id);
  for (const [key, value] of Object.entries(params)) u.searchParams.set(key, String(value));
  return await fetch(u, { signal: AbortSignal.timeout(20000), cache: "no-store" });
};
for (const item of samples) {
  const meta = await visit(item.id, {mode: "info"});
  if (!meta.ok) throw Error(`${item.kind}: metadata status ${meta.status} (expected 200)`);
  const info = await meta.json();
  if (info.fileType !== item.kind || !Number.isInteger(info.pageCount) || info.pageCount < 1) throw Error(`${item.kind}: invalid metadata`);
  const first = await visit(item.id, {page:1});
  if (!first.ok) throw Error(`${item.kind}: page 1 status ${first.status}`);
  if (item.kind === "pdf") {
    if (!first.headers.get("content-type")?.includes("application/pdf")) throw Error("PDF preview has incorrect MIME type");
    const bytes = new Uint8Array(await first.arrayBuffer());
    if (new TextDecoder().decode(bytes.subarray(0,5)) !== "%PDF-") throw Error("PDF page response is invalid");
  } else {
    const content = await first.json();
    if (typeof content.text !== "string" || content.text.length === 0) throw Error("EPUB page is empty");
  }
  const denied = await visit(item.id, {page:11});
  if (denied.status !== 401) throw Error(`${item.kind}: anonymous page 11 must be denied, got ${denied.status}`);
  const denial = await denied.json();
  if (denial.code !== "LOGIN_REQUIRED") throw Error(`${item.kind}: wrong guest gate response`);
  console.log(`PASS ${item.kind}: metadata, preview page 1, anonymous page 11 blocked; ${info.pageCount} pages`);
}
