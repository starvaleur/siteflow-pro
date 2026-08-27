# SiteFlow Pro — Editor Stabilization

## Priority 1: Responsive Editor Layout
- [ ] Implement Desktop collapsible sidebars (Left Panel & Right Inspector)
- [ ] Implement Tablet layout (Collapsible Left, Overlay/Drawer Right)
- [ ] Implement dedicated Mobile Editor (Top Bar + Bottom Nav)
- [ ] Implement Mobile Bottom Sheet for properties

## Priority 2: Canvas Usability
- [ ] Implement Zoom controls (Zoom In, Zoom Out, Fit)
- [ ] Ensure proper centering and workspace behavior
- [ ] Prevent content clipping/squeezing when panels are open
- [ ] Accurate device width simulation (Desktop/Tablet/Mobile)

## Priority 3: Core Functionality Audit
- [ ] Audit and fix all element operations (Add, Select, Edit, Delete, Duplicate)
- [ ] Ensure real persistence (Save, Reload, Preview, Publish)
- [ ] Verify Undo/Redo logic with canonical tree model

## Priority 4: Context-Aware Inspector
- [ ] Specific fields for Text elements (Heading, Paragraph)
- [ ] Specific fields for Image elements (Upload, Alt, Fit)
- [ ] Specific fields for Button elements (Link, Label, Hover)
- [ ] Specific fields for Section elements (Layout, Padding, BG)

## Priority 5: Hierarchical Layers
- [ ] Build a real tree-based Layers panel
- [ ] Support select, rename, hide, lock, duplicate, delete
- [ ] Support drag-and-drop reordering

## Priority 6: Theme & Global Styles
- [ ] Expand Theme panel with Primary/Secondary/Accent/Surface colors
- [ ] Add Global Typography settings (H1-H3, Body, Small)
- [ ] Add Global UI styles (Radius, Shadows, Spacing)

## Priority 7: Robust Loading & Error States
- [ ] Fix blank screens during navigation
- [ ] Add explicit loading states (Skeleton/Status messages)
- [ ] Add error boundaries and retry mechanisms

## Priority 8: Element Library Expansion
- [ ] Add Icon, Video, Link elements
- [ ] Add Layout elements (Columns, Stack)
- [ ] Add Pre-built sections (Gallery, FAQ, Testimonials, Pricing)

## Final Validation
- [ ] Run full end-to-end journey test
- [ ] Confirm mobile-specific style overrides work
- [ ] Confirm published content matches editor state
