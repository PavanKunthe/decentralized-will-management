export async function encryptFile(file, password) {
  // Generate a cryptographically random salt for each encryption
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    await file.arrayBuffer()
  );

  // Store salt + iv + ciphertext so decryption can recover the key
  return new Blob([salt, iv, new Uint8Array(encrypted)]);
}

export async function decryptFile(blob, password) {
  const array = new Uint8Array(await blob.arrayBuffer());

  // Extract salt (first 16 bytes), iv (next 12 bytes), and ciphertext
  const salt = array.slice(0, 16);
  const iv = array.slice(16, 28);
  const encrypted = array.slice(28);

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return new Blob([new Uint8Array(decrypted)], { type: "application/pdf" });
}
