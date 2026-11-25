/**
 * Values shared by the frontend and the backend.
 * Plain ES module with no dependencies so the browser can import it directly
 * (served at /shared/constants.js) and Node can import it as well.
 */

/** Project types offered in the contact form. Keys are stored in the database. */
export const PROJECT_TYPES = Object.freeze({
  new_kitchen: "מטבח חדש",
  renovation: "חידוש מטבח קיים",
  island: "אי מטבח",
  pantry: "מזווה ופתרונות אחסון",
  other: "אחר"
});

/** Gallery categories (used by the filters and by the projects table). */
export const PROJECT_CATEGORIES = Object.freeze({
  modern: "מודרניים",
  wood: "מטבחי עץ",
  light: "בהירים",
  storage: "אחסון ומזווה",
  stone: "אבן ופרטים"
});

/** Lead pipeline statuses (admin API). */
export const LEAD_STATUSES = Object.freeze(["new", "contacted", "meeting", "won", "lost", "spam"]);

/** Field limits, enforced on both sides. */
export const LIMITS = Object.freeze({
  nameMin: 2,
  nameMax: 80,
  phoneMinDigits: 9,
  phoneMaxDigits: 15,
  emailMax: 160,
  messageMax: 2000
});

/** Israeli / international phone: digits, spaces, dashes, parentheses and a leading +. */
export const PHONE_PATTERN = /^\+?[0-9\s\-()]{9,20}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
