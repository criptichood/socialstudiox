# Handoff Prompt: Node Diagram Rendering on the Published Site

Copy this prompt into the agent builder/engineer that controls the **separate application** where published blog posts are served. That site receives Markdown (with embedded `[NODE_DIAGRAM: ...]` markers) from this AI content studio and currently has no way to render the flowcharts.

---

**Task:** Add support for rendering AI-generated "node diagram" flowcharts inside blog posts on this site.

**Why:** Blog posts are published to this site as Markdown from an external AI content studio. Some posts contain a single-line flowchart marker that encodes a graph as JSON. The site currently renders the raw marker text as visible garbage because it has no renderer for it. You need to add the rendering library and the rendering component, then integrate both into the Markdown render pipeline.

**Data format.** A marker looks like this (always one line, always between blank lines, so it renders as its own block):
```
[NODE_DIAGRAM: {"title":"Signup Funnel","nodes":[{"id":"1","label":"Visitor lands"},{"id":"2","label":"Signs up","description":"Optional one-line note","type":"input"}],"edges":[{"source":"1","target":"2","label":"Optional edge label"}]}]
```
- `title` — string, optional; diagram heading.
- `nodes` — required array; each item is `{ id: string (unique), label: string, description?: string, type?: "input" | "process" | "decision" | "output" }`.
- `edges` — required array; each item is `{ source: string, target: string, label?: string }` where `source` and `target` must reference existing node `id`s.

**What to build:**

1. **Add the library.** Install `@xyflow/react` (React Flow v12) — this is the reference implementation already used on the content-creator side. If this site is not React-based, pick the closest equivalent graph library for your stack (e.g. a SVG/canvas layout library) and install it.

2. **Parser/validator.** Detect any line starting with `[NODE_DIAGRAM:` in the post's Markdown, extract the balanced JSON object after the colon, and parse it. Validate: reject silently (render nothing) if fewer than 2 nodes, duplicate node ids, or an edge referencing a missing node. Never break the page — on any parse failure, just render the surrounding text and drop the marker.

3. **Renderer component.** Replace the marker with a rendered flowchart:
   - Layout left-to-right.
   - Decision nodes diamond-shaped; all others rounded rectangles; color by type (suggested: input=cyan, process=indigo, decision=amber, output=emerald).
   - Show `description` as a small subtitle under the node label; show edge `label`s on the connecting lines.
   - Pan/zoom, plus an expand/collapse affordance on mobile so it stays usable on small screens.
   - Match this site's design system, including dark mode.

4. **Integration.** Wire the parser + renderer into the Markdown pipeline used to display blog posts (and any preview/editor if posts can be edited here). Each marker becomes its own block-level diagram with `title` rendered as a heading above it. Rarely there may be up to 2 markers in one post — render each.

5. **Edge cases.** Old posts or hand-edited posts may contain malformed markers — always degrade gracefully. If the library can't be installed (build constraints), fall back to rendering the JSON inside a styled `<pre>` code block so the content isn't lost.

**Acceptance criteria:** Fetch a published post containing the marker, confirm the flowchart renders as an interactive, correctly-styled graph; confirm a post with a malformed marker still renders cleanly.

---

## Pitfalls we already hit & fixed (don't repeat them)

These were real bugs found on the content-creator side during the first diagram render. Apply the same fixes so the published site renders correctly on the first try:

1. **Parser must skip the marker's closing `]`.** After scanning the balanced JSON object, the parser must advance past the marker's trailing `]` — otherwise the cleaned text becomes `[[NODE_DIAGRAM:0]]]` (a stray bracket leaks into the page). Also, only skip that bracket and immediate spacing — do **not** consume the following newlines, or the diagram gets glued onto the next paragraph instead of staying its own block.

2. **Do NOT use a controlled React Flow `nodes`/`edges` prop without `onNodesChange`/`onEdgesChange`.** For a static diagram use `defaultNodes`/`defaultEdges` (uncontrolled) — controlled mode requires change handlers and logs warnings otherwise.

3. **Zero-size container at mount collapses the canvas.** If the diagram mounts inside an animating modal/drawer (fade/scale-in), React Flow measures the container as 0×0, `fitView` computes a degenerate viewport, and only a single blank/clipped node is visible. Fix: render inside a `ReactFlowProvider`, then imperatively call `fitView({ padding, maxZoom: 1 })` after mount (e.g. ~80ms and ~400ms timeouts) AND attach a `ResizeObserver` to the canvas wrapper that calls `fitView` again on every resize. This guarantees the full graph always comes into view regardless of when the container gets its real size.

4. **Cycle-safe layout.** Diagrams often contain feedback loops ("Needs Rework → step 1", "Optimized Insights → step 1"), so the node graph is cyclic. A plain Kahn's/longest-path layout then has **no indegree-zero node**, and naive handling pushes the first logical node all the way to the last column (your pipeline rendered with "1. Ideation & Planning" last). Fix: compute columns using only edges that go strictly forward in the **declared node order** (edge whose `target` id appears later in the `nodes` array than its `source` id). Render **all** edges, but exclude those backward/feedback edges from the layering step. This keeps "1" first, left-to-right order intact, and the feedback arrows still drawn.

5. **Node widths/heights.** Give nodes explicit dimensions (fixed width, min-height) so `fitView` can compute a correct bounding box; don't rely on measuring custom-node content that may not be laid out yet.

---

## Reference implementation (content-creator side)

These files define the exact behavior to match if you want parity:

- `lib/nodeDiagrams.ts` — shared parser/validator (`extractNodeDiagrams`, `removeNodeDiagramMarkers`, `NodeDiagram`/`NodeDiagramNode`/`NodeDiagramEdge` types).
- `components/research/blog/FlowDiagramRenderer.tsx` — React Flow renderer (auto left-to-right layered layout, typed node styling, pan/zoom/minimap/controls, dark-mode aware).
- `components/research/blog/BlogMarkdownRenderer.tsx` — how the marker is detected and replaced inline in rendered Markdown.