import React from 'react';
import { AppState, AdFormat, CtaStyle, CtaAnimation, ShadowSettings } from '../types';

interface TemplateProps {
    state: AppState;
    format: AdFormat;
    scale?: number;
    onElementMouseDown?: (id: string, e: React.MouseEvent) => void;
}

// Helper for dynamic formatting
const getDimensions = (format: AdFormat) => {
    switch (format) {
        case 'square': return { width: 1080, height: 1080, aspect: 'aspect-square' };
        case 'portrait': return { width: 1080, height: 1920, aspect: 'aspect-[9/16]' };
        case 'landscape': return { width: 1920, height: 1080, aspect: 'aspect-[16/9]' };
        default: return { width: 1080, height: 1080, aspect: 'aspect-square' };
    }
};

const getCtaStyles = (style: CtaStyle, bgColor: string, textColor: string) => {
    switch (style) {
        case 'outline':
            return {
                backgroundColor: 'transparent',
                color: textColor,
                border: `3px solid ${bgColor}`,
            };
        case 'gradient':
            return {
                backgroundImage: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}80 100%)`,
                color: textColor
            };
        case 'glass':
            return {
                backgroundColor: `${bgColor}40`, // 25% opacity
                color: textColor,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${textColor}40`
            };
        case 'neon':
            return {
                backgroundColor: 'transparent',
                color: textColor,
                border: `2px solid ${textColor}`,
                boxShadow: `0 0 10px ${textColor}, inset 0 0 10px ${textColor}`
            };
        case 'brutal':
            return {
                backgroundColor: textColor,
                color: bgColor,
                border: `3px solid ${bgColor}`,
                boxShadow: `6px 6px 0px ${bgColor}`,
                borderRadius: '0px',
                fontWeight: '900'
            };
        case 'soft':
            return {
                backgroundColor: `${bgColor}CC`, // 80% opacity
                color: textColor,
                borderRadius: '16px',
                boxShadow: `0 10px 25px -5px ${bgColor}50`,
                border: 'none'
            };
        case 'minimal':
            return {
                backgroundColor: 'transparent',
                color: textColor,
                borderBottom: `2px solid ${textColor}`,
                borderRadius: '0px',
                padding: '5px 0'
            };
        case 'solid':
        default:
            return {
                backgroundColor: bgColor,
                color: textColor,
            };
    }
};

const getShadowStyle = (shadow?: ShadowSettings) => {
    if (!shadow || !shadow.enabled) return {};
    return {
        textShadow: `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.color}`
    };
};

const getObjectShadowStyle = (shadow?: ShadowSettings) => {
    if (!shadow || !shadow.enabled) return {};
    return {
        filter: `drop-shadow(${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.color})`
    };
};

const getCtaAnimationClass = (anim: CtaAnimation) => {
    switch (anim) {
        case 'pulse': return 'cta-anim-pulse';
        case 'bounce': return 'cta-anim-bounce';
        case 'shake': return 'cta-anim-shake';
        case 'shimmer': return 'cta-anim-shimmer';
        case 'wobble': return 'cta-anim-wobble';
        default: return '';
    }
};

const NoiseOverlay = () => (
    <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
    }}></div>
);

const GridOverlay: React.FC<{ show: boolean, size: number, color: 'black' | 'white' }> = ({ show, size, color }) => {
    if (!show) return null;
    const rgba = color === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    return (
        <div
            className="absolute inset-0 z-[999] pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(to right, ${rgba} 1px, transparent 1px), linear-gradient(to bottom, ${rgba} 1px, transparent 1px)`,
                backgroundSize: `${size}px ${size}px`
            }}
        ></div>
    );
}

const BaseContainer: React.FC<{ children: React.ReactNode; format: AdFormat; bg: string; id?: string; state: AppState }> = ({ children, format, bg, id, state }) => {
    const { aspect } = getDimensions(format);
    return (
        <div
            id={id}
            className={`relative overflow-hidden shadow-2xl ${aspect} transition-all duration-300 group`}
            style={{ backgroundColor: bg }}
        >
            <NoiseOverlay />
            <GridOverlay show={state.grid.show} size={state.grid.size} color={state.grid.color} />
            {children}
        </div>
    );
};

// Component to render extra layers
// FIX: Container is pointer-events-none, Image is pointer-events-auto
const ExtraLayersRenderer: React.FC<{ state: AppState; format: AdFormat; onMouseDown?: (id: string, e: React.MouseEvent) => void }> = ({ state, format, onMouseDown }) => {
    return (
        <>
            {state.images.layers.map(layer => {
                const { scale, x, y, rotation } = layer.transforms[format];
                const isGloballyLocked = layer.locked;

                return (
                    <div
                        key={layer.id}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ zIndex: layer.zIndex }}
                        data-layer-id={layer.id}
                    >
                        <img
                            src={layer.src}
                            alt="layer"
                            className={`transition-transform duration-200 ease-out ${isGloballyLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            onMouseDown={(e) => onMouseDown && !isGloballyLocked && onMouseDown(layer.id, e)}
                            style={{
                                transform: `translate(${x}px, ${y}px) rotate(${rotation || 0}deg) scale(${scale})`,
                                maxWidth: 'none',
                                maxHeight: 'none',
                                width: '65%', // consistent base width
                                ...getObjectShadowStyle(layer.shadow)
                            }}
                        />
                    </div>
                )
            })}
        </>
    )
}

// Component to render Shapes (Vector) with Z-INDEX support
// FIX: Container is pointer-events-none, Shape is pointer-events-auto
const ShapesRenderer: React.FC<{ state: AppState; format: AdFormat; onMouseDown?: (id: string, e: React.MouseEvent) => void }> = ({ state, format, onMouseDown }) => {
    return (
        <>
            {state.images.shapes && state.images.shapes.map(shape => {
                const { scale, x, y, rotation } = shape.transforms[format];
                const baseSize = 400; // base px size
                const isLocked = shape.locked;

                return (
                    <div
                        key={shape.id}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ zIndex: shape.zIndex || 10 }}
                        data-layer-id={shape.id}
                    >
                        <div
                            className={`${isLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            onMouseDown={(e) => onMouseDown && !isLocked && onMouseDown(shape.id, e)}
                            style={{
                                transform: `translate(${x}px, ${y}px) rotate(${rotation || 0}deg) scale(${scale})`,
                                width: `${baseSize}px`,
                                height: `${baseSize}px`,
                                opacity: shape.opacity,
                                transition: 'transform 0.1s ease-out',
                                ...getObjectShadowStyle(shape.shadow)
                            }}
                        >
                            {shape.type === 'rectangle' && (
                                <div style={{ backgroundColor: shape.color, width: '100%', height: '100%' }} />
                            )}
                            {shape.type === 'circle' && (
                                <div style={{ backgroundColor: shape.color, width: '100%', height: '100%', borderRadius: '50%' }} />
                            )}
                            {shape.type === 'triangle' && (
                                <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: shape.color }}>
                                    <polygon points="50,0 100,100 0,100" />
                                </svg>
                            )}
                        </div>
                    </div>
                )
            })}
        </>
    )
}

// Component to render Custom Texts
// FIX: Container is pointer-events-none, Text is pointer-events-auto
const CustomTextRenderer: React.FC<{ state: AppState; format: AdFormat; onMouseDown?: (id: string, e: React.MouseEvent) => void }> = ({ state, format, onMouseDown }) => {
    return (
        <>
            {state.images.customTexts.map(textLayer => {
                const { scale, x, y, rotation, textAlign, lineHeight } = textLayer.transforms[format];
                const isLocked = textLayer.locked;
                const baseFontSize = 48; // Base font size, scale handles the rest

                return (
                    <div
                        key={textLayer.id}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ zIndex: textLayer.zIndex }}
                        data-layer-id={textLayer.id}
                    >
                        <div
                            className={`${isLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            onMouseDown={(e) => onMouseDown && !isLocked && onMouseDown(textLayer.id, e)}
                            style={{
                                transform: `translate(${x}px, ${y}px) rotate(${rotation || 0}deg) scale(${scale})`,
                                color: textLayer.color,
                                fontFamily: textLayer.fontFamily,
                                textAlign: textAlign,
                                lineHeight: lineHeight,
                                fontSize: `${baseFontSize}px`,
                                whiteSpace: 'pre-wrap',
                                width: '90%', // Hard clamp width
                                maxWidth: '90%', // Hard clamp width
                                overflowWrap: 'break-word',
                                ...getShadowStyle(textLayer.shadow)
                            }}
                        >
                            {textLayer.text}
                        </div>
                    </div>
                );
            })}
        </>
    );
};

// --- TEMPLATE 1: BOLD GEOMETRIC ---
export const BoldGeometric: React.FC<TemplateProps> = ({ state, format, onElementMouseDown }) => {
    const { content, colors, images, typography, textLayout } = state;
    const { scale, x, y, rotation } = images.productTransforms[format];
    const logoT = images.logoTransforms[format];
    const ctaStyle = getCtaStyles(content.ctaStyle, content.ctaBgColor, content.ctaTextColor);
    const ctaAnim = content.ctaAnimationEnabled ? getCtaAnimationClass(content.ctaAnimation) : '';

    const isPortrait = format === 'portrait';

    return (
        <BaseContainer format={format} bg={colors.background} state={state}>
            <div
                className="absolute top-0 right-0 w-[90%] h-full z-0"
                style={{
                    backgroundColor: colors.primary,
                    clipPath: isPortrait ? 'polygon(0 0, 100% 0, 100% 100%, 30% 100%)' : 'polygon(25% 0, 100% 0, 100% 100%, 5% 100%)'
                }}
            />

            {images.backgroundImage && (
                <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
                    <img src={images.backgroundImage} className="w-full h-full object-cover grayscale contrast-125" alt="bg" />
                </div>
            )}

            {/* Shapes & Layers */}
            <ShapesRenderer state={state} format={format} onMouseDown={onElementMouseDown} />
            <ExtraLayersRenderer state={state} format={format} onMouseDown={onElementMouseDown} />
            <CustomTextRenderer state={state} format={format} onMouseDown={onElementMouseDown} />

            {/* Massive Typography - Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none" style={{ zIndex: textLayout.cta[format].zIndex }}>
                {content.showCTA && (
                    <h1
                        className="font-bold uppercase leading-none opacity-20 whitespace-nowrap"
                        style={{
                            fontFamily: typography.headlineFont,
                            color: 'transparent',
                            WebkitTextStroke: `4px ${colors.secondary}`,
                            fontSize: isPortrait ? '25vw' : '20vw',
                            ...getShadowStyle(textLayout.cta[format].shadow)
                        }}
                    >
                        {content.ctaText}
                    </h1>
                )}
            </div>

            {/* Product Image Layer */}
            <div className="absolute inset-0 z-[30] flex items-center justify-center overflow-visible pointer-events-none"
                data-layer-id="productImage">
                {images.productImage && (
                    <img
                        src={images.productImage}
                        className={`drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out ${images.productLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                        onMouseDown={(e) => onElementMouseDown && !images.productLocked && onElementMouseDown('productImage', e)}
                        style={{
                            transform: `translate(${x}px, ${y}px) rotate(${rotation || 0}deg) scale(${scale})`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            width: '65%',
                        }}
                        alt="Product"
                    />
                )}
            </div>

            {/* Foreground Content */}
            <div className="absolute inset-0 z-40 pointer-events-none">

                {/* LOGO */}
                <div className="absolute top-16 left-16 z-50 pointer-events-none" data-layer-id="logoImage">
                    {images.logoImage && (
                        <img
                            src={images.logoImage}
                            className={`h-14 object-contain brightness-0 invert ${images.logoLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            onMouseDown={e => onElementMouseDown && !images.logoLocked && onElementMouseDown('logoImage', e)}
                            alt="Logo"
                            style={{ transform: `translate(${logoT.x}px, ${logoT.y}px) rotate(${logoT.rotation || 0}deg) scale(${logoT.scale})` }}
                        />
                    )}
                </div>

                {/* BADGE */}
                {content.showPromoBadge && content.promoBadge && (
                    <div
                        className={`absolute top-16 right-16 font-bold px-6 py-3 transform skew-x-[-10deg] shadow-lg origin-top-right ${textLayout.badge[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                        data-layer-id="badge"
                        onMouseDown={e => onElementMouseDown && !textLayout.badge[format].locked && onElementMouseDown('badge', e)}
                        style={{
                            backgroundColor: content.promoBadgeBgColor,
                            color: content.promoBadgeTextColor,
                            zIndex: textLayout.badge[format].zIndex,
                            transform: `translate(${textLayout.badge[format].x}px, ${textLayout.badge[format].y}px) rotate(${textLayout.badge[format].rotation || 0}deg) scale(${textLayout.badge[format].scale}) skewX(-10deg)`,
                            textAlign: textLayout.badge[format].textAlign,
                            lineHeight: textLayout.badge[format].lineHeight,
                            whiteSpace: 'pre-wrap',
                            ...getShadowStyle(textLayout.badge[format].shadow)
                        }}
                    >
                        <span className="block transform skew-x-[10deg] text-lg">{content.promoBadge}</span>
                    </div>
                )}

                {/* TEXT CONTENT CONTAINER - ABSOLUTE CENTERED */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">

                    {/* HEADLINE */}
                    {content.showHeadline && (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                zIndex: textLayout.headline[format].zIndex,
                                transform: `translate(${textLayout.headline[format].x}px, ${textLayout.headline[format].y}px) rotate(${textLayout.headline[format].rotation || 0}deg) scale(${textLayout.headline[format].scale})`,
                                maxWidth: '90%',
                                width: '90%',
                                display: 'flex',
                                justifyContent: textLayout.headline[format].textAlign === 'left' ? 'flex-start' : textLayout.headline[format].textAlign === 'right' ? 'flex-end' : 'center',
                            }}
                        >
                            <h1
                                className={`font-bold uppercase leading-[0.9] break-words ${textLayout.headline[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                                onMouseDown={e => onElementMouseDown && !textLayout.headline[format].locked && onElementMouseDown('headline', e)}
                                data-layer-id="headline"
                                style={{
                                    fontFamily: typography.headlineFont,
                                    fontSize: '4.5rem',
                                    color: content.headlineColor,
                                    textAlign: textLayout.headline[format].textAlign,
                                    lineHeight: textLayout.headline[format].lineHeight,
                                    whiteSpace: 'pre-wrap',
                                    ...getShadowStyle(textLayout.headline[format].shadow)
                                }}
                            >
                                {content.headline}
                            </h1>
                        </div>
                    )}

                    {/* SUBHEADLINE */}
                    {content.showSubheadline && (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                zIndex: textLayout.subheadline[format].zIndex,
                                transform: `translate(${textLayout.subheadline[format].x}px, ${textLayout.subheadline[format].y}px) rotate(${textLayout.subheadline[format].rotation || 0}deg) scale(${textLayout.subheadline[format].scale})`,
                                maxWidth: '80%',
                                width: '80%',
                                display: 'flex',
                                justifyContent: textLayout.subheadline[format].textAlign === 'left' ? 'flex-start' : textLayout.subheadline[format].textAlign === 'right' ? 'flex-end' : 'center',
                            }}
                        >
                            <p
                                className={`font-medium leading-relaxed ${textLayout.subheadline[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                                data-layer-id="subheadline"
                                onMouseDown={e => onElementMouseDown && !textLayout.subheadline[format].locked && onElementMouseDown('subheadline', e)}
                                style={{
                                    fontFamily: typography.subheadlineFont,
                                    fontSize: '1.25rem',
                                    color: content.subheadlineColor,
                                    textAlign: textLayout.subheadline[format].textAlign,
                                    lineHeight: textLayout.subheadline[format].lineHeight,
                                    whiteSpace: 'pre-wrap',
                                    ...getShadowStyle(textLayout.subheadline[format].shadow)
                                }}
                            >
                                {content.subheadline}
                            </p>
                        </div>
                    )}

                    {/* PRODUCT NAME */}
                    {content.showProductName && (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                zIndex: textLayout.productName[format].zIndex,
                                transform: `translate(${textLayout.productName[format].x}px, ${textLayout.productName[format].y}px) rotate(${textLayout.productName[format].rotation || 0}deg) scale(${textLayout.productName[format].scale})`,
                                maxWidth: '80%',
                                width: '80%',
                                display: 'flex',
                                justifyContent: textLayout.productName[format].textAlign === 'left' ? 'flex-start' : textLayout.productName[format].textAlign === 'right' ? 'flex-end' : 'center',
                            }}
                        >
                            <h2
                                className={`font-bold tracking-widest uppercase text-sm ${textLayout.productName[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                                data-layer-id="productName"
                                onMouseDown={e => onElementMouseDown && !textLayout.productName[format].locked && onElementMouseDown('productName', e)}
                                style={{
                                    color: colors.accent,
                                    textAlign: textLayout.productName[format].textAlign,
                                    lineHeight: textLayout.productName[format].lineHeight,
                                    whiteSpace: 'pre-wrap',
                                    ...getShadowStyle(textLayout.productName[format].shadow)
                                }}
                            >
                                {content.productName}
                            </h2>
                        </div>
                    )}

                    {/* CTA */}
                    {content.showCTA && (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                zIndex: textLayout.cta[format].zIndex,
                                transform: `translate(${textLayout.cta[format].x}px, ${textLayout.cta[format].y}px) rotate(${textLayout.cta[format].rotation || 0}deg) scale(${textLayout.cta[format].scale})`,
                                maxWidth: '80%',
                                display: 'flex',
                                justifyContent: textLayout.cta[format].textAlign === 'left' ? 'flex-start' : textLayout.cta[format].textAlign === 'right' ? 'flex-end' : 'center',
                                ...getObjectShadowStyle(textLayout.cta[format].shadow)
                            }}
                        >
                            <button
                                className={`py-5 px-8 text-2xl font-bold uppercase tracking-widest hover:brightness-110 transition-all ${ctaAnim} ${textLayout.cta[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                                data-layer-id="cta"
                                onMouseDown={e => onElementMouseDown && !textLayout.cta[format].locked && onElementMouseDown('cta', e)}
                                style={{
                                    ...ctaStyle,
                                    lineHeight: textLayout.cta[format].lineHeight,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {content.ctaText}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </BaseContainer>
    );
};

// --- TEMPLATE 2: MODERN MINIMAL ---
export const ModernMinimal: React.FC<TemplateProps> = ({ state, format, onElementMouseDown }) => {
    const { content, colors, images, typography, textLayout } = state;
    const { scale, x, y, rotation } = images.productTransforms[format];
    const logoT = images.logoTransforms[format];
    const ctaStyle = getCtaStyles(content.ctaStyle, content.ctaBgColor, content.ctaTextColor);
    const ctaAnim = content.ctaAnimationEnabled ? getCtaAnimationClass(content.ctaAnimation) : '';

    const buttonWidthClass = !content.ctaAnimationEnabled ? 'w-56 px-4' : 'w-16 group-hover:w-56 px-0 group-hover:px-4';
    const textWidthClass = !content.ctaAnimationEnabled ? 'w-auto' : 'w-0 group-hover:w-auto';

    return (
        <BaseContainer format={format} bg={colors.background} state={state}>
            <ShapesRenderer state={state} format={format} onMouseDown={onElementMouseDown} />
            <ExtraLayersRenderer state={state} format={format} onMouseDown={onElementMouseDown} />
            <CustomTextRenderer state={state} format={format} onMouseDown={onElementMouseDown} />

            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* LOGO */}
                {images.logoImage && (
                    <div className="absolute top-12 left-12 pointer-events-none">
                        <img
                            src={images.logoImage}
                            className={`h-10 object-contain ${images.logoLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="logoImage"
                            onMouseDown={e => onElementMouseDown && !images.logoLocked && onElementMouseDown('logoImage', e)}
                            alt="Logo"
                            style={{ transform: `translate(${logoT.x}px, ${logoT.y}px) rotate(${logoT.rotation || 0}deg) scale(${logoT.scale})` }}
                        />
                    </div>
                )}

                {/* HEADLINE */}
                {content.showHeadline && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.headline[format].zIndex,
                            transform: `translate(${textLayout.headline[format].x}px, ${textLayout.headline[format].y}px) rotate(${textLayout.headline[format].rotation || 0}deg) scale(${textLayout.headline[format].scale})`,
                        }}
                    >
                        <h1
                            style={{
                                color: content.headlineColor,
                                fontFamily: typography.headlineFont,
                                fontSize: '6rem',
                                textAlign: textLayout.headline[format].textAlign,
                                lineHeight: textLayout.headline[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                maxWidth: '90%',
                                width: '90%',
                                ...getShadowStyle(textLayout.headline[format].shadow)
                            }}
                            className={`font-semibold tracking-tight leading-[1.05] break-words text-center ${textLayout.headline[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="headline"
                            onMouseDown={e => onElementMouseDown && !textLayout.headline[format].locked && onElementMouseDown('headline', e)}
                        >
                            {content.headline}
                        </h1>
                    </div>
                )}

                {/* SUBHEADLINE */}
                {content.showSubheadline && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.subheadline[format].zIndex,
                            transform: `translate(${textLayout.subheadline[format].x}px, ${textLayout.subheadline[format].y}px) rotate(${textLayout.subheadline[format].rotation || 0}deg) scale(${textLayout.subheadline[format].scale})`
                        }}
                    >
                        <p
                            style={{
                                color: content.subheadlineColor,
                                fontFamily: typography.subheadlineFont,
                                fontSize: '1.875rem',
                                textAlign: textLayout.subheadline[format].textAlign,
                                lineHeight: textLayout.subheadline[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                maxWidth: '80%',
                                width: '80%',
                                ...getShadowStyle(textLayout.subheadline[format].shadow)
                            }}
                            className={`font-light leading-relaxed text-center ${textLayout.subheadline[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="subheadline"
                            onMouseDown={e => onElementMouseDown && !textLayout.subheadline[format].locked && onElementMouseDown('subheadline', e)}
                        >
                            {content.subheadline}
                        </p>
                    </div>
                )}

                {/* PRODUCT NAME */}
                {content.showProductName && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.productName[format].zIndex,
                            transform: `translate(${textLayout.productName[format].x}px, ${textLayout.productName[format].y}px) rotate(${textLayout.productName[format].rotation || 0}deg) scale(${textLayout.productName[format].scale})`
                        }}
                    >
                        <span
                            className={`font-medium tracking-wide text-lg uppercase inline-block ${textLayout.productName[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="productName"
                            onMouseDown={e => onElementMouseDown && !textLayout.productName[format].locked && onElementMouseDown('productName', e)}
                            style={{
                                color: colors.text,
                                textAlign: textLayout.productName[format].textAlign,
                                lineHeight: textLayout.productName[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                maxWidth: '80%',
                                ...getShadowStyle(textLayout.productName[format].shadow)
                            }}
                        >{content.productName}</span>
                    </div>
                )}

                {/* CTA */}
                {content.showCTA && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.cta[format].zIndex,
                            transform: `translate(${textLayout.cta[format].x}px, ${textLayout.cta[format].y}px) rotate(${textLayout.cta[format].rotation || 0}deg) scale(${textLayout.cta[format].scale})`,
                            ...getObjectShadowStyle(textLayout.cta[format].shadow)
                        }}
                    >
                        <div
                            className={`inline-flex items-center group ${textLayout.cta[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="cta"
                            onMouseDown={e => onElementMouseDown && !textLayout.cta[format].locked && onElementMouseDown('cta', e)}
                        >
                            <div
                                className={`h-16 rounded-full flex items-center justify-center transition-all ${buttonWidthClass} ${ctaAnim}`}
                                style={ctaStyle}
                            >
                                <span
                                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 text-xl font-medium ${textWidthClass}`}
                                    style={{ color: content.ctaTextColor, lineHeight: textLayout.cta[format].lineHeight }}
                                >
                                    {content.ctaText}
                                </span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={content.ctaTextColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* BADGE */}
                {content.showPromoBadge && content.promoBadge && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.badge[format].zIndex,
                            transform: `translate(${textLayout.badge[format].x}px, ${textLayout.badge[format].y}px) rotate(${textLayout.badge[format].rotation || 0}deg) scale(${textLayout.badge[format].scale})`
                        }}
                    >
                        <span
                            style={{
                                color: content.promoBadgeTextColor,
                                borderColor: content.promoBadgeTextColor,
                                backgroundColor: content.promoBadgeBgColor !== '#ffffff' ? content.promoBadgeBgColor : 'transparent',
                                textAlign: textLayout.badge[format].textAlign,
                                lineHeight: textLayout.badge[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                ...getShadowStyle(textLayout.badge[format].shadow)
                            }}
                            className={`inline-block border-2 rounded-full px-4 py-1.5 text-sm font-bold tracking-[0.2em] uppercase ${textLayout.badge[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="badge"
                            onMouseDown={e => onElementMouseDown && !textLayout.badge[format].locked && onElementMouseDown('badge', e)}
                        >
                            {content.promoBadge}
                        </span>
                    </div>
                )}

                {/* CONTACT */}
                {content.showContact && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.contact[format].zIndex,
                            transform: `translate(${textLayout.contact[format].x}px, ${textLayout.contact[format].y}px) rotate(${textLayout.contact[format].rotation || 0}deg) scale(${textLayout.contact[format].scale})`
                        }}
                    >
                        <span
                            style={{
                                color: colors.secondary,
                                textAlign: textLayout.contact[format].textAlign,
                                lineHeight: textLayout.contact[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                maxWidth: '90%',
                                ...getShadowStyle(textLayout.contact[format].shadow)
                            }}
                            className={`text-sm font-mono inline-block ${textLayout.contact[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="contact"
                            onMouseDown={e => onElementMouseDown && !textLayout.contact[format].locked && onElementMouseDown('contact', e)}
                        >
                            {content.contactInfo}
                        </span>
                    </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center z-[30] pointer-events-none">
                    {images.productImage && (
                        <div
                            className={`${images.productLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="productImage"
                            onMouseDown={(e) => onElementMouseDown && !images.productLocked && onElementMouseDown('productImage', e)}
                            style={{
                                transform: `translate(${x}px, ${y}px) rotate(${rotation || 0}deg) scale(${scale})`,
                                position: 'absolute'
                            }}
                        >
                            <img
                                src={images.productImage}
                                className="max-w-none transition-transform duration-200 ease-out drop-shadow-2xl"
                                style={{ width: '600px', pointerEvents: 'none' }} // Fixed base width for product to ensure it's visible
                                alt="Product"
                            />
                        </div>
                    )}
                </div>
            </div>
        </BaseContainer>
    );
};

// --- TEMPLATE 3: ELEGANT SERIF ---
export const ElegantSerif: React.FC<TemplateProps> = ({ state, format, onElementMouseDown }) => {
    const { content, colors, images, typography, textLayout } = state;
    const { scale, x, y, rotation } = images.productTransforms[format];
    const logoT = images.logoTransforms[format];
    const ctaStyle = getCtaStyles(content.ctaStyle, content.ctaBgColor, content.ctaTextColor);
    const ctaAnim = content.ctaAnimationEnabled ? getCtaAnimationClass(content.ctaAnimation) : '';

    return (
        <BaseContainer format={format} bg={colors.primary} state={state}>
            {images.backgroundImage && (
                <div className="absolute inset-0 z-0">
                    <img src={images.backgroundImage} className="w-full h-full object-cover" alt="bg" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, #000000 0%, transparent 70%)` }}></div>
                </div>
            )}

            <ShapesRenderer state={state} format={format} onMouseDown={onElementMouseDown} />

            <div className="absolute inset-0 z-[30] flex items-center justify-center pointer-events-none">
                {images.productImage && (
                    <img
                        src={images.productImage}
                        className={`transition-transform duration-200 ease-out ${images.productLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                        data-layer-id="productImage"
                        onMouseDown={(e) => onElementMouseDown && !images.productLocked && onElementMouseDown('productImage', e)}
                        style={{
                            transform: `translate(${x}px, ${y}px) rotate(${rotation || 0}deg) scale(${scale})`,
                            maxHeight: '80%',
                            filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))',
                        }}
                        alt="product"
                    />
                )}
            </div>

            <ExtraLayersRenderer state={state} format={format} onMouseDown={onElementMouseDown} />
            <CustomTextRenderer state={state} format={format} onMouseDown={onElementMouseDown} />

            <div className="absolute inset-0 z-[50] pointer-events-none">

                {/* LOGO */}
                {images.logoImage && (
                    <div
                        className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none"
                    >
                        <img
                            src={images.logoImage}
                            className={`h-10 brightness-0 invert ${images.logoLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="logoImage"
                            onMouseDown={e => onElementMouseDown && !images.logoLocked && onElementMouseDown('logoImage', e)}
                            alt="logo"
                            style={{ transform: `translate(${logoT.x}px, ${logoT.y}px) rotate(${logoT.rotation || 0}deg) scale(${logoT.scale})` }}
                        />
                    </div>
                )}

                {/* BADGE */}
                {content.showPromoBadge && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.badge[format].zIndex,
                            transform: `translate(${textLayout.badge[format].x}px, ${textLayout.badge[format].y}px) rotate(${textLayout.badge[format].rotation || 0}deg) scale(${textLayout.badge[format].scale})`,
                        }}
                    >
                        <span
                            style={{
                                textAlign: textLayout.badge[format].textAlign,
                                lineHeight: textLayout.badge[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                color: 'white',
                                fontFamily: typography.badgeFont,
                                ...getShadowStyle(textLayout.badge[format].shadow)
                            }}
                            className={`text-sm font-serif italic tracking-widest uppercase ${textLayout.badge[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="badge"
                            onMouseDown={e => onElementMouseDown && !textLayout.badge[format].locked && onElementMouseDown('badge', e)}
                        >
                            {content.promoBadge || "Exclusive"}
                        </span>
                    </div>
                )}

                {/* HEADLINE */}
                {content.showHeadline && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.headline[format].zIndex,
                            transform: `translate(${textLayout.headline[format].x}px, ${textLayout.headline[format].y}px) rotate(${textLayout.headline[format].rotation || 0}deg) scale(${textLayout.headline[format].scale})`,
                        }}
                    >
                        <h1
                            className={`leading-[0.85] tracking-tight break-words text-center mix-blend-difference ${textLayout.headline[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="headline"
                            onMouseDown={e => onElementMouseDown && !textLayout.headline[format].locked && onElementMouseDown('headline', e)}
                            style={{
                                fontFamily: typography.headlineFont,
                                fontSize: '7rem',
                                color: content.headlineColor,
                                textAlign: textLayout.headline[format].textAlign,
                                lineHeight: textLayout.headline[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                maxWidth: '90%',
                                width: '90%',
                                ...getShadowStyle(textLayout.headline[format].shadow)
                            }}
                        >
                            {content.headline}
                        </h1>
                    </div>
                )}

                {/* SUBHEADLINE */}
                {content.showSubheadline && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.subheadline[format].zIndex,
                            transform: `translate(${textLayout.subheadline[format].x}px, ${textLayout.subheadline[format].y}px) rotate(${textLayout.subheadline[format].rotation || 0}deg) scale(${textLayout.subheadline[format].scale})`,
                        }}
                    >
                        <p
                            className={`font-light tracking-[0.3em] uppercase opacity-90 bg-black/20 backdrop-blur-sm p-3 rounded text-center ${textLayout.subheadline[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="subheadline"
                            onMouseDown={e => onElementMouseDown && !textLayout.subheadline[format].locked && onElementMouseDown('subheadline', e)}
                            style={{
                                fontFamily: typography.subheadlineFont,
                                fontSize: '1rem',
                                color: content.subheadlineColor,
                                textAlign: textLayout.subheadline[format].textAlign,
                                lineHeight: textLayout.subheadline[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                maxWidth: '80%',
                                width: '80%',
                                ...getShadowStyle(textLayout.subheadline[format].shadow)
                            }}
                        >
                            {content.subheadline}
                        </p>
                    </div>
                )}

                {/* CTA */}
                {content.showCTA && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.cta[format].zIndex,
                            transform: `translate(${textLayout.cta[format].x}px, ${textLayout.cta[format].y}px) rotate(${textLayout.cta[format].rotation || 0}deg) scale(${textLayout.cta[format].scale})`,
                            ...getObjectShadowStyle(textLayout.cta[format].shadow)
                        }}
                    >
                        <button
                            className={`px-20 py-5 border border-white/40 text-2xl italic hover:bg-white hover:text-black transition-all duration-500 ${ctaAnim} ${textLayout.cta[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="cta"
                            onMouseDown={e => onElementMouseDown && !textLayout.cta[format].locked && onElementMouseDown('cta', e)}
                            style={{
                                backdropFilter: 'blur(4px)',
                                fontFamily: typography.headlineFont,
                                ...ctaStyle,
                                textAlign: textLayout.cta[format].textAlign,
                                lineHeight: textLayout.cta[format].lineHeight,
                            }}
                        >
                            {content.ctaText}
                        </button>
                    </div>
                )}

                {/* CONTACT */}
                {content.showContact && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.contact[format].zIndex,
                            transform: `translate(${textLayout.contact[format].x}px, ${textLayout.contact[format].y}px) rotate(${textLayout.contact[format].rotation || 0}deg) scale(${textLayout.contact[format].scale})`,
                        }}
                    >
                        <div
                            className={`text-white/40 text-xs tracking-[0.5em] uppercase text-center ${textLayout.contact[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="contact"
                            onMouseDown={e => onElementMouseDown && !textLayout.contact[format].locked && onElementMouseDown('contact', e)}
                            style={{
                                textAlign: textLayout.contact[format].textAlign,
                                lineHeight: textLayout.contact[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                maxWidth: '90%',
                                ...getShadowStyle(textLayout.contact[format].shadow)
                            }}
                        >
                            {content.contactInfo}
                        </div>
                    </div>
                )}
            </div>
        </BaseContainer>
    );
};

// --- TEMPLATE 4: NEON URBAN ---
export const NeonUrban: React.FC<TemplateProps> = ({ state, format, onElementMouseDown }) => {
    const { content, colors, images, typography, textLayout } = state;
    const { scale, x, y, rotation } = images.productTransforms[format];
    const logoT = images.logoTransforms[format];
    const ctaStyle = getCtaStyles(content.ctaStyle, content.ctaBgColor, content.ctaTextColor);
    const ctaAnim = content.ctaAnimationEnabled ? getCtaAnimationClass(content.ctaAnimation) : '';

    return (
        <BaseContainer format={format} bg="#050505" state={state}>
            <div className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(${colors.secondary} 1px, transparent 1px), linear-gradient(90deg, ${colors.secondary} 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}>
            </div>

            <ShapesRenderer state={state} format={format} onMouseDown={onElementMouseDown} />

            <div className="absolute inset-0 flex items-center justify-center z-[50] pointer-events-none">

                {/* LOGO */}
                {images.logoImage && (
                    <div className="absolute top-8 left-8 pointer-events-none">
                        <img
                            src={images.logoImage}
                            className={`h-10 object-contain ${images.logoLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="logoImage"
                            onMouseDown={e => onElementMouseDown && !images.logoLocked && onElementMouseDown('logoImage', e)}
                            alt="Logo"
                            style={{ transform: `translate(${logoT.x}px, ${logoT.y}px) rotate(${logoT.rotation || 0}deg) scale(${logoT.scale})` }}
                        />
                    </div>
                )}

                {/* HEADLINE */}
                {content.showHeadline && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.headline[format].zIndex,
                            transform: `translate(${textLayout.headline[format].x}px, ${textLayout.headline[format].y}px) rotate(${textLayout.headline[format].rotation || 0}deg) scale(${textLayout.headline[format].scale})`,
                        }}
                    >
                        <h1
                            className={`font-bold leading-none break-words text-center ${textLayout.headline[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="headline"
                            onMouseDown={e => onElementMouseDown && !textLayout.headline[format].locked && onElementMouseDown('headline', e)}
                            style={{
                                textShadow: `4px 4px 0px ${colors.accent}`,
                                fontFamily: typography.headlineFont,
                                fontSize: '6rem',
                                color: content.headlineColor,
                                textAlign: textLayout.headline[format].textAlign,
                                lineHeight: textLayout.headline[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                maxWidth: '90%',
                                width: '90%',
                                ...getShadowStyle(textLayout.headline[format].shadow)
                            }}
                        >
                            {content.headline}
                        </h1>
                    </div>
                )}

                {/* SUBHEADLINE */}
                {content.showSubheadline && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.subheadline[format].zIndex,
                            transform: `translate(${textLayout.subheadline[format].x}px, ${textLayout.subheadline[format].y}px) rotate(${textLayout.subheadline[format].rotation || 0}deg) scale(${textLayout.subheadline[format].scale})`,
                        }}
                    >
                        <p
                            className={`bg-black/60 p-6 border-l-4 text-center ${textLayout.subheadline[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="subheadline"
                            onMouseDown={e => onElementMouseDown && !textLayout.subheadline[format].locked && onElementMouseDown('subheadline', e)}
                            style={{
                                borderColor: colors.accent,
                                fontFamily: typography.subheadlineFont,
                                fontSize: '1.25rem',
                                color: content.subheadlineColor,
                                textAlign: textLayout.subheadline[format].textAlign,
                                lineHeight: textLayout.subheadline[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                maxWidth: '80%',
                                width: '80%',
                                ...getShadowStyle(textLayout.subheadline[format].shadow)
                            }}
                        >
                            {`> ${content.subheadline}`}
                        </p>
                    </div>
                )}

                {/* CTA */}
                {content.showCTA && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.cta[format].zIndex,
                            transform: `translate(${textLayout.cta[format].x}px, ${textLayout.cta[format].y}px) rotate(${textLayout.cta[format].rotation || 0}deg) scale(${textLayout.cta[format].scale})`,
                            ...getObjectShadowStyle(textLayout.cta[format].shadow)
                        }}
                    >
                        <button
                            className={`border-2 font-bold py-5 px-12 text-2xl uppercase tracking-wider hover:bg-white hover:text-black transition-all ${ctaAnim} ${textLayout.cta[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="cta"
                            onMouseDown={e => onElementMouseDown && !textLayout.cta[format].locked && onElementMouseDown('cta', e)}
                            style={{
                                ...ctaStyle,
                                textAlign: textLayout.cta[format].textAlign,
                                lineHeight: textLayout.cta[format].lineHeight,
                            }}
                        >
                            {content.ctaText}
                        </button>
                    </div>
                )}

                {/* BADGE */}
                {content.showPromoBadge && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.badge[format].zIndex,
                            transform: `translate(${textLayout.badge[format].x}px, ${textLayout.badge[format].y}px) rotate(${textLayout.badge[format].rotation || 0}deg) scale(${textLayout.badge[format].scale}) skewX(-12deg)`,
                        }}
                    >
                        <div
                            className={`font-bold text-lg inline-block px-4 py-1 transform ${textLayout.badge[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="badge"
                            onMouseDown={e => onElementMouseDown && !textLayout.badge[format].locked && onElementMouseDown('badge', e)}
                            style={{
                                backgroundColor: content.promoBadgeBgColor,
                                color: content.promoBadgeTextColor,
                                textAlign: textLayout.badge[format].textAlign,
                                lineHeight: textLayout.badge[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                ...getShadowStyle(textLayout.badge[format].shadow)
                            }}
                        >
                            {content.promoBadge || "LIMITED DROP"}
                        </div>
                    </div>
                )}

                {/* CONTACT */}
                {content.showContact && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            zIndex: textLayout.contact[format].zIndex,
                            transform: `translate(${textLayout.contact[format].x}px, ${textLayout.contact[format].y}px) rotate(${textLayout.contact[format].rotation || 0}deg) scale(${textLayout.contact[format].scale})`,
                        }}
                    >
                        <span
                            className={`${textLayout.contact[format].locked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="contact"
                            onMouseDown={e => onElementMouseDown && !textLayout.contact[format].locked && onElementMouseDown('contact', e)}
                            style={{
                                display: 'inline-block',
                                textAlign: textLayout.contact[format].textAlign,
                                lineHeight: textLayout.contact[format].lineHeight,
                                whiteSpace: 'pre-wrap',
                                color: 'rgba(255,255,255,0.5)',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                maxWidth: '90%',
                                ...getShadowStyle(textLayout.contact[format].shadow)
                            }}>{content.contactInfo}</span>
                    </div>
                )}

                <div className="absolute inset-0 z-[30] flex items-center justify-center pointer-events-none">
                    {images.productImage && (
                        <div
                            className={`${images.productLocked ? 'pointer-events-none' : 'cursor-move pointer-events-auto'}`}
                            data-layer-id="productImage"
                            onMouseDown={(e) => onElementMouseDown && !images.productLocked && onElementMouseDown('productImage', e)}
                            style={{
                                transform: `translate(${x}px, ${y}px) rotate(${rotation || 0}deg) scale(${scale})`,
                                position: 'absolute'
                            }}
                        >
                            <img
                                src={images.productImage}
                                className="transition-transform duration-200 ease-out drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                                style={{ width: '600px', pointerEvents: 'none' }}
                                alt="product"
                            />
                        </div>
                    )}
                </div>

                <ExtraLayersRenderer state={state} format={format} onMouseDown={onElementMouseDown} />
                <CustomTextRenderer state={state} format={format} onMouseDown={onElementMouseDown} />
            </div>
        </BaseContainer>
    );
};