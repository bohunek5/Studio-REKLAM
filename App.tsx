import React, { useState, useRef, useEffect } from 'react';
import { AppState, DEFAULT_PALETTES, PALETTES, TEMPLATES, FavoriteDesign, DesignStyle, ColorPalette, FontFamily, ShapeLayer, ShapeType, TextLayout, TextTransformMap, FONTS, Guide, ActiveElementId, AdFormat, ExtraLayer, CustomTextLayer, TextTransform, ImageTransform, CtaStyle, CtaAnimation } from './types';
import Controls from './components/Controls';
import { BoldGeometric, ModernMinimal, ElegantSerif, NeonUrban } from './components/DesignTemplates';
import { generateAdCopy, generateBackgroundImage } from './services/geminiService';
import { DownloadIcon } from './components/icons';
import { createRoot } from 'react-dom/client';

const App: React.FC = () => {
    const canvasRef = useRef<HTMLDivElement>(null);

    // UI State for drag feedback
    const [isDraggingUI, setIsDraggingUI] = useState(false);

    // History state for Undo/Redo
    const [history, setHistory] = useState<AppState[]>([]);
    const [redoStack, setRedoStack] = useState<AppState[]>([]);

    // Drag State
    const dragRef = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        initialObjX: 0, // Used for single element or guide
        initialObjY: 0,
        type: 'element' as 'element' | 'guide' | 'marquee',
        activeId: ''
    });

    // Default Transform helper
    const defaultTextTransform = (z: number = 30): TextTransformMap => ({
        square: { scale: 1, x: 0, y: 0, rotation: 0, zIndex: z, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: false, color: '#000000', blur: 10, x: 5, y: 5 } },
        portrait: { scale: 1, x: 0, y: 0, rotation: 0, zIndex: z, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: false, color: '#000000', blur: 10, x: 5, y: 5 } },
        landscape: { scale: 1, x: 0, y: 0, rotation: 0, zIndex: z, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: false, color: '#000000', blur: 10, x: 5, y: 5 } },
    });

    // --- INITIAL STATE: APPLE STYLE MINIMALISM ---
    const [appState, setAppState] = useState<AppState>({
        format: 'square',
        style: 'elegant-serif', // Catalog style
        isGenerating: false,
        favorites: [],
        grid: { show: false, size: 20, color: 'black' },
        guides: [],
        guideMode: false,
        activeElement: null,
        selectedElements: [],
        selectionBox: null,
        content: {
            productName: "Stranda Residence", // Brand
            showProductName: true,
            productNameColor: "#ffffff",
            headline: "SZTUKA\nWYPOCZYNKU",
            showHeadline: true,
            headlineColor: "#ffffff",
            subheadline: "Giżycko • Jezioro Kisajno • Apartament A103",
            showSubheadline: true,
            subheadlineColor: "#cbd5e1", // Subtle gray-white
            ctaText: "ZOBACZ WIĘCEJ",
            showCTA: true,
            ctaBgColor: "transparent",
            ctaTextColor: "#ffffff",
            ctaStyle: 'glass', // Premium glass effect
            ctaAnimation: 'none',
            ctaAnimationEnabled: false, // Static elegance
            contactInfo: "mazury.holiday",
            showContact: true,
            contactInfoColor: "#94a3b8",
            promoBadge: "Premium",
            showPromoBadge: false, // Minimalist
            promoBadgeBgColor: "#000000",
            promoBadgeTextColor: "#ffffff"
        },
        images: {
            productImage: null,
            logoImage: '/Studio-REKLAM/mazury_logo.png',
            backgroundImage: '/Studio-REKLAM/a103_catalog.webp',
            layers: [],
            shapes: [
                // Subtle dark gradient from bottom for readability
                { id: 'overlay_gradient', type: 'rectangle', color: '#000000', opacity: 0.3, transforms: { square: { scale: 2, x: 0, y: 0, rotation: 0 }, portrait: { scale: 2, x: 0, y: 0, rotation: 0 }, landscape: { scale: 2, x: 0, y: 0, rotation: 0 } }, zIndex: 5, locked: true, shadow: { enabled: false, color: '#000000', blur: 0, x: 0, y: 0 } }
            ],
            customTexts: [],
            productLocked: false,
            logoLocked: false,
            productTransforms: {
                square: { scale: 1, x: 0, y: 0, rotation: 0 },
                portrait: { scale: 1, x: 0, y: 0, rotation: 0 },
                landscape: { scale: 1, x: 0, y: 0, rotation: 0 },
            },
            logoTransforms: {
                square: { scale: 0.5, x: 0, y: -450, rotation: 0 }, // Top Center
                portrait: { scale: 0.6, x: 0, y: -850, rotation: 0 },
                landscape: { scale: 0.4, x: -850, y: -450, rotation: 0 }, // Top Left
            }
        },
        colors: {
            primary: "#ffffff",
            secondary: "#e2e8f0",
            accent: "#ffffff",
            background: "#1c1917",
            text: "#ffffff"
        },
        typography: {
            headlineFont: 'Playfair Display', // Elegant Serif
            subheadlineFont: 'Montserrat', // Clean Sans
            badgeFont: 'Inter',
            contactFont: 'Inter',
        },
        textLayout: {
            productName: {
                square: { scale: 0.6, x: 0, y: -380, rotation: 0, zIndex: 48, textAlign: 'center', lineHeight: 2, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
                portrait: { scale: 0.7, x: 0, y: -750, rotation: 0, zIndex: 48, textAlign: 'center', lineHeight: 2, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
                landscape: { scale: 0.6, x: -850, y: -350, rotation: 0, zIndex: 48, textAlign: 'left', lineHeight: 2, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
            },
            headline: {
                square: { scale: 1.4, x: 0, y: -50, rotation: 0, zIndex: 50, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: true, color: '#000000', blur: 10, x: 2, y: 2 } },
                portrait: { scale: 1.6, x: 0, y: -150, rotation: 0, zIndex: 50, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: true, color: '#000000', blur: 10, x: 2, y: 2 } },
                landscape: { scale: 1.4, x: 0, y: 0, rotation: 0, zIndex: 50, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: true, color: '#000000', blur: 10, x: 2, y: 2 } },
            },
            subheadline: {
                square: { scale: 0.8, x: 0, y: 150, rotation: 0, zIndex: 49, textAlign: 'center', lineHeight: 1.6, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
                portrait: { scale: 0.9, x: 0, y: 100, rotation: 0, zIndex: 49, textAlign: 'center', lineHeight: 1.6, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
                landscape: { scale: 0.8, x: 0, y: 150, rotation: 0, zIndex: 49, textAlign: 'center', lineHeight: 1.6, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
            },
            cta: {
                square: { scale: 1, x: 0, y: 350, rotation: 0, zIndex: 47, textAlign: 'center', lineHeight: 1, locked: false, shadow: { enabled: true, color: '#000000', blur: 10, x: 2, y: 2 } },
                portrait: { scale: 1.1, x: 0, y: 500, rotation: 0, zIndex: 47, textAlign: 'center', lineHeight: 1, locked: false, shadow: { enabled: true, color: '#000000', blur: 10, x: 2, y: 2 } },
                landscape: { scale: 1.1, x: 0, y: 350, rotation: 0, zIndex: 47, textAlign: 'center', lineHeight: 1, locked: false, shadow: { enabled: true, color: '#000000', blur: 10, x: 2, y: 2 } },
            },
            contact: {
                square: { scale: 0.7, x: 0, y: 480, rotation: 0, zIndex: 46, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
                portrait: { scale: 0.8, x: 0, y: 850, rotation: 0, zIndex: 46, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
                landscape: { scale: 0.7, x: 0, y: 480, rotation: 0, zIndex: 46, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
            },
            badge: {
                square: { scale: 1.2, x: 350, y: -350, rotation: 0, zIndex: 46, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
                portrait: { scale: 1.2, x: 400, y: -800, rotation: 0, zIndex: 46, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
                landscape: { scale: 1.2, x: 800, y: -400, rotation: 0, zIndex: 46, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: true, color: '#000000', blur: 5, x: 1, y: 1 } },
            }
        }
    });

    const updateState = (newState: Partial<AppState>, saveHistory: boolean = true) => {
        if (saveHistory) {
            setHistory(prev => [...prev.slice(-50), appState]);
            setRedoStack([]); // Clear redo stack on new action
        }
        setAppState(prev => ({ ...prev, ...newState }));
    };

    // ... (PROJECT EXPORT / IMPORT - kept as is)
    const handleProjectExport = () => {
        const dataStr = JSON.stringify(appState, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `projekt_reklamy_${Date.now()}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleProjectImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json && json.content && json.images && json.textLayout) {
                    updateState(json);
                } else {
                    alert("Nieprawidłowy format pliku projektu.");
                }
            } catch (error) {
                console.error(error);
                alert("Błąd podczas wczytywania pliku.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // ... (HELPERS: isElementLocked, calculateSnap, duplicate, addText - kept as is)
    const isElementLocked = (id: string, state: AppState): boolean => {
        if (['headline', 'subheadline', 'productName', 'contact', 'cta', 'badge'].includes(id)) {
            return state.textLayout[id as keyof TextLayout][state.format].locked;
        }
        if (id === 'productImage') return state.images.productLocked;
        if (id === 'logoImage') return state.images.logoLocked;
        const shape = state.images.shapes.find(s => s.id === id);
        if (shape) return shape.locked;
        const layer = state.images.layers.find(l => l.id === id);
        if (layer) return layer.locked;
        const customText = state.images.customTexts.find(t => t.id === id);
        if (customText) return customText.locked;
        return false;
    };

    const handleDuplicate = (id: string) => {
        if (!id) return;
        const offset = 30;
        const newId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        if (appState.images.shapes.find(s => s.id === id)) {
            const shape = appState.images.shapes.find(s => s.id === id)!;
            const newShape: ShapeLayer = JSON.parse(JSON.stringify(shape));
            newShape.id = newId;
            Object.keys(newShape.transforms).forEach(key => {
                const fmt = key as AdFormat;
                newShape.transforms[fmt].x += offset;
                newShape.transforms[fmt].y += offset;
            });
            setHistory(prev => [...prev, appState]);
            setAppState(prev => ({ ...prev, images: { ...prev.images, shapes: [...prev.images.shapes, newShape] }, activeElement: newId, selectedElements: [newId] }));
            return;
        }
        if (appState.images.layers.find(l => l.id === id)) {
            const layer = appState.images.layers.find(l => l.id === id)!;
            const newLayer: ExtraLayer = JSON.parse(JSON.stringify(layer));
            newLayer.id = newId;
            Object.keys(newLayer.transforms).forEach(key => {
                const fmt = key as AdFormat;
                newLayer.transforms[fmt].x += offset;
                newLayer.transforms[fmt].y += offset;
            });
            setHistory(prev => [...prev, appState]);
            setAppState(prev => ({ ...prev, images: { ...prev.images, layers: [...prev.images.layers, newLayer] }, activeElement: newId, selectedElements: [newId] }));
            return;
        }
        if (appState.images.customTexts.find(t => t.id === id)) {
            const customText = appState.images.customTexts.find(t => t.id === id)!;
            const newText: CustomTextLayer = JSON.parse(JSON.stringify(customText));
            newText.id = newId;
            Object.keys(newText.transforms).forEach(key => {
                const fmt = key as AdFormat;
                newText.transforms[fmt].x += offset;
                newText.transforms[fmt].y += offset;
            });
            setHistory(prev => [...prev, appState]);
            setAppState(prev => ({ ...prev, images: { ...prev.images, customTexts: [...prev.images.customTexts, newText] }, activeElement: newId, selectedElements: [newId] }));
            return;
        }
        if (id === 'headline' || id === 'subheadline') {
            const sourceText = appState.textLayout[id];
            const contentText = id === 'headline' ? appState.content.headline : appState.content.subheadline;
            const color = id === 'headline' ? appState.content.headlineColor : appState.content.subheadlineColor;
            const font = id === 'headline' ? appState.typography.headlineFont : appState.typography.subheadlineFont;
            const newTextLayer: CustomTextLayer = {
                id: newId, text: contentText, color: color, fontFamily: font, zIndex: 55, locked: false,
                shadow: sourceText[appState.format].shadow || { enabled: false, color: '#000000', blur: 5, x: 2, y: 2 },
                transforms: JSON.parse(JSON.stringify(sourceText))
            };
            Object.keys(newTextLayer.transforms).forEach(key => {
                const fmt = key as AdFormat;
                newTextLayer.transforms[fmt].x += offset;
                newTextLayer.transforms[fmt].y += offset;
            });
            setHistory(prev => [...prev, appState]);
            setAppState(prev => ({ ...prev, images: { ...prev.images, customTexts: [...prev.images.customTexts, newTextLayer] }, activeElement: newId, selectedElements: [newId] }));
        }
    }

    const handleAddText = () => {
        const newId = `${Date.now()}_text`;
        const newTextLayer: CustomTextLayer = {
            id: newId, text: "Twój tekst", color: appState.colors.text, fontFamily: appState.typography.headlineFont, zIndex: 55, locked: false,
            shadow: { enabled: false, color: '#000000', blur: 5, x: 2, y: 2 },
            transforms: {
                square: { scale: 1, x: 0, y: 0, rotation: 0, zIndex: 55, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: false, color: '#000000', blur: 5, x: 2, y: 2 } },
                portrait: { scale: 1, x: 0, y: 0, rotation: 0, zIndex: 55, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: false, color: '#000000', blur: 5, x: 2, y: 2 } },
                landscape: { scale: 1, x: 0, y: 0, rotation: 0, zIndex: 55, textAlign: 'center', lineHeight: 1.1, locked: false, shadow: { enabled: false, color: '#000000', blur: 5, x: 2, y: 2 } },
            }
        };
        setHistory(prev => [...prev, appState]);
        setAppState(prev => ({ ...prev, images: { ...prev.images, customTexts: [...prev.images.customTexts, newTextLayer] }, activeElement: newId, selectedElements: [newId] }));
    }

    // --- KEYBOARD, MOUSE, LOGIC --- 
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!appState.activeElement) return;
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); handleDuplicate(appState.activeElement); return; }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault(); const id = appState.activeElement; if (isElementLocked(id, appState)) return;
                setHistory(prev => [...prev.slice(-50), appState]); setRedoStack([]);
                if (appState.images.shapes.find(s => s.id === id)) { setAppState(prev => ({ ...prev, images: { ...prev.images, shapes: prev.images.shapes.filter(s => s.id !== id) }, activeElement: null })); return; }
                if (appState.images.layers.find(l => l.id === id)) { setAppState(prev => ({ ...prev, images: { ...prev.images, layers: prev.images.layers.filter(l => l.id !== id) }, activeElement: null })); return; }
                if (appState.images.customTexts.find(t => t.id === id)) { setAppState(prev => ({ ...prev, images: { ...prev.images, customTexts: prev.images.customTexts.filter(t => t.id !== id) }, activeElement: null })); return; }
                const textMap: Record<string, keyof AppState['content']> = { 'headline': 'showHeadline', 'subheadline': 'showSubheadline', 'productName': 'showProductName', 'contact': 'showContact', 'cta': 'showCTA', 'badge': 'showPromoBadge' };
                if (textMap[id]) { setAppState(prev => ({ ...prev, content: { ...prev.content, [textMap[id]]: false }, activeElement: null })); return; }
                if (id === 'productImage') { setAppState(prev => ({ ...prev, images: { ...prev.images, productImage: null }, activeElement: null })); return; }
                if (id === 'logoImage') { setAppState(prev => ({ ...prev, images: { ...prev.images, logoImage: null }, activeElement: null })); return; }
            }
            const isShift = e.shiftKey; const step = isShift ? 10 : 1; let dx = 0, dy = 0;
            if (e.key === 'ArrowUp') dy = -step; if (e.key === 'ArrowDown') dy = step; if (e.key === 'ArrowLeft') dx = -step; if (e.key === 'ArrowRight') dx = step;
            if (dx !== 0 || dy !== 0) {
                e.preventDefault(); const elId = appState.activeElement;
                const currentFormat = appState.format; const targets = appState.selectedElements.length > 0 ? appState.selectedElements : [elId];
                setAppState(prev => {
                    let next = { ...prev };
                    targets.forEach(tid => {
                        if (isElementLocked(tid, next)) return;
                        if (['headline', 'subheadline', 'productName', 'contact', 'cta', 'badge'].includes(tid)) { const key = tid as keyof TextLayout; const old = next.textLayout[key][currentFormat]; next = { ...next, textLayout: { ...next.textLayout, [key]: { ...next.textLayout[key], [currentFormat]: { ...old, x: old.x + dx, y: old.y + dy } } } }; }
                        else if (tid === 'productImage') { const old = next.images.productTransforms[currentFormat]; next = { ...next, images: { ...next.images, productTransforms: { ...next.images.productTransforms, [currentFormat]: { ...old, x: old.x + dx, y: old.y + dy } } } }; }
                        else if (tid === 'logoImage') { const old = next.images.logoTransforms[currentFormat]; next = { ...next, images: { ...next.images, logoTransforms: { ...next.images.logoTransforms, [currentFormat]: { ...old, x: old.x + dx, y: old.y + dy } } } }; }
                        else if (next.images.shapes.find(s => s.id === tid)) { next = { ...next, images: { ...next.images, shapes: next.images.shapes.map(s => s.id === tid ? { ...s, transforms: { ...s.transforms, [currentFormat]: { ...s.transforms[currentFormat], x: s.transforms[currentFormat].x + dx, y: s.transforms[currentFormat].y + dy } } } : s) } }; }
                        else if (next.images.layers.find(l => l.id === tid)) { next = { ...next, images: { ...next.images, layers: next.images.layers.map(l => l.id === tid ? { ...l, transforms: { ...l.transforms, [currentFormat]: { ...l.transforms[currentFormat], x: l.transforms[currentFormat].x + dx, y: l.transforms[currentFormat].y + dy } } } : l) } }; }
                        else if (next.images.customTexts.find(t => t.id === tid)) { next = { ...next, images: { ...next.images, customTexts: next.images.customTexts.map(t => t.id === tid ? { ...t, transforms: { ...t.transforms, [currentFormat]: { ...t.transforms[currentFormat], x: t.transforms[currentFormat].x + dx, y: t.transforms[currentFormat].y + dy } } } : t) } }; }
                    }); return next;
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
    }, [appState]);

    const handleElementMouseDown = (clickedId: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        // Allow selection of locked elements so they can be unlocked via UI, but don't start drag if it's the *only* clicked element and it's locked.
        // However, if we shift-click, we want to add it to selection.

        let newSelected = [...appState.selectedElements];
        if (e.shiftKey) { if (newSelected.includes(clickedId)) newSelected = newSelected.filter(id => id !== clickedId); else newSelected.push(clickedId); }
        else { if (!newSelected.includes(clickedId)) newSelected = [clickedId]; }

        updateState({ activeElement: clickedId, selectedElements: newSelected }, false);

        // If we are just selecting a single locked element, don't initiate drag.
        // If we have multiple, we initiate drag, but filter locked ones in onMouseMove.
        if (!e.shiftKey && isElementLocked(clickedId, appState)) return;

        setIsDraggingUI(true); dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialObjX: 0, initialObjY: 0, type: 'element', activeId: clickedId };
    };

    const handleBackgroundMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const canvasRect = canvasRef.current?.getBoundingClientRect(); if (!canvasRect) return;
        const scaleFactor = appState.format === 'portrait' ? 0.45 : appState.format === 'landscape' ? 0.55 : 0.65;
        const x = (e.clientX - canvasRect.left) / scaleFactor; const y = (e.clientY - canvasRect.top) / scaleFactor;
        updateState({ selectionBox: { x, y, width: 0, height: 0, startX: x, startY: y } }, false);
        dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialObjX: 0, initialObjY: 0, type: 'marquee', activeId: '' };
    };

    const handleGuideMouseDown = (guideId: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); const guide = appState.guides.find(g => g.id === guideId); if (!guide || guide.locked) return;
        setIsDraggingUI(true); dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialObjX: guide.position, initialObjY: 0, type: 'guide', activeId: guideId }
    };

    const handleNewGuideMouseDown = (axis: 'x' | 'y', e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); const newGuide: Guide = { id: Date.now().toString(), axis, position: 0, locked: false };
        setAppState(prev => ({ ...prev, guides: [...prev.guides, newGuide] }));
        setIsDraggingUI(true); dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialObjX: 0, initialObjY: 0, type: 'guide', activeId: newGuide.id };
    }

    const handleGlobalMouseMove = (e: React.MouseEvent) => {
        if (!dragRef.current.isDragging) return; e.preventDefault();
        const scaleFactor = appState.format === 'portrait' ? 0.45 : appState.format === 'landscape' ? 0.55 : 0.65;

        if (dragRef.current.type === 'guide') {
            const deltaX = (e.clientX - dragRef.current.startX) / scaleFactor;
            const deltaY = (e.clientY - dragRef.current.startY) / scaleFactor;
            const guide = appState.guides.find(g => g.id === dragRef.current.activeId);
            if (guide) setAppState(prev => ({ ...prev, guides: prev.guides.map(g => g.id === guide.id ? { ...g, position: dragRef.current.initialObjX + (guide.axis === 'x' ? deltaX : deltaY) } : g) }));
            return;
        }
        if (dragRef.current.type === 'marquee' && appState.selectionBox) {
            const sb = appState.selectionBox;
            const currentX = (e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0)) / scaleFactor;
            const currentY = (e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0)) / scaleFactor;
            const newX = Math.min(sb.startX, currentX); const newY = Math.min(sb.startY, currentY);
            const newW = Math.abs(currentX - sb.startX); const newH = Math.abs(currentY - sb.startY);
            setAppState(prev => ({ ...prev, selectionBox: { ...sb, x: newX, y: newY, width: newW, height: newH } })); return;
        }
        if (dragRef.current.type === 'element') {
            const rawDeltaX = (e.clientX - dragRef.current.startX) / scaleFactor;
            const rawDeltaY = (e.clientY - dragRef.current.startY) / scaleFactor;
            let effectiveDX = rawDeltaX; let effectiveDY = rawDeltaY;
            if (e.shiftKey) { if (Math.abs(effectiveDX) > Math.abs(effectiveDY)) effectiveDY = 0; else effectiveDX = 0; }
            const fmt = appState.format; const targets = appState.selectedElements.length > 0 ? appState.selectedElements : (appState.activeElement ? [appState.activeElement] : []);
            setAppState(prev => {
                let next = { ...prev };
                targets.forEach(tid => {
                    if (isElementLocked(tid, next)) return;
                    if (['headline', 'subheadline', 'productName', 'contact', 'cta', 'badge'].includes(tid)) { const key = tid as keyof TextLayout; const old = next.textLayout[key][fmt]; next = { ...next, textLayout: { ...next.textLayout, [key]: { ...next.textLayout[key], [fmt]: { ...old, x: old.x + effectiveDX, y: old.y + effectiveDY } } } }; }
                    else if (tid === 'productImage') { const old = next.images.productTransforms[fmt]; next = { ...next, images: { ...next.images, productTransforms: { ...next.images.productTransforms, [fmt]: { ...old, x: old.x + effectiveDX, y: old.y + effectiveDY } } } }; }
                    else if (tid === 'logoImage') { const old = next.images.logoTransforms[fmt]; next = { ...next, images: { ...next.images, logoTransforms: { ...next.images.logoTransforms, [fmt]: { ...old, x: old.x + effectiveDX, y: old.y + effectiveDY } } } }; }
                    else if (next.images.shapes.find(s => s.id === tid)) { next = { ...next, images: { ...next.images, shapes: next.images.shapes.map(s => s.id === tid ? { ...s, transforms: { ...s.transforms, [fmt]: { ...s.transforms[fmt], x: s.transforms[fmt].x + effectiveDX, y: s.transforms[fmt].y + effectiveDY } } } : s) } }; }
                    else if (next.images.layers.find(l => l.id === tid)) { next = { ...next, images: { ...next.images, layers: next.images.layers.map(l => l.id === tid ? { ...l, transforms: { ...l.transforms, [fmt]: { ...l.transforms[fmt], x: l.transforms[fmt].x + effectiveDX, y: l.transforms[fmt].y + effectiveDY } } } : l) } }; }
                    else if (next.images.customTexts.find(t => t.id === tid)) { next = { ...next, images: { ...next.images, customTexts: next.images.customTexts.map(t => t.id === tid ? { ...t, transforms: { ...t.transforms, [fmt]: { ...t.transforms[fmt], x: t.transforms[fmt].x + effectiveDX, y: t.transforms[fmt].y + effectiveDY } } } : t) } }; }
                }); return next;
            });
            dragRef.current.startX = e.clientX; dragRef.current.startY = e.clientY;
        }
    };

    const handleGlobalMouseUp = () => {
        if (dragRef.current.type === 'marquee' && appState.selectionBox) {
            const sb = appState.selectionBox;
            if (sb.width > 5 || sb.height > 5) {
                const fmt = appState.format; const selectedIds: string[] = [];
                const checkInside = (x: number, y: number) => { const w = fmt === 'landscape' ? 1920 : 1080; const h = fmt === 'portrait' ? 1920 : 1080; const elementXMap = x + w / 2; const elementYMap = y + h / 2; return elementXMap >= sb.x && elementXMap <= sb.x + sb.width && elementYMap >= sb.y && elementYMap <= sb.y + sb.height; };
                ['headline', 'subheadline', 'productName', 'cta', 'badge'].forEach(key => { const t = appState.textLayout[key as keyof TextLayout][fmt]; if (checkInside(t.x, t.y)) selectedIds.push(key); });
                if (appState.images.productImage) { const t = appState.images.productTransforms[fmt]; if (checkInside(t.x, t.y)) selectedIds.push('productImage'); }
                if (appState.images.logoImage) { const t = appState.images.logoTransforms[fmt]; if (checkInside(t.x, t.y)) selectedIds.push('logoImage'); }
                appState.images.shapes.forEach(s => { if (checkInside(s.transforms[fmt].x, s.transforms[fmt].y)) selectedIds.push(s.id); });
                appState.images.layers.forEach(l => { if (checkInside(l.transforms[fmt].x, l.transforms[fmt].y)) selectedIds.push(l.id); });
                appState.images.customTexts.forEach(t => { if (checkInside(t.transforms[fmt].x, t.transforms[fmt].y)) selectedIds.push(t.id); });
                setAppState(prev => ({ ...prev, selectedElements: selectedIds, selectionBox: null, activeElement: selectedIds.length > 0 ? selectedIds[0] : null }));
            } else { setAppState(prev => ({ ...prev, selectionBox: null })); }
        }
        if (dragRef.current.isDragging) { setHistory(prev => [...prev.slice(-50), appState]); setRedoStack([]); }
        dragRef.current.isDragging = false; setIsDraggingUI(false);
    };
    const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); updateState({ activeElement: null, selectedElements: [] }, false); }
    const handleUpdateZIndex = (id: string, val: number) => {
        if (['headline', 'subheadline', 'productName', 'contact', 'cta', 'badge'].includes(id)) { const textId = id as keyof TextLayout; setAppState(prev => ({ ...prev, textLayout: { ...prev.textLayout, [textId]: { ...prev.textLayout[textId], [appState.format]: { ...prev.textLayout[textId][appState.format], zIndex: val } } } })); }
        else if (appState.images.shapes.find(s => s.id === id)) { setAppState(prev => ({ ...prev, images: { ...prev.images, shapes: prev.images.shapes.map(s => s.id === id ? { ...s, zIndex: val } : s) } })); }
        else if (appState.images.layers.find(l => l.id === id)) { setAppState(prev => ({ ...prev, images: { ...prev.images, layers: prev.images.layers.map(l => l.id === id ? { ...l, zIndex: val } : l) } })); }
        else if (appState.images.customTexts.find(t => t.id === id)) { setAppState(prev => ({ ...prev, images: { ...prev.images, customTexts: prev.images.customTexts.map(t => t.id === id ? { ...t, zIndex: val } : t) } })); }
    };
    const moveLayerOrder = (id: string, dir: 'up' | 'down') => { const layers = appState.images.layers.map(l => l.id === id ? { ...l, zIndex: dir === 'up' ? l.zIndex + 1 : l.zIndex - 1 } : l); updateState({ images: { ...appState.images, layers } }); };
    const moveShapeOrder = (id: string, dir: 'up' | 'down') => { const shapes = appState.images.shapes.map(s => s.id === id ? { ...s, zIndex: dir === 'up' ? s.zIndex + 1 : s.zIndex - 1 } : s); updateState({ images: { ...appState.images, shapes } }); };
    const moveTextOrder = (id: string, dir: 'up' | 'down') => { if (!['headline', 'subheadline', 'productName', 'contact', 'cta', 'badge'].includes(id)) return; const textId = id as keyof TextLayout; const current = appState.textLayout[textId][appState.format]; setAppState(prev => ({ ...prev, textLayout: { ...prev.textLayout, [textId]: { ...prev.textLayout[textId], [appState.format]: { ...current, zIndex: dir === 'up' ? current.zIndex + 1 : current.zIndex - 1 } } } })); };
    const handleToggleLock = (id: string) => {
        if (['headline', 'subheadline', 'productName', 'contact', 'cta', 'badge'].includes(id)) { const textId = id as keyof TextLayout; setAppState(prev => ({ ...prev, textLayout: { ...prev.textLayout, [textId]: { ...prev.textLayout[textId], [prev.format]: { ...prev.textLayout[textId][prev.format], locked: !prev.textLayout[textId][prev.format].locked } } } })); }
        else if (id === 'productImage') { setAppState(prev => ({ ...prev, images: { ...prev.images, productLocked: !prev.images.productLocked } })); }
        else if (id === 'logoImage') { setAppState(prev => ({ ...prev, images: { ...prev.images, logoLocked: !prev.images.logoLocked } })); }
        else if (appState.images.shapes.find(s => s.id === id)) { setAppState(prev => ({ ...prev, images: { ...prev.images, shapes: prev.images.shapes.map(s => s.id === id ? { ...s, locked: !s.locked } : s) } })); }
        else if (appState.images.layers.find(l => l.id === id)) { setAppState(prev => ({ ...prev, images: { ...prev.images, layers: prev.images.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l) } })); }
        else if (appState.images.customTexts.find(t => t.id === id)) { setAppState(prev => ({ ...prev, images: { ...prev.images, customTexts: prev.images.customTexts.map(t => t.id === id ? { ...t, locked: !t.locked } : t) } })); }
    };
    const handleUndo = () => { if (history.length > 0) { const prev = history[history.length - 1]; setHistory(p => p.slice(0, -1)); setRedoStack(p => [...p, appState]); setAppState(prev); } };
    const handleRedo = () => { if (redoStack.length > 0) { const next = redoStack[redoStack.length - 1]; setRedoStack(p => p.slice(0, -1)); setHistory(p => [...p, appState]); setAppState(next); } };
    const handleCopyGeneration = async (prompt: string) => { setAppState(prev => ({ ...prev, isGenerating: true })); try { const copy = await generateAdCopy(appState.content.productName, prompt); updateState({ isGenerating: false, content: { ...appState.content, headline: copy.headline, subheadline: copy.subheadline, ctaText: copy.ctaText, promoBadge: copy.promoBadge || appState.content.promoBadge } }); } catch (error) { setAppState(prev => ({ ...prev, isGenerating: false })); } };
    const handleImageGeneration = async (prompt: string) => { setAppState(prev => ({ ...prev, isGenerating: true })); try { const bg = await generateBackgroundImage(prompt); if (bg) updateState({ isGenerating: false, images: { ...appState.images, backgroundImage: bg } }); else setAppState(prev => ({ ...prev, isGenerating: false })); } catch (error) { setAppState(prev => ({ ...prev, isGenerating: false })); } };

    // --- COMPOSITION LOGIC ---
    const handleModifyComposition = () => {
        const fontPairs = [{ head: 'Playfair Display', sub: 'Lato' }, { head: 'Oswald', sub: 'Open Sans' }, { head: 'Anton', sub: 'Roboto' }, { head: 'Bodoni Moda', sub: 'Montserrat' }, { head: 'Bebas Neue', sub: 'Inter' }, { head: 'Cinzel', sub: 'Raleway' }, { head: 'Righteous', sub: 'Exo 2' }, { head: 'Abril Fatface', sub: 'Lato' }, { head: 'Montserrat', sub: 'Merriweather' }, { head: 'Syne', sub: 'Space Mono' }, { head: 'Space Grotesk', sub: 'Inter' }, { head: 'Teko', sub: 'Barlow' }, { head: 'League Spartan', sub: 'Nunito' }, { head: 'Russo One', sub: 'Chakra Petch' }, { head: 'Passion One', sub: 'Open Sans' }, { head: 'Fjalla One', sub: 'Roboto Slab' }, { head: 'Monoton', sub: 'Montserrat' }, { head: 'Zilla Slab', sub: 'Work Sans' }, { head: 'Caveat', sub: 'Quicksand' }, { head: 'Shadows Into Light', sub: 'Amatic SC' }, { head: 'Gloria Hallelujah', sub: 'Comic Neue' }, { head: 'Comfortaa', sub: 'Varela Round' }, { head: 'Epilogue', sub: 'Manrope' }, { head: 'Sora', sub: 'Outfit' }, { head: 'DM Serif Display', sub: 'DM Sans' }, { head: 'Archivo Black', sub: 'Heebo' }, { head: 'Pacifico', sub: 'Josefin Sans' }, { head: 'Permanent Marker', sub: 'Kalam' }, { head: 'Lobster', sub: 'Cabin' }, { head: 'Fredoka', sub: 'Nunito' }];
        const randomFonts = fontPairs[Math.floor(Math.random() * fontPairs.length)];
        const fontUpdate: any = { headlineFont: randomFonts.head, subheadlineFont: randomFonts.sub, badgeFont: randomFonts.sub, contactFont: randomFonts.sub };
        const ctaStyles: CtaStyle[] = ['solid', 'outline', 'gradient', 'glass', 'neon', 'brutal', 'soft', 'minimal'];
        const ctaAnims: CtaAnimation[] = ['none', 'pulse', 'bounce', 'shake', 'shimmer', 'wobble'];
        const randomCtaStyle = ctaStyles[Math.floor(Math.random() * ctaStyles.length)];
        const randomCtaAnim = ctaAnims[Math.floor(Math.random() * ctaAnims.length)];
        const Z = { HEAD: 50, SUB: 49, META: 48, CTA: 47, BADGE: 46 };
        const archetypeId = Math.floor(Math.random() * 8);
        const fmt = appState.format; const isPortrait = fmt === 'portrait'; const isLandscape = fmt === 'landscape'; const width = isLandscape ? 1920 : 1080; const height = isPortrait ? 1920 : 1080; const padding = 120; const maxY = (height / 2) - padding;
        const getRandomScale = (base: number) => Number((base + (Math.random() * 0.6) - 0.2).toFixed(2));
        const p = (pct: number) => Math.floor(maxY * pct);
        const getStrictLayout = (id: number) => {
            switch (id) {
                case 0: return { align: 'center' as const, meta: { x: 0, y: -p(0.8), scale: 0.8 }, head: { x: 0, y: -p(0.4), scale: isPortrait ? 1.6 : 1.3 }, sub: { x: 0, y: p(0.1), scale: 1.0 }, cta: { x: 0, y: p(0.6), scale: 1.1 }, badge: { x: 0, y: p(0.9), scale: 0.9 } };
                case 1: return { align: 'center' as const, meta: { x: 0, y: -p(0.8), scale: 0.7 }, head: { x: 0, y: -p(0.5), scale: isPortrait ? 1.8 : 1.4 }, sub: { x: 0, y: -p(0.1), scale: 0.9 }, cta: { x: 0, y: p(0.3), scale: 1.2 }, badge: { x: 0, y: -p(0.9), scale: 0.8 } };
                case 2: return { align: 'center' as const, meta: { x: 0, y: 0, scale: 0.7 }, head: { x: 0, y: p(0.3), scale: isPortrait ? 1.5 : 1.2 }, sub: { x: 0, y: p(0.6), scale: 0.9 }, cta: { x: 0, y: p(0.85), scale: 1.0 }, badge: { x: 0, y: -p(0.8), scale: 1.0 } };
                case 3: return { align: 'center' as const, meta: { x: 0, y: -maxY + 50, scale: 0.8 }, head: { x: 0, y: -p(0.6), scale: isPortrait ? 1.7 : 1.4 }, sub: { x: 0, y: -p(0.2), scale: 1.1 }, cta: { x: 0, y: 0, scale: 1.2 }, badge: { x: 0, y: p(0.8), scale: 0.9 } };
                case 4: return { align: 'center' as const, meta: { x: 0, y: -p(0.9), scale: 0.7 }, head: { x: 0, y: -p(0.3), scale: 1.4 }, sub: { x: 0, y: p(0.3), scale: 1.0 }, cta: { x: 0, y: p(0.8), scale: 1.1 }, badge: { x: 0, y: 0, scale: 0.8 } };
                case 5: return { align: 'center' as const, meta: { x: 0, y: -p(0.2), scale: 0.6 }, head: { x: 0, y: 0, scale: 1.0 }, sub: { x: 0, y: p(0.2), scale: 0.8 }, cta: { x: 0, y: p(0.5), scale: 0.9 }, badge: { x: 0, y: p(0.8), scale: 0.7 } };
                case 6: return { align: 'center' as const, meta: { x: 0, y: -p(0.9), scale: 0.9 }, head: { x: 0, y: 0, scale: isPortrait ? 2.2 : 1.8 }, sub: { x: 0, y: 0, scale: 0.1 }, cta: { x: 0, y: p(0.7), scale: 1.3 }, badge: { x: 0, y: -p(0.7), scale: 1.0 } };
                case 7: return { align: 'center' as const, meta: { x: 0, y: -p(0.9), scale: 0.7 }, sub: { x: 0, y: -p(0.4), scale: 1.2 }, head: { x: 0, y: 0, scale: isPortrait ? 1.5 : 1.2 }, cta: { x: 0, y: p(0.5), scale: 1.1 }, badge: { x: 0, y: p(0.8), scale: 0.9 } };
                default: return { align: 'center' as const, meta: { x: 0, y: 0, scale: 1 }, head: { x: 0, y: 0, scale: 1 }, sub: { x: 0, y: 0, scale: 1 }, cta: { x: 0, y: 0, scale: 1 }, badge: { x: 0, y: 0, scale: 1 } };
            }
        };
        const layout = getStrictLayout(archetypeId); const align = 'center';
        const newTextLayout: TextLayout = { ...appState.textLayout, headline: { ...appState.textLayout.headline, [fmt]: { ...appState.textLayout.headline[fmt], x: layout.head.x, y: layout.head.y, textAlign: align, zIndex: Z.HEAD, scale: getRandomScale(layout.head.scale || 1) } }, subheadline: { ...appState.textLayout.subheadline, [fmt]: { ...appState.textLayout.subheadline[fmt], x: layout.sub.x, y: layout.sub.y, textAlign: align, zIndex: Z.SUB, scale: getRandomScale(layout.sub.scale || 1) } }, productName: { ...appState.textLayout.productName, [fmt]: { ...appState.textLayout.productName[fmt], x: layout.meta.x, y: layout.meta.y, textAlign: align, zIndex: Z.META, scale: getRandomScale(layout.meta.scale || 1) } }, cta: { ...appState.textLayout.cta, [fmt]: { ...appState.textLayout.cta[fmt], x: layout.cta.x, y: layout.cta.y, textAlign: align, zIndex: Z.CTA, scale: getRandomScale(layout.cta.scale || 1) } }, badge: { ...appState.textLayout.badge, [fmt]: { ...appState.textLayout.badge[fmt], x: layout.badge.x, y: layout.badge.y, textAlign: 'center', zIndex: Z.BADGE, scale: getRandomScale(layout.badge.scale || 1) } }, contact: { ...appState.textLayout.contact, [fmt]: { ...appState.textLayout.contact[fmt], x: 0, y: (height / 2) - 60, textAlign: 'center', scale: 0.6 } } };
        updateState({ typography: fontUpdate, textLayout: newTextLayout, content: { ...appState.content, ctaStyle: randomCtaStyle, ctaAnimation: randomCtaAnim, ctaAnimationEnabled: true } });
    };

    const handleExport = async (type: 'png' | 'html') => {
        const element = document.getElementById('ad-canvas');
        if (!element) return;
        const fileName = `${appState.content.productName.replace(/\s+/g, '_')}_reklama`;

        if (type === 'html') {
            const fmt = appState.format;
            const { width, height } = fmt === 'portrait' ? { width: 1080, height: 1920 } : fmt === 'landscape' ? { width: 1920, height: 1080 } : { width: 1080, height: 1080 };
            const isPortrait = fmt === 'portrait';

            const getTransformStyle = (t: TextTransform | ImageTransform | any) => {
                return `translate(${t.x}px, ${t.y}px) rotate(${t.rotation || 0}deg) scale(${t.scale})`;
            };

            const getShadowCSS = (s: any) => {
                if (!s || !s.enabled) return '';
                return `${s.x}px ${s.y}px ${s.blur}px ${s.color}`;
            }

            const getObjectShadowStyle = (s: any) => {
                if (!s || !s.enabled) return '';
                return `filter: drop-shadow(${s.x}px ${s.y}px ${s.blur}px ${s.color});`;
            }

            const getCtaStyleCSS = (style: CtaStyle, bg: string, text: string) => {
                switch (style) {
                    case 'outline': return `background-color: transparent; color: ${text}; border: 3px solid ${bg};`;
                    case 'gradient': return `background-image: linear-gradient(135deg, ${bg} 0%, ${bg}80 100%); color: ${text};`;
                    case 'glass': return `background-color: ${bg}40; color: ${text}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid ${text}40;`;
                    case 'neon': return `background-color: transparent; color: ${text}; border: 2px solid ${text}; box-shadow: 0 0 10px ${text}, inset 0 0 10px ${text};`;
                    case 'brutal': return `background-color: ${text}; color: ${bg}; border: 3px solid ${bg}; box-shadow: 6px 6px 0px ${bg}; border-radius: 0px; font-weight: 900;`;
                    case 'soft': return `background-color: ${bg}CC; color: ${text}; border-radius: 16px; box-shadow: 0 10px 25px -5px ${bg}50; border: none;`;
                    case 'minimal': return `background-color: transparent; color: ${text}; border-bottom: 2px solid ${text}; border-radius: 0px; padding: 5px 0;`;
                    case 'solid': default: return `background-color: ${bg}; color: ${text};`;
                }
            };

            const ctaAnimClass = appState.content.ctaAnimationEnabled
                ? (appState.content.ctaAnimation === 'pulse' ? 'cta-anim-pulse' : appState.content.ctaAnimation === 'bounce' ? 'cta-anim-bounce' : appState.content.ctaAnimation === 'shake' ? 'cta-anim-shake' : appState.content.ctaAnimation === 'wobble' ? 'cta-anim-wobble' : appState.content.ctaAnimation === 'shimmer' ? 'cta-anim-shimmer' : '')
                : '';

            // 1. Template Specific Backgrounds
            let templateSpecificCSS = '';
            let templateBackgroundHTML = '';

            if (appState.style === 'bold-geometric') {
                const clipPath = isPortrait ? 'polygon(0 0, 100% 0, 100% 100%, 30% 100%)' : 'polygon(25% 0, 100% 0, 100% 100%, 5% 100%)';
                templateBackgroundHTML = `<div style="position: absolute; top: 0; right: 0; width: 90%; height: 100%; z-index: 0; background-color: ${appState.colors.primary}; clip-path: ${clipPath}; pointer-events: none;"></div>`;
            } else if (appState.style === 'neon-urban') {
                templateBackgroundHTML = `<div style="position: absolute; inset: 0; z-index: 0; opacity: 0.2; background-image: linear-gradient(${appState.colors.secondary} 1px, transparent 1px), linear-gradient(90deg, ${appState.colors.secondary} 1px, transparent 1px); background-size: 50px 50px; pointer-events: none;"></div>`;
            } else if (appState.style === 'elegant-serif') {
                templateBackgroundHTML = appState.images.backgroundImage ? `<div style="position: absolute; inset: 0; z-index: 1; background: linear-gradient(to top, ${appState.colors.primary} 10%, transparent 60%); pointer-events: none;"></div>` : '';
            }

            // 2. Base Container Construction
            const bodyContent = `
            <div id="ad-container" style="
                position: relative; 
                width: ${width}px; 
                height: ${height}px; 
                overflow: hidden; 
                background-color: ${appState.style === 'neon-urban' ? '#050505' : appState.colors.background};
                box-shadow: 0 0 50px rgba(0,0,0,0.5);
                transform-origin: top left;
                font-family: 'Inter', sans-serif;
            ">
                ${templateBackgroundHTML}
                
                ${appState.images.backgroundImage ? `
                <div style="position: absolute; inset: 0; z-index: 0; opacity: ${appState.style === 'bold-geometric' ? '0.4' : '0.6'}; mix-blend-mode: ${appState.style === 'bold-geometric' ? 'overlay' : 'normal'};">
                    <img src="${appState.images.backgroundImage}" style="width:100%; height:100%; object-fit:cover; ${appState.style === 'bold-geometric' ? 'filter: grayscale(100%) contrast(125%);' : ''}" />
                </div>` : ''}
                
                <!-- SHAPES -->
                ${appState.images.shapes.map(s => {
                const t = s.transforms[fmt];
                const shadow = getObjectShadowStyle(s.shadow);
                let inner = '';
                if (s.type === 'rectangle') inner = `<div style="width:100%; height:100%; background-color:${s.color};"></div>`;
                else if (s.type === 'circle') inner = `<div style="width:100%; height:100%; background-color:${s.color}; border-radius:50%;"></div>`;
                else if (s.type === 'triangle') inner = `<svg viewBox="0 0 100 100" style="width:100%; height:100%; fill:${s.color};"><polygon points="50,0 100,100 0,100" /></svg>`;

                return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${s.zIndex || 10}; pointer-events: none;">
                        <div style="
                            width: 400px; height: 400px;
                            transform: ${getTransformStyle(t)};
                            opacity: ${s.opacity}; 
                            ${shadow}
                        ">${inner}</div>
                    </div>`;
            }).join('')}

                <!-- LAYERS -->
                ${appState.images.layers.map(l => {
                const t = l.transforms[fmt];
                const shadow = getObjectShadowStyle(l.shadow);
                return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${l.zIndex}; pointer-events: none;">
                        <img src="${l.src}" style="width: 65%; max-width: none; transform: ${getTransformStyle(t)}; ${shadow}" />
                    </div>`;
            }).join('')}

                <!-- PRODUCT IMAGE -->
                ${appState.images.productImage ? (() => {
                    const t = appState.images.productTransforms[fmt];
                    const shadow = appState.style === 'modern-minimal' ? 'filter: drop-shadow(0 0 50px rgba(255,255,255,0.2));' : 'filter: drop-shadow(0 30px 60px rgba(0,0,0,0.5));';
                    // Fix: Ensure product image has a base width similar to React component if needed, or use scale
                    return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 30; pointer-events: none;">
                        <img src="${appState.images.productImage}" style="width: 65%; max-width: none; transform: ${getTransformStyle(t)}; ${shadow}" />
                    </div>`;
                })() : ''}

                <!-- LOGO -->
                ${appState.images.logoImage ? (() => {
                    const t = appState.images.logoTransforms[fmt];
                    // Logic to mimic specific template positioning if necessary, but transforms usually handle it
                    // React component sets 'absolute top-xx left-xx' for logo in some templates, but transform overrides it mostly.
                    // We will use the 'absolute inset-0 flex center' strategy for everything to ensure transforms work 1:1.

                    let filter = '';
                    if (appState.style !== 'modern-minimal') filter = 'filter: brightness(0) invert(1);';

                    return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 60; pointer-events: none;">
                         <!-- Wrapper div to simulate original positioning if strictly needed, but transforms should cover it -->
                         <div style="transform: ${getTransformStyle(t)};">
                            <img src="${appState.images.logoImage}" style="height: 50px; ${filter}" />
                         </div>
                    </div>`;
                })() : ''}

                <!-- TEXTS & BADGES & CTA -->
                ${appState.content.showHeadline ? (() => {
                    const t = appState.textLayout.headline[fmt];
                    const shadow = t.shadow && t.shadow.enabled ? `text-shadow: ${getShadowCSS(t.shadow)};` : '';
                    let mixBlend = appState.style === 'elegant-serif' ? 'mix-blend-mode: difference;' : '';
                    return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${t.zIndex}; pointer-events: none;">
                        <div style="
                            transform: ${getTransformStyle(t)};
                            text-align: ${t.textAlign}; color: ${appState.content.headlineColor};
                            font-family: '${appState.typography.headlineFont}', sans-serif; 
                            font-size: ${appState.style === 'modern-minimal' || appState.style === 'neon-urban' ? '6rem' : appState.style === 'elegant-serif' ? '7rem' : '4.5rem'};
                            font-weight: bold; line-height: ${t.lineHeight}; text-transform: uppercase;
                            white-space: pre-wrap; ${shadow} 
                            width: 90%; word-wrap: break-word;
                            display: flex; justify-content: ${t.textAlign === 'left' ? 'flex-start' : t.textAlign === 'right' ? 'flex-end' : 'center'};
                            ${mixBlend}
                        ">
                            ${appState.content.headline}
                        </div>
                    </div>`;
                })() : ''}

                ${appState.content.showSubheadline ? (() => {
                    const t = appState.textLayout.subheadline[fmt];
                    const shadow = t.shadow && t.shadow.enabled ? `text-shadow: ${getShadowCSS(t.shadow)};` : '';
                    let extraStyle = '';
                    if (appState.style === 'elegant-serif' || appState.style === 'neon-urban') {
                        extraStyle = 'background-color: rgba(0,0,0,0.6); padding: 12px; border-radius: 4px; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);';
                    }
                    return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${t.zIndex}; pointer-events: none;">
                        <div style="
                            transform: ${getTransformStyle(t)};
                            text-align: ${t.textAlign}; color: ${appState.content.subheadlineColor};
                            font-family: '${appState.typography.subheadlineFont}', sans-serif; 
                            font-size: ${appState.style === 'modern-minimal' ? '1.875rem' : '1.25rem'};
                            line-height: ${t.lineHeight};
                            white-space: pre-wrap; ${shadow} 
                            width: 80%; word-wrap: break-word;
                            display: flex; justify-content: ${t.textAlign === 'left' ? 'flex-start' : t.textAlign === 'right' ? 'flex-end' : 'center'};
                            ${extraStyle}
                        ">
                            ${appState.content.subheadline}
                        </div>
                    </div>`;
                })() : ''}

                ${appState.content.showCTA ? (() => {
                    const t = appState.textLayout.cta[fmt];
                    const shadow = getObjectShadowStyle(t.shadow);
                    const ctaStyleCSS = getCtaStyleCSS(appState.content.ctaStyle, appState.content.ctaBgColor, appState.content.ctaTextColor);
                    const staticExpanded = !appState.content.ctaAnimationEnabled && appState.style === 'modern-minimal'
                        ? 'padding: 20px 60px; min-width: 200px;'
                        : 'padding: 20px 40px;';

                    return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${t.zIndex}; pointer-events: none;">
                        <div style="transform: ${getTransformStyle(t)}; display: flex; justify-content: ${t.textAlign === 'left' ? 'flex-start' : t.textAlign === 'right' ? 'flex-end' : 'center'}; width: 80%; ${shadow}">
                            <button class="${ctaAnimClass}" style="
                                ${ctaStyleCSS}
                                font-family: '${appState.typography.headlineFont}', sans-serif;
                                font-size: 24px; font-weight: bold; text-transform: uppercase; cursor: pointer;
                                ${staticExpanded}
                                line-height: ${t.lineHeight};
                                white-space: nowrap;
                            ">${appState.content.ctaText}</button>
                        </div>
                    </div>`;
                })() : ''}

                ${appState.content.showPromoBadge ? (() => {
                    const t = appState.textLayout.badge[fmt];
                    const shadow = getObjectShadowStyle(t.shadow);
                    const skew = appState.style === 'bold-geometric' ? 'transform: skewX(-10deg);' : '';
                    return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${t.zIndex}; pointer-events: none;">
                        <div style="
                            transform: ${getTransformStyle(t)};
                            text-align: ${t.textAlign}; color: ${appState.content.promoBadgeTextColor};
                            font-family: '${appState.typography.badgeFont}', sans-serif;
                            font-size: 14px; font-weight: bold; padding: 5px 10px; background: ${appState.content.promoBadgeBgColor};
                            white-space: pre-wrap; ${shadow}
                            ${skew}
                        ">${appState.content.promoBadge}</div>
                    </div>`;
                })() : ''}

                ${appState.content.showProductName ? (() => {
                    const t = appState.textLayout.productName[fmt];
                    const shadow = t.shadow && t.shadow.enabled ? `text-shadow: ${getShadowCSS(t.shadow)};` : '';
                    return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${t.zIndex}; pointer-events: none;">
                        <div style="
                            transform: ${getTransformStyle(t)};
                            text-align: ${t.textAlign}; color: ${appState.content.productNameColor};
                            font-size: 14px; text-transform: uppercase; letter-spacing: 2px;
                            white-space: pre-wrap; ${shadow}
                            width: 80%; display: flex; justify-content: ${t.textAlign === 'left' ? 'flex-start' : t.textAlign === 'right' ? 'flex-end' : 'center'};
                        ">${appState.content.productName}</div>
                    </div>`;
                })() : ''}

                ${appState.content.showContact ? (() => {
                    const t = appState.textLayout.contact[fmt];
                    const shadow = t.shadow && t.shadow.enabled ? `text-shadow: ${getShadowCSS(t.shadow)};` : '';
                    return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${t.zIndex}; pointer-events: none;">
                        <div style="
                            transform: ${getTransformStyle(t)};
                            text-align: ${t.textAlign}; color: ${appState.content.contactInfoColor};
                            font-family: '${appState.typography.contactFont}', sans-serif;
                            font-size: 14px; text-transform: uppercase; letter-spacing: 2px;
                            white-space: pre-wrap; ${shadow}
                            width: 90%; display: flex; justify-content: ${t.textAlign === 'left' ? 'flex-start' : t.textAlign === 'right' ? 'flex-end' : 'center'};
                        ">${appState.content.contactInfo}</div>
                    </div>`;
                })() : ''}

                <!-- CUSTOM TEXTS -->
                ${appState.images.customTexts.map(txt => {
                    const t = txt.transforms[fmt];
                    const shadow = txt.shadow && txt.shadow.enabled ? `text-shadow: ${getShadowCSS(txt.shadow)};` : '';
                    return `
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${txt.zIndex}; pointer-events: none;">
                        <div style="
                            transform: ${getTransformStyle(t)};
                            text-align: ${t.textAlign}; line-height: ${t.lineHeight};
                            color: ${txt.color}; font-family: '${txt.fontFamily}', sans-serif; font-size: 48px; white-space: pre-wrap;
                            ${shadow} width: 90%; word-wrap: break-word;
                            display: flex; justify-content: ${t.textAlign === 'left' ? 'flex-start' : t.textAlign === 'right' ? 'flex-end' : 'center'};
                        ">${txt.text}</div>
                    </div>`;
                }).join('')}
            </div>
          `;

            const finalHTML = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Anton&family=Archivo+Black&family=Arvo:wght@400;700&family=Bangers&family=Barlow:wght@400;900&family=Bebas+Neue&family=Bitter:wght@400;700&family=Cabin:wght@400;700&family=Catamaran:wght@400;900&family=Caveat:wght@700&family=Cinzel:wght@400;900&family=Comfortaa:wght@700&family=Crimson+Text:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;700&family=DM+Serif+Display&family=Dosis:wght@400;800&family=Epilogue:wght@400;900&family=Exo+2:wght@400;800&family=Fira+Sans:wght@300;400;800&family=Fjalla+One&family=Fredoka:wght@300;600&family=Gloria+Hallelujah&family=Heebo:wght@900&family=IBM+Plex+Mono:wght@400;700&family=Inconsolata:wght@400;700&family=Inter:wght@300;400;600;900&family=Josefin+Sans:wght@300;700&family=Kanit:wght@400;800&family=Lato:wght@300;400;700&family=League+Spartan:wght@400;800&family=Lobster&family=Manrope:wght@400;800&family=Merriweather:ital,wght@0,300;0,700;1,400&family=Monoton&family=Montserrat:wght@400;700;900&family=Nunito:wght@300;800&family=Open+Sans:wght@400;800&family=Oswald:wght@500;700&family=Outfit:wght@400;900&family=PT+Sans:wght@400;700&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Pacifico&family=Passion+One&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:wght@300;500;900&family=Quicksand:wght@400;700&family=Raleway:wght@300;900&family=Righteous&family=Roboto+Slab:wght@400;700&family=Roboto:wght@400;700&family=Rubik:wght@400;800&family=Russo+One&family=Shadows+Into+Light&family=Signika:wght@400;700&family=Sora:wght@400;800&family=Space+Grotesk:wght@400;700&family=Space+Mono:wght@400;700&family=Syne:wght@400;800&family=Teko:wght@400;700&family=Titillium+Web:wght@400;900&family=Ubuntu:wght@400;700&family=Work+Sans:wght@300;800&family=Zilla+Slab:wght@700&display=swap" rel="stylesheet">
    <style>
        /* Base Reset */
        body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: transparent; overflow: hidden; }
        
        /* Ad Container Scaler Wrapper */
        #ad-wrapper {
            position: relative;
            width: ${width}px;
            height: ${height}px;
            transform-origin: center center;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        /* Animations Keyframes */
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
        @keyframes wobble { 0% { transform: translateX(0%); } 15% { transform: translateX(-5%) rotate(-5deg); } 30% { transform: translateX(4%) rotate(3deg); } 45% { transform: translateX(-3%) rotate(-3deg); } 60% { transform: translateX(2%) rotate(2deg); } 75% { transform: translateX(-1%) rotate(-1deg); } 100% { transform: translateX(0%); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        /* Animation Classes */
        .cta-anim-pulse { animation: pulse 2s infinite; }
        .cta-anim-bounce { animation: bounce 2s infinite; }
        .cta-anim-shake { animation: shake 0.5s infinite; }
        .cta-anim-wobble { animation: wobble 1s infinite; }
        .cta-anim-shimmer { 
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); 
            background-size: 200% 100%; 
            animation: shimmer 2s infinite; 
        }
    </style>
</head>
<body>
    <div id="ad-wrapper">
        ${bodyContent}
    </div>

    <script>
        // Auto-scaling script for responsive embedding
        const wrapper = document.getElementById('ad-wrapper');
        const originalWidth = ${width};
        const originalHeight = ${height};

        function resize() {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            const scale = Math.min(
                windowWidth / originalWidth,
                windowHeight / originalHeight
            );

            wrapper.style.transform = 'scale(' + scale + ')';
        }

        window.addEventListener('resize', resize);
        resize();
    </script>
</body>
</html>`;

            const blob = new Blob([finalHTML], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            // --- PNG EXPORT --- (Keep existing logic)
            let originalStyle: string | null = null;
            let originalBodyOverflow = '';

            try {
                // @ts-ignore
                if (typeof window.html2canvas === 'undefined') {
                    alert("Biblioteka do generowania obrazów wciąż się ładuje. Spróbuj za chwilę.");
                    return;
                }

                originalStyle = element.getAttribute('style');
                const originalScrollY = window.scrollY;
                const originalScrollX = window.scrollX;
                originalBodyOverflow = document.body.style.overflow;

                const width = appState.format === 'landscape' ? 1920 : 1080;
                const height = appState.format === 'portrait' ? 1920 : 1080;

                Object.assign(element.style, {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: `${width}px`,
                    height: `${height}px`,
                    zIndex: '9999999',
                    transform: 'none',
                    margin: '0',
                    borderRadius: '0',
                    boxShadow: 'none'
                });

                const guides = document.querySelectorAll('.guide-line');
                guides.forEach((g) => (g as HTMLElement).style.display = 'none');

                document.body.style.overflow = 'hidden';
                window.scrollTo(0, 0);

                await new Promise(resolve => setTimeout(resolve, 250));

                // @ts-ignore
                const canvas = await window.html2canvas(element, {
                    useCORS: true,
                    scale: 1,
                    width: width,
                    height: height,
                    backgroundColor: null,
                    logging: false,
                    allowTaint: true,
                });

                if (originalStyle) element.setAttribute('style', originalStyle);
                else element.removeAttribute('style');

                document.body.style.overflow = originalBodyOverflow;
                window.scrollTo(originalScrollX, originalScrollY);

                guides.forEach((g) => (g as HTMLElement).style.display = '');

                const link = document.createElement('a');
                link.download = `${fileName}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

            } catch (error) {
                console.error("Export failed:", error);
                alert("Wystąpił błąd podczas generowania obrazu.");
                if (originalStyle) element.setAttribute('style', originalStyle);
                else element.removeAttribute('style');
                if (originalBodyOverflow) document.body.style.overflow = originalBodyOverflow;
            }
        }
    };

    const handleSaveFavorite = () => {
        const newFav: FavoriteDesign = { id: Date.now().toString(), style: appState.style, colors: appState.colors, timestamp: Date.now() };
        setAppState(prev => ({ ...prev, favorites: [newFav, ...prev.favorites].slice(0, 8) }));
    };

    const handleLoadFavorite = (fav: FavoriteDesign) => { updateState({ style: fav.style, colors: fav.colors }); };

    const renderTemplate = (format: AppState['format']) => {
        const TemplateComponent = (() => {
            switch (appState.style) {
                case 'bold-geometric': return BoldGeometric;
                case 'modern-minimal': return ModernMinimal;
                case 'elegant-serif': return ElegantSerif;
                case 'neon-urban': return NeonUrban;
                default: return ModernMinimal;
            }
        })();

        const scaleFactor = format === 'portrait' ? 0.45 : format === 'landscape' ? 0.55 : 0.65;
        const canvasWidth = format === 'landscape' ? 1920 : 1080;
        const canvasHeight = format === 'portrait' ? 1920 : 1080;

        return (
            <div
                className="flex flex-col items-center justify-center min-h-full p-10 bg-slate-950 relative"
                onMouseMove={handleGlobalMouseMove}
                onMouseUp={handleGlobalMouseUp}
                onMouseDown={handleBackgroundMouseDown} // Marquee start
                onContextMenu={handleContextMenu}
            >
                {appState.guideMode && (
                    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <div
                            className="relative border-2 border-orange-500/50 pointer-events-auto"
                            style={{ width: canvasWidth * scaleFactor + 40, height: canvasHeight * scaleFactor + 40 }}
                        >
                            <div
                                className="absolute -top-6 left-0 right-0 h-6 bg-slate-800 border border-slate-700 hover:bg-slate-700 cursor-row-resize flex items-center justify-center text-[9px] text-slate-400"
                                onMouseDown={(e) => handleNewGuideMouseDown('y', e)}
                            >PRZECIĄGNIJ POZIOMĄ LINIĘ</div>
                            <div
                                className="absolute -left-6 top-0 bottom-0 w-6 bg-slate-800 border border-slate-700 hover:bg-slate-700 cursor-col-resize flex items-center justify-center writing-mode-vertical text-[9px] text-slate-400"
                                style={{ writingMode: 'vertical-rl' }}
                                onMouseDown={(e) => handleNewGuideMouseDown('x', e)}
                            >PRZECIĄGNIJ PIONOWĄ LINIĘ</div>
                            <button onClick={() => setAppState(prev => ({ ...prev, guides: [] }))} className="absolute -top-16 right-0 bg-red-600 hover:bg-red-500 text-white px-3 py-1 text-xs font-bold rounded uppercase shadow-lg pointer-events-auto">Usuń linie</button>
                        </div>
                    </div>
                )}
                <div
                    id="ad-canvas"
                    ref={canvasRef}
                    className={`shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transform transition-transform duration-75 relative ${dragRef.current.isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
                    style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${scaleFactor})`, transformOrigin: 'center center' }}
                >
                    {/* Center Crosshair (Visual Feedback when Dragging) */}
                    {isDraggingUI && (
                        <>
                            {/* Vertical Line */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-[9999] pointer-events-none" style={{ transform: 'translateX(-50%)' }} />
                            {/* Horizontal Line */}
                            <div className="absolute left-0 right-0 top-1/2 h-px bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-[9999] pointer-events-none" style={{ transform: 'translateY(-50%)' }} />
                        </>
                    )}

                    <TemplateComponent state={appState} format={format} onElementMouseDown={handleElementMouseDown} />

                    {/* Marquee Selection Box */}
                    {appState.selectionBox && (
                        <div
                            className="absolute border border-blue-500 bg-blue-500/20 z-[9999] pointer-events-none"
                            style={{
                                left: appState.selectionBox.x,
                                top: appState.selectionBox.y,
                                width: appState.selectionBox.width,
                                height: appState.selectionBox.height
                            }}
                        />
                    )}

                    {appState.guides.map(guide => (
                        <div key={guide.id} className={`absolute z-[1000] guide-line ${appState.guideMode ? 'pointer-events-auto cursor-grab' : 'pointer-events-none'}`} onMouseDown={(e) => handleGuideMouseDown(guide.id, e)}
                            style={{ left: guide.axis === 'x' ? `${canvasWidth / 2 + guide.position}px` : '0', top: guide.axis === 'y' ? `${canvasHeight / 2 + guide.position}px` : '0', width: guide.axis === 'x' ? '1px' : '100%', height: guide.axis === 'y' ? '1px' : '100%', backgroundColor: '#0ea5e9', boxShadow: '0 0 5px #0ea5e9, 0 0 10px #0ea5e9', opacity: appState.guideMode || dragRef.current.isDragging ? 1 : 0 }}>
                            {appState.guideMode && (<button className="absolute bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform" style={{ left: guide.axis === 'y' ? '50%' : '0', top: guide.axis === 'x' ? '50%' : '0' }} onClick={(e) => { e.stopPropagation(); setAppState(prev => ({ ...prev, guides: prev.guides.filter(g => g.id !== guide.id) })) }}>×</button>)}
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex gap-4 relative z-10">
                    <div className="flex items-center bg-slate-800 rounded-full p-1 shadow-lg border border-slate-700">
                        <button onClick={() => handleExport('png')} className="px-6 py-3 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all">
                            Obraz (PNG)
                        </button>
                        <div className="w-px h-4 bg-slate-600 mx-1"></div>
                        <button onClick={() => handleExport('html')} className="flex items-center gap-2 px-6 py-3 bg-orange-600 rounded-full text-xs font-bold text-white hover:bg-orange-500 hover:scale-105 transition-all shadow-orange-900/20 shadow-lg">
                            <DownloadIcon /> HTML (Animacja)
                        </button>
                    </div>
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 text-center">
                        Przytrzymaj <b>Shift</b> aby przesuwać w osi. Kliknij i przeciągnij na tle, aby zaznaczyć wiele.
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
            <div className="w-[420px] flex-shrink-0 z-20 shadow-2xl h-full border-r border-slate-800">
                <Controls
                    state={appState}
                    updateState={updateState}
                    onGenerateCopy={handleCopyGeneration}
                    onGenerateImage={handleImageGeneration}
                    onModifyComposition={handleModifyComposition}
                    onSaveFavorite={handleSaveFavorite}
                    onLoadFavorite={handleLoadFavorite}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={history.length > 0}
                    canRedo={redoStack.length > 0}
                    onMoveLayer={moveLayerOrder}
                    onMoveShape={moveShapeOrder}
                    onMoveText={moveTextOrder}
                    onUpdateZIndex={handleUpdateZIndex}
                    onToggleLock={handleToggleLock}
                    onDuplicate={handleDuplicate}
                    onAddText={handleAddText}
                    onExportProject={handleProjectExport}
                    onImportProject={handleProjectImport}
                />
            </div>
            <div className="flex-1 relative h-full overflow-hidden bg-slate-950">
                {appState.isGenerating && (
                    <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-white font-bold text-lg tracking-tight animate-pulse">Projektuję z AI...</p>
                        </div>
                    </div>
                )}
                <div className="w-full h-full overflow-auto custom-scrollbar">{renderTemplate(appState.format)}</div>
            </div>
        </div>
    );
};

export default App;