import crypto from "node:crypto";
import { put, head } from "@vercel/blob";

/**
 * Saved kitchen designs ("שמירה וקישור"), stored in Vercel Blob as designs/<id>.json.
 * Needs a Blob store connected to the Vercel project (it sets BLOB_READ_WRITE_TOKEN).
 * Designs hold only colour/material choices, no personal data. IDs are random and unguessable.
 */
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const newId = () => Array.from(crypto.randomBytes(10), b => ALPHABET[b % ALPHABET.length]).join("");
export const ID = /^[A-Za-z0-9_-]{6,20}$/;

let testStore = null;
/** Local preview and tests only: keep designs in a Map instead of Vercel Blob. */
export function setTestStore(map) { testStore = map; }

export const isStoreConfigured = () => Boolean(testStore || process.env.BLOB_READ_WRITE_TOKEN);

const key = id => `designs/${id}.json`;

export async function saveDesign(id, data) {
  if (testStore) { testStore.set(id, data); return; }
  await put(key(id), JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: false
  });
}

/** Returns the saved design, or null if there is none. */
export async function loadDesign(id) {
  if (testStore) return testStore.get(id) || null;
  let meta;
  try { meta = await head(key(id)); } catch (err) {
    if (err?.name === "BlobNotFoundError" || /not.?found/i.test(err?.message || "")) return null;
    throw err;
  }
  const res = await fetch(meta.url);
  if (!res.ok) return null;
  return res.json();
}
