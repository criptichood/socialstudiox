# Social Studio X
> A premium, modular AI-powered Social Media Post Generator, Brand Graphic Workspace, and Dynamic Image Editor.
>
> **Build with ❤️ by [@criptichood](https://github.com/criptichood)**

---

## 🚀 Overview

**Social Studio X** is an all-in-one interactive workspace designed to research trends, write high-converting copy, design eye-catching brand posts, generate custom AI visual assets, and edit your graphics on the fly. Driven by Google Gemini's advanced models and search-grounding research, it allows creators to seamlessly turn raw ideas or trends into beautifully formatted and annotated posts ready for social feeds.

---

## 💎 Features & Capabilities

### 📂 1. Projects Space (Multi-Campaign Sandboxing)
- **Isolated Workspaces**: Create, edit, and manage separate campaigns or client spaces (e.g., *Default Campaign*, *Tech Brand Launch*) to keep asset history and drafts organized.
- **Context Preservation**: Automatically stores active draft layouts, copy variations, and image libraries per-project, preventing visual pollution.

### 🎨 2. Visual Canvas & Post Prompt Studio
- **Curated Trend Grounding**: Queries Google search and curates validated factual bullet points before generating social copywriting or imagery.
- **Style and Brand Fine-Tuning**: Select visual styles (e.g., *3D Render*, *Minimalist Vector*, *Neon Cyberpunk*), complexity levels, aspect ratios (e.g., Square 1:1, Story 9:16, Landscape 16:9), and language translations.
- **Interactive Prompt Studio**: Preview, refine, and customize image prompts with Gemini or write direct edit commands to iterate on generated visuals on the fly.

### ✏️ 3. Multi-Layer Image Editor & Annotation Studio
- **On-The-Fly Editing Tools**: Draw directly on your generated base graphics with high-fidelity vector shapes, lines, arrows, and brush paths.
- **Text & Brand Layering**: Add stylized text, descriptions, handles, or callouts on top of images with point-and-click placement.
- **Persistent States**: Saved canvas edits are stored with full vector state back to Local IndexedDB.

### 📽️ 4. Interactive Slide Importer & Presenter
- **Per-Project Presentations**: Automatically structures your campaign assets into a sleek interactive deck with custom autoplay, smooth transitions, and overlays.
- **Multi-Project Importer**: Want to reference brand graphic assets from a different client project? Open the importer to search, filter, select, and import generated visuals from *any other project* instantly.
- **Interactive Annotation Overlays**: Dynamically displays vector annotations and text tags over slides as you present.

### ⚙️ 5. Clean & Performant Architecture
- **State Separation**: Business logic is separated from visual representation using a custom state controller at `/hooks/useAppEngine.ts`.
- **IndexedDB Sync**: Safely persists complex image streams and custom layouts locally inside the browser.
- **Dark Space Theme**: Visually designed around a polished deep-slate/neon-cyan workspace to ensure visual ergonomics during long design sessions.

---

## 🛠️ Architecture and File Guide

```bash
├── App.tsx                     # Main layout & component routing
├── types.ts                    # Strongly-typed schemas for projects, images, and drafts
├── hooks/
│   └── useAppEngine.ts         # Custom React Hook separating core business logic from UI
├── services/
│   ├── dbService.ts            # IndexedDB manager for persisting high-res image histories
│   └── geminiService.ts        # AI engine for prompt engineering, copy, and image synthesis
└── components/
    ├── Sidebar.tsx             # Workspace navigator with custom brand footer
    ├── IntroScreen.tsx         # Welcome dashboard with interactive WebGL parallax particles
    ├── ProjectsDashboard.tsx   # Workspace administrator
    ├── GalleryDashboard.tsx    # Scrollable vault with detail analytics
    ├── AnnotationStudio.tsx    # Live image annotation and layer editor
    └── PresentationDeck.tsx    # Slideshow system with cross-project asset importer
```

---

## 🛠️ Getting Started

### Installation
Ensure you have Node.js and npm installed, then boot up the development workspace:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application automatically runs on port **3000**. Open [http://localhost:3000](http://localhost:3000) to view the development preview.

---
*Created as a production-grade social and brand visualization tool, engineered with clean code paradigms and elegant typography.*
