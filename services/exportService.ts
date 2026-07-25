import { Project, GeneratedImage } from '../types';

/**
 * Triggers a download of a beautiful offline self-contained HTML report with base64 embedded visuals.
 */
export const exportHTMLReport = (project: Project, images: GeneratedImage[], triggerCallback?: () => void) => {
  const imagesHTML = images.map((img, index) => {
    const annotationsList = img.annotations && img.annotations.length > 0 
      ? `<div class="annotations">
           <h4>Applied Overlay Labels</h4>
           <ul>
             ${img.annotations.map(ann => `<li><strong>${ann.type.toUpperCase()}:</strong> ${ann.text || 'Coordinate overlay'}</li>`).join('')}
           </ul>
         </div>`
      : '';

    const factsList = img.facts && img.facts.length > 0
      ? `<h3>Verified Grounding Facts</h3>
         <ul>
           ${img.facts.map(f => `<li>${f}</li>`).join('')}
         </ul>`
      : '';

    const sourcesList = img.searchResults && img.searchResults.length > 0
      ? `<div class="sources">
           <h4>External Research Sources</h4>
           <ul>
             ${img.searchResults.map(s => `<li><a href="${s.url}" target="_blank">${s.title}</a></li>`).join('')}
           </ul>
         </div>`
      : '';

    return `
      <div class="infographic-section">
        <h2>Visual Slide ${index + 1}: ${img.prompt}</h2>
        <div class="metadata">
          <span>Complexity: ${img.level}</span> | 
          <span>Style: ${img.style}</span> | 
          <span>Language: ${img.language}</span> | 
          <span>Ratio: ${img.resolution}</span>
        </div>
        <div class="image-wrapper">
          <img src="${img.data}" alt="${img.prompt}" />
        </div>
        <div class="brief-text">
          <p><strong>Visual AI Guidelines:</strong> ${img.imagePrompt}</p>
        </div>
        ${annotationsList}
        ${factsList}
        ${sourcesList}
      </div>
    `;
  }).join('<hr />');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portfolio Brief: ${project.name}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          line-height: 1.6;
          padding: 40px 20px;
          max-width: 900px;
          margin: 0 auto;
        }
        header {
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 20px;
          margin-bottom: 40px;
        }
        h1 {
          font-size: 2.5rem;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .project-desc {
          font-size: 1.1rem;
          color: #475569;
          margin-bottom: 16px;
        }
        .timestamp {
          font-size: 0.85rem;
          color: #94a3b8;
          font-family: monospace;
        }
        .infographic-section {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 40px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        h2 {
          font-size: 1.6rem;
          color: #0284c7;
          margin-top: 0;
          margin-bottom: 10px;
        }
        .metadata {
          font-size: 0.85rem;
          color: #64748b;
          font-family: monospace;
          margin-bottom: 20px;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
        }
        .image-wrapper {
          text-align: center;
          background-color: #0f172a;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
        }
        .image-wrapper img {
          max-width: 100%;
          height: auto;
          max-height: 600px;
          border-radius: 6px;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
        }
        h3 {
          font-size: 1.25rem;
          color: #0f172a;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 6px;
          margin-top: 25px;
        }
        ul {
          padding-left: 20px;
        }
        li {
          margin-bottom: 8px;
        }
        .annotations, .sources {
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .annotations h4, .sources h4 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }
        hr {
          border: 0;
          border-top: 1px dashed #cbd5e1;
          margin: 40px 0;
        }
        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
          }
          .infographic-section {
            border: none;
            box-shadow: none;
            padding: 0;
            page-break-after: always;
          }
          .image-wrapper {
            background-color: transparent;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <header>
        <h1>Project Portfolio: ${project.name}</h1>
        <p class="project-desc">${project.description || 'Verified research workspace portfolio compiled seamlessly.'}</p>
        <div class="timestamp">COMPILED AT: ${new Date().toLocaleString()} | TOTAL SLIDES: ${images.length}</div>
      </header>

      ${imagesHTML}

      <footer style="text-align: center; margin-top: 60px; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        Generated with InfoGenius Suite. Visual briefs & references verified dynamically.
      </footer>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Portfolio-${project.name.toLowerCase().replace(/\s+/g, '-')}.html`;
  link.click();
  if (triggerCallback) triggerCallback();
};

/**
 * Triggers a download of raw campaign/project metadata packages.
 */
export const exportJSONPackage = (project: Project, images: GeneratedImage[], triggerCallback?: () => void) => {
  const dataPackage = {
    project,
    exportedAt: Date.now(),
    totalGraphics: images.length,
    graphics: images.map(img => ({
      id: img.id,
      prompt: img.prompt,
      imagePrompt: img.imagePrompt,
      timestamp: img.timestamp,
      level: img.level,
      style: img.style,
      language: img.language,
      resolution: img.resolution,
      facts: img.facts || [],
      searchResults: img.searchResults || [],
      annotations: img.annotations || []
    }))
  };

  const blob = new Blob([JSON.stringify(dataPackage, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Portfolio-${project.name.toLowerCase().replace(/\s+/g, '-')}.json`;
  link.click();
  if (triggerCallback) triggerCallback();
};

/**
 * Triggers a download of a structured Markdown briefing overview.
 */
export const exportMarkdownBrief = (project: Project, images: GeneratedImage[], triggerCallback?: () => void) => {
  let md = `# Project Research Portfolio: ${project.name}\n`;
  md += `> ${project.description || 'Compiled Research Workspace Brief.'}\n\n`;
  md += `- **Compiled At:** ${new Date().toLocaleString()}\n`;
  md += `- **Total Resources:** ${images.length} Visual Briefs\n\n`;
  md += `---\n\n`;

  images.forEach((img, idx) => {
    md += `## Visual Slide ${idx + 1}: ${img.prompt}\n\n`;
    md += `### Technical Architecture Metadata\n`;
    md += `- **Target Audience / Complexity:** ${img.level}\n`;
    md += `- **Aesthetic Paradigm:** ${img.style}\n`;
    md += `- **Syntactical Language:** ${img.language}\n`;
    md += `- **Aspect Ratio:** ${img.resolution}\n\n`;
    md += `### Descriptive AI Visual Blueprint\n`;
    md += `> ${img.imagePrompt}\n\n`;

    if (img.annotations && img.annotations.length > 0) {
      md += `### Structured Visual Overlay Labels\n`;
      img.annotations.forEach(ann => {
        md += `- **[${ann.type.toUpperCase()}]** at (x: ${Math.round(ann.x * 100)}%, y: ${Math.round(ann.y * 100)}%): *${ann.text || 'Coordinate marker'}*\n`;
      });
      md += `\n`;
    }

    if (img.facts && img.facts.length > 0) {
      md += `### Verified Fact Grounding Core\n`;
      img.facts.forEach(fact => {
        md += `- ${fact}\n`;
      });
      md += `\n`;
    }

    if (img.searchResults && img.searchResults.length > 0) {
      md += `### Validated Grounding Web Sources\n`;
      img.searchResults.forEach(src => {
        md += `- [${src.title}](${src.url})\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Briefing-${project.name.toLowerCase().replace(/\s+/g, '-')}.md`;
  link.click();
  if (triggerCallback) triggerCallback();
};
