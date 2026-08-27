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
- [ ] Run full end-to-end journey test
- [x] Confirm mobile-specific style overrides work
- [ ] Confirm published content matches editor state
- [x] Wrap the editor route in a user-facing React error boundary and verify recovery separately from query retry
- [x] Auto-recenter the canvas after panel/device/viewport changes
- [x] Bind async image uploads to their originating node and cover selection-change behavior with a regression test
- [x] Add a regression test that captures an image upload target before selection changes and applies the result to that original node
- [ ] Run an accessible editor-session verification covering add, select, edit, delete, and duplicate flows
- [ ] Verify save, reload, preview, and publish on an owned site and compare rendered output
- [x] Add focused editor history tests for undo/redo branching and save-state interaction
- [x] Verify a real mobile-only override edit on an owned site and confirm desktop remains unchanged after reload/preview
- [x] Add save-state transition coverage for unsaved, saving, saved, error, and undo/redo interactions
- [x] Add an integrated regression for history actions setting save status and then transitioning through autosave success/error
- [x] Verify secondary and surface theme tokens change distinct rendered roles and preview/public parity
- [x] Verify semantic heading levels and H1/H2/H3/body/small theme tokens through the editor renderer path
- [x] Verify radius, shadow, and spacing tokens across the supported rendered element families
- [ ] Perform an owned-site editor verification: change a mobile-only style override, reload the editor, switch back to desktop, and confirm desktop styles remain unchanged
- [ ] Verify the same owned-site mobile-only override in preview or public rendering, or document that the draft public route is intentionally unavailable
- [x] Verify the live hosted domain loads the public SiteFlow Pro experience
- [ ] Verify an authenticated user can open the live editor, persist a change, and see the matching preview/public output
- [x] Document any authentication requirement or domain limitation that prevents live end-to-end verification
