import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mocked collaborators. file-sync's module-scoped state persists across imports,
// so each test re-imports the module via vi.resetModules() (below) for isolation.
const exportToJson = vi.fn<[], Promise<string>>();
const encrypt = vi.fn<[string, string], Promise<ArrayBuffer>>();
const writeFileToHandle = vi.fn<[FileSystemFileHandle, BufferSource], Promise<void>>();
const queryReadWritePermission = vi.fn<[FileSystemFileHandle], Promise<PermissionState>>();
const requestReadWritePermission = vi.fn<[FileSystemFileHandle], Promise<PermissionState>>();
const logError = vi.fn();

vi.mock("../src/export.js", () => ({ exportToJson: () => exportToJson() }));
vi.mock("../src/crypto.js", () => ({ encrypt: (p: string, pw: string) => encrypt(p, pw) }));
vi.mock("../src/local-file.js", () => ({
  writeFileToHandle: (h: FileSystemFileHandle, d: BufferSource) => writeFileToHandle(h, d),
  queryReadWritePermission: (h: FileSystemFileHandle) => queryReadWritePermission(h),
  requestReadWritePermission: (h: FileSystemFileHandle) => requestReadWritePermission(h),
}));
vi.mock("@commons-systems/errorutil/log", () => ({ logError: (...a: unknown[]) => logError(...a) }));

const HANDLE = { name: "budget.benc" } as unknown as FileSystemFileHandle;
const PASSWORD = "hunter2";
const BYTES = new Uint8Array([1, 2, 3]).buffer;
const JSON_STR = '{"version":1}';

type FileSync = typeof import("../src/file-sync.js");

// Fresh module per test so module-scoped handle/password/timer state never leaks.
async function loadFileSync(): Promise<FileSync> {
  vi.resetModules();
  return import("../src/file-sync.js");
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  exportToJson.mockResolvedValue(JSON_STR);
  encrypt.mockResolvedValue(BYTES);
  writeFileToHandle.mockResolvedValue(undefined);
  queryReadWritePermission.mockResolvedValue("granted");
  requestReadWritePermission.mockResolvedValue("granted");
});

afterEach(() => {
  vi.useRealTimers();
});

const DEBOUNCE_MS = 800;

describe("file-sync", () => {
  it("scheduleWriteBack is a no-op before configureFileSync", async () => {
    const fs = await loadFileSync();
    fs.scheduleWriteBack();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(exportToJson).not.toHaveBeenCalled();
    expect(writeFileToHandle).not.toHaveBeenCalled();
  });

  it("coalesces a burst of scheduleWriteBack calls into a single write", async () => {
    const fs = await loadFileSync();
    fs.configureFileSync(HANDLE, PASSWORD);
    fs.scheduleWriteBack();
    fs.scheduleWriteBack();
    fs.scheduleWriteBack();
    // Nothing fires until the debounce elapses.
    expect(exportToJson).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(exportToJson).toHaveBeenCalledTimes(1);
    expect(encrypt).toHaveBeenCalledTimes(1);
    expect(encrypt).toHaveBeenCalledWith(JSON_STR, PASSWORD);
    expect(writeFileToHandle).toHaveBeenCalledTimes(1);
    expect(writeFileToHandle).toHaveBeenCalledWith(HANDLE, BYTES);
  });

  it("flushWriteBack writes immediately and cancels the pending timer", async () => {
    const fs = await loadFileSync();
    fs.configureFileSync(HANDLE, PASSWORD);
    fs.scheduleWriteBack();
    await fs.flushWriteBack();
    expect(writeFileToHandle).toHaveBeenCalledTimes(1);
    expect(writeFileToHandle).toHaveBeenCalledWith(HANDLE, BYTES);
    // The pending debounce timer was cancelled — advancing fires no second write.
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(writeFileToHandle).toHaveBeenCalledTimes(1);
  });

  it("requests permission when query returns prompt, then writes on grant", async () => {
    queryReadWritePermission.mockResolvedValue("prompt");
    requestReadWritePermission.mockResolvedValue("granted");
    const fs = await loadFileSync();
    fs.configureFileSync(HANDLE, PASSWORD);
    await fs.flushWriteBack();
    expect(requestReadWritePermission).toHaveBeenCalledWith(HANDLE);
    expect(writeFileToHandle).toHaveBeenCalledTimes(1);
  });

  it("logs and skips the write when permission is never granted", async () => {
    queryReadWritePermission.mockResolvedValue("prompt");
    requestReadWritePermission.mockResolvedValue("denied");
    const fs = await loadFileSync();
    fs.configureFileSync(HANDLE, PASSWORD);
    await fs.flushWriteBack();
    expect(requestReadWritePermission).toHaveBeenCalledWith(HANDLE);
    expect(logError).toHaveBeenCalled();
    expect(exportToJson).not.toHaveBeenCalled();
    expect(writeFileToHandle).not.toHaveBeenCalled();
  });

  it("resetFileSync cancels a pending write and disarms subsequent schedules", async () => {
    const fs = await loadFileSync();
    fs.configureFileSync(HANDLE, PASSWORD);
    fs.scheduleWriteBack();
    fs.resetFileSync();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(writeFileToHandle).not.toHaveBeenCalled();
    // After reset, scheduling is a no-op.
    fs.scheduleWriteBack();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(writeFileToHandle).not.toHaveBeenCalled();
  });

  it("concurrent flushWriteBack awaits the in-flight write before returning", async () => {
    // Simulate: a timer fires and starts a doWrite (inFlight); then a second
    // flushWriteBack (e.g. from visibilitychange) is called while doWrite runs.
    // The second caller must not return until the in-flight write completes.
    let resolveWrite!: () => void;
    writeFileToHandle.mockReturnValueOnce(
      new Promise<void>((res) => { resolveWrite = res; }),
    );
    const fs = await loadFileSync();
    fs.configureFileSync(HANDLE, PASSWORD);

    // Start first flush — writeFileToHandle is blocked on resolveWrite.
    const firstFlush = fs.flushWriteBack();

    // Second flush (concurrent) — should await the in-flight write, not return immediately.
    let secondFlushDone = false;
    const secondFlush = fs.flushWriteBack().then(() => { secondFlushDone = true; });

    // Neither flush has completed yet.
    await Promise.resolve();
    expect(secondFlushDone).toBe(false);

    // Unblock the write.
    resolveWrite();
    await firstFlush;
    await secondFlush;

    // Both should have completed; only one actual write occurred.
    expect(secondFlushDone).toBe(true);
    expect(writeFileToHandle).toHaveBeenCalledTimes(1);
  });

  it("flush drains a mutation that arrives during an in-flight write", async () => {
    // A mutation that lands while a write is in flight must reach disk before a
    // concurrent flush (e.g. visibilitychange→hidden) returns — the flush cancels
    // the debounce timer, so the writer loop is the only thing that can persist it.
    let resolveWrite!: () => void;
    writeFileToHandle.mockReturnValueOnce(
      new Promise<void>((res) => { resolveWrite = res; }),
    );
    const fs = await loadFileSync();
    fs.configureFileSync(HANDLE, PASSWORD);

    // First write starts and blocks on resolveWrite.
    const firstFlush = fs.flushWriteBack();

    // A mutation lands mid-write, then a concurrent flush is requested.
    fs.scheduleWriteBack();
    let secondFlushDone = false;
    const secondFlush = fs.flushWriteBack().then(() => { secondFlushDone = true; });

    await Promise.resolve();
    expect(secondFlushDone).toBe(false);

    // Unblock the first write; the writer loop must run a second write for the
    // mutation, and the concurrent flush must wait for it.
    resolveWrite();
    await firstFlush;
    await secondFlush;

    expect(secondFlushDone).toBe(true);
    expect(writeFileToHandle).toHaveBeenCalledTimes(2);
  });

  it("abandons an in-flight write when the session is reset mid-write", async () => {
    // Clear-data while a write is encrypting must not clobber the on-disk file
    // with a post-clear (empty) snapshot. The generation guard makes doWrite bail
    // before writeFileToHandle when resetFileSync ran after it started.
    let resolveEncrypt!: (b: ArrayBuffer) => void;
    encrypt.mockReturnValueOnce(
      new Promise<ArrayBuffer>((res) => { resolveEncrypt = res; }),
    );
    const fs = await loadFileSync();
    fs.configureFileSync(HANDLE, PASSWORD);

    const flush = fs.flushWriteBack();
    // Let doWrite run through the permission check + export and block on encrypt.
    await vi.advanceTimersByTimeAsync(0);

    // User clears data while the write is mid-flight.
    fs.resetFileSync();

    // The (now-stale) encryption finishes.
    resolveEncrypt(BYTES);
    await flush;

    expect(writeFileToHandle).not.toHaveBeenCalled();
  });
});
