# Student usability walkthrough — 10 September 2026

Tested the actual authenticated website through browser controls, using a disposable student account and a separate SQLite database. This was additional testing beyond the editor fixture. Existing account records and saved diagrams were not used for the walkthrough.

## Results

| Student activity | Result |
| --- | --- |
| Sign in and create a new assignment | Passed |
| Start from a class template, rename the assignment and a class | Passed |
| Build Book and Member manually; edit attributes and methods; drag a connector between them | Passed |
| Save, refresh, find the assignment in Recent/Dashboard, reopen it | Passed after fixing the saved-diagram lists |
| Duplicate and undo; copy connected classes into a different diagram | Passed via editor buttons; duplicate/undo shortcuts also passed |
| Group and resize a selection, apply a theme, delete both classes, undo deletion | Passed |
| Create a Gantt schedule from a template; edit task name, owner, duration and progress | Passed |
| Add a final-presentation milestone and a predecessor | Passed; the milestone moved to the predecessor's finish date |
| Increase a task duration using Shift+Right; save and reload the schedule | Passed; later tasks and milestones moved forward |
| Choose a network template, use the matching shape library, enter focus mode | Passed |
| Add a shape on a narrow screen | Passed; drawer dismissed and the new shape appeared without covering existing nodes |
| PNG, SVG, PDF and JSON exports | Generated and inspected; see download limitation below |
| Natural-language AI generation | Blocked by missing provider configuration; error recovery passed for class and Gantt |

Screen checks included the normal browser sizes encountered during testing (approximately 1172 and 820 pixels wide), plus explicit 1024×768 and 390×844 checks. Temporary viewport overrides were reset. Phone testing covered core controls, fitting the diagram and shape insertion; it was not a comprehensive mobile editing audit.

## Fixes made during the walkthrough

- Dashboard and Recent now display the student's persisted diagrams instead of hardcoded sample projects. Removed fictitious dashboard counts and AI-credit balance.
- Failed saves remain discoverable locally and are scoped by owner. A late response from an older save cannot mark a newer failed edit as synchronized. Added regression tests for both cases.
- The editor title can be renamed directly. Ctrl/Command+S also works while editing text, and canvas shortcuts do not act behind a modal.
- Corrected the laptop sidebar breakpoint and drawer positioning. Compact editor controls occupy their own footer instead of covering the canvas or Gantt task form.
- Added **Focus canvas** to hide side panels and fit a large diagram. The matching diagram shape category appears first and opens automatically.
- Added a blank-canvas starting guide and a template route when AI generation is unavailable. Generation errors retain the requirements text.
- New shapes are selected for immediate editing and placed in available space. Fixed duplicate input rows when adding class attributes/methods, added accessible field labels, and focused the new member's name.
- Exposed **Export** in the active editor, replacing an inert Share button. PNG/SVG/PDF use the full diagram bounds, with a preview before download. JSON includes Gantt data, layers and preferences. Corrected blank image positioning and loss of styles inside SVG labels; removed selection shadows and editing hints from captures.
- Gantt uses more of the available width. Clicking a task name opens its form even when its bar is offscreen. Wider labels accommodate longer assignment task names.

## Verification and limits

- `npm run typecheck`: passed.
- `npm run build`: passed. Existing bundle-size warnings remain.
- `npm test --prefix frontend`: **9 passed**.
- Backend pytest: **87 passed**. Existing dependency deprecation warnings remain.
- `git diff --check`: passed.

PNG and SVG previews were visually inspected for complete content, readable labels and connectors. The PDF payload had a valid `%PDF-1.3` header and its complete rendered preview was inspected. Downloadable Gantt JSON was decoded and checked for all six tasks, dates, durations, dependencies and preferences. The export library logged cross-origin Google Fonts embedding warnings; the inspected previews rendered successfully, but exact web-font embedding is not guaranteed. The in-app browser did not emit a download event or expose an OS-saved file, so actual filesystem download completion is **not verified**.

Neither Gemini nor OpenAI has a configured key in the local backend. A real generated result therefore could not be tested; no simulated result was presented as live AI generation. Templates and manual editing worked independently of AI. Provider integration tests use mocked responses.

The disposable student account was signed out and its isolated server stopped. The backend was then started with the app's normal database configuration, allowing the running Vite origin on port 5175. No environment files were edited for this test setup.
