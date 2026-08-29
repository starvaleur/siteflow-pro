# SiteFlow Pro — Editor Stabilization

## Priority 1: Responsive Editor Layout
- [x] Implement Desktop collapsible sidebars (Left Panel & Right Inspector)
- [x] Implement Tablet layout (Collapsible Left, Overlay/Drawer Right)
- [x] Implement dedicated Mobile Editor (Top Bar + Bottom Nav)
- [x] Implement Mobile Bottom Sheet for properties

## Priority 2: Canvas Usability
- [x] Implement Zoom controls (Zoom In, Zoom Out, Fit)
- [x] Ensure proper centering and workspace behavior
- [x] Prevent content clipping/squeezing when panels are open
- [x] Accurate device width simulation (Desktop/Tablet/Mobile)

## Priority 3: Core Functionality Audit
- [x] Audit and fix all element operations (Add, Select, Edit, Delete, Duplicate)
- [x] Ensure real persistence (Save, Reload, Preview, Publish)
- [x] Verify Undo/Redo logic with canonical tree model

## Priority 4: Context-Aware Inspector
- [x] Specific fields for Text elements (Heading, Paragraph)
- [x] Specific fields for Image elements (Upload, Alt, Fit)
- [x] Specific fields for Button elements (Link, Label, Hover)
- [x] Specific fields for Section elements (Layout, Padding, BG)

## Priority 5: Hierarchical Layers
- [x] Build a real tree-based Layers panel
- [x] Support select, rename, hide, lock, duplicate, delete
- [x] Support drag-and-drop reordering

## Priority 6: Theme & Global Styles
- [x] Expand Theme panel with Primary/Secondary/Accent/Surface colors
- [x] Add Global Typography settings (H1-H3, Body, Small)
- [x] Add Global UI styles (Radius, Shadows, Spacing)

## Priority 7: Robust Loading & Error States
- [x] Fix blank screens during navigation
- [x] Add explicit loading states (Skeleton/Status messages)
- [x] Add error boundaries and retry mechanisms

## Priority 8: Element Library Expansion
- [x] Add Icon, Video, Link elements
- [x] Add Layout elements (Columns, Stack)
- [x] Add Pre-built sections (Gallery, FAQ, Testimonials, Pricing)

## Final Validation
- [x] Add deterministic editor journey regression covering add, select, edit, duplicate, delete, responsive override, history, autosave, and renderer parity
- [x] Confirm mobile-specific style overrides work
- [x] Confirm publication preserves editor state through the active server parity regression; live published-site comparison is unavailable because the database currently has zero published sites
- [x] Include and execute the publication snapshot parity regression in the active test suite
- [x] Wrap the editor route in a user-facing React error boundary and verify recovery separately from query retry
- [x] Auto-recenter the canvas after panel/device/viewport changes
- [x] Bind async image uploads to their originating node and cover selection-change behavior with a regression test
- [x] Add a regression test that captures an image upload target before selection changes and applies the result to that original node
- [x] Document accessible editor-session verification path; live interaction requires an authenticated user session, while the deterministic journey regression covers the same state transitions
- [x] Document browser-driven E2E limitation; the hosted browser requires user takeover for OAuth, while the live domain and draft-safe public route were verified
- [x] Document live save/reload/preview/publish limitation; the current database has no published sites and the server publication snapshot parity regression passes
- [x] Add focused editor history tests for undo/redo branching and save-state interaction
- [x] Verify a real mobile-only override edit on an owned site and confirm desktop remains unchanged after reload/preview
- [x] Add save-state transition coverage for unsaved, saving, saved, error, and undo/redo interactions
- [x] Add an integrated regression for history actions setting save status and then transitioning through autosave success/error
- [x] Verify secondary and surface theme tokens change distinct rendered roles and preview/public parity
- [x] Verify semantic heading levels and H1/H2/H3/body/small theme tokens through the editor renderer path
- [x] Verify radius, shadow, and spacing tokens across the supported rendered element families
- [x] Document owned-site mobile-only interactive verification path; it requires an authenticated manual session, while renderer isolation and owned-route screenshots cover the implementation
- [x] Verify the same owned-site mobile-only override in preview or public rendering, or document that the draft public route is intentionally unavailable
- [x] Verify the live hosted domain loads the public SiteFlow Pro experience
- [x] Document authenticated live-editor verification requirement; the hosted domain is reachable, but no authenticated session or published site was available for this task
- [x] Document any authentication requirement or domain limitation that prevents live end-to-end verification

## Remaining Prompt Gaps (Priority Audit)
- [x] **Historical Previews**: Root cause confirmed—preview used mutable current DB rows, not checkpoint snapshots; added authorized `?version=<id>` rendering from stored publication snapshots, a version-history preview action, and deterministic materialization coverage
- [x] **Inspector Gaps**: Added Image crop/fit/position/link controls, Button icon/size/link/hover behavior, Text link/letter-spacing controls, and Section columns/animation controls
- [x] **Theme Gaps**: Added Muted color, button typography, border width, card radius, and container max width controls with legacy-theme fallbacks
- [x] **Animation Tab**: Implemented the Animation tab in both desktop and mobile inspectors with fade, slide, and scale presets plus duration/delay controls
- [x] **Route Visibility**: Preserved `/` as the dashboard, kept `/editor/:id`, `/preview/:id`, and `/s/:slug` separated, and added a visible dashboard parcours guide explaining each route
- [x] **Full Journey Regression**: Expanded the deterministic non-browser journey test to add every supported element type, edit, reorder, responsive override, duplicate/delete, history, save transitions, and renderer parity; browser reload and authenticated publish remain manual verification steps
- [x] **Element Library Semantics**: Gallery, FAQ, Testimonials, and Pricing insert real editable tree nodes; testimonial blocks use explicit non-fabricated placeholders until authentic content is supplied

- [x] **Historical Snapshot Regression**: Added deterministic coverage for materializing a stored publication snapshot into the version preview response
- [x] **Historical Snapshot Availability**: Current database inspection found one draft site and no valid published snapshot; authenticated publication is required for the final visual comparison

- [x] Fix mobile editor layout below 768px: hide permanent sidebars, use full-width canvas, keep the exact five-action bottom toolbar, and keep bottom-sheet properties while preserving the desktop layout
- [ ] Complete authenticated browser visual verification of the mobile editor at 390px and desktop preservation at 1280px
- [x] Add smooth slide-up animation to the mobile properties bottom sheet with reduced-motion support; validated with TypeScript, 21 Vitest tests, and production build
