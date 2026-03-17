export interface EncryptionStatus {
  initialized: boolean;
  useKeychain: boolean;
  message: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

export function useEncryption() {
  const isMasterKeyInitialized = async (): Promise<boolean> => {
    return window.ipcRenderer.invoke("encryption:isMasterKeyInitialized");
  };

  const getStatus = async (): Promise<EncryptionStatus> => {
    return window.ipcRenderer.invoke("encryption:getStatus");
  };

  const retryKeychainAuth = async (): Promise<AuthResult> => {
    return window.ipcRenderer.invoke("encryption:retryKeychainAuth");
  };

  const useLocalStorageTemporarily = async (): Promise<AuthResult> => {
    return window.ipcRenderer.invoke("encryption:useLocalStorageTemporarily");
  };

  const encrypt = async (plaintext: string): Promise<string> => {
    return window.ipcRenderer.invoke("encryption:encrypt", plaintext);
  };

  const decrypt = async (ciphertext: string): Promise<string> => {
    return window.ipcRenderer.invoke("encryption:decrypt", ciphertext);
  };

  return {
    isMasterKeyInitialized,
    getStatus,
    retryKeychainAuth,
    useLocalStorageTemporarily,
    encrypt,
    decrypt,
  };
}
