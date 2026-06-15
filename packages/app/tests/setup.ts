// Node 20+ exposes a global (undici) `Blob`/`File`, but vitest's jsdom environment
// only provides a `FileReader` that recognizes jsdom blobs — so reading a real
// uploaded file under the test environment throws "parameter 1 is not of type 'Blob'".
// Real browsers don't have this split, so we provide
// a minimal `FileReader` here that delegates to `Blob.text()`/`Blob.arrayBuffer()`.
class TestFileReader extends EventTarget {
  result: string | ArrayBuffer | null = null;
  error: unknown = null;
  onload: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  #read(promise: Promise<string | ArrayBuffer>) {
    promise.then(
      (value) => {
        this.result = value;
        const ev = new Event("load");
        this.onload?.(ev);
        this.dispatchEvent(ev);
      },
      (err) => {
        this.error = err;
        const ev = new Event("error");
        this.onerror?.(ev);
        this.dispatchEvent(ev);
      }
    );
  }

  readAsText(blob: Blob) {
    this.#read(blob.text());
  }

  readAsArrayBuffer(blob: Blob) {
    this.#read(blob.arrayBuffer());
  }
}

globalThis.FileReader = TestFileReader as unknown as typeof FileReader;
