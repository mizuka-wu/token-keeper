import { safeStorage } from "electron";
import Store from "electron-store";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const TAG_LENGTH = 16;
const IV_LENGTH = 12;

const store = new Store<{
  encryptedMasterKey?: string;
  plainMasterKey?: string;
  useKeychain: boolean;
}>({
  name: "encryption-config",
});

export interface KeychainAuthError {
  code: "KEYCHAIN_AUTH_REQUIRED";
  message: string;
}

export class EncryptionService {
  private static masterKey: Buffer | null = null;
  private static useKeychain: boolean = true;
  private static keychainAuthRequired: boolean = false;

  static async initializeMasterKey(): Promise<void> {
    try {
      const useKeychain = store.get("useKeychain", true);

      if (useKeychain) {
        try {
          let encryptedMasterKey = store.get("encryptedMasterKey");

          if (encryptedMasterKey) {
            try {
              // Try to decrypt the stored master key
              let bufferToDecrypt: Buffer;

              if (typeof encryptedMasterKey === "string") {
                bufferToDecrypt = Buffer.from(encryptedMasterKey, "utf-8");
              } else if (Buffer.isBuffer(encryptedMasterKey)) {
                bufferToDecrypt = encryptedMasterKey;
              } else {
                throw new Error("Invalid encrypted master key format");
              }

              const decrypted = safeStorage.decryptString(bufferToDecrypt);
              this.masterKey = Buffer.from(decrypted, "utf-8");
              this.useKeychain = true;
              this.keychainAuthRequired = false;
              console.log("Master key loaded from keychain");
            } catch (decryptError) {
              console.warn(
                "Failed to decrypt stored master key, creating new one:",
                decryptError,
              );
              // If decryption fails, create a new master key
              this.masterKey = crypto.randomBytes(32);
              const keyString = this.masterKey.toString("utf-8");
              const encrypted = safeStorage.encryptString(keyString);
              store.set("encryptedMasterKey", encrypted.toString("utf-8"));
              store.set("useKeychain", true);
              this.useKeychain = true;
              this.keychainAuthRequired = false;
              console.log("New master key created and stored in keychain");
            }
          } else {
            this.masterKey = crypto.randomBytes(32);
            const keyString = this.masterKey.toString("utf-8");
            const encrypted = safeStorage.encryptString(keyString);
            store.set("encryptedMasterKey", encrypted.toString("utf-8"));
            store.set("useKeychain", true);
            this.useKeychain = true;
            this.keychainAuthRequired = false;
            console.log("Master key created and stored in keychain");
          }
        } catch (keychainError) {
          console.error("Keychain access failed:", keychainError);
          this.keychainAuthRequired = true;
          throw {
            code: "KEYCHAIN_AUTH_REQUIRED",
            message:
              "Keychain authorization required. Please grant access to continue.",
          } as KeychainAuthError;
        }
      } else {
        this.loadFromLocalStorage();
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "KEYCHAIN_AUTH_REQUIRED"
      ) {
        throw error;
      }
      console.error("Failed to initialize master key:", error);
      throw new Error("Failed to initialize encryption master key");
    }
  }

  static async retryKeychainAuth(): Promise<void> {
    if (!this.keychainAuthRequired) {
      throw new Error("Keychain auth is not required");
    }

    try {
      let encryptedMasterKey = store.get("encryptedMasterKey");

      if (encryptedMasterKey) {
        try {
          // Try to decrypt the stored master key
          let bufferToDecrypt: Buffer;

          if (typeof encryptedMasterKey === "string") {
            bufferToDecrypt = Buffer.from(encryptedMasterKey, "utf-8");
          } else if (Buffer.isBuffer(encryptedMasterKey)) {
            bufferToDecrypt = encryptedMasterKey;
          } else {
            throw new Error("Invalid encrypted master key format");
          }

          const decrypted = safeStorage.decryptString(bufferToDecrypt);
          this.masterKey = Buffer.from(decrypted, "utf-8");
          this.useKeychain = true;
          this.keychainAuthRequired = false;
          store.set("useKeychain", true);
          console.log(
            "Master key successfully loaded from keychain after auth",
          );
        } catch (decryptError) {
          console.warn(
            "Failed to decrypt stored master key, creating new one:",
            decryptError,
          );
          // If decryption fails, create a new master key
          this.masterKey = crypto.randomBytes(32);
          const keyString = this.masterKey.toString("utf-8");
          const encrypted = safeStorage.encryptString(keyString);
          store.set("encryptedMasterKey", encrypted.toString("utf-8"));
          store.set("useKeychain", true);
          this.useKeychain = true;
          this.keychainAuthRequired = false;
          console.log(
            "New master key created and stored in keychain after auth",
          );
        }
      } else {
        this.masterKey = crypto.randomBytes(32);
        const keyString = this.masterKey.toString("utf-8");
        const encrypted = safeStorage.encryptString(keyString);
        store.set("encryptedMasterKey", encrypted.toString("utf-8"));
        store.set("useKeychain", true);
        this.useKeychain = true;
        this.keychainAuthRequired = false;
        console.log("Master key created and stored in keychain after auth");
      }
    } catch (error) {
      console.error("Keychain auth retry failed:", error);
      throw {
        code: "KEYCHAIN_AUTH_REQUIRED",
        message:
          "Keychain authorization still required. Please try again or use local storage.",
      } as KeychainAuthError;
    }
  }

  static useLocalStorageTemporarily(): void {
    if (this.keychainAuthRequired) {
      this.loadFromLocalStorage();
      console.warn(
        "Using local storage temporarily. Keychain authorization still required.",
      );
    }
  }

  private static loadFromLocalStorage(): void {
    let plainMasterKey = store.get("plainMasterKey");

    if (plainMasterKey) {
      this.masterKey = Buffer.from(plainMasterKey, "utf-8");
      this.useKeychain = false;
      console.log(
        "Master key loaded from local storage (keychain unavailable)",
      );
    } else {
      this.masterKey = crypto.randomBytes(32);
      const keyString = this.masterKey.toString("utf-8");
      store.set("plainMasterKey", keyString);
      store.set("useKeychain", false);
      this.useKeychain = false;
      console.warn(
        "Master key stored in local storage (not encrypted). " +
          "Please grant keychain access for better security.",
      );
    }
  }

  static getMasterKey(): Buffer {
    if (!this.masterKey) {
      throw new Error(
        "Master key not initialized. Call initializeMasterKey first.",
      );
    }
    return this.masterKey;
  }

  static getStatus(): {
    initialized: boolean;
    useKeychain: boolean;
    message: string;
  } {
    return {
      initialized: this.masterKey !== null,
      useKeychain: this.useKeychain,
      message: this.useKeychain
        ? "Master key stored in system keychain (secure)"
        : "Master key stored in local storage (fallback mode - less secure)",
    };
  }

  static encrypt(plaintext: string): string {
    const masterKey = this.getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

    let encrypted = cipher.update(plaintext, "utf-8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    const result = Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]);
    return result.toString("base64");
  }

  static decrypt(ciphertext: string): string {
    const masterKey = this.getMasterKey();
    const buffer = Buffer.from(ciphertext, "base64");

    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf-8");
  }

  static clearMasterKey(): void {
    this.masterKey = null;
  }
}
