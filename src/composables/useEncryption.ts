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
  const ipcClient = (window as any).ipcClient;

  const isMasterKeyInitialized = async (): Promise<boolean> => {
    const response = await (ipcClient.get as any)(
      "/api/encryption/initialized",
    );
    return response.data.initialized;
  };

  const getStatus = async (): Promise<EncryptionStatus> => {
    const response = await (ipcClient.get as any)("/api/encryption/status");
    return response.data;
  };

  const retryKeychainAuth = async (): Promise<AuthResult> => {
    const response = await (ipcClient.post as any)(
      "/api/encryption/retry-keychain-auth",
    );
    return response.data;
  };

  const useLocalStorageTemporarily = async (): Promise<AuthResult> => {
    const response = await (ipcClient.post as any)(
      "/api/encryption/use-local-storage",
    );
    return response.data;
  };

  const encrypt = async (plaintext: string): Promise<string> => {
    const response = await (ipcClient.post as any)("/api/encryption/encrypt", {
      plaintext,
    });
    return response.data.ciphertext;
  };

  const decrypt = async (ciphertext: string): Promise<string> => {
    const response = await (ipcClient.post as any)("/api/encryption/decrypt", {
      ciphertext,
    });
    return response.data.plaintext;
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
