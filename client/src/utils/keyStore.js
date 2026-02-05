// IndexedDB storage for E2EE private keys
// Private keys are stored ONLY in the browser — never sent to the server

const DB_NAME = 'pingup-e2ee';
const DB_VERSION = 1;
const IDENTITY_STORE = 'identityKeys';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDENTITY_STORE)) {
        db.createObjectStore(IDENTITY_STORE, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save the user's identity key pair (JWK format).
 */
export async function saveIdentityKeyPair(userId, publicKeyJwk, privateKeyJwk) {
  const db = await openDB();
  const tx = db.transaction(IDENTITY_STORE, 'readwrite');
  tx.objectStore(IDENTITY_STORE).put({ userId, publicKeyJwk, privateKeyJwk });
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get the user's identity key pair.
 * @returns {{ userId, publicKeyJwk, privateKeyJwk } | null}
 */
export async function getIdentityKeyPair(userId) {
  const db = await openDB();
  const tx = db.transaction(IDENTITY_STORE, 'readonly');
  const request = tx.objectStore(IDENTITY_STORE).get(userId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if identity keys exist for this user.
 */
export async function hasIdentityKeys(userId) {
  const keys = await getIdentityKeyPair(userId);
  return !!keys;
}

/**
 * Delete identity keys for a user.
 */
export async function deleteIdentityKeys(userId) {
  const db = await openDB();
  const tx = db.transaction(IDENTITY_STORE, 'readwrite');
  tx.objectStore(IDENTITY_STORE).delete(userId);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Clear all E2EE data (full reset).
 */
export async function clearAllKeys() {
  const db = await openDB();
  const tx = db.transaction(IDENTITY_STORE, 'readwrite');
  tx.objectStore(IDENTITY_STORE).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
