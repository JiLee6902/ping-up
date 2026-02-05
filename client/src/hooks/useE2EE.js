import { useState, useEffect, useRef, useCallback } from 'react';
import {
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  base64ToPublicKey,
} from '../utils/crypto';
import { getIdentityKeyPair } from '../utils/keyStore';
import api from '../api/axios';

/**
 * Hook for E2EE operations in a chat conversation.
 *
 * @param {string} currentUserId - The logged-in user's ID
 * @param {string} partnerUserId - The chat partner's ID
 * @returns {{ encrypt, decrypt, isReady, e2eeEnabled }}
 */
export function useE2EE(currentUserId, partnerUserId) {
  const [isReady, setIsReady] = useState(false);
  const [e2eeEnabled, setE2eeEnabled] = useState(false);
  const sharedKeyRef = useRef(null);

  useEffect(() => {
    if (!currentUserId || !partnerUserId) return;

    let cancelled = false;

    async function initE2EE() {
      try {
        // 1. Get my private key from IndexedDB
        const myKeys = await getIdentityKeyPair(currentUserId);
        if (!myKeys) {
          setIsReady(true);
          setE2eeEnabled(false);
          return;
        }

        // 2. Fetch partner's public key from server
        const { data } = await api.get(`/api/encryption/keys/${partnerUserId}`);
        if (!data.success || !data.data) {
          setIsReady(true);
          setE2eeEnabled(false);
          return;
        }

        // 3. Derive shared AES-256 key via ECDH + HKDF
        const partnerPublicKeyJwk = base64ToPublicKey(data.data.identityPublicKey);
        const aesKey = await deriveSharedKey(myKeys.privateKeyJwk, partnerPublicKeyJwk);

        if (!cancelled) {
          sharedKeyRef.current = aesKey;
          setE2eeEnabled(true);
          setIsReady(true);
        }
      } catch (err) {
        console.error('E2EE initialization failed:', err);
        if (!cancelled) {
          setIsReady(true);
          setE2eeEnabled(false);
        }
      }
    }

    initE2EE();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, partnerUserId]);

  const encrypt = useCallback(async (plaintext) => {
    if (!sharedKeyRef.current || !plaintext) {
      return { text: plaintext, encrypted: false, iv: null };
    }
    try {
      const { ciphertext, iv } = await encryptMessage(sharedKeyRef.current, plaintext);
      return { text: ciphertext, encrypted: true, iv };
    } catch (err) {
      console.error('Encryption failed, sending plaintext:', err);
      return { text: plaintext, encrypted: false, iv: null };
    }
  }, []);

  const decrypt = useCallback(async (message) => {
    if (!message.encrypted || !message.encryptionIv || !sharedKeyRef.current) {
      return message.text;
    }
    try {
      return await decryptMessage(
        sharedKeyRef.current,
        message.text,
        message.encryptionIv,
      );
    } catch (err) {
      console.error('Decryption failed:', err);
      return '[Encrypted message - unable to decrypt]';
    }
  }, []);

  return { encrypt, decrypt, isReady, e2eeEnabled };
}
