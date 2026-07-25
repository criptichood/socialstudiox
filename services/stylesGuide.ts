export interface StyleChoice {
  value: string;
  label: string;
  promptSegment: string;
}

export interface SubStyleOption {
  id: string;
  label: string;
  choices: StyleChoice[];
}

export interface StyleGuide {
  id: string;
  name: string;
  description: string;
  systemPromptGuide: string;
  options: SubStyleOption[];
}

export const STYLE_GUIDES: Record<string, StyleGuide> = {
  Default: {
    id: "Default",
    name: "Auto-Detect / Follow Prompt",
    description: "Let the AI dynamically analyze your prompt, determine the best medium, and design a customized composition.",
    systemPromptGuide: "Aesthetic: Adaptive. Dynamically analyze the user's prompt to determine the most effective visual medium, style, and structure. Avoid enforcing pre-defined restrictions. Let the inherent nature of the prompt guide the color palette, lighting, visual components, and details. Focus on making the visual look professional, accurate, and bespoke.",
    options: []
  },
  Realistic: {
    id: "Realistic",
    name: "Photorealistic",
    description: "Professional-grade photographic composite with cinematic lighting and high-fidelity textures.",
    systemPromptGuide: "Aesthetic: High-Fidelity Photorealistic Composite. Incorporate photographic depth, cinematic studio light, real-world physical textures, and realistic material reflections. Make it look like a real, professionally captured photograph with absolute precision and 8k resolution details.",
    options: [
      {
        id: "coloration",
        label: "Color Grading & Tone",
        choices: [
          { value: "vibrant", label: "Vibrant Chrome", promptSegment: "Vibrant, highly saturated color palette with rich cinematic color grading and deeply saturated tones." },
          { value: "muted", label: "Muted Pastel", promptSegment: "Muted, subtle pastel color grading, low-contrast, soft organic hues for an elegant, understated look." },
          { value: "monochrome", label: "Monochrome / B&W", promptSegment: "Classic high-contrast black and white photography, rich monochrome tones, dramatic silvery gray scales." },
          { value: "warm", label: "Warm Sepia Sunset", promptSegment: "Warm, amber-infused color temperatures, sepia-toned highlights, reminiscent of golden hour photography." }
        ]
      },
      {
        id: "lighting",
        label: "Lighting & Exposure",
        choices: [
          { value: "golden", label: "Golden Hour", promptSegment: "Warm golden-hour sunlight casting long, soft shadows, side-lit with a luminous amber glow." },
          { value: "studio", label: "Studio Softbox", promptSegment: "Diffuse three-point studio lighting, soft shadows, uniform soft exposure, clean reflections." },
          { value: "dramatic", label: "Dramatic Chiaroscuro", promptSegment: "High-contrast chiaroscuro lighting, deep shadows, crisp direct light source, moody atmosphere." },
          { value: "natural", label: "Natural Overcast", promptSegment: "Soft, uniform overcast daylight, minimal specular glare, highly naturalistic shadow falloff." }
        ]
      },
      {
        id: "composition",
        label: "Shot & Composition",
        choices: [
          { value: "macro", label: "Macro Close-up", promptSegment: "Ultra close-up macro shot with shallow depth of field, sharp foreground focus, beautiful blurred bokeh background." },
          { value: "wide", label: "Wide Angle", promptSegment: "Wide-angle cinematic shot, high spatial awareness, clear sense of environment and scale." },
          { value: "eye", label: "Eye-Level Portrait", promptSegment: "Symmetrical eye-level composition, clear, centered focal point, balanced proportions." }
        ]
      }
    ]
  },
  Sketch: {
    id: "Sketch",
    name: "Technical Blueprint",
    description: "Detailed blueprints, schematics, and clean technical vector diagrams with annotations.",
    systemPromptGuide: "Aesthetic: Professional Technical Blueprint & Schematic. Use precise fine-line engineering draft work, complex mathematical measurements, scale indicators, and structural cross-sections. Render with clean drafting-board fidelity, giving it the look of a premium architectural or patent drawing.",
    options: [
      {
        id: "theme",
        label: "Subject Theme",
        choices: [
          { value: "architectural", label: "Architectural Draft", promptSegment: "Styled like a rigorous civil engineering and architectural blueprint, elevation lines, plan views, and structural dimensions." },
          { value: "mechanical", label: "Mechanical Patent", promptSegment: "Styled like an official patent office mechanical schematic, exploded assembly views, reference numbers, and gears." },
          { value: "electronic", label: "Silicon Circuit Board", promptSegment: "Styled like a detailed electronics hardware blueprint, copper trace paths, soldering pads, and microchip schematics." },
          { value: "astrophysical", label: "Astrophysical Chart", promptSegment: "Styled like a deep-space navigational celestial chart, orbit lines, cosmic coordinates, and star charts." }
        ]
      },
      {
        id: "background",
        label: "Canvas Background Style",
        choices: [
          { value: "blueprint", label: "Blueprint Cyan Grid", promptSegment: "Deep Prussian cyan-blue background with crisp white drafting lines and a fine mathematical graph grid." },
          { value: "chalkboard", label: "Drafting Chalkboard", promptSegment: "Slate gray chalk-dusted chalkboard background with fine white/yellow chalk-style sketch lines." },
          { value: "kraft", label: "Modern Kraft Paper", promptSegment: "Warm off-white textured drafting paper, with elegant dark charcoal graphite line work." },
          { value: "grid", label: "Graph Matrix Grey", promptSegment: "Dark matte grey background with subtle grid lines and glowing white technical details." }
        ]
      },
      {
        id: "annotation",
        label: "Annotation Detail Level",
        choices: [
          { value: "heavy", label: "Dense Annotations", promptSegment: "Densely populated with mechanical callouts, labels, measuring guides, angles, and technical text boxes." },
          { value: "minimal", label: "Clean Minimal", promptSegment: "Minimalist drafting annotations, sparse text callouts, focus on clean layout and structural shapes." }
        ]
      }
    ]
  },
  Minimalist: {
    id: "Minimalist",
    name: "Minimalist Graphic",
    description: "Flat, vector-based minimalist visuals honoring Swiss and Bauhaus design principles.",
    systemPromptGuide: "Aesthetic: Bauhaus & Swiss Typographic Minimalist. Emphasize strict geometric simplicity, flat vector shapes, spacious negative space, and clear spatial hierarchy. Absolutely no gradients, textures, or complex shadows. Keep the layout flat, clean, and highly structured.",
    options: [
      {
        id: "philosophy",
        label: "Design School",
        choices: [
          { value: "bauhaus", label: "Bauhaus Functionalism", promptSegment: "Inspired by Bauhaus design: primary geometric shapes (circles, squares, triangles), bold functional lines, and asymmetric balance." },
          { value: "swiss", label: "Swiss International", promptSegment: "Inspired by the Swiss style: rigid grid system, superb typographic balance, extreme cleanliness, and high contrast." },
          { value: "brutalist", label: "Neo-Brutalist Bold", promptSegment: "Inspired by Neo-Brutalism: high contrast, solid primary color blocks, thick black separators, and raw, punchy structures." }
        ]
      },
      {
        id: "palette",
        label: "Color Palette Theme",
        choices: [
          { value: "monochrome", label: "Strict Monochrome", promptSegment: "High-contrast monochrome palette using only black, white, and a single shade of deep charcoal gray." },
          { value: "duotone", label: "Complementary Duotone", promptSegment: "Striking duotone color palette utilizing two contrasting flat colors for a modern, artistic impact." },
          { value: "accent", label: "Neutral with Pop Accent", promptSegment: "Dominated by soft cream/grey neutrals with a single energetic accent color (like electric blue or hazard orange)." }
        ]
      },
      {
        id: "density",
        label: "Visual Density",
        choices: [
          { value: "spacious", label: "Ultra-Spacious Negative Space", promptSegment: "Generous margins, vast empty backgrounds, extreme focus on a single elegant centered graphic." },
          { value: "compact", label: "Compact Geometric Grid", promptSegment: "Neatly grouped bento-grid-like layout, compact spacing with uniform geometric dividers." }
        ]
      }
    ]
  },
  "3D Render": {
    id: "3D Render",
    name: "3D Isometric / Clay",
    description: "Cute isometric 3D illustrations resembling physical clay or glossy toy models.",
    systemPromptGuide: "Aesthetic: 3D Isometric Digital Render. Utilize claymorphism, soft ambient occlusion shadows, glossy reflections, and a toy-like miniature scale. Light the scene with warm, high-key studio softboxes for a tangible, physically tactile quality.",
    options: [
      {
        id: "material",
        label: "Material Texture",
        choices: [
          { value: "clay", label: "Matte Claymorphism", promptSegment: "Soft-touch matte clay texture with gentle gradients, smooth pastel finishes, and velvety surface shading." },
          { value: "plastic", label: "Glossy Toy Plastic", promptSegment: "High-gloss polished plastic material, crisp highlight reflections, resembling a custom vinyl collectible figurine." },
          { value: "glass", label: "Glass & Metallic", promptSegment: "Sleek frosted glass with refractive light bending paired with polished, satin-finished brushed chrome metals." }
        ]
      },
      {
        id: "camera",
        label: "Camera Projection",
        choices: [
          { value: "isometric", label: "3D Isometric Grid", promptSegment: "Perfect isometric camera projection at 30-degree angles, displaying three sides of objects uniformly with zero perspective distortion." },
          { value: "perspective", label: "Distant Perspective", promptSegment: "Telephoto perspective zoom, soft natural camera angles with a subtle 3D perspective depth." }
        ]
      }
    ]
  },
  Cartoon: {
    id: "Cartoon",
    name: "Graphic Novel",
    description: "Rich, cel-shaded vector comics with clean ink work and engaging educational characters.",
    systemPromptGuide: "Aesthetic: Premium Educational Comic & Graphic Novel. Feature crisp black ink outlines, flat color fills with cel-shading, playful characters, and clear visual narratives. Make it visually engaging, friendly, and highly legible.",
    options: [
      {
        id: "style",
        label: "Artistic Illustration Style",
        choices: [
          { value: "comic", label: "Comic Cel-Shaded", promptSegment: "Classic graphic novel style with hand-inked line art, cel-shading gradients, and dynamic action panel layouts." },
          { value: "pop", label: "Pop-Art Vector", promptSegment: "Vibrant pop-art illustration style, featuring halftone dot patterns, bold colors, and retro cartoon aesthetics." },
          { value: "sticker", label: "Chibi Decal Sticker", promptSegment: "Adorable sticker style with highly simplified shapes, large expressive features, and bold outlines." }
        ]
      },
      {
        id: "outline",
        label: "Outline Style",
        choices: [
          { value: "thick", label: "Thick Bold Ink", promptSegment: "Heavy, expressive black ink outlines surrounding every visual element, making them pop out." },
          { value: "diecut", label: "Die-Cut White Sticker Edge", promptSegment: "A thick, clean die-cut white vinyl border surrounding the overall graphic, creating a physical sticker look." },
          { value: "none", label: "Clean Flat Vector", promptSegment: "No outlines, relying purely on contrasting flat color boundaries and sharp geometric cuts." }
        ]
      }
    ]
  },
  Vintage: {
    id: "Vintage",
    name: "Vintage Lithograph",
    description: "Authentic scientific drawings and hand-colored etchings from the 19th century.",
    systemPromptGuide: "Aesthetic: Historic Scientific Lithograph & Hand-Colored Engraving. Use sepia tones, extensive stippling, delicate hand-hatched shading, and aged fiber paper backdrops to mimic antique scientific plates.",
    options: [
      {
        id: "era",
        label: "Historical Period",
        choices: [
          { value: "scientific", label: "19th Century Scientific Plate", promptSegment: "Styled like a 19th-century botanical or zoological monograph plate, hand-tinted watercolor hues, and Latin calligraphy captions." },
          { value: "alchemy", label: "Medieval Alchemical Scroll", promptSegment: "Styled like a medieval alchemical notebook or parchment scroll, featuring cryptic geometric symbols, ink-wash textures, and aged borders." },
          { value: "screenprint", label: "Retro 1950s Screenprint", promptSegment: "Mid-century modern flat screenprint style, ink misregistration, textured woodblock printing colors, and paper grain." }
        ]
      },
      {
        id: "ink",
        label: "Etching & Ink Technique",
        choices: [
          { value: "hatch", label: "Fine Hatch-Line Engraving", promptSegment: "Intricate copperplate engraving, fine cross-hatching line shadows, and meticulous ink details." },
          { value: "wash", label: "Soft Watercolor Wash", promptSegment: "Delicate hand-colored watercolor wash over ink lines, subtle paint bleeding, and organic textured tints." }
        ]
      }
    ]
  },
  Futuristic: {
    id: "Futuristic",
    name: "Cyberpunk HUD",
    description: "Glow-in-the-dark holographic user interfaces with data readouts and digital displays.",
    systemPromptGuide: "Aesthetic: Cyberpunk Holographic Head-Up Display (HUD). Include highly detailed telemetry data streams, neon-lit interface grids, wireframe models, glowing waveform analyzers, and micro-text metrics on an immersive dark canvas.",
    options: [
      {
        id: "theme",
        label: "Diagnostic Theme",
        choices: [
          { value: "telemetry", label: "Spaceflight Telemetry Screen", promptSegment: "Deep-space astronomical navigation overlay, constellation lines, coordinate sectors, and orbital vector graphs." },
          { value: "bio", label: "Bio-Medical HUD", promptSegment: "Holographic human bio-diagnostic screen, pulsing heart waves, DNA double-helix wireframe, and cellular analysis grids." },
          { value: "core", label: "AI Core Visualizer", promptSegment: "Glowing neural network matrix, interactive particle streams, digital data flow tunnels, and binary coordinate labels." }
        ]
      },
      {
        id: "color",
        label: "Glow Color Profile",
        choices: [
          { value: "cyan", label: "Holographic Cyan & Indigo", promptSegment: "Electric cyan, neon blue, and deep purple glowing graphics overlaying a pitch-black background." },
          { value: "amber", label: "Tactical Amber & Hazard Orange", promptSegment: "Warning amber, bright orange, and caution yellow glowing vector graphics." },
          { value: "acid", label: "Acid Lime Green", promptSegment: "Acid green, matrix lime, and bright yellow luminescent interface highlights." }
        ]
      }
    ]
  }
};
