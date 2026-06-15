// Ambient declarations for the WICG File System Access API surface that
// TypeScript's lib.dom.d.ts does not yet ship: the picker entry points on
// Window and the permission-management methods on FileSystemHandle. Needed
// because print's program compiles its own local-folder code plus the
// `@commons-systems/local-first` source it imports, both of which reference
// these globals. The handle interfaces (FileSystemFileHandle /
// FileSystemDirectoryHandle) and PermissionState are already in lib.dom.
//
// Mirrors local-first/src/fsa-types.d.ts; that package's ambient file does not
// propagate into a consumer's program (ambient global augmentations are only
// in scope for the program that includes them), so print declares its own.

interface FileSystemHandlePermissionDescriptor {
  mode?: "read" | "readwrite";
}

interface FileSystemHandle {
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
}

interface OpenFilePickerOptions {
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string | string[]>;
  }>;
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: "read" | "readwrite";
  startIn?: FileSystemHandle | string;
}

interface Window {
  showOpenFilePicker?: (
    options?: OpenFilePickerOptions,
  ) => Promise<FileSystemFileHandle[]>;
  showDirectoryPicker?: (
    options?: DirectoryPickerOptions,
  ) => Promise<FileSystemDirectoryHandle>;
}
