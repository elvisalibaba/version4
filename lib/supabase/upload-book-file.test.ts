import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadBookFile } from "./upload-book-file";

class UploadRequest {
  static instances: UploadRequest[] = [];
  status = 0;
  timeout = 0;
  upload: { onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  ontimeout?: () => void;
  onabort?: () => void;
  open = vi.fn();
  send = vi.fn();

  constructor() {
    UploadRequest.instances.push(this);
  }
}

function storageClient(error: { message: string } | null = null) {
  return {
    storage: {
      from: () => ({
        createSignedUploadUrl: async () => ({
          data: error ? null : { signedUrl: "https://storage.example/upload?token=test" },
          error,
        }),
      }),
    },
  } as unknown as Parameters<typeof uploadBookFile>[0];
}

describe("book upload progress", () => {
  beforeEach(() => {
    UploadRequest.instances = [];
    vi.stubGlobal("XMLHttpRequest", UploadRequest);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows transferred bytes and completes only after Storage accepts the upload", async () => {
    const progress = vi.fn();
    const result = uploadBookFile(storageClient(), "files/author/book.pdf", new File(["pdf"], "book.pdf"), progress);
    await vi.waitFor(() => expect(UploadRequest.instances).toHaveLength(1));
    const request = UploadRequest.instances[0];
    request.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 });
    expect(progress).toHaveBeenLastCalledWith(25);
    request.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
    expect(progress).toHaveBeenLastCalledWith(99);
    request.status = 200;
    request.onload?.();
    await expect(result).resolves.toBe("files/author/book.pdf");
    expect(progress).toHaveBeenLastCalledWith(100);
  });

  it("keeps a rejected upload from appearing complete", async () => {
    const progress = vi.fn();
    const result = uploadBookFile(storageClient(), "files/author/book.pdf", new File(["pdf"], "book.pdf"), progress);
    const failure = expect(result).rejects.toThrow("échoué");
    await vi.waitFor(() => expect(UploadRequest.instances).toHaveLength(1));
    const request = UploadRequest.instances[0];
    request.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
    request.status = 500;
    request.onload?.();
    await failure;
    expect(progress).not.toHaveBeenCalledWith(100);
  });

  it("does not send a file when upload authorization fails", async () => {
    await expect(uploadBookFile(storageClient({ message: "Accès refusé" }), "files/author/book.pdf", new File(["pdf"], "book.pdf"), vi.fn())).rejects.toThrow("Accès refusé");
    expect(UploadRequest.instances).toHaveLength(0);
  });
});
