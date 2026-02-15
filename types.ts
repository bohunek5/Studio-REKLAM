
export type AdFormat = 'square' | 'portrait' | 'landscape';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export type CtaStyle = 'solid' | 'outline' | 'gradient' | 'glass' | 'neon' | 'brutal' | 'soft' | 'minimal';
export type CtaAnimation = 'none' | 'pulse' | 'bounce' | 'shake' | 'shimmer' | 'wobble';

export interface ShadowSettings {
    enabled: boolean;
    color: string;
    blur: number;
    x: number;
    y: number;
}

export interface AdContent {
  productName: string;
  showProductName: boolean;
  productNameColor: string;
  headline: string;
  showHeadline: boolean;
  headlineColor: string;
  subheadline: string;
  showSubheadline: boolean;
  subheadlineColor: string;
  ctaText: string;
  showCTA: boolean;
  ctaBgColor: string;
  ctaTextColor: string;
  ctaStyle: CtaStyle; 
  ctaAnimation: CtaAnimation;
  ctaAnimationEnabled: boolean; // New toggle for static/animated
  contactInfo: string;
  showContact: boolean;
  contactInfoColor: string;
  promoBadge?: string;
  showPromoBadge: boolean;
  promoBadgeBgColor: string;
  promoBadgeTextColor: string;
}

export interface ImageTransform {
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

export interface TextTransform {
    scale: number;
    x: number;
    y: number;
    rotation: number;
    zIndex: number;
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    locked: boolean; 
    shadow: ShadowSettings;
}

// Map each format to its own transform settings
export type TransformMap = Record<AdFormat, ImageTransform>;
export type TextTransformMap = Record<AdFormat, TextTransform>;

export interface ExtraLayer {
    id: string;
    src: string;
    transforms: TransformMap;
    zIndex: number;
    locked: boolean; 
    shadow: ShadowSettings;
}

export interface CustomTextLayer {
    id: string;
    text: string;
    color: string;
    fontFamily: string;
    transforms: TextTransformMap; // Uses TextTransformMap to handle font size via scale/base size
    zIndex: number;
    locked: boolean;
    shadow: ShadowSettings;
}

export type ShapeType = 'rectangle' | 'circle' | 'triangle';

export interface ShapeLayer {
    id: string;
    type: ShapeType;
    color: string;
    opacity: number;
    transforms: TransformMap;
    zIndex: number;
    locked: boolean; 
    shadow: ShadowSettings;
}

export interface Guide {
    id: string;
    axis: 'x' | 'y';
    position: number;
    locked: boolean;
}

export interface AdImages {
  productImage: string | null;
  logoImage: string | null;
  backgroundImage: string | null;
  generatedBackground?: boolean;
  productTransforms: TransformMap; 
  productLocked: boolean; 
  logoTransforms: TransformMap;
  logoLocked: boolean; 
  layers: ExtraLayer[]; 
  shapes: ShapeLayer[];
  customTexts: CustomTextLayer[]; // New array for extra text
}

export type DesignStyle = 'modern-minimal' | 'bold-geometric' | 'elegant-serif' | 'neon-urban';

export interface FavoriteDesign {
    id: string;
    style: DesignStyle;
    colors: ColorPalette;
    timestamp: number;
}

export type FontFamily = 
  | 'Inter' | 'Playfair Display' | 'Oswald' | 'Montserrat' | 'Roboto' | 'Lato' 
  | 'Bebas Neue' | 'Poppins' | 'Anton' | 'Pacifico' | 'Permanent Marker' 
  | 'Righteous' | 'Cinzel' | 'Raleway' | 'Open Sans' | 'Merriweather' 
  | 'Roboto Slab' | 'Lobster' | 'Bangers' | 'Fredoka'
  | 'Nunito' | 'Rubik' | 'Ubuntu' | 'PT Sans' | 'PT Serif' | 'Quicksand'
  | 'Work Sans' | 'Fira Sans' | 'Josefin Sans' | 'Dosis' | 'Titillium Web'
  | 'Inconsolata' | 'Kanit' | 'Exo 2' | 'Crimson Text' | 'Arvo' | 'Signika'
  | 'Bitter' | 'Cabin' | 'Catamaran'
  // New Additions
  | 'Syne' | 'Space Mono' | 'Outfit' | 'Epilogue' | 'Sora' | 'Manrope'
  | 'DM Sans' | 'DM Serif Display' | 'Archivo Black' | 'Teko' | 'Barlow'
  | 'Heebo' | 'League Spartan' | 'Russo One' | 'Passion One' | 'Fjalla One'
  | 'Space Grotesk' | 'IBM Plex Mono' | 'Monoton' | 'Zilla Slab'
  | 'Caveat' | 'Shadows Into Light' | 'Gloria Hallelujah' | 'Comfortaa' | 'Abril Fatface';

export interface TypographySettings {
  headlineFont: FontFamily;
  subheadlineFont: FontFamily;
  badgeFont: FontFamily;   // New independent font for badge
  contactFont: FontFamily; // New independent font for contact
}

export interface TextLayout {
    productName: TextTransformMap;
    headline: TextTransformMap;
    subheadline: TextTransformMap;
    cta: TextTransformMap;
    contact: TextTransformMap;
    badge: TextTransformMap;
}

export interface GridSettings {
    show: boolean;
    size: 5 | 10 | 20;
    color: 'black' | 'white';
}

export type ActiveElementId = 'productName' | 'headline' | 'subheadline' | 'cta' | 'contact' | 'badge' | 'productImage' | 'logoImage' | string | null;

export interface SelectionBox {
    x: number;
    y: number;
    width: number;
    height: number;
    startX: number;
    startY: number;
}

export interface AppState {
  format: AdFormat;
  style: DesignStyle;
  content: AdContent;
  images: AdImages;
  colors: ColorPalette;
  typography: TypographySettings;
  textLayout: TextLayout; 
  grid: GridSettings; 
  guides: Guide[]; 
  guideMode: boolean; 
  activeElement: ActiveElementId;
  selectedElements: string[]; // Support for multiple selected IDs
  selectionBox: SelectionBox | null; // For Marquee selection
  isGenerating: boolean;
  favorites: FavoriteDesign[]; 
}

export interface LayerSelectionMenu {
    x: number;
    y: number;
    items: { id: string; label: string; zIndex: number }[];
}

export const PALETTES: ColorPalette[] = [
  { primary: '#1e293b', secondary: '#64748b', accent: '#3b82f6', background: '#ffffff', text: '#0f172a' }, 
  { primary: '#000000', secondary: '#fbbf24', accent: '#ef4444', background: '#f3f4f6', text: '#111827' },
  { primary: '#4a3b32', secondary: '#a68b6c', accent: '#d4c5b0', background: '#faf9f6', text: '#2d241e' },
  { primary: '#111827', secondary: '#818cf8', accent: '#c026d3', background: '#0f172a', text: '#e2e8f0' },
  { primary: '#064e3b', secondary: '#34d399', accent: '#fbbf24', background: '#ecfdf5', text: '#064e3b' },
  { primary: '#4c1d95', secondary: '#a78bfa', accent: '#f472b6', background: '#fff1f2', text: '#4c1d95' },
  { primary: '#7c2d12', secondary: '#fdba74', accent: '#ea580c', background: '#fff7ed', text: '#431407' },
  { primary: '#171717', secondary: '#525252', accent: '#22c55e', background: '#000000', text: '#ffffff' },
  { primary: '#1e3a8a', secondary: '#93c5fd', accent: '#f59e0b', background: '#eff6ff', text: '#172554' },
  { primary: '#be123c', secondary: '#fda4af', accent: '#4338ca', background: '#fff1f2', text: '#881337' },
];

export const DEFAULT_PALETTES = {
  modern: PALETTES[0],
  bold: PALETTES[1],
  elegant: PALETTES[2],
  neon: PALETTES[3],
};

export const TEMPLATES: DesignStyle[] = ['modern-minimal', 'bold-geometric', 'elegant-serif', 'neon-urban'];

export const FONTS: FontFamily[] = [
    'Inter', 'Playfair Display', 'Oswald', 'Montserrat', 'Roboto', 'Lato', 
    'Bebas Neue', 'Poppins', 'Anton', 'Pacifico', 'Permanent Marker', 
    'Righteous', 'Cinzel', 'Raleway', 'Open Sans', 'Merriweather', 
    'Roboto Slab', 'Lobster', 'Bangers', 'Fredoka',
    'Nunito', 'Rubik', 'Ubuntu', 'PT Sans', 'PT Serif', 'Quicksand',
    'Work Sans', 'Fira Sans', 'Josefin Sans', 'Dosis', 'Titillium Web',
    'Inconsolata', 'Kanit', 'Exo 2', 'Crimson Text', 'Arvo', 'Signika',
    'Bitter', 'Cabin',
    // New
    'Syne', 'Space Mono', 'Outfit', 'Epilogue', 'Sora', 'Manrope',
    'DM Sans', 'DM Serif Display', 'Archivo Black', 'Teko', 'Barlow',
    'Heebo', 'League Spartan', 'Russo One', 'Passion One', 'Fjalla One',
    'Space Grotesk', 'IBM Plex Mono', 'Monoton', 'Zilla Slab',
    'Caveat', 'Shadows Into Light', 'Gloria Hallelujah', 'Comfortaa', 'Abril Fatface'
];
