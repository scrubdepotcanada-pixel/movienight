"use client";

import { useState, useEffect } from "react";

export type Locale = "en" | "he" | "fr" | "es" | "ar" | "ru";

export const translations = {
  en: {
    // Brand
    brandName: "Next Movie",

    // Landing page
    heroHeadline: "AI movie picks for the whole family — without the arguing.",
    heroSubtext:
      "No more scrolling, no more debates. Just the right movie for everyone — instantly.",
    free: "100% Free",
    poweredByAI: "Powered by AI",
    worksWithServices: "Works with Netflix, Disney+, Prime & more",
    freeForever: "Free forever, no credit card needed",
    likedExplainer: "Liked = more like this",
    passExplainer: "Pass = skip, no effect",
    nopeExplainer: "Nope = avoid similar",
    hoverExplainer: "Hover to read about it, then like or dislike",

    // Member selector
    whosWatching: "Who's watching tonight?",
    pickProfile:
      "Pick your profile for personalized picks — or add a family member",
    startPicking: "Start Picking",
    tryAsGuest: "Try as Guest",

    // Auth
    signIn: "Sign In",
    signOut: "Sign out",
    signInToSave: "Sign in to save",

    // Greeting
    hey: "Hey {name}!",

    // Search
    searchPrompt:
      "Tell us a movie you love and we'll find your next watch",
    searchPlaceholder: "Enter a movie you love...",
    search: "Search",

    // Categories
    orBrowseByCategory: "Or browse by category",
    continueWhereYouLeftOff: "Continue where you left off",
    changeCategory: "Change category",
    switchLabel: "Switch",
    browseDifferentCategory: "Browse a different category",
    startOverDifferentMovie: "Start over with a different movie",

    // Actions
    liked: "Liked",
    pass: "Pass",
    nope: "Nope",

    // Genres
    genreAction: "Action",
    genreComedy: "Comedy",
    genreDrama: "Drama",
    genreHorror: "Horror",
    genreSciFi: "Sci-Fi",
    genreRomance: "Romance",
    genreThriller: "Thriller",
    genreAnimation: "Animation",
    genreDocumentary: "Documentary",
    genreFantasy: "Fantasy",
    genreMystery: "Mystery",
    genreAdventure: "Adventure",

    // Onboarding
    letsGetStarted: "Let's get started",
    quickSetup: "Quick setup — takes 10 seconds",
    yourName: "Your name",
    age: "Age",
    whatCanYouWatch: "What can you watch?",
    startPickingMovies: "Start Picking Movies",
    addMember: "Add Member",
    everyone: "Everyone",

    // Ratings
    ratingKids: "Kids",
    ratingFamily: "Family",
    ratingTeens: "Teens",
    ratingAdult: "Adult",
    ratingNoLimit: "No limit",
    allRatings: "All Ratings",

    // History
    history: "history",
    picks: "picks",
  },

  he: {
    // Brand
    brandName: "Next Movie",

    // Landing page
    heroHeadline:
      "המלצות סרטים בינה מלאכותית לכל המשפחה — בלי הויכוחים.",
    heroSubtext:
      "בלי גלילה אינסופית, בלי ויכוחים. רק הסרט הנכון לכולם — מיידית.",
    free: "חינם 100%",
    poweredByAI: "מופעל בינה מלאכותית",
    worksWithServices: "עובד עם נטפליקס, דיסני+, פריים ועוד",
    freeForever: "חינם לנצח, ללא כרטיס אשראי",
    likedExplainer: "אהבתי = עוד כמו זה",
    passExplainer: "דלג = דלג, בלי השפעה",
    nopeExplainer: "לא = הימנע מדומים",
    hoverExplainer: "רחף לקריאה, ואז אהב או לא",

    // Member selector
    whosWatching: "מי צופה הערב?",
    pickProfile:
      "בחר את הפרופיל שלך להמלצות מותאמות — או הוסף בן משפחה",
    startPicking: "התחל לבחור",
    tryAsGuest: "נסה כאורח",

    // Auth
    signIn: "התחבר",
    signOut: "התנתק",
    signInToSave: "התחבר כדי לשמור",

    // Greeting
    hey: "!{name} היי",

    // Search
    searchPrompt:
      "ספר לנו על סרט שאהבת ונמצא לך את הבא",
    searchPlaceholder: "...הזן סרט שאהבת",
    search: "חפש",

    // Categories
    orBrowseByCategory: "או עיין לפי קטגוריה",
    continueWhereYouLeftOff: "המשך מאיפה שהפסקת",
    changeCategory: "שנה קטגוריה",
    switchLabel: "החלף",
    browseDifferentCategory: "עיין בקטגוריה אחרת",
    startOverDifferentMovie: "התחל מחדש עם סרט אחר",

    // Actions
    liked: "אהבתי",
    pass: "דלג",
    nope: "לא",

    // Genres
    genreAction: "אקשן",
    genreComedy: "קומדיה",
    genreDrama: "דרמה",
    genreHorror: "אימה",
    genreSciFi: "מדע בדיוני",
    genreRomance: "רומנטיקה",
    genreThriller: "מותחן",
    genreAnimation: "אנימציה",
    genreDocumentary: "דוקומנטרי",
    genreFantasy: "פנטזיה",
    genreMystery: "מסתורין",
    genreAdventure: "הרפתקאות",

    // Onboarding
    letsGetStarted: "בואו נתחיל",
    quickSetup: "הגדרה מהירה — לוקח 10 שניות",
    yourName: "השם שלך",
    age: "גיל",
    whatCanYouWatch: "מה מותר לצפות?",
    startPickingMovies: "התחל לבחור סרטים",
    addMember: "הוסף חבר",
    everyone: "כולם",

    // Ratings
    ratingKids: "ילדים",
    ratingFamily: "משפחה",
    ratingTeens: "נוער",
    ratingAdult: "מבוגרים",
    ratingNoLimit: "ללא הגבלה",
    allRatings: "כל הדירוגים",

    // History
    history: "היסטוריה",
    picks: "בחירות",
  },
} as Record<string, Record<string, string>>;

export type TranslationStrings = typeof translations.en;

/**
 * Detect locale from browser settings.
 * Returns 'he' if browser language starts with 'he', otherwise 'en'.
 * Safe to call on the server (returns 'en' when navigator is unavailable).
 */
const RTL_LOCALES: Locale[] = ["he", "ar"];

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function getLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() || "";
  if (lang.startsWith("he")) return "he";
  if (lang.startsWith("ar")) return "ar";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("ru")) return "ru";
  return "en";
}

export function tmdbLocale(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: "en-US", he: "he", fr: "fr-FR", es: "es-MX", ar: "ar", ru: "ru-RU",
  };
  return map[locale] || "en-US";
}

/**
 * React hook that returns the current locale and its translation strings.
 * On mount, detects locale from the browser and also checks the cookie-based
 * preference (set via /api/locale). Syncs the cookie so server API routes
 * can serve TMDB data in the correct language.
 */
export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    // Detect from browser
    const detected = getLocale();
    setLocale(detected);

    // Sync cookie for server-side API routes
    fetch("/api/locale", { method: "POST", body: JSON.stringify({ locale: detected }) })
      .catch(() => {
        // Silently fail — locale cookie is a nice-to-have
      });
  }, []);

  const t = translations[locale] || translations.en;
  const dir = isRTL(locale) ? "rtl" : "ltr";

  return { locale, setLocale, t, dir } as const;
}
