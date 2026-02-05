// E2EE using Web Crypto API
// ECDH P-256 key exchange + AES-256-GCM encryption
// Zero external dependencies — uses only browser-native APIs

const ECDH_ALGO = { name: 'ECDH', namedCurve: 'P-256' };
const AES_ALGO = { name: 'AES-GCM', length: 256 };

/**
 * Generate a new ECDH identity key pair.
 * @returns {{ publicKey: JsonWebKey, privateKey: JsonWebKey }}
 */
export async function generateIdentityKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    ECDH_ALGO,
    true, // extractable — needed to export JWK for storage
    ['deriveKey', 'deriveBits'],
  );
  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  return { publicKey, privateKey };
}

/**
 * Derive a shared AES-256-GCM key from my private key + their public key.
 * Uses ECDH key agreement → HKDF → AES-256 key.
 * @param {JsonWebKey} myPrivateKeyJwk
 * @param {JsonWebKey} theirPublicKeyJwk
 * @returns {CryptoKey} AES-GCM key for encrypt/decrypt
 */
export async function deriveSharedKey(myPrivateKeyJwk, theirPublicKeyJwk) {
  // Import my private key
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    myPrivateKeyJwk,
    ECDH_ALGO,
    false,
    ['deriveBits'],
  );

  // Import their public key
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    theirPublicKeyJwk,
    ECDH_ALGO,
    false,
    [],
  );

  // ECDH → raw shared secret (256 bits)
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256,
  );

  // HKDF to derive AES-256 key from raw shared secret
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    'HKDF',
    false,
    ['deriveKey'],
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('pingup-e2ee-v1'),
      info: new TextEncoder().encode('message-key'),
    },
    hkdfKey,
    AES_ALGO,
    false,
    ['encrypt', 'decrypt'],
  );

  return aesKey;
}

/**
 * Encrypt a plaintext message with AES-256-GCM.
 * @param {CryptoKey} aesKey
 * @param {string} plaintext
 * @returns {{ ciphertext: string, iv: string }} base64-encoded
 */
export async function encryptMessage(aesKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded,
  );

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypt a ciphertext message with AES-256-GCM.
 * @param {CryptoKey} aesKey
 * @param {string} ciphertextBase64
 * @param {string} ivBase64
 * @returns {string} plaintext
 */
export async function decryptMessage(aesKey, ciphertextBase64, ivBase64) {
  const cipherBuffer = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    cipherBuffer,
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Serialize a JWK public key to base64 string (for server storage).
 */
export function publicKeyToBase64(jwk) {
  return btoa(JSON.stringify(jwk));
}

/**
 * Deserialize a base64 string back to JWK object.
 */
export function base64ToPublicKey(base64) {
  return JSON.parse(atob(base64));
}

// --- Internal helpers ---

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
