declare module 'expo-file-system' {
  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;
  export enum EncodingType {
    UTF8 = 'utf8',
    Base64 = 'base64',
  }
  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: EncodingType | 'utf8' | 'base64' }
  ): Promise<void>;
  export function readAsStringAsync(
    fileUri: string,
    options?: { encoding?: EncodingType | 'utf8' | 'base64' }
  ): Promise<string>;
  export function getInfoAsync(
    fileUri: string,
    options?: { md5?: boolean; size?: boolean }
  ): Promise<{ exists: boolean; uri: string; size?: number; isDirectory: boolean }>;
  export function deleteAsync(
    fileUri: string,
    options?: { idempotent?: boolean }
  ): Promise<void>;
}
