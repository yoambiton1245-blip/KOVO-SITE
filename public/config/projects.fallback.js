/**
 * Fallback gallery, used only when the API cannot be reached (e.g. static hosting without the backend).
 * The source of truth is the `projects` table (seeded from backend/src/database/seed-data.js).
 */
export const FALLBACK_PROJECTS = [
  { title: "מטבח אגוז וחיפוי שיש", spec: "פורניר אגוז · חיפוי שיש לבן", category: "modern", size: "wide", image: "assets/img/kitchen-walnut-marble.webp", alt: "מטבח ישר עם ארונות עץ אגוז כהה וחיפוי שיש לבן עם עורקים" },
  { title: "אי אלון ומשטח אבן", spec: "פורניר אלון · משטח אבן בהיר", category: "stone", size: "", image: "assets/img/kitchen-oak-island.webp", alt: "מטבח מעץ אלון עם אי גדול, משטח אבן בהיר וכיסאות בר" },
  { title: "לבן ואגוז", spec: "חזיתות לבנות · ארונות תחתונים אגוז", category: "light", size: "", image: "assets/img/kitchen-white-walnut.webp", alt: "מטבח עם ארונות עליונים לבנים וארונות תחתונים מעץ כהה" },
  { title: "מגירות בתוך האי", spec: "מגירות אלון · טריקה שקטה", category: "storage", size: "", image: "assets/img/kitchen-drawer-storage.webp", alt: "מגירה פנימית מעץ אלון נפתחת מתוך אי מטבח לבן" },
  { title: "מטבח עץ עם אי", spec: "פורניר עץ · משטח לבן", category: "wood", size: "wide", image: "assets/img/kitchen-wood-island.webp", alt: "מטבח עץ חמים עם אי ומשטח לבן וכיסאות עץ" },
  { title: "עץ, בטון ותאורה", spec: "פורניר עץ · תאורת לד נסתרת", category: "modern", size: "", image: "assets/img/kitchen-concrete-wood.webp", alt: "מטבח עץ עם אי, קירות בטון ותאורה נסתרת מתחת לארונות" },
  { title: "מטבח אגוז ואבן", spec: "פורניר אגוז · שיש בהיר", category: "modern", size: "wide", image: "assets/img/kitchen-stone-warm.webp", alt: "מטבח עץ כהה עם משטח אבן ותאורה חמה" },
  { title: "מזווה אגוז עם נישות", spec: "אגוז · ידיות פליז", category: "storage", size: "", image: "assets/img/walnut-cabinet-shelves.webp", alt: "יחידת מזווה מעץ אגוז כהה עם מדפים פתוחים" },
  { title: "מגירות אלון", spec: "אלון טבעי · שמן מט", category: "light", size: "", image: "assets/img/oak-drawer-detail.webp", alt: "מגירות מטבח מעץ אלון בהיר" },
  { title: "מטבח ליד החלון", spec: "אגוז · חיפוי קרמיקה", category: "wood", size: "", image: "assets/img/kitchen-walnut-window.webp", alt: "מטבח עץ כהה עם חלון ואור טבעי" },
  { title: "קיר שיש ופרט עץ", spec: "שיש קלקטה · אגוז", category: "stone", size: "", image: "assets/img/crop-marble-backsplash.webp", alt: "חיפוי שיש במטבח לצד ארונות עץ" },
  { title: "חזיתות עליונות", spec: "פורניר אגוז · ללא ידיות", category: "wood", size: "half", image: "assets/img/crop-walnut-uppers.webp", alt: "חזיתות מטבח עליונות מעץ אגוז" },
  { title: "מגירות עם ידיות פליז", spec: "אגוז · פליז מוברש", category: "storage", size: "half", image: "assets/img/crop-cabinet-drawers.webp", alt: "מגירות מטבח מעץ כהה עם ידיות פליז" },
  { title: "פרט סיבי אלון", spec: "אלון · 19 מ״מ", category: "light", size: "", image: "assets/img/crop-oak-grain.webp", alt: "סיבי עץ אלון בהיר מקרוב" },
  { title: "ארונות תחתונים ומשטח אבן", spec: "אגוז · משטח אבן", category: "modern", size: "wide", image: "assets/img/crop-walnut-base.webp", alt: "ארונות מטבח תחתונים מעץ כהה ומשטח אבן" }
];
