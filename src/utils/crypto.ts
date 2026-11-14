function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(secretSeed: string): Promise<CryptoKey> {
  const subtle = globalThis.crypto.subtle;
  const encoder = new TextEncoder();
  const hash = await subtle.digest('SHA-256', encoder.encode(secretSeed));
  return subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptPayload(
  plaintext: string,
  secretSeed: string
): Promise<{ ciphertext: string; iv: string; algorithm: string }> {
  const subtle = globalThis.crypto.subtle;
  const key = await deriveAesKey(secretSeed);
  const ivBytes = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    encoded
  );
  return {
    ciphertext: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(ivBytes),
    algorithm: 'AES-GCM-256',
  };
}

export async function decryptPayload(
  ciphertextB64: string,
  ivB64: string,
  secretSeed: string
): Promise<string> {
  const subtle = globalThis.crypto.subtle;
  const key = await deriveAesKey(secretSeed);
  const ivBytes = fromBase64(ivB64);
  const cipherBytes = fromBase64(ciphertextB64);
  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as BufferSource },
    key,
    cipherBytes as BufferSource
  );
  return new TextDecoder().decode(decrypted);
}
