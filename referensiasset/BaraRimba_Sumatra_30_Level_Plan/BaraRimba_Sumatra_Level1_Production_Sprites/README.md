# BaraRimba — Sumatra Level 1 extracted sprite pack

## Contents
- `sprites/`: extracted transparent PNG cutouts from the supplied sheet.
- `previews/sprite_contact_sheet.jpg`: labeled visual audit sheet (preview only).
- `asset-manifest.json`: coordinates, output dimensions, categories, and caveats.
- `source/original_sprite_sheet.png`: untouched original source.

## Important production caveat
This pack improves the source sheet by extracting connected alpha components into individual PNG files. It is **not guaranteed to be fully production-ready without visual QA**: some connected assets may still be grouped together, and the image source contains colored edge artifacts around some objects. Inspect each PNG on both light and dark backgrounds, clean any halos, and confirm pivots/collisions/animation order before shipping.

## Integration sequence
1. Review `previews/sprite_contact_sheet.jpg`.
2. Audit individual PNGs in `sprites/`.
3. Split any remaining multi-object clusters manually.
4. Clean halo/edge artifacts.
5. Add pivots, collision shapes, and physics metadata for rocks, seesaw, pulleys, and gate.
6. Verify puzzle logic in-engine: water jet -> small rock -> seesaw -> rolling boulder -> rope/pulley -> raised gate -> clear elephant exit.
