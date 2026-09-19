# Graphic Signal System

This document explains the reusable motion model for the portfolio's minimal technical graphics. It is written for someone encountering the system for the first time. Update it whenever the signal, receiver, or family rules change.

## What this system makes

The system creates a quiet technical path with a small moving light. The path explains structure; the light shows activity. A receiver node briefly glows when the moving light reaches it.

The desired visual is deliberately subtle:

- the structural path is a muted one-pixel line;
- the signal carrier is a one-pixel-thick transparent footprint with a deliberate travel length;
- the carrier is painted behind the structural line;
- the halo and bloom remain visible around the line;
- the glow, not a colored line, communicates movement.

This creates a signal that feels embedded in the system rather than laid on top of it.

## Vocabulary

- **Rail:** the static muted line that describes the route.
- **Signal carrier:** the moving element that owns the signal's position and timing. It may be fully transparent.
- **Halo:** the tight blurred light immediately around the signal carrier.
- **Bloom:** the wider, softer atmospheric glow outside the halo.
- **Receiver / node:** a labeled point on the path that responds when the signal arrives.
- **Progress:** a normalized number from `0` to `1` describing the signal's position along the path.
- **Hit window:** the small progress range during which a receiver is considered reached.

## Quick implementation recipe

For a new straight-line graphic:

1. Write the stages as semantic ordered content.
2. Measure or define the first and last receiver centers.
3. Draw the muted rail between those centers.
4. Move a one-pixel-thick transparent signal carrier footprint between the same centers.
5. Put the carrier behind the rail with `z-index: 0` and the rail above it with `z-index: 1`.
6. Add the halo and bloom with `box-shadow`; do not add a visible colored body to create brightness.
7. Use one progress clock for both the core and receiver activation.
8. Freeze the signal and leave a static readable state for reduced motion.

For a curved or circular graphic, use SVG path length and normalized path positions instead of manually guessed delays.

## Core concept

Each graphic has two layers:

1. A quiet structural path that explains the relationship.
2. A narrow active signal whose glow communicates movement and state.

Nodes are receivers placed on known positions along the path. A receiver lights when the active signal reaches its position. The receiver is not an independent animation; it derives its state from the same progress value as the signal.

## Current homepage implementation

The Practice relay lives in `src/pages/index.astro`. Its semantic ordered list is the source of truth. CSS draws the muted rail and the narrow glowing signal as pseudo-elements. A small page-local `requestAnimationFrame` controller sets the signal position and toggles receiver state from one shared clock.

The three normalized receiver positions are:

```text
Work       0.00
Systems    0.50
Provenance 1.00
```

The signal moves from the first node center to the last node center. It does not travel beyond the final receiver. Each node receives an active class while the signal is within the receiver threshold.

The rail and signal are CSS pseudo-elements on `.practice-relay__stages`:

```css
.practice-relay__stages::before { z-index: 1; height: 1px; }
.practice-relay__stages::after { z-index: 0; height: 1px; box-shadow: ...; }
```

The `::before` rail paints over the signal carrier. The carrier is transparent; its shadow extends beyond the rail, so the viewer sees a soft moving glow without a second colored line.

The homepage uses a positioned `.practice-relay__stage-field` containing the semantic ordered list, a separate `.practice-relay__signal` element for geometry, and a nested one-pixel span for light. This separation is important: the outer carrier can retain a useful travel footprint while the inner glow remains a point. The rail is painted above the carrier, just as the original home-lab SVG paints its orbit above the moving signal layers.

## Timing contract

Every signal graphic should define:

- a duration;
- a normalized path progress from `0` to `1`;
- receiver progress values;
- a receiver hit window;
- a reduced-motion state;
- a cleanup path when the route changes.

The signal's visual center, not its left or top edge, is the position used for synchronization.

## Family rules

The Web Development render pipeline is the first non-homepage implementation of the reusable controller. It lives in `src/pages/work/web-development/index.astro`. The semantic ordered list remains the content source of truth, while a sibling `.render-pipeline__signal` element owns the moving geometry. A `ResizeObserver` measures the four rectangular receiver centers after every responsive layout change, and one `requestAnimationFrame` clock interpolates between the first and final centers. Receiver classes are derived from that same progress value.

The pipeline uses Earthsong blue to distinguish an active browser/render state from the homepage's warm practice signal and the topology graphic's access/containment colors. Its sequence is finite: `Design → Implement → Test → Contain`. The signal parks at the final receiver for a short readable hold, then restarts. On narrow screens the measured geometry becomes vertical; no wide canvas is scaled or clipped. Circular receivers retain their perimeter as a clear stage landmark; their inner point stays transparent at rest, then expands into a restrained blue orb and bloom when reached. The signal uses a narrow tapered center with a quieter atmospheric bloom so the rail remains legible beneath it. Endpoint hit windows are tuned independently so the first receiver engages as the signal begins and the final receiver waits until the signal is centered on it. The homepage relay remains the reference for its own circular receiver treatment.

### Archive ribbon family

The Provenance custody ribbon lives in `src/pages/work/web-development/provenance/index.astro`. It uses the same measured controller but keeps square archival receivers, because `Source → Condition → Artifact` describes custody states rather than operational stages. Its green signal means an evidence trace moving through the archive. The ribbon is finite, parks briefly at `Artifact`, and becomes a vertical evidence trail on mobile. Its caption remains the text equivalent of the visual claim.

### Trust-boundary topology family

The IT Systems + Security trust map uses inline SVG because its paths, boundary enclosure, labels, and branch relationships are geometric content. The primary route communicates identity-based access entering a private boundary, with services and storage as destinations and DNS filtering plus isolated testing shown as controlled branches. The route uses a tight halo and separate bloom around a transparent carrier; the broadest field layer is intentionally omitted because it reads as a second line in this geometry. The muted route is painted afterward, hiding the carrier while allowing the halo and bloom to remain visible. Each SVG dash layer is centered using its own half-length; sharing one offset across different dash lengths made the glow appear to taper on only one side. Main-route receivers acknowledge the orange access signal in order from one normalized progress clock, using the actual cumulative lengths of the unequal route segments. The carrier is centered on each receiver rather than lighting it with its trailing edge. At the subnet-router checkpoint, the primary signal pauses while two green branch carriers travel to DNS filtering and isolated testing; each branch receiver expands its inner dot on arrival before the primary route continues. This is an audit metaphor, not a literal packet trace: the lab may evaluate these controls in parallel or at different layers. A shared clock is important here: independent negative animation delays caused the receivers to light in reverse order, so topology receivers must derive state from route progress just like pipeline receivers do.

### Local/remote boundary plate family

The Proof Sheet boundary plate lives in `src/pages/work/web-development/provenance/proof-sheet.astro`. Its orange signal stays inside the browser-local route `Image → Canvas → Worker → Proof Sheet`. A green remote tether travels conditionally from `Model Weights` down into the Worker handoff; the source receiver lights as the tether begins, and the Worker acknowledges the green handoff as it arrives. It does not connect to the final Proof Sheet. Both paths use the hidden-core, centered halo/bloom treatment; local and remote receivers derive their states from one page-local clock. The distinction is important: the plate communicates data locality and dependency flow, not a generic network route.

### Pipeline

- Use a finite ordered path.
- Align the rail endpoints to the first and last receiver centers.
- Use one shared progress clock.
- Reflow to a vertical path on mobile.
- Keep the stage sequence available as semantic ordered content.

### Topology

- Use actual SVG path geometry for irregular routes.
- Express receiver positions as normalized path lengths.
- Keep passive routes quiet and activate only the path currently being traversed.
- Never expose private infrastructure details.

### Loop

- Use SVG path length rather than guessed time offsets.
- Treat a loop as circular progress, so the receiver distance wraps from `1` back to `0`.
- Use one shared circular clock when two loops meet at a shared receiver.
- Center each glow layer from its own dash length; different dash lengths cannot share one offset without looking asymmetrical.
- Keep glow layered separately from the thin core, hide the core in the final paint, and omit the broadest field layer when it reads as a second rail.
- Let both loops pass continuously through the shared receiver; Recover lights only during the crossing and does not become a lingering pause state.

### Archive and trace

- Use motion sparingly; the material or evidence remains primary.
- Use registration lines, gaps, and status marks as visual metadata.
- Never make animation the only way to understand the content.

## Accessibility and runtime

- Semantic text and ordered content remain available without the graphic.
- `prefers-reduced-motion: reduce` freezes the signal and leaves a quiet static state.
- Route initialization must be idempotent for Astro view transitions.
- Animation frames must be cancelled when a route is replaced.
- No new dependency is justified for the simple pipeline controller; arbitrary SVG geometry may use the same controller once the shared utility is extracted.

## Current known issue history

- The first homepage version used independent six-second CSS animations and manually selected delays. The path and receivers could drift because the path was linear while the node pulse was eased.
- The receiver delays were changed from negative offsets to forward offsets to correct the initial order, but that still did not create true geometric synchronization.
- The homepage now uses the shared-progress model. A page-local `requestAnimationFrame` clock measures one normalized progress value, reads the first and last receiver centers after layout, interpolates the signal's visual center between them, and toggles receiver state from the same progress value. A `ResizeObserver` recalculates the geometry for responsive changes. The controller cancels its animation frame and disconnects its observer during cleanup.

### Homepage relay refinement / 2026-07-31

- Removed independent CSS receiver delays and the separate node pulse timeline.
- Aligned the baseline and active signal to the actual first and last node centers instead of extending past the final node.
- Added explicit receiver progress values: `0`, `.5`, and `1`.
- Switched receiver lighting to a shared `.is-active` state derived from signal progress.
- Kept the path core thin and moved the visual emphasis into the orange glow.
- Made the same geometry calculation drive desktop and mobile axes.
- Preserved the static reduced-motion state at the first receiver.

### Signal paint-order refinement / 2026-07-31

- Reduced the moving core to the same one-pixel thickness as the structural rail.
- Moved the core behind the rail with `z-index: 0` and raised the rail to `z-index: 1`.
- Kept the halo and bloom visible around the rail, making the glow the primary visible motion cue.

### Homepage relay glow refinement / 2026-07-31

- Restored signal visibility with a thin tapered core, warm inner bloom, and wider low-opacity outer halo.
- Kept the glow on the moving signal rather than thickening the structural rail.
- Mirrored the treatment on the mobile vertical signal.

### Signal terminology and carrier refinement / 2026-07-31

- Standardized the vocabulary to rail, signal carrier, halo, bloom, and receiver.
- Removed the visible colored body from the carrier; only its shadow layers remain visible.
- Reserved “core” for a future intentionally visible one-pixel light, not the current transparent carrier.
- Restored the carrier footprint to its diagnostic length of `1.4rem` while keeping its thickness at `1px`.
- Reduced the halo to a single-pixel `box-shadow` so the carrier and halo can be inspected independently.

### Geometry separation refinement / 2026-07-31

- Restored the carrier's `1.4rem` travel footprint without making that footprint visible.
- Moved the glow into a separate one-pixel child element centered inside the carrier.
- Kept the rail above the carrier so only the glow extending around the rail is visible.
- Reused the original home-lab chart's successful paint-order principle: the structural path covers the moving core while the broader glow layers remain visible.

### Carrier isolation test / 2026-07-31

- Reduced the outer signal carrier to `1px × 1px` on desktop and mobile.
- Left the nested glow point unchanged so the carrier footprint can be evaluated separately from the halo.

### Halo isolation test / 2026-07-31

- Disabled all nested halo shadows while retaining the 1px carrier and glow-point geometry.
- This test isolates whether any remaining visible streak comes from the halo layers rather than the carrier.

### Halo variable test 01 / 2026-07-31

- Enabled only the tight inner halo: `0 0 2px 1px var(--earthsong-orange)`.
- The medium halo, broad halo, and bloom remain disabled for comparison.

### Halo variable test 02 / 2026-07-31

- Disabled variable 01 by removing its shadow.
- Enabled only the medium halo: `0 0 9px 2px color-mix(in srgb, var(--earthsong-orange) 82%, transparent)`.
- The broad halo and bloom remain disabled for comparison.

### Homepage halo decision / 2026-07-31

- Halo variable 01 was rejected because its tight spread read as a visible red line behind the rail.
- Halo variable 02 is accepted as the current homepage treatment:
  `0 0 9px 2px color-mix(in srgb, var(--earthsong-orange) 82%, transparent)`.
- Variables 03 and 04 remain disabled until a later graphic specifically needs a broader bloom.
- For future signals, begin with variable 02; add broader layers only after confirming they read as atmosphere rather than linework.

### Homepage halo atmosphere pass / 2026-07-31

- Kept rejected variable 01 disabled.
- Added variables 03 and 04 alongside accepted variable 02 to restore the broad halo and bloom.
- Current active stack is variables 02, 03, and 04; variable 01 remains excluded.

### Carrier width pass / 2026-07-31

- Returned the transparent carrier width from `20rem` to `1.4rem`.
- Increased the visible glow point length from `1px` to `10px` while keeping its thickness at `1px`.
- Kept the carrier height at `1px` so the rail remains the only structural line.
- Left the accepted 02/03/04 halo stack unchanged.

### Carrier and halo expansion / 2026-07-31

- Doubled the desktop carrier width to `4.4rem`.
- Increased the active halo stack from `12px / 3px`, `28px / 7px`, and `48px / 12px` for blur/spread.
- Kept variable 01 disabled.

### Tapered glow refinement / 2026-07-31

- Replaced the rectangular glow footprint with a horizontal gradient whose ends fade to transparent.
- Added a tight blurred envelope and a softer broad envelope so the glow tapers without exposing a solid carrier line.
- Rotated the same tapered treatment vertically for mobile.

### Tapered glow intensity pass / 2026-07-31

- Increased the tapered center intensity so the glow remains visible after its ends fade.
- Tightened the inner blur to `1.5px` and expanded the outer bloom to `8px`.
- Preserved transparent ends and the invisible carrier.

### Tapered glow restoration / 2026-07-31

- Restored the lost glow energy with `drop-shadow()` filters on the tapered alpha shapes.
- Used `drop-shadow()` instead of `box-shadow()` because it follows the gradient's transparent ends and does not create a rectangular line-shaped shadow.

### Glow length and brightness pass / 2026-07-31

- Increased the tapered glow envelope from `1.4rem` to `2.4rem`.
- Increased inner halo drop-shadow strength and outer bloom opacity.
- Mirrored the longer glow envelope in the mobile vertical treatment.

### Sequence reset pause / 2026-07-31

- Added a `900ms` hold after progress reaches `1` before the signal returns to `0`.
- The signal remains parked at the endpoint during the hold, making the completed sequence readable before restart.
- The endpoint receiver now turns off when the hold begins; the signal remains parked while the receiver follows its normal light duration.

### Receiver window alignment / 2026-07-31

- Matched Work and Provenance to Systems' full receiver-light duration.
- Edge receivers now use complete one-sided windows instead of losing half their duration at progress `0` and `1`.
- The reset pause still suppresses all receiver states before the signal returns to Work.

### Provenance receiver phase / 2026-08-01

- Delayed Provenance activation by a small `0.01` normalized-progress offset.
- Kept the overall sequence duration, pause, and receiver-light treatment unchanged.
