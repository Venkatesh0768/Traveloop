/**
 * Central design tokens — single source of truth.
 * Import these wherever you need consistent values in TypeScript/TSX.
 * All Tailwind classes reference the CSS variables defined in globals.css.
 */

export const theme = {
  // Brand
  brand: "indigo-600",
  brandHover: "indigo-700",
  brandLight: "indigo-50",
  brandText: "indigo-600",

  // Surfaces
  bg: "white",
  bgMuted: "gray-50",
  bgCard: "white",

  // Borders
  border: "gray-200",
  borderStrong: "gray-300",

  // Text
  textPrimary: "gray-900",
  textSecondary: "gray-600",
  textMuted: "gray-400",

  // Status
  success: "emerald-600",
  successBg: "emerald-50",
  successBorder: "emerald-200",
  error: "red-600",
  errorBg: "red-50",
  errorBorder: "red-200",
  warning: "amber-600",
  warningBg: "amber-50",
  warningBorder: "amber-200",
  info: "blue-600",
  infoBg: "blue-50",
  infoBorder: "blue-200",
} as const;

/** Reusable class strings for common patterns */
export const cx = {
  // Page wrapper
  page: "min-h-screen bg-gray-50",
  pageContent: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8",

  // Card
  card: "bg-white border border-gray-200 rounded-xl shadow-sm",
  cardPadding: "p-6",

  // Section header inside a card
  sectionHeader: "flex items-center gap-3 pb-5 mb-5 border-b border-gray-100",

  // Form
  formGroup: "flex flex-col gap-1.5",
  label: "text-sm font-medium text-gray-700",
  input: [
    "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5",
    "text-sm text-gray-900 placeholder:text-gray-400",
    "outline-none transition",
    "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
    "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
  ].join(" "),
  inputError: "border-red-400 focus:border-red-500 focus:ring-red-500/20",

  // Buttons
  btnPrimary: [
    "inline-flex items-center justify-center gap-2 rounded-lg",
    "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800",
    "text-white text-sm font-semibold",
    "px-4 py-2.5 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  btnSecondary: [
    "inline-flex items-center justify-center gap-2 rounded-lg",
    "bg-white hover:bg-gray-50 active:bg-gray-100",
    "text-gray-700 text-sm font-semibold",
    "border border-gray-300 px-4 py-2.5 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  btnDanger: [
    "inline-flex items-center justify-center gap-2 rounded-lg",
    "bg-white hover:bg-red-50 active:bg-red-100",
    "text-red-600 text-sm font-semibold",
    "border border-red-300 px-4 py-2.5 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  btnGhost: [
    "inline-flex items-center justify-center gap-2 rounded-lg",
    "hover:bg-gray-100 active:bg-gray-200",
    "text-gray-600 hover:text-gray-900 text-sm font-medium",
    "px-3 py-2 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),

  // Badge
  badgeGray: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700",
  badgeIndigo: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700",
  badgeGreen: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700",
  badgeRed: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700",
  badgeAmber: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700",
} as const;
