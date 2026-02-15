import React, { useRef } from 'react';
import { AppState, AdFormat, FavoriteDesign, FONTS, ExtraLayer, ShapeType, ShapeLayer, ActiveElementId, TextTransform, ImageTransform, CtaStyle, CtaAnimation, TextLayout, ShadowSettings, CustomTextLayer, FontFamily } from '../types';
import { MagicIcon, UploadIcon, TrashIcon, PlusIcon, EyeIcon, EyeOffIcon, LockOpenIcon, LockClosedIcon, RulerIcon, RedoIcon, CopyIcon, DownloadIcon } from './icons';

interface ControlsProps {
  state: AppState;
  updateState: (newState: Partial<AppState>, saveHistory?: boolean) => void;
  onGenerateCopy: (prompt: string) => void;
  onGenerateImage: (prompt: string) => void;
  onModifyComposition: () => void; // Renamed from onShuffleDesign
  onLoadFavorite: (fav: FavoriteDesign) => void;
  onSaveFavorite: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onMoveShape: (id: string, direction: 'up' | 'down') => void;
  onMoveText?: (id: string, direction: 'up' | 'down') => void;
  onUpdateZIndex: (id: string, val: number) => void; 
  onToggleLock: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddText: () => void;
  onExportProject?: () => void;
  onImportProject?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Distinct colors for layers to make them visually separate
const LAYER_COLORS = [
    '#1e293b', // Slate
    '#450a0a', // Red
    '#431407', // Orange
    '#422006', // Amber
    '#3f6212', // Lime
    '#14532d', // Green
    '#064e3b', // Emerald
    '#134e4a', // Teal
    '#164e63', // Cyan
    '#0c4a6e', // Sky
    '#1e3a8a', // Blue
    '#312e81', // Indigo
    '#4c1d95', // Violet
    '#581c87', // Purple
    '#701a75', // Fuchsia
    '#831843', // Pink
    '#881337', // Rose
];

const ColorControl = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="mb-3">
        <label className="text-[10px] text-slate-500 block mb-1">{label}</label>
        <div className="flex gap-2 items-center">
            <input 
                type="color" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-8 h-8 rounded cursor-pointer bg-slate-800 border border-slate-700"
            />
            <input 
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white uppercase"
            />
        </div>
    </div>
);

const Controls: React.FC<ControlsProps> = ({ 
    state, 
    updateState, 
    onGenerateCopy, 
    onModifyComposition,
    onSaveFavorite,
    onLoadFavorite,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onMoveLayer,
    onMoveShape,
    onMoveText,
    onUpdateZIndex,
    onToggleLock,
    onDuplicate,
    onAddText,
    onExportProject,
    onImportProject
}) => {
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // --- Core Helpers ---
  const setActive = (id: ActiveElementId) => {
      // If guide mode is active, selecting things might be annoying, but we allow it
      updateState({ activeElement: id }, false);
  }

  // --- Handlers for Text ---
  const updateText = (id: ActiveElementId, field: keyof TextTransform, value: any) => {
      if (!id || typeof id !== 'string') return;
      const current = state.textLayout[id as keyof typeof state.textLayout][state.format];
      updateState({
          textLayout: {
              ...state.textLayout,
              [id]: {
                  ...state.textLayout[id as keyof typeof state.textLayout],
                  [state.format]: { ...current, [field]: value }
              }
          }
      }, false); 
  };

  const updateTextContent = (key: keyof AppState['content'], value: any) => {
      updateState({ content: { ...state.content, [key]: value } });
  }

  // --- Handlers for Images (Product/Logo) ---
  const updateMainImage = (type: 'product' | 'logo', field: keyof ImageTransform, value: number) => {
      const transformKey = type === 'product' ? 'productTransforms' : 'logoTransforms';
      const current = state.images[transformKey][state.format];
      updateState({
          images: {
              ...state.images,
              [transformKey]: {
                  ...state.images[transformKey],
                  [state.format]: { ...current, [field]: value }
              }
          }
      }, false);
  }

  // --- Handlers for Shapes ---
  const updateShapeTransform = (id: string, field: keyof ImageTransform, value: number) => {
      const shapes = state.images.shapes.map(s => {
          if (s.id !== id) return s;
          return {
              ...s,
              transforms: {
                  ...s.transforms,
                  [state.format]: { ...s.transforms[state.format], [field]: value }
              }
          }
      });
      updateState({ images: { ...state.images, shapes } }, false);
  }

  const updateShapeProp = (id: string, field: 'color' | 'opacity' | 'zIndex' | 'shadow', value: any) => {
      const shapes = state.images.shapes.map(s => s.id === id ? { ...s, [field]: value } : s);
      updateState({ images: { ...state.images, shapes } });
  }

  // --- Handlers for Layers ---
  const updateLayerTransform = (id: string, field: keyof ImageTransform, value: number) => {
      const layers = state.images.layers.map(l => {
          if (l.id !== id) return l;
          return {
              ...l,
              transforms: {
                  ...l.transforms,
                  [state.format]: { ...l.transforms[state.format], [field]: value }
              }
          }
      });
      updateState({ images: { ...state.images, layers } }, false);
  }

  const updateLayerProp = (id: string, field: 'shadow', value: any) => {
      const layers = state.images.layers.map(l => l.id === id ? { ...l, [field]: value } : l);
      updateState({ images: { ...state.images, layers } });
  }

  // --- Handlers for Custom Text ---
  const updateCustomTextTransform = (id: string, field: keyof TextTransform, value: any) => {
      const customTexts = state.images.customTexts.map(t => {
          if (t.id !== id) return t;
          return {
              ...t,
              transforms: {
                  ...t.transforms,
                  [state.format]: { ...t.transforms[state.format], [field]: value }
              }
          }
      });
      updateState({ images: { ...state.images, customTexts } }, false);
  }

  const updateCustomTextProp = (id: string, field: 'color' | 'text' | 'fontFamily' | 'zIndex' | 'shadow', value: any) => {
      const customTexts = state.images.customTexts.map(t => t.id === id ? { ...t, [field]: value } : t);
      updateState({ images: { ...state.images, customTexts } });
  }

  // --- File Uploaders ---
  const handleFileUpload = (target: 'product' | 'logo' | 'layer') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          if (target === 'layer') {
              const newLayer: ExtraLayer = {
                  id: Date.now().toString(),
                  src: reader.result as string,
                  zIndex: 50, // Default Z-Index
                  locked: false,
                  shadow: { enabled: false, color: '#000000', blur: 10, x: 5, y: 5 },
                  transforms: {
                      square: { scale: 1, x: 0, y: 0, rotation: 0 },
                      portrait: { scale: 1, x: 0, y: 0, rotation: 0 },
                      landscape: { scale: 1, x: 0, y: 0, rotation: 0 }
                  }
              };
              updateState({ images: { ...state.images, layers: [...state.images.layers, newLayer] } });
              setActive(newLayer.id);
          } else {
              const key = target === 'product' ? 'productImage' : 'logoImage';
              updateState({ images: { ...state.images, [key]: reader.result as string } });
              setActive(target === 'product' ? 'productImage' : 'logoImage');
          }
      };
      reader.readAsDataURL(file);
  }

  const handleAddShape = (type: ShapeType) => {
      const newShape: ShapeLayer = {
          id: Date.now().toString(),
          type,
          color: state.colors.accent,
          opacity: 1,
          zIndex: 40, 
          locked: false,
          shadow: { enabled: false, color: '#000000', blur: 10, x: 5, y: 5 },
          transforms: {
            square: { scale: 1, x: 0, y: 0, rotation: 0 },
            portrait: { scale: 1, x: 0, y: 0, rotation: 0 },
            landscape: { scale: 1, x: 0, y: 0, rotation: 0 }
        }
      };
      updateState({ images: { ...state.images, shapes: [...state.images.shapes, newShape] } });
      setActive(newShape.id);
  };

  const toggleGuideMode = () => {
      updateState({ guideMode: !state.guideMode });
  }

  const handleFormatChange = (format: AdFormat) => {
      updateState({ format });
  }

  // --- REUSABLE INSPECTOR COMPONENTS ---

  const ShadowControl = ({ shadow, onChange }: { shadow: ShadowSettings, onChange: (s: ShadowSettings) => void }) => (
      <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 mt-4">
          <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Cień</span>
              <button 
                  onClick={() => onChange({ ...shadow, enabled: !shadow.enabled })}
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors ${shadow.enabled ? 'bg-orange-600' : 'bg-slate-700'}`}
              >
                  <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${shadow.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
          </div>
          {shadow.enabled && (
              <div className="space-y-2 animate-slide-up">
                  <div className="flex gap-2 items-center">
                      <input type="color" value={shadow.color} onChange={e => onChange({ ...shadow, color: e.target.value })} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none" />
                      <span className="text-xs text-slate-400">Kolor</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-8">Rozmycie</span>
                      <input type="range" min="0" max="50" value={shadow.blur} onChange={e => onChange({ ...shadow, blur: parseFloat(e.target.value) })} className="flex-1 h-1 bg-slate-700 rounded accent-orange-500" />
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-8">Oś X</span>
                      <input type="range" min="-50" max="50" value={shadow.x} onChange={e => onChange({ ...shadow, x: parseFloat(e.target.value) })} className="flex-1 h-1 bg-slate-700 rounded accent-orange-500" />
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-8">Oś Y</span>
                      <input type="range" min="-50" max="50" value={shadow.y} onChange={e => onChange({ ...shadow, y: parseFloat(e.target.value) })} className="flex-1 h-1 bg-slate-700 rounded accent-orange-500" />
                  </div>
              </div>
          )}
      </div>
  );

  const TransformControls = ({ 
      scale, x, y, rotation, 
      onUpdate 
  }: { 
      scale: number, x: number, y: number, rotation: number, 
      onUpdate: (field: any, val: number) => void 
  }) => (
      <div className="space-y-3 p-4 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-8">Skala</span>
              <input type="range" min="0.1" max="5" step="0.01" value={scale} onChange={e => onUpdate('scale', parseFloat(e.target.value))} className="flex-1 h-1 bg-slate-700 rounded accent-orange-500" />
              <input type="number" step="0.01" value={scale} onChange={e => onUpdate('scale', parseFloat(e.target.value))} className="w-16 bg-slate-800 border border-slate-700 rounded text-[10px] text-center p-1" />
          </div>
          <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-8">Poz. X</span>
              <input type="range" min="-1000" max="1000" step="1" value={x} onChange={e => onUpdate('x', parseFloat(e.target.value))} className="flex-1 h-1 bg-slate-700 rounded accent-orange-500" />
              <input type="number" step="1" value={x} onChange={e => onUpdate('x', parseFloat(e.target.value))} className="w-16 bg-slate-800 border border-slate-700 rounded text-[10px] text-center p-1" />
          </div>
          <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-8">Poz. Y</span>
              <input type="range" min="-1000" max="1000" step="1" value={y} onChange={e => onUpdate('y', parseFloat(e.target.value))} className="flex-1 h-1 bg-slate-700 rounded accent-orange-500" />
              <input type="number" step="1" value={y} onChange={e => onUpdate('y', parseFloat(e.target.value))} className="w-16 bg-slate-800 border border-slate-700 rounded text-[10px] text-center p-1" />
          </div>
          <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-8">Obrót</span>
              <input type="range" min="-180" max="180" step="1" value={rotation || 0} onChange={e => onUpdate('rotation', parseFloat(e.target.value))} className="flex-1 h-1 bg-slate-700 rounded accent-orange-500" />
              <input type="number" step="1" value={rotation || 0} onChange={e => onUpdate('rotation', parseFloat(e.target.value))} className="w-16 bg-slate-800 border border-slate-700 rounded text-[10px] text-center p-1" />
          </div>
      </div>
  );

  const ZIndexControl = ({ id, currentZ, onChange }: { id: string, currentZ: number, onChange: (id: string, val: number) => void }) => (
      <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800 mt-2">
          <span className="text-[10px] text-slate-500">Warstwa (Index)</span>
          <input 
            type="number" 
            value={currentZ} 
            onChange={(e) => onChange(id, parseInt(e.target.value) || 0)}
            className="w-16 bg-slate-800 border border-slate-700 rounded text-xs text-center p-1 focus:border-orange-500 outline-none"
          />
      </div>
  );

  const handleMagicCopy = () => {
    if (promptRef.current?.value) {
      onGenerateCopy(promptRef.current.value);
    }
  };

  const toggleGrid = () => {
      updateState({ grid: { ...state.grid, show: !state.grid.show }});
  }

  // --- RENDER INSPECTOR ---
  const renderInspector = () => {
      const { activeElement } = state;
      if (!activeElement) return <div className="p-6 text-center text-slate-500 text-xs italic">Wybierz element z listy powyżej, aby go edytować.</div>;

      // 1. Text Elements
      if (['headline', 'subheadline', 'productName', 'contact', 'cta', 'badge'].includes(activeElement)) {
          const t = state.textLayout[activeElement as keyof typeof state.textLayout][state.format];
          
          let contentValue = '';
          let updateFn = null;
          let label = '';
          let showToggle = '';

          // Colors
          let colorValue1 = '';
          let colorLabel1 = '';
          let updateColor1 = null;
          let colorValue2 = '';
          let colorLabel2 = '';
          let updateColor2 = null;

          if (activeElement === 'headline') {
               label = 'Nagłówek';
               contentValue = state.content.headline;
               updateFn = (v: string) => updateTextContent('headline', v);
               showToggle = 'showHeadline';
               colorValue1 = state.content.headlineColor;
               colorLabel1 = 'Kolor Tekstu';
               updateColor1 = (v: string) => updateTextContent('headlineColor', v);
          } else if (activeElement === 'subheadline') {
               label = 'Podtytuł';
               contentValue = state.content.subheadline;
               updateFn = (v: string) => updateTextContent('subheadline', v);
               showToggle = 'showSubheadline';
               colorValue1 = state.content.subheadlineColor;
               colorLabel1 = 'Kolor Tekstu';
               updateColor1 = (v: string) => updateTextContent('subheadlineColor', v);
          } else if (activeElement === 'productName') {
              label = 'Meta Tag / Info'; 
              contentValue = state.content.productName;
              updateFn = (v: string) => updateTextContent('productName', v);
              showToggle = 'showProductName';
              colorValue1 = state.content.productNameColor;
              colorLabel1 = 'Kolor Tekstu';
              updateColor1 = (v: string) => updateTextContent('productNameColor', v);
          } else if (activeElement === 'contact') {
              label = 'Stopka / Kontakt';
              contentValue = state.content.contactInfo;
              updateFn = (v: string) => updateTextContent('contactInfo', v);
              showToggle = 'showContact';
              colorValue1 = state.content.contactInfoColor;
              colorLabel1 = 'Kolor Tekstu';
              updateColor1 = (v: string) => updateTextContent('contactInfoColor', v);
          } else if (activeElement === 'cta') {
              label = 'Przycisk (CTA)';
              contentValue = state.content.ctaText;
              updateFn = (v: string) => updateTextContent('ctaText', v);
              showToggle = 'showCTA';
              colorValue1 = state.content.ctaTextColor;
              colorLabel1 = 'Kolor Tekstu';
              updateColor1 = (v: string) => updateTextContent('ctaTextColor', v);
              colorValue2 = state.content.ctaBgColor;
              colorLabel2 = 'Tło Przycisku';
              updateColor2 = (v: string) => updateTextContent('ctaBgColor', v);
          } else if (activeElement === 'badge') {
              label = 'Odznaka';
              contentValue = state.content.promoBadge || '';
              updateFn = (v: string) => updateTextContent('promoBadge', v);
              showToggle = 'showPromoBadge';
              colorValue1 = state.content.promoBadgeTextColor;
              colorLabel1 = 'Kolor Tekstu';
              updateColor1 = (v: string) => updateTextContent('promoBadgeTextColor', v);
              colorValue2 = state.content.promoBadgeBgColor;
              colorLabel2 = 'Tło Odznaki';
              updateColor2 = (v: string) => updateTextContent('promoBadgeBgColor', v);
          }

          return (
              <div className="p-4 border-t border-slate-700 bg-slate-800 animate-slide-up pb-20">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          Edycja: {label}
                      </h3>
                      <div className="flex gap-2">
                          <button onClick={() => onDuplicate(activeElement)} className="text-xs text-slate-400 hover:text-white" title="Powiel"><CopyIcon/></button>
                          {showToggle && (
                              <button 
                                onClick={() => updateTextContent(showToggle as any, !state.content[showToggle as keyof typeof state.content])}
                                className={`text-xs ${state.content[showToggle as keyof typeof state.content] ? 'text-orange-400' : 'text-slate-600'}`}
                              >
                                  {state.content[showToggle as keyof typeof state.content] ? <EyeIcon/> : <EyeOffIcon/>}
                              </button>
                          )}
                      </div>
                  </div>
                  
                  {activeElement === 'headline' || activeElement === 'subheadline' ? (
                      <textarea value={contentValue} onChange={e => updateFn && updateFn(e.target.value)} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white mb-4 outline-none focus:border-orange-500" />
                  ) : (
                      <input type="text" value={contentValue} onChange={e => updateFn && updateFn(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white mb-4 outline-none focus:border-orange-500" />
                  )}

                  {/* BUTTON STYLE & ANIMATION CONTROLS */}
                  {activeElement === 'cta' && (
                      <div className="mb-4 space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <label className="text-[10px] text-slate-500 block mb-1">Styl Przycisku</label>
                                  <select 
                                    value={state.content.ctaStyle}
                                    onChange={(e) => updateTextContent('ctaStyle', e.target.value as CtaStyle)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs"
                                  >
                                      <option value="solid">Pełny</option>
                                      <option value="outline">Obrys</option>
                                      <option value="gradient">Gradient</option>
                                      <option value="glass">Szkło</option>
                                      <option value="neon">Neon</option>
                                      <option value="brutal">Brutal</option>
                                      <option value="soft">Miękki</option>
                                      <option value="minimal">Minimal</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-[10px] text-slate-500 block mb-1">Animacja</label>
                                  <select 
                                    value={state.content.ctaAnimation}
                                    onChange={(e) => updateTextContent('ctaAnimation', e.target.value as CtaAnimation)}
                                    disabled={!state.content.ctaAnimationEnabled}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs disabled:opacity-50"
                                  >
                                      <option value="none">Brak</option>
                                      <option value="pulse">Puls</option>
                                      <option value="bounce">Podskok</option>
                                      <option value="shake">Potrząśnij</option>
                                      <option value="shimmer">Błysk</option>
                                      <option value="wobble">Kołysanie</option>
                                  </select>
                              </div>
                          </div>
                          {/* New Toggle for Animation */}
                          <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-700">
                              <span className="text-[10px] text-slate-400">Animacja Aktywna</span>
                              <button 
                                  onClick={() => updateTextContent('ctaAnimationEnabled', !state.content.ctaAnimationEnabled)}
                                  className={`w-8 h-4 rounded-full p-0.5 transition-colors ${state.content.ctaAnimationEnabled ? 'bg-orange-600' : 'bg-slate-700'}`}
                              >
                                  <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${state.content.ctaAnimationEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Colors */}
                  {updateColor1 && <ColorControl label={colorLabel1} value={colorValue1} onChange={updateColor1} />}
                  {updateColor2 && <ColorControl label={colorLabel2} value={colorValue2} onChange={updateColor2} />}

                  {/* Text Formatting Tools */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                          <label className="text-[10px] text-slate-500 block mb-1">Wyrównanie</label>
                          <div className="flex gap-1">
                                <button onClick={() => updateText(activeElement as any, 'textAlign', 'left')} className={`flex-1 p-1 rounded text-[10px] ${t.textAlign === 'left' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>L</button>
                                <button onClick={() => updateText(activeElement as any, 'textAlign', 'center')} className={`flex-1 p-1 rounded text-[10px] ${t.textAlign === 'center' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>C</button>
                                <button onClick={() => updateText(activeElement as any, 'textAlign', 'right')} className={`flex-1 p-1 rounded text-[10px] ${t.textAlign === 'right' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>R</button>
                          </div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                          <label className="text-[10px] text-slate-500 block mb-1">Interlinia: {t.lineHeight}</label>
                          <input type="range" min="0.8" max="2.0" step="0.1" value={t.lineHeight} onChange={e => updateText(activeElement as any, 'lineHeight', parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-orange-500"/>
                      </div>
                  </div>


                  <div className="mb-2 text-[10px] font-bold text-slate-500 uppercase">Pozycja i Rozmiar</div>
                  <TransformControls 
                      scale={t.scale} x={t.x} y={t.y} rotation={t.rotation}
                      onUpdate={(f, v) => updateText(activeElement as any, f, v)}
                  />

                  <ZIndexControl id={activeElement} currentZ={t.zIndex} onChange={onUpdateZIndex} />
                  <ShadowControl shadow={t.shadow || { enabled: false, color: '#000000', blur: 10, x: 5, y: 5 }} onChange={(s) => updateText(activeElement as any, 'shadow', s)} />

                  {/* Font Controls (Updated for Badge and Contact independent fonts) */}
                  {(['headline', 'subheadline', 'badge', 'contact'].includes(activeElement)) && (
                      <div className="mt-4">
                          <div className="mb-2 text-[10px] font-bold text-slate-500 uppercase">Czcionka</div>
                          <select 
                             value={
                                activeElement === 'headline' ? state.typography.headlineFont : 
                                activeElement === 'subheadline' ? state.typography.subheadlineFont :
                                activeElement === 'badge' ? state.typography.badgeFont :
                                activeElement === 'contact' ? state.typography.contactFont :
                                'Inter' 
                             }
                             onChange={(e) => {
                                 const font = e.target.value as FontFamily;
                                 if (activeElement === 'headline') updateState({ typography: { ...state.typography, headlineFont: font }});
                                 else if (activeElement === 'subheadline') updateState({ typography: { ...state.typography, subheadlineFont: font }});
                                 else if (activeElement === 'badge') updateState({ typography: { ...state.typography, badgeFont: font }});
                                 else if (activeElement === 'contact') updateState({ typography: { ...state.typography, contactFont: font }});
                             }}
                             className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs"
                          >
                              {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                          </select>
                      </div>
                  )}
              </div>
          )
      }

      // 2. Custom Text Layers
      const customText = state.images.customTexts.find(t => t.id === activeElement);
      if (customText) {
          const t = customText.transforms[state.format];
          return (
              <div className="p-4 border-t border-slate-700 bg-slate-800 animate-slide-up pb-20">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-white uppercase">Edycja: Tekst Własny</h3>
                      <div className="flex gap-2">
                           <button onClick={() => onDuplicate(customText.id)} className="text-xs text-slate-400 hover:text-white" title="Powiel"><CopyIcon/></button>
                           <button onClick={() => {
                              const newTexts = state.images.customTexts.filter(x => x.id !== activeElement);
                              updateState({ images: { ...state.images, customTexts: newTexts }, activeElement: null });
                           }} className="text-red-500 hover:text-red-400"><TrashIcon/></button>
                      </div>
                  </div>

                  <textarea 
                      value={customText.text} 
                      onChange={e => updateCustomTextProp(customText.id, 'text', e.target.value)} 
                      rows={2} 
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white mb-4 outline-none focus:border-orange-500" 
                  />

                  <div className="mb-4">
                        <label className="text-[10px] text-slate-500 block mb-1">Czcionka</label>
                        <select 
                            value={customText.fontFamily}
                            onChange={(e) => updateCustomTextProp(customText.id, 'fontFamily', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs"
                        >
                            {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                        </select>
                  </div>

                  <ColorControl label="Kolor Tekstu" value={customText.color} onChange={(v) => updateCustomTextProp(customText.id, 'color', v)} />

                  {/* Text Formatting Tools */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                          <label className="text-[10px] text-slate-500 block mb-1">Wyrównanie</label>
                          <div className="flex gap-1">
                                <button onClick={() => updateCustomTextTransform(customText.id, 'textAlign', 'left')} className={`flex-1 p-1 rounded text-[10px] ${t.textAlign === 'left' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>L</button>
                                <button onClick={() => updateCustomTextTransform(customText.id, 'textAlign', 'center')} className={`flex-1 p-1 rounded text-[10px] ${t.textAlign === 'center' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>C</button>
                                <button onClick={() => updateCustomTextTransform(customText.id, 'textAlign', 'right')} className={`flex-1 p-1 rounded text-[10px] ${t.textAlign === 'right' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>R</button>
                          </div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                          <label className="text-[10px] text-slate-500 block mb-1">Interlinia: {t.lineHeight}</label>
                          <input type="range" min="0.8" max="2.0" step="0.1" value={t.lineHeight} onChange={e => updateCustomTextTransform(customText.id, 'lineHeight', parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-orange-500"/>
                      </div>
                  </div>

                  <div className="mb-2 text-[10px] font-bold text-slate-500 uppercase">Pozycja i Rozmiar</div>
                  <TransformControls 
                      scale={t.scale} x={t.x} y={t.y} rotation={t.rotation}
                      onUpdate={(f, v) => updateCustomTextTransform(customText.id, f, v)}
                  />
                  
                  <ZIndexControl id={customText.id} currentZ={customText.zIndex} onChange={onUpdateZIndex} />
                  <ShadowControl shadow={customText.shadow || { enabled: false, color: '#000000', blur: 10, x: 5, y: 5 }} onChange={(s) => updateCustomTextProp(customText.id, 'shadow', s)} />
              </div>
          );
      }

      // 3. Shapes
      const activeShape = state.images.shapes.find(s => s.id === activeElement);
      if (activeShape) {
          const t = activeShape.transforms[state.format];
          return (
              <div className="p-4 border-t border-slate-700 bg-slate-800 animate-slide-up pb-20">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-white uppercase">Edycja: Kształt</h3>
                      <div className="flex gap-2">
                           <button onClick={() => onDuplicate(activeShape.id)} className="text-xs text-slate-400 hover:text-white" title="Powiel"><CopyIcon/></button>
                           <button onClick={() => {
                              const newShapes = state.images.shapes.filter(s => s.id !== activeElement);
                              updateState({ images: { ...state.images, shapes: newShapes }, activeElement: null });
                           }} className="text-red-500 hover:text-red-400"><TrashIcon/></button>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Kolor</label>
                          <input type="color" value={activeShape.color} onChange={e => updateShapeProp(activeShape.id, 'color', e.target.value)} className="w-full h-8 bg-slate-900 rounded cursor-pointer border border-slate-700"/>
                      </div>
                      <div>
                           <label className="block text-[10px] text-slate-500 mb-1">Przezroczystość</label>
                           <input type="range" min="0" max="1" step="0.1" value={activeShape.opacity} onChange={e => updateShapeProp(activeShape.id, 'opacity', parseFloat(e.target.value))} className="w-full h-8"/>
                      </div>
                  </div>

                  <TransformControls 
                      scale={t.scale} x={t.x} y={t.y} rotation={t.rotation}
                      onUpdate={(f, v) => updateShapeTransform(activeShape.id, f, v)}
                  />
                  
                  <ZIndexControl id={activeShape.id} currentZ={activeShape.zIndex} onChange={onUpdateZIndex} />
                  <ShadowControl shadow={activeShape.shadow || { enabled: false, color: '#000000', blur: 10, x: 5, y: 5 }} onChange={(s) => updateShapeProp(activeShape.id, 'shadow', s)} />
              </div>
          )
      }

      // 4. Extra Layers
      const activeLayer = state.images.layers.find(l => l.id === activeElement);
      if (activeLayer) {
          const t = activeLayer.transforms[state.format];
          return (
              <div className="p-4 border-t border-slate-700 bg-slate-800 animate-slide-up pb-20">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-white uppercase">Edycja: Obiekt</h3>
                      <div className="flex gap-2">
                           <button onClick={() => onDuplicate(activeLayer.id)} className="text-xs text-slate-400 hover:text-white" title="Powiel"><CopyIcon/></button>
                           <button onClick={() => {
                              const newLayers = state.images.layers.filter(l => l.id !== activeElement);
                              updateState({ images: { ...state.images, layers: newLayers }, activeElement: null });
                           }} className="text-red-500 hover:text-red-400"><TrashIcon/></button>
                      </div>
                  </div>
                  
                  <div className="flex justify-center mb-4 bg-slate-900 p-2 rounded">
                      <img src={activeLayer.src} className="h-16 object-contain" alt="preview" />
                  </div>

                  <TransformControls 
                      scale={t.scale} x={t.x} y={t.y} rotation={t.rotation}
                      onUpdate={(f, v) => updateLayerTransform(activeLayer.id, f, v)}
                  />
                  <ZIndexControl id={activeLayer.id} currentZ={activeLayer.zIndex} onChange={onUpdateZIndex} />
                  <ShadowControl shadow={activeLayer.shadow || { enabled: false, color: '#000000', blur: 10, x: 5, y: 5 }} onChange={(s) => updateLayerProp(activeLayer.id, 'shadow', s)} />
              </div>
          )
      }

      // 5. Main Product / Logo
      if (activeElement === 'productImage' && state.images.productImage) {
           const t = state.images.productTransforms[state.format];
           return (
              <div className="p-4 border-t border-slate-700 bg-slate-800 animate-slide-up pb-20">
                   <h3 className="text-sm font-bold text-white uppercase mb-4">Edycja: Główny Produkt</h3>
                   <TransformControls 
                      scale={t.scale} x={t.x} y={t.y} rotation={t.rotation}
                      onUpdate={(f, v) => updateMainImage('product', f, v)}
                   />
              </div>
           );
      }
      if (activeElement === 'logoImage' && state.images.logoImage) {
           const t = state.images.logoTransforms[state.format];
           return (
              <div className="p-4 border-t border-slate-700 bg-slate-800 animate-slide-up pb-20">
                   <h3 className="text-sm font-bold text-white uppercase mb-4">Edycja: Logo</h3>
                   <TransformControls 
                      scale={t.scale} x={t.x} y={t.y} rotation={t.rotation}
                      onUpdate={(f, v) => updateMainImage('logo', f, v)}
                   />
              </div>
           );
      }

      return null;
  }
  
  // Helper to get color from predefined list based on index
  const getLayerStyle = (index: number, isActive: boolean) => {
      const color = LAYER_COLORS[index % LAYER_COLORS.length];
      return {
          backgroundColor: isActive ? '#ea580c' : color, // Orange if active, else cyclic color
          borderColor: isActive ? '#fdba74' : 'transparent',
      }
  };

  const getIsLocked = (id: string): boolean => {
      if (['headline', 'subheadline', 'productName', 'contact', 'cta', 'badge'].includes(id)) {
          return state.textLayout[id as keyof TextLayout][state.format].locked;
      }
      if (id === 'productImage') return state.images.productLocked;
      if (id === 'logoImage') return state.images.logoLocked;
      const s = state.images.shapes.find(x => x.id === id);
      if (s) return s.locked;
      const l = state.images.layers.find(x => x.id === id);
      if (l) return l.locked;
      const t = state.images.customTexts.find(x => x.id === id);
      if (t) return t.locked;
      return false;
  }

  // Build a flat list of items for the layer list
  const layerListItems = [
      { id: 'headline', label: 'Nagłówek', type: 'text' },
      { id: 'subheadline', label: 'Podtytuł', type: 'text' },
      { id: 'cta', label: 'Przycisk', type: 'text' },
      { id: 'productName', label: 'Meta Tag / Info', type: 'text' },
      { id: 'contact', label: 'Stopka', type: 'text' },
      { id: 'badge', label: 'Odznaka', type: 'text' },
  ];
  
  if (state.images.productImage) layerListItems.push({ id: 'productImage', label: 'Produkt Główny', type: 'image' });
  if (state.images.logoImage) layerListItems.push({ id: 'logoImage', label: 'Logo', type: 'image' });
  state.images.customTexts.forEach((t, i) => layerListItems.push({ id: t.id, label: `Tekst: ${t.text.substring(0, 10)}...`, type: 'text+' }));
  state.images.shapes.forEach((s, i) => layerListItems.push({ id: s.id, label: `${s.type === 'rectangle' ? 'Prostokąt' : s.type === 'circle' ? 'Koło' : 'Trójkąt'} ${i+1}`, type: 'shape' }));
  state.images.layers.forEach((l, i) => layerListItems.push({ id: l.id, label: `Obiekt ${i+1}`, type: 'layer' }));

  return (
    <div className="w-full h-full bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex flex-col gap-3">
        <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-orange-500">Kingusia</span> Studio
            </h1>
            
            <div className="flex items-center gap-2">
                 {/* NEW ADD OBJECT BUTTON */}
                <label className="cursor-pointer bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95">
                    <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload('layer')} />
                    <PlusIcon /> Dodaj Obiekt
                </label>
                
                <button onClick={onUndo} disabled={!canUndo} className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors text-[10px] font-bold uppercase" title="Cofnij">
                    Cofnij
                </button>
                <button onClick={onRedo} disabled={!canRedo} className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors text-[10px] font-bold uppercase" title="Krok w przód">
                    <RedoIcon />
                </button>
            </div>
        </div>
        
        {/* Project Management */}
        <div className="flex gap-2 mb-2">
            <button 
                onClick={onExportProject}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-1 px-2 rounded border border-slate-700 uppercase font-bold"
            >
                Zapisz Projekt
            </button>
            <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-1 px-2 rounded border border-slate-700 uppercase font-bold text-center cursor-pointer">
                Wczytaj Projekt
                <input type="file" accept=".json" onChange={onImportProject} className="hidden"/>
            </label>
        </div>

        {/* Format Selector */}
        <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            {['square', 'portrait', 'landscape'].map((f) => (
                <button 
                    key={f} 
                    onClick={() => handleFormatChange(f as AdFormat)}
                    className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded transition-colors ${state.format === f ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700'}`}
                >
                    {f === 'square' ? '1:1' : f === 'portrait' ? '9:16' : '16:9'}
                </button>
            ))}
        </div>

        {/* Quick Tools */}
        <div className="flex gap-2">
            <button 
                onClick={toggleGuideMode} 
                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded border border-slate-700 flex items-center justify-center gap-1 ${state.guideMode ? 'bg-cyan-600 text-white border-cyan-400 animate-pulse' : 'text-slate-400 hover:bg-slate-800'}`}
            >
                <RulerIcon /> Linie Pom.
            </button>
            <button onClick={toggleGrid} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded border border-slate-700 ${state.grid.show ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                Siatka
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* AI & Gen */}
          <div className="p-4 border-b border-slate-800">
             <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-2">
                <textarea ref={promptRef} className="w-full bg-transparent text-xs text-white placeholder-slate-600 outline-none resize-none" placeholder="Opisz pomysł na reklamę..." rows={2}/>
                <div className="flex gap-2">
                    <button onClick={handleMagicCopy} disabled={state.isGenerating} className="flex-1 bg-slate-700 hover:bg-slate-600 text-[10px] font-bold text-white py-2 rounded flex items-center justify-center gap-1">
                        <MagicIcon/> Hasła
                    </button>
                    <button onClick={onModifyComposition} className="flex-1 bg-gradient-to-r from-orange-600 to-pink-600 hover:brightness-110 text-[10px] font-bold text-white py-2 rounded flex items-center justify-center gap-1">
                        <RulerIcon/> Kompozycja (Auto)
                    </button>
                </div>
             </div>
          </div>

          {/* --- LAYER LIST (The Core UI) --- */}
          <div className="p-4 space-y-4">
              
              {/* Add New Objects Row */}
              <div className="grid grid-cols-4 gap-2">
                   <button onClick={() => handleAddShape('rectangle')} className="flex flex-col items-center justify-center gap-1 bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors border border-slate-700 group">
                       <div className="w-4 h-3 border border-slate-400 group-hover:border-orange-500"></div>
                       <span className="text-[8px] uppercase font-bold text-slate-500 group-hover:text-white">Prostokąt</span>
                   </button>
                   <button onClick={() => handleAddShape('circle')} className="flex flex-col items-center justify-center gap-1 bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors border border-slate-700 group">
                       <div className="w-4 h-4 rounded-full border border-slate-400 group-hover:border-orange-500"></div>
                       <span className="text-[8px] uppercase font-bold text-slate-500 group-hover:text-white">Koło</span>
                   </button>
                   <button onClick={() => handleAddShape('triangle')} className="flex flex-col items-center justify-center gap-1 bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors border border-slate-700 group">
                       <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-slate-400 group-hover:border-b-orange-500"></div>
                       <span className="text-[8px] uppercase font-bold text-slate-500 group-hover:text-white">Trójkąt</span>
                   </button>
                   <label className="flex flex-col items-center justify-center gap-1 bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors border border-slate-700 group cursor-pointer">
                       <input type="file" className="hidden" accept="image/png" onChange={handleFileUpload('layer')} />
                       <PlusIcon />
                       <span className="text-[8px] uppercase font-bold text-slate-500 group-hover:text-white">Wgraj</span>
                   </label>
              </div>
              
              {/* NEW: ADD TEXT BUTTON ROW */}
              <button 
                  onClick={onAddText} 
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors border border-slate-700 group"
              >
                  <span className="font-serif text-lg italic text-slate-400 group-hover:text-orange-500">T</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-white">Dodaj Tekst</span>
              </button>

              <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Warstwy Projektu</div>
                  
                  {layerListItems.map((item, index) => {
                      const isLocked = getIsLocked(item.id);
                      return (
                      <div key={item.id} className="flex gap-1 group">
                          <button 
                            onClick={() => setActive(item.id as any)}
                            style={getLayerStyle(index, state.activeElement === item.id)}
                            className={`flex-1 text-left p-2 rounded text-xs font-bold flex items-center gap-2 transition-all border border-transparent shadow-sm`}
                          >
                              <span className="opacity-50 text-[9px] uppercase tracking-wider">{item.type}</span> 
                              <span className="flex-1 truncate">{item.label}</span>
                          </button>
                          
                          {/* QUICK ACTIONS ON HOVER */}
                           <div className="hidden group-hover:flex gap-1">
                                <button 
                                    onClick={() => onDuplicate(item.id)}
                                    className="p-2 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                                    title="Powiel"
                                >
                                    <CopyIcon/>
                                </button>
                           </div>

                          {/* LOCK BUTTON */}
                          <button 
                             onClick={() => onToggleLock(item.id)}
                             className={`p-2 rounded border border-transparent ${isLocked ? 'text-red-500 bg-red-900/20 border-red-900/30' : 'text-slate-600 hover:text-green-500 hover:bg-slate-800'}`}
                             title={isLocked ? "Odblokuj warstwę" : "Zablokuj warstwę"}
                          >
                              {isLocked ? <LockClosedIcon/> : <LockOpenIcon/>}
                          </button>
                      </div>
                  )})}
              </div>

          </div>
      </div>

      {/* INSPECTOR PANEL (Sticky Bottom) */}
      <div className="bg-slate-900 border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
          {renderInspector()}
      </div>
      
      {/* Upload Hidden Inputs for Main slots (kept for legacy support if needed, but handled via unified file upload now) */}
      <input type="file" id="upload-product" className="hidden" accept="image/png" onChange={handleFileUpload('product')} />
      <input type="file" id="upload-logo" className="hidden" accept="image/*" onChange={handleFileUpload('logo')} />
      
    </div>
  );
};

export default Controls;