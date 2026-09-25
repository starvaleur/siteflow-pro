# Stabilization verification notes

The desktop preview captured the authenticated dashboard successfully at 1280×720, showing the existing SiteFlow Pro workspace shell and site card without visible layout regressions. The editor preview at `/editor/1` did not reach the canvas because site ID 1 is not accessible to the preview user; development logs show the expected `siteflow.get` access error for that ID. The editor contains a dedicated loading state and a retryable query-error state, so this route should be verified again using a site ID owned by the authenticated preview user. The mobile preview at 390×844 also showed the centered editor loading state without horizontal clipping; the actual mobile canvas and bottom navigation require an accessible owned project route for end-to-end visual confirmation.

## Owned editor visual verification

The owned draft site at `/editor/270001` rendered successfully at 1280×720. The desktop canvas is centered between the left add panel and right inspector; the zoom utility is visible over the canvas and the selected Hero node opens the Design inspector with Typography and Colors groups. The same route rendered at 390×844 with the compact top bar, the full-width mobile document, the floating zoom utility, the selected-element properties bar, and the fixed bottom navigation. No narrow desktop-style sidebars or horizontal canvas squeeze were visible in the mobile capture.

## Preview and public route

The owned draft preview at `/preview/270001` renders the same navbar, hero copy, typography, spacing, and primary action visible in the editor. The public route `/s/essai-06183` correctly shows the unavailable-page state because the site remains a draft; no publish mutation was executed during this verification pass.

## Live hosted domain

The published domain `https://siteflowpro-nnvlwst7.manus.space/` is reachable and renders the SiteFlow Pro authentication landing page with the branded mark, login call to action, and footer. The domain is live, but editor access requires an authenticated Manus session.

The live hosted slug `https://siteflowpro-nnvlwst7.manus.space/s/essai-06183` returns a centered, readable unavailable-page state with a working return link because that site remains unpublished. This confirms the public route fails safely and does not expose draft content.

The live database currently reports `0` published sites, so a real editor-to-published-site parity check cannot be completed without an authenticated user creating and publishing a site. The hosted app itself is reachable, and draft slugs correctly remain unavailable.
