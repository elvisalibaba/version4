import { chromium, webkit } from "playwright";

const base="http://127.0.0.1:3000";
const id="8a701e21-6636-4468-8b53-d827bf2ce409";
const edge="https://wgsvzhhzsmioihjwcwcs.supabase.co/functions/v1/holistic-reader-page?bookId="+id+"&page=1";

async function waitForServer(){
 for(let i=0;i<55;i++){
  try{const response=await fetch(base+"/__smoke__/reader");if(response.status===200)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 throw Error("Smoke reader server did not start");
}
await waitForServer();
const pdfResponse=await fetch(edge,{signal:AbortSignal.timeout(30000)});
if(!pdfResponse.ok)throw Error("Supabase guest sample unavailable: "+pdfResponse.status);
const pdf=new Uint8Array(await pdfResponse.arrayBuffer());
if(new TextDecoder().decode(pdf.slice(0,5))!=="%PDF-")throw Error("Invalid PDF sample");

for(const [name,type,mobile] of [["Chrome desktop",chromium,false],["Safari mobile (WebKit)",webkit,true]]){
 const browser=await type.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1320,height:920},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage();
 const pageErrors=[];
 page.on("pageerror",e=>pageErrors.push(String(e)));
 await page.route("**/api/read/"+id,route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
   readerUrl:"/api/read/"+id+"/file",fileType:"pdf",deliveryMode:"pdf_pages",pageCount:260,
   isGuestPreview:true,previewPageLimit:10
 })}));
 await page.route("**/api/read/"+id+"/file?page=*",route=>route.fulfill({status:200,contentType:"application/pdf",body:Buffer.from(pdf)}));
 await page.route("**/api/auth/me",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({data:null})}));
 await page.goto(base+"/__smoke__/reader",{waitUntil:"domcontentloaded",timeout:40000});
 await page.waitForFunction(()=>{
  const canvas=document.querySelector('canvas[aria-label="Page PDF 1"]');
  const native=document.querySelector('iframe[title="Page PDF 1"]');
  return !!native || !!canvas && canvas.width>0 && getComputedStyle(canvas).display!=="none";
 },undefined,{timeout:50000});
 if(pageErrors.length)throw Error(name+" JS runtime errors: "+pageErrors.join("; ").slice(0,1500));
 console.log("PASS "+name+": guest PDF first page displayed without JavaScript error");
 await page.keyboard.press("ArrowRight");
 for(let i=0;i<9;i++)await page.keyboard.press("ArrowRight");
 await page.getByText("Vous avez lu les 10 pages gratuites.").waitFor({state:"visible",timeout:12000});
 console.log("PASS "+name+": 10-page limit displays signup prompt");
 await context.close();await browser.close();
}
