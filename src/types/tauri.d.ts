// Type declarations for Tauri APIs
declare module '@tauri-apps/api/dialog' {
  export interface SaveDialogOptions {
    defaultPath?: string;
    filters?: Array<{
      name: string;
      extensions: string[];
    }>;
  }
  
  export function save(options?: SaveDialogOptions): Promise<string | null>;
}

declare module '@tauri-apps/api/fs' {
  export function writeBinaryFile(path: string, data: Uint8Array): Promise<void>;
} 