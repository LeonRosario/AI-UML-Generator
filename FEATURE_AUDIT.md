# Diagram coverage and editor audit

## New diagram types

The generation selector, project type selector, templates and saved diagram model now include:

| Type key | Display name | Presets |
| --- | --- | --- |
| `flowchart` | Flowchart | Purchase approval; Support triage |
| `network` | Network Diagram | Secure office network; Public service DMZ |
| `architecture` | Cloud / System Architecture | Cloud service platform; Web application architecture |
| `gantt` | Gantt Chart | Product launch schedule; Event planning schedule |

All eight existing UML types remain available. The three existing `/ai/generate-diagram`, `/ai/modify-diagram` and `/ai/explain-diagram` endpoints remain in place. Generation uses the configured provider and type-specific instructions. Gantt has its own schedule prompt, validation and renderer. The new types require the configured backend for AI generation; templates and manual editing work offline.

## Gantt data and behavior

Gantt stores `gantt: { tasks: [...] }` on the existing diagram document, with empty `nodes` and `edges`. A task has `id`, `name`, ISO `start` date, integer `duration`, `assignee`, integer `progress` (0–100), `milestone`, and predecessor IDs in `dependencies`.

- Durations use calendar days; the end date is **exclusive** (`start + duration`). Milestones have zero duration and render as diamonds.
- Dependencies are finish-to-start. Edits move successors forward as needed, preserving independent work and intentional gaps. They do not pull successors earlier automatically.
- The renderer has a date header, owner lanes, one row per task, progress bars, dependency arrows, a today line and day/week/month density controls.
- Select a task to edit its fields and predecessors. Drag a bar to move it, or its right edge to change duration. Edits, deletion, AI changes and template application participate in undo/redo.
- Validation rejects invalid dates, duplicate IDs, noninteger/negative durations, invalid milestones, missing dependencies, cycles and impossible finish-to-start ordering. Imported schedules support up to 300 tasks and a ten-year span.
- Save/load, autosave, JSON serialization and template previews preserve schedules. Existing backend JSON storage is extended; no database migration is needed.

This implementation does not add working-day calendars, critical-path analysis or the other dependency kinds (SS/FF/SF).

Research: [draw.io's Gantt guide](https://www.drawio.com/docs/diagram-types/gantt-charts/) describes table rows, overlaid task bars and connectors, grouped shape templates, and Mermaid/text generation. [Lucid's Gantt guide](https://app.lucid.co/diagram/gantt) describes tasks with ownership, durations, dependencies and milestones against a timeline. UMLForge uses those visual conventions with actual calendar data instead of storing task bars as free-form graph nodes.

## Shape fidelity

Canvas and shape-library previews share original SVG artwork for all 14 corrected node types:

| Node type | New notation |
| --- | --- |
| `networkFirewallNode` | Brick wall and flame |
| `archApiNode` | Code brackets, slash and endpoints |
| `archCacheNode` | Cache lines and lightning bolt |
| `archQueueNode` | Queued messages and directional flow |
| `archServiceNode` | Gear |
| `archGatewayNode` | Gateway with incoming/outgoing arrows |
| `cloudComputeNode` | Processor and pins |
| `cloudMonitoringNode` | Monitor and signal trace |
| `deploymentDeviceNode` | Perspective device box with UML stereotype |
| `deploymentEnvironmentNode` | Nested execution boundary and UML stereotype |
| `erWeakEntityNode` | Double-bordered rectangle |
| `flowOffPageNode` | Downward pentagonal off-page connector |
| `sequenceBoundaryNode` | Circle connected to boundary line |
| `sequenceControlNode` | Circle with control arrow |

Gantt adds task/progress bars, milestone diamonds and date/owner rows in its separate SVG renderer. It does not introduce fake React Flow task nodes. Extended node defaults also now use the correct diagram family, palette label and dimensions.

## Canvas checklist

| Capability | Found before | Added or fixed |
| --- | --- | --- |
| Multi-select / move / delete | React Flow selection, group dragging and deletion | Persistent grouping/ungrouping, proportional selection scaling (including labels), atomic deletion/history |
| Copy/paste / duplicate | Duplicate button copied nodes only | Copy/paste across diagrams in the same browser origin, new IDs, internal connectors, independent node data; duplicate now includes connectors |
| Grid / guides | Grid and grid snapping | Smart guides snap selection edges/centers to other visible shapes; group spacing is preserved; grid preferences persist |
| Routing | Rounded orthogonal path was hard-coded | Explicit elbow, straight and curved routing; diagram default and per-edge selector; routing and line/marker colors survive JSON round trips |
| Layers | Absent | Add/rename layers, assign selection, show/hide and lock; connected edges follow visibility/locking; layer state persists |
| Zoom / minimap | Zoom buttons, fit view, pannable/zoomable minimap | Keyboard zoom and fit; Gantt uses date density and scrolling |
| Shortcuts / history | Delete, undo/redo and save shortcuts | Copy/paste, duplicate, select-all, grouping, zoom/fit; fixed the no-op drag history handler; template/AI edits are undoable |
| Diagram style presets | Per-shape styling and canvas background only | Classic, Ocean, Forest and Midnight themes for nodes, connectors and background; newly inserted shapes inherit the theme |

The active editor uses the Zustand history in `editor-store.ts`. `useHistory.ts` is a separate generic hook, not the active editor's history implementation; it did not need replacement. The existing shape library's search, favorites, recent items, drag/drop and click insertion were retained.

## Keyboard reference

Shortcuts ignore text inputs, textareas, selects, content-editable elements and generation dialogs.

| Action | Shortcut |
| --- | --- |
| Select multiple | Shift+click / drag selection |
| Pan | Space+drag; middle/right drag |
| Select all | Ctrl/⌘+A |
| Copy / paste | Ctrl/⌘+C / V |
| Duplicate | Ctrl/⌘+D |
| Group / ungroup | Ctrl/⌘+G / Ctrl/⌘+Shift+G |
| Delete selected nodes and incident edges | Delete / Backspace |
| Undo | Ctrl/⌘+Z |
| Redo | Ctrl/⌘+Shift+Z or Ctrl/⌘+Y |
| Save | Ctrl/⌘+S |
| Zoom in / out / fit | + (or =) / − / 0 |
| Select a focused Gantt task | Enter |
| Shift a focused Gantt task one day | ← / → |
| Change focused task duration one day | Shift+← / Shift+→ |

Graph clipboard/grouping commands apply to graph diagrams. Gantt task editing uses the timeline and its task form. Undo/redo and save work in both editors.

## Verification

- `npm run typecheck`
- `npm run build`
- `npm test --prefix frontend`: nine behavioral regression tests covering graph clipboard, history, scaling, layers, styles/serialization, scheduling, guides and failed-save recovery.
- Backend pytest: 87 tests, including the real new-type routes and persistence. External AI provider responses are mocked; no live provider credentials are required or spent by these tests.
- Browser smoke fixture: `http://127.0.0.1:5175/tests/editor-smoke.html` when the Vite server is running on port 5175. It mounts the actual editor components with disposable in-memory fixtures, and never accesses user diagrams. Verified group scaling, duplicate connectors, hidden/locked layers, the 14 corrected symbols, and Gantt duration edits propagating to successors.

Windows sandbox restrictions can prevent esbuild from spawning and pytest from opening its temporary directories. Run those commands in an environment with local process and temporary-directory permissions. Existing dependency deprecation and bundle-size warnings remain.

## Student workflow follow-up

See [STUDENT_USABILITY_REPORT.md](STUDENT_USABILITY_REPORT.md) for the authenticated browser walkthrough, usability fixes, export checks and live-AI/download verification limits.
