# eCTD Workspace design system

Reviewed output of the [UI/UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) v2.15.0 (commit `713eef5`), run as `"regulatory compliance validation tool enterprise" --design-system --variance 2 --motion 2 --density 8`. Skill results are recommendations; the decisions below are what this project applies. Tokens live on `:root` in `style.css`.

## Accepted

- **Style:** Minimalism & Swiss. Grid-based, dense, functional, without decorative effects.
- **Palette:** navy primary `#1E3A5F`, blue links and focus, slate neutrals. The site opens in light mode, and the header switch changes to dark. The choice is stored as `ectd-theme`. Print always uses the light values.
- **Status colors:** green for match, amber for partial, slate for no mapping. A status always carries its text label, never color alone.
- **Contrast:** at least 4.5:1 for text and 3:1 for control boundaries, in both themes.
- **Type:** 15px body, 13px tables and notes, 12px minimum.
- **Targets:** at least 24×24 CSS px (WCAG 2.2 AA); 44px on coarse pointers, except 32px tree toggles in dense table rows.
- **Motion:** color transitions of 150ms only, removed under reduced motion.

## Rejected for this project

- **Google Fonts (Outfit, Work Sans):** the app must make no external requests. The CSP and browser tests enforce this, so it keeps the system font stack.
- **GSAP and scroll reveal:** adds a runtime dependency, and hiding regulatory content behind animation serves no purpose.
- **Hero + Features + CTA:** a marketing pattern. This is a work tool, so the intro stays short and the workspace comes first.

## Constraints

Presentation changes must not alter heading data, source references, scope notices or exports.
