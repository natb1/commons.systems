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
});
