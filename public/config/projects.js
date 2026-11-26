/**
 * Gallery projects (the only source: the site is static, there is no gallery database).
 *
 * Order and size drive the editorial layout (components/gallery.js):
 *   feature = full width, wide = 7/12, tall = 5/12 portrait, half = 6/12, small = 4/12.
 * High-resolution photos come first; small detail crops come last (shown after "לכל הפרויקטים").
 * width + small: the photo's pixel width and an 800px copy, so phones and tablets download the smaller one.
 * inspiration: true marks stock photos (labelled "תמונת השראה" when enlarged); real KOVO projects omit it.
 */
export const PROJECTS = [
  { inspiration: true, title: "מטבח אגוז וחיפוי שיש", spec: "פורניר אגוז · חיפוי שיש לבן", category: "modern", size: "feature", image: "assets/img/kitchen-walnut-marble.webp", width: 1600, small: "assets/img/kitchen-walnut-marble-800.webp", alt: "מטבח ישר עם ארונות עץ אגוז כהה וחיפוי שיש לבן עם עורקים" },
  { inspiration: true, title: "לבן ואגוז", spec: "חזיתות לבנות · ארונות תחתונים אגוז", category: "light", size: "tall", image: "assets/img/kitchen-white-walnut.webp", width: 1000, small: "assets/img/kitchen-white-walnut-800.webp", alt: "מטבח עם ארונות עליונים לבנים וארונות תחתונים מעץ כהה" },
  { inspiration: true, title: "אי אלון ומשטח אבן", spec: "פורניר אלון · משטח אבן בהיר", category: "stone", size: "wide", image: "assets/img/kitchen-oak-island.webp", width: 1600, small: "assets/img/kitchen-oak-island-800.webp", alt: "מטבח מעץ אלון עם אי גדול, משטח אבן בהיר וכיסאות בר" },
  { inspiration: true, title: "עץ, בטון ותאורה", spec: "פורניר עץ · תאורת לד נסתרת", category: "modern", size: "wide", image: "assets/img/kitchen-concrete-wood.webp", width: 1600, small: "assets/img/kitchen-concrete-wood-800.webp", alt: "מטבח עץ עם אי, קירות בטון ותאורה נסתרת מתחת לארונות" },
  { inspiration: true, title: "מגירות בתוך האי", spec: "מגירות אלון · טריקה שקטה", category: "storage", size: "tall", image: "assets/img/kitchen-drawer-storage.webp", width: 1000, small: "assets/img/kitchen-drawer-storage-800.webp", alt: "מגירה פנימית מעץ אלון נפתחת מתוך אי מטבח לבן" },
  { inspiration: true, title: "מטבח עץ עם אי", spec: "פורניר עץ · משטח לבן", category: "wood", size: "feature", image: "assets/img/kitchen-wood-island.webp", width: 1600, small: "assets/img/kitchen-wood-island-800.webp", alt: "מטבח עץ חמים עם אי ומשטח לבן וכיסאות עץ" },
  { inspiration: true, title: "מגירות אלון", spec: "אלון טבעי · שמן מט", category: "light", size: "half", image: "assets/img/oak-drawer-detail.webp", alt: "מגירות מטבח מעץ אלון בהיר" },
  { inspiration: true, title: "מטבח ליד החלון", spec: "אגוז · חיפוי קרמיקה", category: "wood", size: "half", image: "assets/img/kitchen-walnut-window.webp", alt: "מטבח עץ כהה עם חלון ואור טבעי" },
  { inspiration: true, title: "מטבח אגוז ואבן", spec: "פורניר אגוז · שיש בהיר", category: "modern", size: "wide", image: "assets/img/kitchen-stone-warm.webp", alt: "מטבח עץ כהה עם משטח אבן ותאורה חמה" },
  { inspiration: true, title: "מזווה אגוז עם נישות", spec: "אגוז · ידיות פליז", category: "storage", size: "tall", image: "assets/img/walnut-cabinet-shelves.webp", alt: "יחידת מזווה מעץ אגוז כהה עם מדפים פתוחים" },
  { inspiration: true, title: "קיר שיש ופרט עץ", spec: "שיש קלקטה · אגוז", category: "stone", size: "small", image: "assets/img/crop-marble-backsplash.webp", alt: "חיפוי שיש במטבח לצד ארונות עץ" },
  { inspiration: true, title: "חזיתות עליונות", spec: "פורניר אגוז · ללא ידיות", category: "wood", size: "small", image: "assets/img/crop-walnut-uppers.webp", alt: "חזיתות מטבח עליונות מעץ אגוז" },
  { inspiration: true, title: "מגירות עם ידיות פליז", spec: "אגוז · פליז מוברש", category: "storage", size: "small", image: "assets/img/crop-cabinet-drawers.webp", alt: "מגירות מטבח מעץ כהה עם ידיות פליז" },
  { inspiration: true, title: "פרט סיבי אלון", spec: "אלון · 19 מ״מ", category: "light", size: "half", image: "assets/img/crop-oak-grain.webp", alt: "סיבי עץ אלון בהיר מקרוב" },
  { inspiration: true, title: "ארונות תחתונים ומשטח אבן", spec: "אגוז · משטח אבן", category: "modern", size: "half", image: "assets/img/crop-walnut-base.webp", alt: "ארונות מטבח תחתונים מעץ כהה ומשטח אבן" }
];
