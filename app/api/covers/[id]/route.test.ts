import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("../../../../lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { GET } from "./route";

const id = "e53fbed9-7f51-47e9-a513-f71926b99b96";
const request = (bookId=id) => new Request("https://test.example/api/covers/" + bookId);
const published = { cover_url: "covers/owner/original.png", cover_thumbnail_url: "covers/owner/thumb.png", status: "published", review_status: "approved", copyright_status: "clear" };

function mockDb(book: typeof published | null, signed: (path: string) => unknown) {
  const createSignedUrl = vi.fn(async (path: string) => signed(path));
  mocks.createClient.mockResolvedValue({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: book, error: null }) }) }) }),
    storage: { from: () => ({ createSignedUrl }) },
  });
  return createSignedUrl;
}
beforeEach(() => {
  mocks.createClient.mockReset();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([137,80,78,71,1,2,3]),{headers:{"Content-Type":"image/png"}})));
});
afterEach(() => vi.unstubAllGlobals());

describe("stable public book cover proxy", () => {
  it("returns an image for an approved published book", async () => {
    const signer=mockDb(published, () => ({ data:{signedUrl:"https://storage.example/c.png"},error:null }));
    const response=await GET(request(), {params:Promise.resolve({id})});
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
    expect(signer).toHaveBeenCalledWith(published.cover_thumbnail_url, 120);
  });
  it("uses the original cover when the thumbnail is missing", async () => {
    const signer=mockDb(published, (path) => path.endsWith("thumb.png")
       ? ({ data:null,error:{message:"missing"} })
       : ({ data:{signedUrl:"https://storage.example/original.png"},error:null }));
    const response=await GET(request(),{params:Promise.resolve({id})});
    expect(response.status).toBe(200);
    expect(signer).toHaveBeenCalledTimes(2);
  });
  it("never exposes covers belonging to drafts", async () => {
    mockDb({ ...published,status:"draft" },()=>({data:{signedUrl:"https://storage.example/c.png"},error:null}));
    const response=await GET(request(),{params:Promise.resolve({id})});
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/pwa-icon-512.png");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("rejects invalid identifiers without touching Supabase", async () => {
    const response=await GET(request("bad"),{params:Promise.resolve({id:"bad"})});
    expect(response.status).toBe(404);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
