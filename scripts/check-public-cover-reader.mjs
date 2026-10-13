// Public production-like checks. Never fetch a complete book or require credentials.
const base = process.env.HOLISTIC_PUBLIC_SMOKE_URL?.replace(/\/$/, "");
if (!base || !/^https:\/\//.test(base)) throw Error("Set HOLISTIC_PUBLIC_SMOKE_URL to a HTTPS preview");
const id = "e53fbed9-7f51-47e9-a513-f71926b99b96";
async function get(path) {
 const response = await fetch(base + path, { cache: "no-store", signal: AbortSignal.timeout(30_000), redirect: "manual" });
 return response;
}
const cover = await get("/api/covers/" + id);
if (cover.status !== 200 || !/^image\/(?:png|jpeg|webp|avif)/i.test(cover.headers.get("content-type")??"")) {
 throw Error("Public cover failed: status=" + cover.status + " type=" + cover.headers.get("content-type"));
}
if ((await cover.arrayBuffer()).byteLength < 500) throw Error("Cover image unexpectedly empty");
console.log("PASS: cover publicly accessible, image bytes received");
const infoResponse = await get("/api/read/" + id);
if (infoResponse.status!==200) throw Error("Anonymous reader metadata failed: "+infoResponse.status);
const info=await infoResponse.json();
if(info.fileType!=="pdf"||info.previewPageLimit!==10||info.isGuestPreview!==true||info.deliveryMode!=="pdf_pages")throw Error("Invalid guest reader metadata");
console.log("PASS: guest PDF reader metadata, 10-page limit");
const page = await get("/api/read/" + id + "/file?page=1");
if (page.status!==200 || !(page.headers.get("content-type")??"").includes("application/pdf"))throw Error("First guest page unavailable: "+page.status);
const pdf = new Uint8Array(await page.arrayBuffer());
if(new TextDecoder().decode(pdf.subarray(0,5))!=="%PDF-")throw Error("First page is not a valid PDF response");
console.log("PASS: first PDF page delivered");
const denied=await get("/api/read/" + id + "/file?page=11");
if(denied.status!==401)throw Error("Guest page 11 must return 401, got "+denied.status);
console.log("PASS: page 11 blocked for anonymous visitors");
