# SAGE-Agent Brand Guidelines

## Vision
SAGE-Agent embodies **verifiable autonomy** in the onchain economy — where AI agents operate with cryptographic transparency, geometric precision, and cyberpunk edge.

## Color Palette

### Core Colors
- **Primary Dark**: `#0c0c0c` — Deep space black, the foundation
- **Accent Neon**: `#00d4aa` — Cyberpunk green, our signature color
- **Text Primary**: `#fafafa` — Clean white for high contrast
- **Text Secondary**: `#a0a0a0` — Mid-gray for supporting text
- **Text Tertiary**: `#606060` — Subtle gray for labels

### Extended Palette
- **Background Raised**: `#111111` — Elevated surfaces
- **Background Subtle**: `#161616` — Secondary backgrounds  
- **Border Default**: `rgba(255, 255, 255, 0.06)` — Subtle divisions
- **Border Hover**: `rgba(255, 255, 255, 0.12)` — Interactive states
- **Accent Dim**: `rgba(0, 212, 170, 0.12)` — Accent backgrounds

## Typography

### Font Stack
- **Display**: General Sans (via Fontshare) — Bold, geometric headers
- **Body**: Satoshi (via Fontshare) — Clean, readable text
- **Fallback**: `-apple-system, system-ui, sans-serif`

### Hierarchy
```css
/* Hero/Display */
font: 600 clamp(2.8rem, 6vw, 5rem)/1.08 'General Sans';
letter-spacing: -0.03em;

/* Section Titles */
font: 600 clamp(1.8rem, 3.5vw, 2.6rem)/1.15 'General Sans';
letter-spacing: -0.025em;

/* Body Text */
font: 400 1rem/1.7 'Satoshi';

/* Labels/Small */
font: 600 0.7rem/1 'General Sans';
letter-spacing: 0.18em;
text-transform: uppercase;
```

## Logo System

### Primary Mark
- **Main Logo**: `assets/logo.svg` — Full geometric design with hexagon, crosshairs, and tech details
- **Favicon**: `assets/favicon.svg` — Simplified version for small sizes (16px-32px)

### Construction
- Central hexagon represents the AI core and network connectivity
- Crosshairs suggest targeting, precision, and autonomous hunting
- Corner accents add space-tech context
- Subtle scan line overlay provides cyberpunk texture

### Usage Rules
- **Minimum size**: 24px for favicon, 60px for main logo
- **Clear space**: Equal to the height of the hexagon on all sides
- **Backgrounds**: Works on dark (`#0c0c0c`) and raised (`#111111`) surfaces
- **Accent color**: Always use `#00d4aa` for the primary elements

## Visual Language

### Aesthetic Principles
- **Geometric Precision**: Angular shapes, hexagons, clean lines
- **Cyberpunk Edge**: Neon accents, scan lines, glitch effects
- **Space Context**: Floating elements, radar-like circles, tech debris
- **Verifiable Trust**: Clear hierarchy, transparent communication

### Effects & Treatments
```css
/* Neon Glow */
filter: drop-shadow(0 0 8px rgba(0, 212, 170, 0.4));

/* Scan Lines */
background: repeating-linear-gradient(
  0deg,
  transparent 0px,
  rgba(0, 212, 170, 0.03) 1px,
  transparent 3px
);

/* Subtle Grid */
background-image: radial-gradient(
  circle at 1px 1px, 
  rgba(255, 255, 255, 0.1) 1px, 
  transparent 0
);
background-size: 20px 20px;
```

## Tone & Voice

### Personality
- **Confident**: We know our technology works
- **Technical**: Precise language, specific claims
- **Slightly Rebellious**: Challenge the status quo of centralized AI
- **Transparent**: Open about how everything works

### Writing Style
- **Active voice**: "SAGE executes trades" not "trades are executed"
- **Specific claims**: "382 ships indexed" not "hundreds of ships"
- **Technical accuracy**: Use correct blockchain/crypto terminology
- **Confident assertions**: "Verifiable AI" not "potentially verifiable"

### Avoid
- Generic AI marketing speak ("revolutionary", "game-changing")
- Overly complex technical jargon that obscures meaning
- Passive or uncertain language
- Corporate-safe messaging that lacks edge

## Applications

### Web Interface
- Dark-first design with strategic accent color usage
- Generous white space for clarity
- Subtle animations that enhance rather than distract
- Grid-based layouts with occasional asymmetry for visual interest

### Social/Marketing
- Lead with the visual brand: logo + key message
- Use the accent color sparingly but boldly
- Technical diagrams should feel like space-age interfaces
- Screenshots should showcase the actual product, not marketing fluff

## Brand Extensions

### Future Considerations
- Animation system based on geometric transformations
- Sound design with synthetic/digital audio signatures  
- Merchandise using monochrome + accent approach
- Conference/event graphics emphasizing the technical precision

---

**Remember**: SAGE-Agent isn't just another AI tool — it's a new paradigm for verifiable autonomous systems. The brand should feel like it belongs in the future of onchain economies.