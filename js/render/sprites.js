// ============================================================================
// === SPRITES ================================================================
// drawStar() — utility for star geometry (Wizard body).
// drawShape() — per-fighter shape art for use in overlays and the gallery.
// drawFighter() — large switch over f.shape: cross, axe, star, shield, keg,
//   bow, mask, cannon. Also handles per-fighter indicators (shield rings,
//   bloodrage glow, dodge shimmer), aim telegraphs, swing arcs, dash trails.
// ============================================================================

function drawStar(c, cx, cy, spikes, outer, inner) {
  let rot = Math.PI / 2 * 3;
  let x = cx, y = cy;
  const step = Math.PI / spikes;
  c.beginPath();
  c.moveTo(cx, cy - outer);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outer;
    y = cy + Math.sin(rot) * outer;
    c.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * inner;
    y = cy + Math.sin(rot) * inner;
    c.lineTo(x, y);
    rot += step;
  }
  c.lineTo(cx, cy - outer);
  c.closePath();
}

// Draws a fighter's icon/sprite. Extracted so both the in-arena renderer and
// the VS intro can use it. `c` is any 2D context; the caller has already
// translated/rotated into the sprite's local space. Only reads FIGHTER_SIZE,
// f.color, f.accent, f.shape.
function drawShape(c, f, hinge = 0) {
  switch (f.shape) {
    case 'cross': {
      // Priest — vertical scepter icon: dark shaft, horizontal crossguard, glowing orb at tip.
      // Forward direction = orb tip (right side).
      c.strokeStyle = f.color;
      c.lineWidth = 4;
      c.lineCap = 'round';
      // Main shaft (forward-pointing)
      c.beginPath();
      c.moveTo(-FIGHTER_SIZE * 0.9, 0);
      c.lineTo(FIGHTER_SIZE * 0.55, 0);
      c.stroke();
      // Crossguard (perpendicular, near orb)
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(FIGHTER_SIZE * 0.3, -FIGHTER_SIZE * 0.55);
      c.lineTo(FIGHTER_SIZE * 0.3, FIGHTER_SIZE * 0.55);
      c.stroke();
      // Glow halo behind orb
      c.fillStyle = `rgba(255,232,61,0.35)`;
      c.beginPath();
      c.arc(FIGHTER_SIZE * 0.75, 0, FIGHTER_SIZE * 0.45, 0, Math.PI * 2);
      c.fill();
      // Orb (bright accent)
      c.fillStyle = f.accent;
      c.beginPath();
      c.arc(FIGHTER_SIZE * 0.75, 0, FIGHTER_SIZE * 0.3, 0, Math.PI * 2);
      c.fill();
      // Inner highlight on orb
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(FIGHTER_SIZE * 0.65, -FIGHTER_SIZE * 0.1, FIGHTER_SIZE * 0.1, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'axe': {
      // Berserker — clenched fist punching forward (+x). Shape key stays 'axe'.
      const s = FIGHTER_SIZE;
      // Thumb — flat rectangle on top of the fist, tucked near the front.
      c.fillStyle = f.color;
      c.beginPath();
      c.moveTo(-s * 0.05, -s * 0.48);
      c.lineTo( s * 0.45, -s * 0.48);
      c.lineTo( s * 0.45, -s * 0.68);
      c.lineTo(-s * 0.05, -s * 0.68);
      c.closePath();
      c.fill();
      // Main finger block — tall flat rectangle filling the sprite space.
      c.fillStyle = f.color;
      c.beginPath();
      c.moveTo(-s * 0.65, -s * 0.48);
      c.lineTo( s * 0.52, -s * 0.48);
      c.lineTo( s * 0.52,  s * 0.56);
      c.lineTo(-s * 0.65,  s * 0.56);
      c.closePath();
      c.fill();
      // Three knuckle bumps — individual accent polygons, each clearly separated.
      c.fillStyle = f.accent;
      const bx = s * 0.52;
      // top knuckle (index)
      c.beginPath();
      c.moveTo(bx,          -s * 0.40);
      c.lineTo(bx + s*0.30, -s * 0.36);
      c.lineTo(bx + s*0.30, -s * 0.14);
      c.lineTo(bx,          -s * 0.18);
      c.closePath(); c.fill();
      // middle knuckle
      c.beginPath();
      c.moveTo(bx,          -s * 0.08);
      c.lineTo(bx + s*0.30, -s * 0.04);
      c.lineTo(bx + s*0.30,  s * 0.18);
      c.lineTo(bx,           s * 0.14);
      c.closePath(); c.fill();
      // bottom knuckle (ring)
      c.beginPath();
      c.moveTo(bx,           s * 0.24);
      c.lineTo(bx + s*0.30,  s * 0.28);
      c.lineTo(bx + s*0.30,  s * 0.50);
      c.lineTo(bx,           s * 0.46);
      c.closePath(); c.fill();
      // Wrist wrap at the trailing edge — accent colour so it reads against the dark background.
      c.fillStyle = f.accent;
      c.beginPath();
      c.moveTo(-s * 0.65, -s * 0.48);
      c.lineTo(-s * 0.42, -s * 0.48);
      c.lineTo(-s * 0.42,  s * 0.56);
      c.lineTo(-s * 0.65,  s * 0.56);
      c.closePath();
      c.fill();
      break;
    }
    case 'spellbook': {
      // Wizard — a spellbook / grimoire. A bold rectangular silhouette (no
      // other roster sprite is a rectangle) reads instantly as a book, and an
      // arcane sigil glowing on the cover makes it a SPELLBOOK, not just a
      // book. Faceted straight-line geometry, crisp at 64px. Shown front-on,
      // tilted slightly, with a visible page-stack edge and a clasp.
      const s = FIGHTER_SIZE;
      // Page stack — a cream slab peeking out behind/below the cover, so the
      // book reads as a thick volume of pages, not a flat card.
      c.fillStyle = '#e8dcc0';
      c.beginPath();
      c.moveTo(-s * 0.62, -s * 0.86);
      c.lineTo(s * 0.78, -s * 0.78);
      c.lineTo(s * 0.86, s * 0.92);
      c.lineTo(-s * 0.54, s * 0.84);
      c.closePath();
      c.fill();
      // Front cover — purple, offset slightly up-left of the page stack so the
      // pages show along the bottom and right edges.
      c.fillStyle = f.color;
      c.beginPath();
      c.moveTo(-s * 0.72, -s * 0.92);
      c.lineTo(s * 0.66, -s * 0.86);
      c.lineTo(s * 0.74, s * 0.78);
      c.lineTo(-s * 0.64, s * 0.72);
      c.closePath();
      c.fill();
      // Spine — a darker band down the left edge of the cover.
      c.fillStyle = '#3a1b5c';
      c.beginPath();
      c.moveTo(-s * 0.72, -s * 0.92);
      c.lineTo(-s * 0.48, -s * 0.90);
      c.lineTo(-s * 0.40, s * 0.74);
      c.lineTo(-s * 0.64, s * 0.72);
      c.closePath();
      c.fill();
      // Cover border — a crisp accent frame just inside the cover edge.
      c.strokeStyle = f.accent;
      c.lineWidth = 1.3;
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(-s * 0.40, -s * 0.74);
      c.lineTo(s * 0.52, -s * 0.68);
      c.lineTo(s * 0.58, s * 0.60);
      c.lineTo(-s * 0.34, s * 0.56);
      c.closePath();
      c.stroke();
      // Arcane sigil on the cover — a glowing accent star/rune, pulsing. This
      // is the detail that says "spellbook". Centred on the cover face.
      const pulse = 0.6 + Math.sin(performance.now() / 360) * 0.3;
      const sigX = s * 0.08, sigY = -s * 0.05;
      c.fillStyle = f.accent;
      c.globalAlpha = pulse;
      drawStar(c, sigX, sigY, 4, s * 0.32, s * 0.11);
      c.fill();
      c.globalAlpha = 1;
      // Sigil core — a small bright dot at the star's centre.
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(sigX, sigY, s * 0.09, 0, Math.PI * 2);
      c.fill();
      // Clasp — a small accent tab on the right edge holding the book shut.
      c.fillStyle = f.accent;
      c.fillRect(s * 0.58, -s * 0.12, s * 0.20, s * 0.24);
      c.fillStyle = '#3a1b5c';
      c.fillRect(s * 0.63, -s * 0.04, s * 0.10, s * 0.08);
      break;
    }
    case 'shield': {
      // Knight — kite shield with a cross emblem.
      // Shield body (kite shape pointing forward)
      c.fillStyle = f.color;
      c.beginPath();
      c.moveTo(-FIGHTER_SIZE * 0.65, -FIGHTER_SIZE * 0.85);
      c.lineTo(FIGHTER_SIZE * 0.5, -FIGHTER_SIZE * 0.7);
      c.lineTo(FIGHTER_SIZE * 0.95, 0);
      c.lineTo(FIGHTER_SIZE * 0.5, FIGHTER_SIZE * 0.7);
      c.lineTo(-FIGHTER_SIZE * 0.65, FIGHTER_SIZE * 0.85);
      c.lineTo(-FIGHTER_SIZE * 0.55, 0);
      c.closePath();
      c.fill();
      // Shield rim (lighter highlight)
      c.strokeStyle = f.accent;
      c.lineWidth = 2;
      c.stroke();
      // Cross emblem (vertical + horizontal arms)
      c.fillStyle = f.accent;
      c.fillRect(-FIGHTER_SIZE * 0.05, -FIGHTER_SIZE * 0.55, FIGHTER_SIZE * 0.18, FIGHTER_SIZE * 1.1);
      c.fillRect(-FIGHTER_SIZE * 0.4, -FIGHTER_SIZE * 0.1, FIGHTER_SIZE * 0.85, FIGHTER_SIZE * 0.18);
      // Central rivet/boss
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(FIGHTER_SIZE * 0.05, 0, FIGHTER_SIZE * 0.1, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'keg': {
      // Sapper — a round bomb with a lit fuse. A bomb reads from just two
      // things: a dark round body + a lit fuse. The old version had two
      // crossed strap ellipses that read as an ATOM symbol — dropped. Now a
      // plain sphere with a soft highlight (3D read) and the fuse.
      const s = FIGHTER_SIZE;
      // Bomb body — dark sphere.
      c.fillStyle = f.color;
      c.beginPath();
      c.arc(-s * 0.1, 0, s * 0.8, 0, Math.PI * 2);
      c.fill();
      // Soft highlight on the upper-left — a single short arc, so the body
      // reads as a rounded 3D bomb (not a flat disc, not an atom).
      c.strokeStyle = 'rgba(255,255,255,0.22)';
      c.lineWidth = 2.4;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(-s * 0.1, 0, s * 0.55, Math.PI * 1.05, Math.PI * 1.5);
      c.stroke();
      // Fuse collar — a short dark neck where the fuse meets the body.
      c.fillStyle = '#2a2a2a';
      c.beginPath();
      c.moveTo(s * 0.32, -s * 0.62);
      c.lineTo(s * 0.62, -s * 0.62);
      c.lineTo(s * 0.54, -s * 0.34);
      c.lineTo(s * 0.40, -s * 0.34);
      c.closePath();
      c.fill();
      // Fuse string — zig-zag, extending up and forward off the collar.
      c.strokeStyle = '#cfcfcf';
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(s * 0.47, -s * 0.62);
      c.lineTo(s * 0.62, -s * 0.82);
      c.lineTo(s * 0.82, -s * 0.62);
      c.lineTo(s * 1.02, -s * 0.86);
      c.stroke();
      // Glowing ember at the fuse tip (pulsing).
      const fusePulse = 0.6 + Math.sin(performance.now() / 120) * 0.4;
      c.fillStyle = `rgba(255,140,26,${fusePulse})`;
      c.beginPath();
      c.arc(s * 1.02, -s * 0.86, 2.5 + fusePulse, 0, Math.PI * 2);
      c.fill();
      // White-hot core.
      c.fillStyle = `rgba(255,240,200,${fusePulse * 0.9})`;
      c.beginPath();
      c.arc(s * 1.02, -s * 0.86, 1.2, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'bow': {
      // Archer — drawn bow icon with nocked arrow flying forward.
      // Bow curve (vertical, on the right side of icon)
      c.strokeStyle = f.color;
      c.lineWidth = 3.5;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(0, 0, FIGHTER_SIZE * 0.85, -Math.PI * 0.45, Math.PI * 0.45);
      c.stroke();
      // Bowstring (taut, pulled back to anchor at left)
      c.strokeStyle = '#e0d0a0';
      c.lineWidth = 1.3;
      c.beginPath();
      const topY = Math.sin(-Math.PI * 0.45) * FIGHTER_SIZE * 0.85;
      const botY = Math.sin(Math.PI * 0.45) * FIGHTER_SIZE * 0.85;
      const topX = Math.cos(-Math.PI * 0.45) * FIGHTER_SIZE * 0.85;
      const botX = Math.cos(Math.PI * 0.45) * FIGHTER_SIZE * 0.85;
      c.moveTo(topX, topY);
      c.lineTo(-FIGHTER_SIZE * 0.6, 0);
      c.lineTo(botX, botY);
      c.stroke();
      // Bow grip wrap (center of bow, lighter color)
      c.strokeStyle = f.accent;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(FIGHTER_SIZE * 0.85, -FIGHTER_SIZE * 0.12);
      c.lineTo(FIGHTER_SIZE * 0.85, FIGHTER_SIZE * 0.12);
      c.stroke();
      // Arrow shaft
      c.strokeStyle = '#5a4a2a';
      c.lineWidth = 2.2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-FIGHTER_SIZE * 0.6, 0);
      c.lineTo(FIGHTER_SIZE * 1.2, 0);
      c.stroke();
      // Arrowhead
      c.fillStyle = f.accent;
      c.beginPath();
      c.moveTo(FIGHTER_SIZE * 1.35, 0);
      c.lineTo(FIGHTER_SIZE * 1.05, -4);
      c.lineTo(FIGHTER_SIZE * 1.05, 4);
      c.closePath();
      c.fill();
      // Fletching at back (small triangle)
      c.fillStyle = '#c44';
      c.beginPath();
      c.moveTo(-FIGHTER_SIZE * 0.6, 0);
      c.lineTo(-FIGHTER_SIZE * 0.85, -FIGHTER_SIZE * 0.18);
      c.lineTo(-FIGHTER_SIZE * 0.75, 0);
      c.lineTo(-FIGHTER_SIZE * 0.85, FIGHTER_SIZE * 0.18);
      c.closePath();
      c.fill();
      break;
    }
    case 'mask': {
      // Jester — a symmetric harlequin diamond mask: red/blue split, jester-cap
      // points along the top. The mask IS the whole sprite (no weapon). It's drawn
      // as two independent halves so the SNAP animation can slide them apart and
      // scissor them shut; `hinge` is the split distance in px (0 at rest, which
      // reproduces the static diamond exactly).
      const m = FIGHTER_SIZE * 0.9;   // half-height / half-width of the diamond
      // LEFT half (red): triangle, its outline (closed → outer-left edges + the
      // centre divide), the left eye slit, and the left cap point. Slid -hinge.
      c.save();
      c.translate(-hinge, 0);
      c.fillStyle = '#ff2e2e';
      c.beginPath();
      c.moveTo(0, -m); c.lineTo(-m, 0); c.lineTo(0, m); c.closePath();
      c.fill();
      c.strokeStyle = f.color; c.lineWidth = 2;
      c.stroke();
      c.fillStyle = f.color;
      c.fillRect(-FIGHTER_SIZE * 0.5, -FIGHTER_SIZE * 0.15, FIGHTER_SIZE * 0.22, 2.5);
      c.fillStyle = '#ff2e2e';
      c.beginPath();
      c.moveTo(-FIGHTER_SIZE * 0.32, -FIGHTER_SIZE * 0.62);
      c.lineTo(-FIGHTER_SIZE * 0.46, -FIGHTER_SIZE * 1.08);
      c.lineTo(-FIGHTER_SIZE * 0.12, -FIGHTER_SIZE * 0.74);
      c.closePath();
      c.fill();
      c.restore();
      // RIGHT half (blue): mirror, slid +hinge.
      c.save();
      c.translate(hinge, 0);
      c.fillStyle = '#2e9eff';
      c.beginPath();
      c.moveTo(0, -m); c.lineTo(m, 0); c.lineTo(0, m); c.closePath();
      c.fill();
      c.strokeStyle = f.color; c.lineWidth = 2;
      c.stroke();
      c.fillStyle = f.color;
      c.fillRect(FIGHTER_SIZE * 0.28, -FIGHTER_SIZE * 0.15, FIGHTER_SIZE * 0.22, 2.5);
      c.fillStyle = '#2e9eff';
      c.beginPath();
      c.moveTo(FIGHTER_SIZE * 0.12, -FIGHTER_SIZE * 0.74);
      c.lineTo(FIGHTER_SIZE * 0.46, -FIGHTER_SIZE * 1.08);
      c.lineTo(FIGHTER_SIZE * 0.32, -FIGHTER_SIZE * 0.62);
      c.closePath();
      c.fill();
      c.restore();
      // Centre cream cap point — only while ~closed, so it doesn't float in the
      // gap when the halves are slid open.
      if (hinge < 1) {
        c.fillStyle = f.color;
        c.beginPath();
        c.moveTo(-FIGHTER_SIZE * 0.13, -FIGHTER_SIZE * 0.74);
        c.lineTo(0, -FIGHTER_SIZE * 1.16);
        c.lineTo(FIGHTER_SIZE * 0.13, -FIGHTER_SIZE * 0.74);
        c.closePath();
        c.fill();
      }
      break;
    }
    case 'cannon': {
      // Cannoneer — a bold cannon, barrel as the hero element, on a small
      // wheel. Forward = barrel direction (+x). Composed so the visual mass is
      // centred on the origin and fills the frame. s is scaled up a touch so
      // it fills the frame like the other sprites (raw geometry was ~1.75).
      const s = FIGHTER_SIZE * 1.15;
      // Wheel — drawn first, behind the barrel, tucked low.
      c.fillStyle = '#3a2a1a';
      c.beginPath();
      c.arc(-s * 0.4, s * 0.42, s * 0.34, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = f.accent;
      c.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI;
        c.beginPath();
        c.moveTo(-s * 0.4 + Math.cos(a) * s * 0.28, s * 0.42 + Math.sin(a) * s * 0.28);
        c.lineTo(-s * 0.4 - Math.cos(a) * s * 0.28, s * 0.42 - Math.sin(a) * s * 0.28);
        c.stroke();
      }
      // Barrel — big rounded rectangle, the dominant shape.
      c.fillStyle = '#454545';
      c.beginPath();
      if (c.roundRect) c.roundRect(-s * 0.78, -s * 0.46, s * 1.5, s * 0.74, s * 0.16);
      else c.rect(-s * 0.78, -s * 0.46, s * 1.5, s * 0.74);
      c.fill();
      // Barrel top highlight (a lighter strip for form)
      c.fillStyle = '#5c5c5c';
      c.fillRect(-s * 0.72, -s * 0.42, s * 1.3, s * 0.14);
      // Reinforcement bands (accent)
      c.fillStyle = f.accent;
      c.fillRect(-s * 0.5, -s * 0.5, s * 0.14, s * 0.82);
      c.fillRect(s * 0.16, -s * 0.5, s * 0.14, s * 0.82);
      // Muzzle ring + dark bore at the front.
      c.fillStyle = '#1a1a1a';
      c.fillRect(s * 0.66, -s * 0.5, s * 0.1, s * 0.82);
      c.fillStyle = '#000';
      c.beginPath();
      c.ellipse(s * 0.71, -s * 0.09, s * 0.07, s * 0.27, 0, 0, Math.PI * 2);
      c.fill();
      // Cascabel — the round knob at the rear of the barrel.
      c.fillStyle = '#454545';
      c.beginPath();
      c.arc(-s * 0.84, -s * 0.09, s * 0.13, 0, Math.PI * 2);
      c.fill();
      // Touch hole + a spark of fuse on top.
      c.fillStyle = '#1a1a1a';
      c.fillRect(-s * 0.06, -s * 0.5, s * 0.08, s * 0.12);
      c.fillStyle = f.accent;
      c.beginPath();
      c.arc(-s * 0.02, -s * 0.56, s * 0.07, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'rapier': {
      // Duelist — an ornate rapier, the hero of the sprite (RIPOSTE is the
      // thrust). Laid out left-to-right: pommel, grip, swept cup guard, then
      // a long thin blade. Forward = blade tip (+x).
      const s = FIGHTER_SIZE;
      // Pommel — ball at the rear.
      c.fillStyle = f.accent;
      c.beginPath();
      c.arc(-s * 0.86, 0, s * 0.1, 0, Math.PI * 2);
      c.fill();
      // Grip.
      c.strokeStyle = '#1a1a1a';
      c.lineWidth = 3.5;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-s * 0.8, 0);
      c.lineTo(-s * 0.5, 0);
      c.stroke();
      // Swept cup guard — the rapier's signature. A near-full ring around the
      // hilt plus a couple of swept quillons.
      c.strokeStyle = f.accent;
      c.lineWidth = 2.4;
      c.beginPath();
      c.arc(-s * 0.46, 0, s * 0.26, -Math.PI * 0.78, Math.PI * 0.78);
      c.stroke();
      // Quillon bars across the hilt.
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-s * 0.46, -s * 0.3);
      c.lineTo(-s * 0.46, s * 0.3);
      c.stroke();
      // Long thin blade — a slim filled taper to a fine point.
      c.fillStyle = '#dfeaf2';
      c.beginPath();
      c.moveTo(-s * 0.3, -s * 0.055);
      c.lineTo(s * 1.0, 0);                 // fine point
      c.lineTo(-s * 0.3, s * 0.055);
      c.closePath();
      c.fill();
      // Blade highlight down the centre.
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-s * 0.26, 0);
      c.lineTo(s * 0.9, 0);
      c.stroke();
      break;
    }
    case 'scythe': {
      // Necromancer — a purple-glowing skull, centred. No weapon: the skull
      // IS the sprite, and it rhymes with the ability — RAISE SKELETON spawns
      // small skull minions, so the Necromancer reads as the "boss" skull.
      const s = FIGHTER_SIZE;
      // Cranium
      c.fillStyle = '#e8e0d0';
      c.beginPath();
      c.arc(0, -s * 0.12, s * 0.6, 0, Math.PI * 2);
      c.fill();
      // Jaw
      c.fillRect(-s * 0.28, s * 0.34, s * 0.56, s * 0.34);
      // Eye sockets
      c.fillStyle = '#000';
      c.beginPath();
      c.ellipse(-s * 0.22, -s * 0.14, s * 0.15, s * 0.18, 0, 0, Math.PI * 2);
      c.ellipse(s * 0.22, -s * 0.14, s * 0.15, s * 0.18, 0, 0, Math.PI * 2);
      c.fill();
      // Purple eye glow
      c.fillStyle = '#c77dff';
      c.beginPath();
      c.arc(-s * 0.22, -s * 0.14, s * 0.07, 0, Math.PI * 2);
      c.arc(s * 0.22, -s * 0.14, s * 0.07, 0, Math.PI * 2);
      c.fill();
      // Nose hole
      c.fillStyle = '#000';
      c.beginPath();
      c.moveTo(0, s * 0.04);
      c.lineTo(s * 0.09, s * 0.2);
      c.lineTo(-s * 0.09, s * 0.2);
      c.closePath();
      c.fill();
      // Teeth — vertical lines across the jaw
      c.strokeStyle = '#3a2a4a';
      c.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(i * s * 0.11, s * 0.34);
        c.lineTo(i * s * 0.11, s * 0.62);
        c.stroke();
      }
      break;
    }
    case 'sickles': {
      // Reaper — a three-bladed glaive rotor around a hub. Reads as a spinning
      // bladed weapon, matching the WHIRLING BLADES identity. Deliberately not
      // a skull-and-blade (that silhouette belongs to Necromancer's scythe).
      // Three identical blades, 120 deg apart, all curling the same way.
      // s sets the rotor's drawn size. Kept close to the other sprites' extent
      // so the Reaper doesn't read as larger than its actual size-16 hitbox
      // (1.6 made the rotor ~40% bigger on screen than its neighbours).
      const s = FIGHTER_SIZE * 1.2;
      const drawBlade = () => {
        // One rotor blade, hub -> out -> hooked tip -> back to hub. Built as a
        // filled shape: thick near the hub, tapering, with a hooked point.
        c.beginPath();
        c.moveTo(s * 0.12, -s * 0.12);                              // hub, leading edge
        // spine: sweep up and curl to the side into a hooked tip
        c.quadraticCurveTo(s * 0.35, -s * 0.85, -s * 0.18, -s * 0.95);
        // cutting edge: hooked tip back down to the hub
        c.quadraticCurveTo(s * 0.05, -s * 0.55, -s * 0.12, -s * 0.1);
        c.closePath();
        c.fill();
      };
      // Three blades. Steel body with a brighter cutting edge.
      for (let i = 0; i < 3; i++) {
        c.save();
        c.rotate((i * Math.PI * 2) / 3);
        c.fillStyle = '#c4c4cc';
        drawBlade();
        c.restore();
      }
      // Bright edge highlight on each blade (drawn after, slightly inset).
      for (let i = 0; i < 3; i++) {
        c.save();
        c.rotate((i * Math.PI * 2) / 3);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.2;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(s * 0.1, -s * 0.18);
        c.quadraticCurveTo(s * 0.3, -s * 0.78, -s * 0.16, -s * 0.9);
        c.stroke();
        c.restore();
      }
      // Centre hub — dark disc with the accent rim.
      c.fillStyle = '#1a0808';
      c.beginPath();
      c.arc(0, 0, s * 0.26, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = f.accent;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, s * 0.26, 0, Math.PI * 2);
      c.stroke();
      // Accent bead at the hub centre.
      c.fillStyle = f.accent;
      c.beginPath();
      c.arc(0, 0, s * 0.09, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'katana': {
      // Ronin — a straight, blade-dominant katana. The blade is drawn DEAD
      // STRAIGHT (a real katana's curve is slight; straight reads fine and
      // avoids the scimitar look). Laid out left-to-right, blade ~2/3 of the
      // total length. Cutting edge down. Forward = blade tip (+x). Long and
      // slender: it earns its presence in the team circle from REACH (the tip
      // runs past the ring) rather than bulk, so it still reads as a katana.
      const s = FIGHTER_SIZE;
      // --- Pommel (kashira) — end cap ---
      c.fillStyle = "#2a2a2a";
      c.fillRect(-s * 1.05, -s * 0.19, s * 0.1, s * 0.38);
      // --- Grip (tsuka) — dark wrapped handle ---
      c.fillStyle = "#1a1a1a";
      c.fillRect(-s * 0.97, -s * 0.16, s * 0.56, s * 0.32);
      // wrap (ito) — a few single diagonal bindings; sparse so the dark
      // handle still shows through (dense crosses made it look solid gold).
      c.strokeStyle = f.accent;
      c.lineWidth = 2.0;
      for (let i = 0; i < 3; i++) {
        const gx = -s * 0.91 + i * s * 0.17;
        c.beginPath();
        c.moveTo(gx, -s * 0.16);
        c.lineTo(gx + s * 0.11, s * 0.16);
        c.stroke();
      }
      // --- Tsuba (guard) — a tall guard, not a fat bead ---
      c.fillStyle = "#3a3a3a";
      c.fillRect(-s * 0.43, -s * 0.34, s * 0.1, s * 0.68);
      // --- Blade — straight rectangular body that tapers to a long sharp
      // point. The SPINE (back) is the top edge and runs dead straight all
      // the way to the point; the CUTTING EDGE is the bottom and angles up
      // over a long run to meet it (a long taper reads as sharp). ---
      const top = -s * 0.12, bot = s * 0.11;     // spine / cutting-edge lines
      c.fillStyle = "#e4ecf4";
      c.beginPath();
      c.moveTo(-s * 0.39, top);                  // spine, at the guard
      c.lineTo(s * 1.22, top);                   // spine runs dead straight to the point
      c.lineTo(s * 0.64, bot);                   // long taper: edge angles up to the point
      c.lineTo(-s * 0.39, bot);                  // cutting edge runs straight back
      c.closePath();
      c.fill();
      // Cutting-edge highlight — bright line just inside the lower edge,
      // along the straight section only.
      c.strokeStyle = "#ffffff";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(-s * 0.36, bot - s * 0.03);
      c.lineTo(s * 0.6, bot - s * 0.03);
      c.stroke();
      break;
    }
    case 'hat': {
      // Witch — a pointed witch hat. The fighter faces +x (right), so the hat's
      // tip droops BACKWARD (to -x / upper-left), trailing behind like hair or
      // a cloak. The cone has a clean horizontal base so the band stripe sits
      // flush on it — the lean comes only from the drooping tip, not a skewed
      // body. Faceted straight-line geometry so it stays crisp at 64px.
      const s = FIGHTER_SIZE;
      const baseY = s * 0.40;                  // cone base / band bottom (shared)
      const bandTopY = s * 0.10;               // band top (shared with cone)
      const half = s * 0.52;                   // cone half-width at the base
      // Brim — flat wide diamond at the base.
      c.fillStyle = f.color;
      c.beginPath();
      c.moveTo(-s * 1.05, s * 0.52);
      c.lineTo(-s * 0.2, s * 0.36);
      c.lineTo(s * 0.2, s * 0.36);
      c.lineTo(s * 1.05, s * 0.52);
      c.lineTo(s * 0.2, s * 0.68);
      c.lineTo(-s * 0.2, s * 0.68);
      c.closePath();
      c.fill();
      // Cone — clean horizontal base, sides rising symmetrically toward a
      // shoulder, then the tip kinks BACK to the left (trailing the +x facing).
      c.fillStyle = f.color;
      c.beginPath();
      c.moveTo(-half, baseY);                  // base left
      c.lineTo(half, baseY);                   // base right (clean horizontal base)
      c.lineTo(s * 0.10, -s * 0.50);           // right side up to the shoulder/bend
      c.lineTo(-s * 0.52, -s * 1.02);          // tip droops BACK-left
      c.lineTo(-s * 0.30, -s * 0.46);          // back in to the spine
      c.closePath();
      c.fill();
      // Hat band — a clean horizontal stripe flush on the cone base. Its top
      // and bottom are level lines spanning the same width, so it can't read
      // as crooked.
      c.fillStyle = f.accent;
      c.beginPath();
      c.moveTo(-half, baseY);
      c.lineTo(half, baseY);
      c.lineTo(s * 0.42, bandTopY);
      c.lineTo(-s * 0.42, bandTopY);
      c.closePath();
      c.fill();
      // Buckle — small bright square centered on the band.
      const buckleY = (baseY + bandTopY) / 2;
      c.fillStyle = '#fff';
      c.fillRect(-s * 0.11, buckleY - s * 0.10, s * 0.22, s * 0.20);
      c.fillStyle = f.color;
      c.fillRect(-s * 0.05, buckleY - s * 0.045, s * 0.10, s * 0.09);
      // Tiny accent glint at the drooping tip.
      c.fillStyle = f.accent;
      c.beginPath();
      c.arc(-s * 0.52, -s * 1.02, 1.6, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'hook': {
      // Hunter — a grappling hook, drawn as ONE bold claw filling the frame.
      // No coil, no rope (those competed and read as a floating donut every
      // time). It's a thick curved talon with a deep open hollow (the hook's
      // catching gap) tapering to one big sharp point. The matter is the claw;
      // the empty hollow inside the curve is what makes it read as a hook.
      const s = FIGHTER_SIZE;
      c.save();
      // Recenter in screen space — tuned by eye against the live sprite
      // (bounding-box math kept missing because the thin point skews it).
      c.translate(s * 0.3, s * 0.25);
      // The claw is authored shank-up / point-to-the-side. Rotate -90° so the
      // shank trails BACK (-x) and the barbed point leads FORWARD (+x) toward
      // the enemy — every sprite faces +x as "forward".
      c.rotate(-Math.PI / 2);
      c.lineJoin = 'round';
      c.lineCap = 'round';

      // The claw — a closed filled path that TAPERS: wide at the shank/belly
      // (where a hook is strong), narrowing to a single sharp vertex at the
      // point. Outer and inner edges both sweep up to the SAME tip coordinate
      // so the point is a real spike, not a blunt nub. miter join keeps that
      // tip corner crisp. Filled STEEL grey — a grappling hook is metal.
      c.lineJoin = 'miter';
      c.miterLimit = 8;
      c.fillStyle = '#b8bcc4';
      const tipX = s * 1.04, tipY = -s * 0.14;   // the sharp point
      c.beginPath();
      // top of the shank (outer edge)
      c.moveTo(-s * 0.36, -s * 0.92);
      // outer edge: shank down, sweep round the wide belly, up to the TIP
      c.lineTo(-s * 0.36, s * 0.04);
      c.quadraticCurveTo(-s * 0.36, s * 0.88,  s * 0.44, s * 0.84);
      c.quadraticCurveTo(s * 0.86, s * 0.80,  s * 0.90, s * 0.30);
      c.lineTo(tipX, tipY);                       // converge to the sharp point
      // inner edge: back from the TIP, hugging a deep crescent, narrowing the
      // claw as it climbs (taper) back toward the shank
      c.quadraticCurveTo(s * 0.66, s * 0.12,  s * 0.30, s * 0.30);
      c.quadraticCurveTo(s * 0.04, s * 0.42, -s * 0.02, s * 0.10);
      c.quadraticCurveTo(s * 0.0, -s * 0.10,  s * 0.0, -s * 0.10);
      // inner edge of the shank, back up to the top
      c.lineTo(-s * 0.08, -s * 0.92);
      c.closePath();
      c.fill();

      // Dark cap across the top of the shank — where the (off-screen) rope
      // would tie on. Anchors the shank so it doesn't read as floating.
      c.fillStyle = '#2a2a2a';
      c.fillRect(-s * 0.42, -s * 1.02, s * 0.42, s * 0.18);

      // Shadow along the claw's inner cutting edge — gives the steel depth.
      c.strokeStyle = 'rgba(60,64,72,0.7)';
      c.lineWidth = 1.6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-s * 0.02, s * 0.05);
      c.quadraticCurveTo(s * 0.04, s * 0.5, s * 0.46, s * 0.5);
      c.stroke();
      // A bright white glint along the sharp point — catches the light.
      c.strokeStyle = 'rgba(255,255,255,0.9)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(s * 0.62, s * 0.26);
      c.lineTo(tipX - s * 0.04, tipY + s * 0.03);
      c.stroke();
      c.restore();
      break;
    }
    case 'cowl': {
      // Warlock — a hooded figure: pointed dark cowl, a glowing void eye, and
      // short leech-tendrils curling off the hood. Forward = the eye's gaze (+x).
      // Hood — a pointed cowl shape, peak leaning forward
      c.fillStyle = f.color;
      c.beginPath();
      c.moveTo(FIGHTER_SIZE * 0.95, -FIGHTER_SIZE * 0.1);          // forward tip / brow point
      c.quadraticCurveTo(FIGHTER_SIZE * 0.2, -FIGHTER_SIZE * 1.05, -FIGHTER_SIZE * 0.55, -FIGHTER_SIZE * 0.55); // up over the crown
      c.quadraticCurveTo(-FIGHTER_SIZE * 0.95, 0, -FIGHTER_SIZE * 0.5, FIGHTER_SIZE * 0.8);  // down the back
      c.quadraticCurveTo(FIGHTER_SIZE * 0.1, FIGHTER_SIZE * 1.0, FIGHTER_SIZE * 0.85, FIGHTER_SIZE * 0.45); // along the chin
      c.closePath();
      c.fill();
      // Inner shadow of the hood opening (the dark face void)
      c.fillStyle = '#0a0010';
      c.beginPath();
      c.ellipse(FIGHTER_SIZE * 0.3, FIGHTER_SIZE * 0.05, FIGHTER_SIZE * 0.5, FIGHTER_SIZE * 0.6, -0.2, 0, Math.PI * 2);
      c.fill();
      // Glowing void eye — accent-colored, set inside the hood shadow
      const eyeGrad = c.createRadialGradient(FIGHTER_SIZE * 0.42, 0, 0.5, FIGHTER_SIZE * 0.42, 0, FIGHTER_SIZE * 0.32);
      eyeGrad.addColorStop(0, '#fff');
      eyeGrad.addColorStop(0.4, f.accent);
      eyeGrad.addColorStop(1, 'rgba(192,80,255,0)');
      c.fillStyle = eyeGrad;
      c.beginPath();
      c.arc(FIGHTER_SIZE * 0.42, 0, FIGHTER_SIZE * 0.32, 0, Math.PI * 2);
      c.fill();
      // Leech-tendrils — short curved wisps curling off the back of the hood
      const tw = performance.now() / 420;
      c.strokeStyle = f.accent;
      c.lineWidth = 1.8;
      c.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = Math.PI * 0.9 + i * 0.42 + Math.sin(tw + i) * 0.12;
        const bx = Math.cos(a) * FIGHTER_SIZE * 0.7, by = Math.sin(a) * FIGHTER_SIZE * 0.7;
        c.beginPath();
        c.arc(bx, by, FIGHTER_SIZE * 0.3, a - 0.4, a + 1.0);
        c.stroke();
      }
      break;
    }
    case 'dice': {
      // Gambler — a single die tilted forward. The face shown reflects the
      // WILDCARD roll: while the die tumbles (aimTimer) the pip count flickers;
      // once it settles it shows the rolled face; at rest it shows a 5.
      const s = FIGHTER_SIZE * 0.82;
      const TL = { x: -s,        y: -s * 0.7 };
      const TR = { x:  s * 0.6,  y: -s       };
      const BR = { x:  s,        y:  s * 0.7 };
      const BL = { x: -s * 0.6,  y:  s       };
      // Cube body
      c.fillStyle = '#f5f0e0';
      c.beginPath();
      c.moveTo(TL.x, TL.y);
      c.lineTo(TR.x, TR.y);
      c.lineTo(BR.x, BR.y);
      c.lineTo(BL.x, BL.y);
      c.closePath();
      c.fill();
      // Gold leading edge
      c.strokeStyle = f.accent;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(TR.x, TR.y);
      c.lineTo(BR.x, BR.y);
      c.stroke();
      // Face axes
      const cxF = (TL.x + TR.x + BR.x + BL.x) / 4;
      const cyF = (TL.y + TR.y + BR.y + BL.y) / 4;
      const rax = (TR.x + BR.x) / 2 - cxF, ray = (TR.y + BR.y) / 2 - cyF;
      const dax = (BL.x + BR.x) / 2 - cxF, day = (BL.y + BR.y) / 2 - cyF;
      const pip = (u, v) => {
        c.beginPath();
        c.arc(cxF + u * 0.6 * rax + v * 0.6 * dax,
              cyF + u * 0.6 * ray + v * 0.6 * day,
              s * 0.13, 0, Math.PI * 2);
        c.fill();
      };
      // Pip layouts for faces 1-6, in face-coords (u,v) each in [-1,1].
      const FACES = {
        1: [[0, 0]],
        2: [[-1, -1], [1, 1]],
        3: [[-1, -1], [0, 0], [1, 1]],
        4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
        5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
        6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
      };
      // Which face to show: flicker while rolling, else the settled roll, else 5.
      // Resting face before the first roll — show 1 (the lowest). A default of
      // 5 read as a flattering "current result" when nothing had been rolled.
      let face = 1;
      if (f.ability === 'wildcard') {
        if (f.aimTimer > 0 && f.aimAbility === 'wildcard') {
          // Tumbling — flicker through faces, fast then slowing as it settles.
          const period = f.aimTimer > 0.3 ? 60 : 150; // ms per face
          face = 1 + (Math.floor(performance.now() / period) % 6);
        } else if (f.gamblerRoll > 0) {
          face = f.gamblerRoll;
        }
      }
      c.fillStyle = '#1a1a1a';
      for (const [u, v] of FACES[face]) pip(u, v);
      break;
    }
  }
}

// meleeWindupHold() — shared anticipation for dashing melee fighters. The sim
// applies dash velocity instantly, so to read a wind-up we HOLD the whole fighter
// near its launch point for `windupDur` (offsetting back toward dashStart by
// (1-ease) cancels the sim's forward advance), then release as a cubic ease climbs
// — whipping it forward to catch up. Enemy-proximity capped so contact never pops.
// Applies the translate to the current ctx; returns {active, ease}. Visual only.
function meleeWindupHold(f, enemy, dashDur, windupDur) {
  if (f.meleeImpact > 0 || f.dashTimer <= dashDur - windupDur) return { active: false, ease: 1 };
  const wt = (dashDur - f.dashTimer) / windupDur;   // 0 → 1 across the wind-up
  let ease = wt * wt * wt;                            // dwell early, whip late
  if (enemy && !enemy.dead) {
    const d = Math.hypot(enemy.x - f.x, enemy.y - f.y);
    const near = 1 - Math.max(0, Math.min(1, (d - FIGHTER_SIZE * 2) / 70));
    ease = Math.max(ease, near);                      // caught up by the moment of contact
  }
  ctx.translate((f.dashStartX - f.x) * (1 - ease), (f.dashStartY - f.y) * (1 - ease));
  return { active: true, ease };
}

// drawChargeRing() — the shared charge-telegraph grammar for windup fighters. A
// ring that FILLS like a clock (the timing read — you can see when it'll fire),
// TIGHTENS inward + brightens (energy gathering), and FLASHES full just before
// release. `rgb` is the fighter's colour voice; `prog` is 0→1. ctx must be
// translated to the fighter's centre. Line-drawn — no particles.
function drawChargeRing(rgb, prog) {
  const r = FIGHTER_SIZE + 12 - prog * 5;            // tightens inward as it charges
  const a = 0.3 + prog * 0.6;                         // brightens toward release
  // faint backing track — the full ring it's filling toward
  ctx.strokeStyle = `rgba(${rgb},${(a * 0.25).toFixed(3)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  // filling clock arc — sweeps from the top to full as the windup completes
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(${rgb},${a.toFixed(3)})`;
  ctx.lineWidth = 2 + prog * 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
  ctx.stroke();
  // pre-release flash in the last sliver
  if (prog > 0.88) {
    const fa = (prog - 0.88) / 0.12;
    ctx.strokeStyle = `rgba(255,255,255,${(fa * 0.85).toFixed(3)})`;
    ctx.lineWidth = 2 + fa * 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  }
}

// armedRing() — defensive-passive READY indicator: a crisp pulsing rim + a faint
// outer halo ring in the passive's colour, present while the passive is armed and
// gone when it's spent. Line-drawn (no alpha-fill), ctx translated to centre.
function armedRing(rgb) {
  const pulse = 0.6 + Math.sin(performance.now() / 450) * 0.25;
  ctx.strokeStyle = `rgba(${rgb},${(0.5 + pulse * 0.4).toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, FIGHTER_SIZE + 6, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = `rgba(${rgb},${(0.22 * pulse).toFixed(3)})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, FIGHTER_SIZE + 10, 0, Math.PI * 2); ctx.stroke();
}

// drawFighter() — fresh animation system, built fighter by fighter.
// Shared grammar (ANIMATION.md #9): the fighter IS the weapon, so melee is sold
// by deforming the BODY (squash/stretch/lunge) plus a victim recoil, not by
// floating weapon-effects. Each fighter adds its own body-deform branch and a
// bespoke impact effect (its unique voice). drawShape (sprite identity) is never
// touched. All state read here is visual-only — the sim/balance never reads it.
function drawFighter(f) {
  if (f.dead) return;

  const enemy = f.team === 'red' ? game.blue : game.red;

  // Jester blink streak (world space, behind the sprite) — a fading two-tone wisp
  // connecting depart→arrive so the teleport is trackable. Red glow at the depart
  // point, blue at the arrival; cream core line between.
  if (f.ability === 'blink' && f.blinkFx > 0) {
    const a = f.blinkFx / 0.3;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(232,216,184,${(a * 0.7).toFixed(3)})`;
    ctx.lineWidth = 2 + a * 2;
    ctx.beginPath();
    ctx.moveTo(f.blinkFromX, f.blinkFromY);
    ctx.lineTo(f.x, f.y);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,46,46,${(a * 0.5).toFixed(3)})`;   // depart
    ctx.beginPath(); ctx.arc(f.blinkFromX, f.blinkFromY, 3 + a * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(46,158,255,${(a * 0.5).toFixed(3)})`;  // arrive
    ctx.beginPath(); ctx.arc(f.x, f.y, 3 + a * 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Ronin iai cut (world space) — a long gold slash along the teleport-step path;
  // it doubles as the teleport visual (for the Ronin, the dash trail IS the cut).
  // Heaviest hit in the game (35), so the boldest streak of the set: wide gold
  // body + white-hot core + a flash where the cut lands.
  if (f.ability === 'iai' && f.iaiStrike > 0 && f.iaiTrail) {
    const a = f.iaiStrike / 0.15;
    const t = f.iaiTrail;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(232,192,32,${(a * 0.5).toFixed(3)})`;
    ctx.lineWidth = 7 * a + 1;
    ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.lineWidth = 2 * a + 0.5;
    ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke();
    ctx.fillStyle = `rgba(255,240,180,${(a * 0.85).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(t.x2, t.y2, 4 * a + 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // SLOWED — drag-trail (debuff): faint ghost copies of the sprite lag behind as it
  // moves, reading as "it can't keep up." World space, behind the body; only while moving.
  if (f.slowTimer > 0 && !f.dead) {
    const sp = Math.hypot(f.vx, f.vy);
    if (sp > 25) {
      const dragFacing = (enemy && !enemy.dead) ? Math.atan2(enemy.y - f.y, enemy.x - f.x) : (f.lastFacing || 0);
      const nx = f.vx / sp, ny = f.vy / sp;
      for (let i = 1; i <= 2; i++) {
        ctx.save();
        ctx.translate(f.x - nx * 8 * i, f.y - ny * 8 * i);
        ctx.globalAlpha = 0.16 / i;
        if (Math.cos(dragFacing) < 0) { ctx.scale(-1, 1); ctx.rotate(Math.PI - dragFacing); }
        else { ctx.rotate(dragFacing); }
        drawShape(ctx, f);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  ctx.save();
  ctx.translate(f.x, f.y);

  // Anticipation hold — per-fighter dash/wind-up timings (heavier fighters dwell
  // longer relative to their dash). Applies the hold translate to the whole body.
  let windup = { active: false, ease: 1 };
  if (f.ability === 'tackle')        windup = meleeWindupHold(f, enemy, 0.42, 0.16);
  else if (f.ability === 'sword')    windup = meleeWindupHold(f, enemy, 0.26, 0.12);
  else if (f.ability === 'riposte')  windup = meleeWindupHold(f, enemy, 0.3, 0.10);
  else if (f.ability === 'sweep')    windup = meleeWindupHold(f, enemy, 0.25, 0.10);

  // Team-colour border ring — reads position and team allegiance.
  ctx.strokeStyle = f.team === 'red' ? '#ff2e2e' : '#2e9eff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, FIGHTER_SIZE + 3, 0, Math.PI * 2);
  ctx.stroke();

  // Charge telegraph (windup fighters) — the shared filling charge ring plus each
  // fighter's accent, drawn behind the body. Telegraphs "a big attack is coming."
  if (f.aimTimer > 0 && f.aimAbility === 'cannon') {
    const prog = 1 - f.aimTimer / f.windupTime;
    // Cannoneer voice: an aim-line to the target — its shot is a dodgeable straight.
    if (enemy && !enemy.dead) {
      const ang = Math.atan2(enemy.y - f.y, enemy.x - f.x);
      ctx.save();
      ctx.rotate(ang);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = `rgba(255,140,26,${(0.2 + prog * 0.5).toFixed(3)})`;
      ctx.lineWidth = 1 + prog;
      ctx.beginPath(); ctx.moveTo(FIGHTER_SIZE + 6, 0); ctx.lineTo(190, 0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    drawChargeRing('255,140,26', prog);
  } else if (f.aimTimer > 0 && f.aimAbility === 'lightning') {
    const prog = 1 - f.aimTimer / f.windupTime;
    drawChargeRing('255,232,61', prog);
    // Priest voice: a few orbiting divine gleams on the windup (the ground reticle
    // shows where JUDGMENT will strike, so no aim-line on the body).
    const gr = FIGHTER_SIZE + 12 - prog * 5;
    for (let i = 0; i < 3; i++) {
      const ga = (i / 3) * Math.PI * 2 + prog * 6;   // orbit (deterministic)
      ctx.fillStyle = `rgba(255,255,220,${(0.4 + prog * 0.5).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(Math.cos(ga) * gr, Math.sin(ga) * gr, 1.5 + prog, 0, Math.PI * 2); ctx.fill();
    }
  } else if (f.iaiWindup > 0) {
    // Ronin voice: the gold ring on top of the coil + tremor it already has.
    drawChargeRing('232,192,32', 1 - f.iaiWindup / f.windupTime);
  }

  // Defensive-state indicators — armed passive (soft pulsing ring), active window
  // (bright tight ring), or a negated hit (expanding ring). Colour = which passive.
  if (f.ability === 'cast' && !f.dead) {
    // Wizard MANA SHIELD — a 4-segment gauge (the shield has 4 levels: each live
    // orb = 20% reduction, up to 80%). Lit segments = current orbs, faint = spent
    // capacity, so you can read the shield strength and watch it deplete per hit.
    const orbs = Math.min(4, game.projectiles.filter(p => p.kind === 'orb' && p.team === f.team).length);
    if (orbs > 0) {
      const pulse = 0.6 + Math.sin(performance.now() / 450) * 0.25;
      const r = FIGHTER_SIZE + 7, seg = Math.PI * 2 / 4, gap = 0.28;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const lit = i < orbs;
        const a0 = -Math.PI / 2 + i * seg + gap / 2;
        const a1 = -Math.PI / 2 + (i + 1) * seg - gap / 2;
        ctx.strokeStyle = lit ? `rgba(199,125,255,${(0.55 + pulse * 0.4).toFixed(3)})`
                              : 'rgba(199,125,255,0.12)';
        ctx.lineWidth = lit ? 2.5 : 1.5;
        ctx.beginPath(); ctx.arc(0, 0, r, a0, a1); ctx.stroke();
      }
    }
  }
  if (f.ability === 'blink' && f.dodgeReady && !f.dead) {
    armedRing('232,216,184');                          // Jester UNCANNY DODGE armed
  }
  if (f.ability === 'riposte' && f.parryTimer > 0) {   // Duelist PARRY window (active)
    const pa = f.parryTimer / 0.25;
    ctx.strokeStyle = `rgba(192,192,232,${(pa * 0.95).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, FIGHTER_SIZE + 1, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${(pa * 0.5).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, FIGHTER_SIZE - 2, 0, Math.PI * 2); ctx.stroke();
  }
  if (f.ability === 'blink' && f.dodgeInvuln > 0) {    // Jester invuln window (active)
    const ia = f.dodgeInvuln / 0.3;
    ctx.strokeStyle = `rgba(255,255,255,${(ia * 0.9).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, FIGHTER_SIZE + 4, 0, Math.PI * 2); ctx.stroke();
  }
  if (f.ability === 'tackle' && f.hp < f.maxHp * 0.5 && !f.dead) { // Berserker BLOODRAGE
    const pulse = 0.6 + Math.sin(performance.now() / 110) * 0.3;    // faster, agitated pulse
    ctx.strokeStyle = `rgba(255,50,50,${(0.3 + pulse * 0.45).toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, FIGHTER_SIZE + 6, 0, Math.PI * 2); ctx.stroke();
  }
  if (f.negateFlash > 0) {                              // a hit was nullified
    const np = 1 - f.negateFlash / 0.25;                // 0 → 1
    ctx.strokeStyle = `rgba(255,255,255,${((1 - np) * 0.9).toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, FIGHTER_SIZE + 4 + np * 14, 0, Math.PI * 2); ctx.stroke();
  }
  // FOCUS (Ronin) — steady gold aura while on a clean-hit streak. Hidden during
  // the windup/strike so it never stacks with the (filling) gold charge ring.
  if (f.ability === 'iai' && f.focused && f.iaiWindup <= 0 && f.iaiStrike <= 0 && !f.dead) {
    armedRing('232,192,32');
  }
  // VOLLEY (Archer) — green fan of arrowhead ticks aimed at the enemy: the next
  // shot fans 4 arrows, telegraphed.
  if (f.ability === 'arrow' && (f.shotCount % 4 === 3) && !f.dead && enemy && !enemy.dead) {
    const aim = Math.atan2(enemy.y - f.y, enemy.x - f.x);
    ctx.save();
    ctx.rotate(aim);
    ctx.strokeStyle = 'rgba(61,255,138,0.75)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const off = (i - 1) * 0.22;
      ctx.save();
      ctx.translate((FIGHTER_SIZE + 6) * Math.cos(off), (FIGHTER_SIZE + 6) * Math.sin(off));
      ctx.rotate(off);
      ctx.beginPath(); ctx.moveTo(-3, -3); ctx.lineTo(2, 0); ctx.lineTo(-3, 3); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  // FOG — magenta fog-licks encroaching from outside while caught in the closing
  // ring. Sparse radial licks (NOT a ring) so it never collides with a fighter's own
  // state ring (bloodrage/FOCUS/mana-shield/…), which FOG can co-occur with.
  if (game.elapsed > 20 && !f.dead) {
    const dc = Math.hypot(f.x - game.w / 2, f.y - game.h / 2);
    if (dc > (game.ringRadius || 999)) {
      const pulse = 0.5 + Math.sin(performance.now() / 90) * 0.5;   // fast alarm
      ctx.strokeStyle = `rgba(210,90,255,${(0.45 + pulse * 0.45).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const r1 = FIGHTER_SIZE + 12;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const fl = 4 + Math.abs(Math.sin(performance.now() / 80 + i * 1.6)) * 5;  // flicker inward
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.lineTo(Math.cos(ang) * (r1 - fl), Math.sin(ang) * (r1 - fl));
        ctx.stroke();
      }
    }
  }

  // Orientation: face the enemy. Mirror rather than rotate past vertical so the
  // sprite never goes upside-down (forward is local +x).
  const facing = (enemy && !enemy.dead)
    ? Math.atan2(enemy.y - f.y, enemy.x - f.x)
    : (f.lastFacing || 0);
  f.lastFacing = facing;

  // ----- Victim recoil (shared: any fighter that just took a melee hit) -----
  // Knocks the body back along the hit axis and crumples it. World-aligned, so
  // applied before the facing rotation.
  let recoilX = 0, recoilY = 0, recoilSquash = 0;
  if (f.recoilTimer > 0) {
    const k = f.recoilTimer / 0.16;
    const mag = (f.recoilMag || 13) * k;
    recoilX = Math.cos(f.recoilDir) * mag;
    recoilY = Math.sin(f.recoilDir) * mag;
    recoilSquash = 0.22 * (mag / 13) * k;          // crumple scales with the knockback
  }

  // ----- Ranged fire reaction (shared) — a sharp impulse along the firing axis at
  // release: RECOIL (back) for weapons discharged from an implement, THRUST
  // (forward) for casts/throws. Snaps then settles; folded into the body offset. -----
  let fireX = 0, fireY = 0;
  if (f.fireKick > 0) {
    const k = f.fireKick / f.fireKickMax;            // 1 → 0
    // Discharged-from-an-implement weapons recoil BACK; casts/throws thrust FORWARD.
    // (Sapper "mine" steps back from the trap it just set.)
    const recoil = (f.ability === 'cannon' || f.ability === 'arrow' || f.ability === 'mine');
    const mag = ({ cannon: 12, arrow: 5, mine: 5 }[f.ability] || 7) * k;
    const along = recoil ? -mag : mag;               // − = back (recoil), + = forward (thrust)
    fireX = Math.cos(f.fireDir) * along;
    fireY = Math.sin(f.fireDir) * along;
  }

  // ----- Per-fighter body deform (stretch/squash along FORWARD = local +x) -----
  // bodyRot adds an extra spin on top of facing (used by rotor-type fighters).
  let bodyX = 1, bodyY = 1, bodyRot = 0;
  const impactK = f.meleeImpact > 0 ? f.meleeImpact / f.meleeImpactMax : 0;  // 1 → 0
  if (f.ability === 'tackle') {
    // Berserker — fast, whippy PUNCH.
    if (f.meleeImpact > 0) {
      bodyX = 1 - 0.40 * impactK;                   // flatten hard on contact, spring back
      bodyY = 1 + 0.40 * impactK;
    } else if (windup.active) {
      const coil = 1 - windup.ease;                 // anticipation: squat while held
      bodyX = 1 - 0.24 * coil;
      bodyY = 1 + 0.24 * coil;
    } else if (f.dashTimer > 0) {
      bodyX = 1.35;                                 // in-flight: stretch along the charge
      bodyY = 0.74;
    }
  } else if (f.ability === 'sword') {
    // Knight — heavy, deliberate shield BASH. Less whip than the Berserker: it
    // braces, rams as a firm wall, and dead-stops hard on contact.
    if (f.meleeImpact > 0) {
      bodyX = 1 - 0.30 * impactK;                   // dead stop: the shield slams flat
      bodyY = 1 + 0.30 * impactK;
    } else if (windup.active) {
      const coil = 1 - windup.ease;                 // brace back
      bodyX = 1 - 0.18 * coil;
      bodyY = 1 + 0.14 * coil;
    } else if (f.dashTimer > 0) {
      bodyX = 1.16;                                 // ram: firm forward set, not a whip
      bodyY = 0.90;
    }
  } else if (f.ability === 'riposte') {
    // Duelist — a precise DART: the whole rapier loads back, then shoots forward
    // and elongates into a needle; it stays long through contact, then retracts.
    if (f.meleeImpact > 0) {
      bodyX = 1 + 0.30 * impactK;                   // connects fully extended, snaps back
      bodyY = 1 - 0.10 * impactK;
    } else if (windup.active) {
      const coil = 1 - windup.ease;                 // retract: load the needle back
      bodyX = 1 - 0.22 * coil;
      bodyY = 1 + 0.08 * coil;
    } else if (f.dashTimer > 0) {
      bodyX = 1.5;                                   // the dart: elongate into a needle
      bodyY = 0.85;
    }
  } else if (f.ability === 'sweep') {
    // Reaper — the rotor SPINS UP: wound back, then a fast accelerating multi-
    // rotation that bulges outward (centrifugal) and settles. The sprite itself
    // is the buzzsaw — uniform scale + extra spin, not a directional lunge.
    if (f.sweepTimer > 0) {
      const sp = 1 - f.sweepTimer / 0.3;             // 0 → 1 over the spin
      const smooth = sp * sp * (3 - 2 * sp);         // smoothstep: accelerate then settle
      const SPIN = Math.PI * 2 * 2.5;                // 2.5 turns
      const windBack = 0.5;                          // wound back before release
      bodyRot = -windBack + smooth * (SPIN + windBack);
      const s = 1 + 0.18 * Math.sin(sp * Math.PI);   // centrifugal bulge, returns to 1
      bodyX = s; bodyY = s;
    }
  } else if (f.ability === 'iai') {
    // Ronin — THE IAI: a long tense draw-back, then an instant teleport-flash cut.
    // (The windup is a gameplay mechanic, not the 1-3 frame anticipation of #8 — so
    // it gets its own slow coil + a building tremor that telegraphs the release.)
    if (f.iaiStrike > 0) {
      const k = f.iaiStrike / 0.15;                  // 1 → 0
      bodyX = 1 + 0.40 * k;                          // the cut: blade thrusts forward, returns
      bodyY = 1 - 0.10 * k;
    } else if (f.iaiWindup > 0) {
      const wp = 1 - f.iaiWindup / 0.7;              // 0 → 1 as the windup completes
      bodyX = 1 - 0.18 * wp;                         // draw the blade back (coil), deepening
      bodyY = 1 + 0.06 * wp;
      if (wp > 0.5) bodyRot = Math.sin(performance.now() / 22) * 0.05 * ((wp - 0.5) / 0.5);
    }
  } else if (f.ability === 'drain') {
    // Warlock — CHANNEL (the channeler grammar; reusable by any future channeler):
    // while channelling, the body gulps in rhythm with the drain ticks (~0.2s) — a
    // sustained feeding pulse, distinct from any one-shot melee/ranged reaction.
    if (f.drainTimer > 0) {
      const gulp = Math.sin((f.drainElapsed % 0.2) / 0.2 * Math.PI);  // 0 → 1 → 0 each tick
      const s = 1 + 0.08 * gulp;
      bodyX = s; bodyY = s;
    }
  }

  // Jester — THE SNAP. No dash (it teleports), so there's no hold-and-whip; the
  // strike is the mask itself: the two harlequin halves slide APART (jaws gape),
  // then SNAP shut — the snap is the bite. `hinge` (passed to drawShape) is the
  // split distance in px; it's 0 for every other fighter.
  let hinge = 0;
  if (f.ability === 'blink' && f.meleeImpact > 0) {
    const p = 1 - impactK;                           // 0 → 1 over the window
    const MAX = 7;                                   // px each half slides apart
    if (p < 0.5)        hinge = MAX * (p / 0.5);          // gape open (anticipation)
    else if (p < 0.72)  hinge = MAX * (1 - (p - 0.5) / 0.22); // SNAP shut (the bite)
    else                hinge = 0;                       // settled
  }

  // If a fire-recoil and a melee knockback overlap (a ranged fighter struck the
  // instant it fires), take the DOMINANT one (larger magnitude) rather than summing
  // — the body never displaces past a single reaction, no cap needed.
  let bodyOffX = recoilX, bodyOffY = recoilY;
  if (Math.hypot(fireX, fireY) > Math.hypot(recoilX, recoilY)) { bodyOffX = fireX; bodyOffY = fireY; }
  ctx.save();
  ctx.translate(bodyOffX, bodyOffY);
  if (recoilSquash > 0) {
    ctx.rotate(f.recoilDir);
    ctx.scale(1 - recoilSquash, 1 + recoilSquash * 0.4);
    ctx.rotate(-f.recoilDir);
  }
  if (Math.cos(facing) < 0) {
    ctx.scale(-1, 1);
    ctx.rotate(Math.PI - facing);
  } else {
    ctx.rotate(facing);
  }
  ctx.rotate(bodyRot);          // extra spin (rotor fighters); 0 for everyone else
  ctx.scale(bodyX, bodyY);
  drawShape(ctx, f, hinge);     // hinge opens/snaps the Jester's mask; 0 for everyone else
  ctx.restore();

  // ===== BERSERKER — concussive shockwave ring (bespoke impact) =============
  // A blunt-force double ring snaps out from the contact point and fades. Pure
  // line-drawing (cheap on the GPU budget); nothing else in the game does it, so
  // it's the Berserker's voice — no particles needed.
  if (f.ability === 'tackle' && f.meleeImpact > 0) {
    const prog = 1 - impactK;                        // 0 → 1 as it expands
    const a = 1 - prog;                              // fades as it grows
    const cx = Math.cos(facing) * (FIGHTER_SIZE + 2);
    const cy = Math.sin(facing) * (FIGHTER_SIZE + 2);
    const r = 4 + prog * 22;
    ctx.strokeStyle = `rgba(255,60,30,${(a * 0.8).toFixed(3)})`;
    ctx.lineWidth = 3 * a + 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,210,150,${(a * 0.9).toFixed(3)})`;
    ctx.lineWidth = 1.5 * a + 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ===== KNIGHT — flat shield-slam shock (bespoke impact) ===================
  // A flat bar of force perpendicular to the bash direction snaps wide at the
  // contact point and fades — a blunt WALL hit, deliberately NOT a radial ring
  // (that's the Berserker's voice). Steel-blue, line-drawn, no particles.
  if (f.ability === 'sword' && f.meleeImpact > 0) {
    const prog = 1 - impactK;                        // 0 → 1
    const a = 1 - prog;                              // fades as it widens
    ctx.save();
    ctx.rotate(facing);
    ctx.translate(FIGHTER_SIZE + 2, 0);              // contact point, ahead of the shield
    const half = 9 + prog * 16;                      // bar flares outward
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(190,215,255,${(a * 0.85).toFixed(3)})`;
    ctx.lineWidth = 4 * a + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.lineTo(0, half);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.lineWidth = 1.5 * a + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.7);
    ctx.lineTo(0, half * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  // ===== DUELIST — puncture lance (bespoke impact) ==========================
  // A thin bright lance along the thrust AXIS punches forward from the tip and a
  // small 4-point glint marks the hit — precise and linear, neither ring nor bar.
  if (f.ability === 'riposte' && f.meleeImpact > 0) {
    const prog = 1 - impactK;                        // 0 → 1
    const a = 1 - prog;
    ctx.save();
    ctx.rotate(facing);
    ctx.lineCap = 'round';
    const x0 = FIGHTER_SIZE * 0.6;
    const x1 = FIGHTER_SIZE + 6 + prog * 16;         // lance drives forward as it fades
    ctx.strokeStyle = `rgba(220,220,245,${(a * 0.9).toFixed(3)})`;
    ctx.lineWidth = 2 * a + 0.4;
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.lineWidth = 0.8 * a + 0.3;
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    // tip glint
    const g = 3 * a + 1;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x1 - g, 0); ctx.lineTo(x1 + g, 0);
    ctx.moveTo(x1, -g);    ctx.lineTo(x1, g);
    ctx.stroke();
    ctx.restore();
  }

  // ----- Duelist COUNTER — reactive riposte jab toward the attacker ---------
  // Same puncture motif, fired toward counterDir (not the facing) when COUNTER
  // triggers off a melee hit. A quick flick, no body lunge.
  if (f.ability === 'riposte' && f.counterAnim > 0) {
    const a = f.counterAnim / 0.16;                  // 1 → 0
    ctx.save();
    ctx.rotate(f.counterDir);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(200,200,235,${(a * 0.85).toFixed(3)})`;
    ctx.lineWidth = 1.6 * a + 0.3;
    ctx.beginPath();
    ctx.moveTo(FIGHTER_SIZE * 0.6, 0);
    ctx.lineTo(FIGHTER_SIZE + 14, 0);
    ctx.stroke();
    ctx.restore();
  }

  // ===== REAPER — bleeding crescent slash (bespoke impact) ==================
  // A whirling blade carves an ARC, so the force signature is a crescent (the
  // fourth distinct primitive — circle / bar / line / ARC). The Reaper's VOICE on
  // top of that shared grammar is BLOOD: crimson droplets flick off the cutting
  // edge as the arc sweeps out. Droplets are deterministic render flecks (no rng,
  // no particle pool), bounded and shape-based — within the GPU budget.
  if (f.ability === 'sweep' && f.meleeImpact > 0) {
    const prog = 1 - impactK;                        // 0 → 1
    const a = 1 - prog;
    const r = FIGHTER_SIZE + 6 + prog * 10;          // sweeps outward as it fades
    const span = 1.7;                                // ~100° crescent
    const mid = facing + 0.5 - prog * 1.0;           // arc carves across the front
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(170,0,0,${(a * 0.9).toFixed(3)})`;
    ctx.lineWidth = 3.5 * a + 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, mid - span / 2, mid + span / 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,90,70,${a.toFixed(3)})`;   // bright cutting edge
    ctx.lineWidth = 1.4 * a + 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, r - 2.5, mid - span / 2, mid + span / 2);
    ctx.stroke();
    // Blood flicked off the cutting edge — a few thin radial spray streaks,
    // deterministic (no rng). Kept RESTRAINED: the Reaper is the lowest-damage
    // melee (16) and fires most often (cd 1.0), so by Principle 5 its impact sits
    // on the LIGHT side of the four. Blood is its voice, not a bigger hit.
    const N = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(165,0,0,${(a * 0.9).toFixed(3)})`;
    for (let i = 0; i < N; i++) {
      const frac = i / (N - 1);
      const da = mid - span / 2 + frac * span;        // spread along the arc
      const r0 = r + 1 + prog * (6 + (i % 3) * 4);    // flung outward, varied
      const len = (4 + (i % 2) * 3) * (0.4 + prog);   // short streak, elongates a little
      const ux = Math.cos(da), uy = Math.sin(da);
      ctx.lineWidth = (1.8 - frac * 0.5) * a + 0.4;
      ctx.beginPath();
      ctx.moveTo(ux * r0, uy * r0);
      ctx.lineTo(ux * (r0 + len), uy * (r0 + len));
      ctx.stroke();
    }
  }

  // ===== JESTER — pinch bite (bespoke impact) ===============================
  // A bite is a PINCH: force from two converging jaws. So the signature is a
  // converging PAIR (the fifth primitive — circle / bar / line / arc / PAIR), and
  // the Jester's two-tone VOICE rides it: a red jaw and a blue jaw snap together
  // on the contact point. Line-drawn, deterministic, no particles.
  if (f.ability === 'blink' && f.meleeImpact > 0) {
    const p = 1 - impactK;                           // 0 → 1
    const a = p < 0.5 ? 0 : Math.max(0, 1 - (p - 0.5) / 0.5); // appears at the snap, fades
    const snapClose = Math.max(0, Math.min(1, (p - 0.5) / 0.22)); // jaws shut during the snap
    const gap = (1 - snapClose) * 8 + 1.5;            // vertical gap closes
    ctx.save();
    ctx.rotate(facing);
    ctx.translate(FIGHTER_SIZE + 3, 0);               // contact point, toward the enemy
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.2 * a + 0.5;
    ctx.strokeStyle = `rgba(255,46,46,${a.toFixed(3)})`;   // red jaw (top)
    ctx.beginPath();
    ctx.moveTo(-5, -gap - 4); ctx.lineTo(3, -gap);
    ctx.stroke();
    ctx.strokeStyle = `rgba(46,158,255,${a.toFixed(3)})`;  // blue jaw (bottom)
    ctx.beginPath();
    ctx.moveTo(-5, gap + 4); ctx.lineTo(3, gap);
    ctx.stroke();
    ctx.restore();
  }

  // ===== CANNONEER — muzzle blast (bespoke launch flash) ====================
  // The biggest launch flash of the set: a forward fan of fire spikes + an
  // expanding ring + a white-hot core at the barrel tip, fired along fireDir.
  if (f.ability === 'cannon' && f.fireKick > 0) {
    const prog = 1 - f.fireKick / f.fireKickMax;     // 0 → 1
    const a = 1 - prog;
    ctx.save();
    ctx.translate(Math.cos(f.fireDir) * (FIGHTER_SIZE + 6), Math.sin(f.fireDir) * (FIGHTER_SIZE + 6));
    ctx.rotate(f.fireDir);                            // +x = the firing direction
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(255,140,26,${(a * 0.9).toFixed(3)})`;   // fire spikes, fanned forward
    ctx.lineWidth = 2.5 * a + 0.5;
    const N = 7;
    for (let i = 0; i < N; i++) {
      const sa = (i / (N - 1) - 0.5) * 1.6;           // ±0.8 rad forward cone
      const len = 8 + prog * 22 + (i % 2) * 4;
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(Math.cos(sa) * len, Math.sin(sa) * len); ctx.stroke();
    }
    ctx.strokeStyle = `rgba(255,200,80,${(a * 0.7).toFixed(3)})`;   // expanding ring
    ctx.lineWidth = 2 * a + 0.5;
    ctx.beginPath(); ctx.arc(0, 0, 4 + prog * 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(255,255,220,${a.toFixed(3)})`;            // white-hot core
    ctx.beginPath(); ctx.arc(0, 0, 3 * a + 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ===== WIZARD — rune flare (bespoke launch flash) =========================
  // A spinning arcane sigil + ring flares at the cast point as the orbs release —
  // purple ring, yellow sigil core (the spellbook's colours).
  if (f.ability === 'cast' && f.fireKick > 0) {
    const prog = 1 - f.fireKick / f.fireKickMax;     // 0 → 1
    const a = 1 - prog;
    ctx.save();
    ctx.translate(Math.cos(f.fireDir) * (FIGHTER_SIZE + 4), Math.sin(f.fireDir) * (FIGHTER_SIZE + 4));
    ctx.rotate(prog * 1.5);                           // sigil spins as it flares
    ctx.strokeStyle = `rgba(199,125,255,${(a * 0.8).toFixed(3)})`;  // purple rune ring
    ctx.lineWidth = 2 * a + 0.5;
    ctx.beginPath(); ctx.arc(0, 0, 4 + prog * 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(255,232,61,${a.toFixed(3)})`;            // yellow sigil core
    drawStar(ctx, 0, 0, 4, 6 + prog * 6, 2);
    ctx.fill();
    ctx.restore();
  }

  // ===== ARCHER — bowstring snap (bespoke launch flash) =====================
  // A short forward release streak + a perpendicular string-snap, fired green.
  if (f.ability === 'arrow' && f.fireKick > 0) {
    const prog = 1 - f.fireKick / f.fireKickMax;
    const a = 1 - prog;
    ctx.save();
    ctx.translate(Math.cos(f.fireDir) * (FIGHTER_SIZE + 4), Math.sin(f.fireDir) * (FIGHTER_SIZE + 4));
    ctx.rotate(f.fireDir);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(61,255,138,${a.toFixed(3)})`;
    ctx.lineWidth = 1.5 * a + 0.4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6 + prog * 14, 0); ctx.stroke();
    const s = 5 * a;
    ctx.lineWidth = 1 * a + 0.3;
    ctx.beginPath(); ctx.moveTo(-2, -s); ctx.lineTo(-2, s); ctx.stroke();
    ctx.restore();
  }

  // ===== NECROMANCER — summoning circle (bespoke launch flash) ==============
  // Centred on the Necromancer (the dead rise at its feet, not forward): an
  // expanding purple rune ring with bone ticks rising around it.
  if (f.ability === 'raise' && f.fireKick > 0) {
    const prog = 1 - f.fireKick / f.fireKickMax;
    const a = 1 - prog;
    const r = FIGHTER_SIZE + 2 + prog * 10;
    ctx.strokeStyle = `rgba(199,125,255,${(a * 0.7).toFixed(3)})`;
    ctx.lineWidth = 2 * a + 0.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(232,224,208,${a.toFixed(3)})`;   // bone ticks
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const ag = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ag) * r, Math.sin(ag) * r);
      ctx.lineTo(Math.cos(ag) * (r + 4), Math.sin(ag) * (r + 4));
      ctx.stroke();
    }
  }

  // ===== WITCH — hex pop (bespoke launch flash) =============================
  // A sickly-green radial pop + ring at the cast point.
  if (f.ability === 'hex' && f.fireKick > 0) {
    const prog = 1 - f.fireKick / f.fireKickMax;
    const a = 1 - prog;
    ctx.save();
    ctx.translate(Math.cos(f.fireDir) * (FIGHTER_SIZE + 4), Math.sin(f.fireDir) * (FIGHTER_SIZE + 4));
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(125,255,61,${a.toFixed(3)})`;
    ctx.lineWidth = 2 * a + 0.4;
    for (let i = 0; i < 6; i++) {
      const ag = (i / 6) * Math.PI * 2 + prog;
      const len = 4 + prog * 9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ag) * 2, Math.sin(ag) * 2);
      ctx.lineTo(Math.cos(ag) * len, Math.sin(ag) * len);
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(125,255,61,${(a * 0.6).toFixed(3)})`;
    ctx.lineWidth = 1.5 * a + 0.4;
    ctx.beginPath(); ctx.arc(0, 0, 3 + prog * 8, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // ===== GAMBLER — coin glint (bespoke launch flash) ========================
  // A gold flick fan + a bright glint at the throw point.
  if (f.ability === 'wildcard' && f.fireKick > 0) {
    const prog = 1 - f.fireKick / f.fireKickMax;
    const a = 1 - prog;
    ctx.save();
    ctx.translate(Math.cos(f.fireDir) * (FIGHTER_SIZE + 4), Math.sin(f.fireDir) * (FIGHTER_SIZE + 4));
    ctx.rotate(f.fireDir);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(255,210,61,${a.toFixed(3)})`;
    ctx.lineWidth = 1.5 * a + 0.4;
    for (let i = 0; i < 3; i++) {
      const off = (i - 1) * 0.4;
      const len = 6 + prog * 12;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(off) * len, Math.sin(off) * len); ctx.stroke();
    }
    ctx.fillStyle = `rgba(255,240,180,${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(2, 0, 2 * a + 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ===== HUNTER — launch flick (bespoke launch flash) =======================
  // A small copper flick along the throw; the steel cable carries the rest.
  if (f.ability === 'grapple' && f.fireKick > 0) {
    const prog = 1 - f.fireKick / f.fireKickMax;
    const a = 1 - prog;
    ctx.save();
    ctx.translate(Math.cos(f.fireDir) * (FIGHTER_SIZE + 4), Math.sin(f.fireDir) * (FIGHTER_SIZE + 4));
    ctx.rotate(f.fireDir);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(200,144,96,${a.toFixed(3)})`;
    ctx.lineWidth = 2 * a + 0.5;
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(5 + prog * 8, 0); ctx.stroke();
    ctx.restore();
  }

  // ===== Negative-status marks (debuffs) — afflict the fighter, drawn distinctly
  // from the beneficial edge-rings so a buff never reads like a debuff. =========
  // MARKED (Witch's Mark) — a slow-rotating green sigil painted over the fighter.
  if (f.witchMarkTimer > 0 && !f.dead) {
    const pulse = 0.5 + Math.sin(performance.now() / 200) * 0.3;
    ctx.save();
    ctx.rotate(performance.now() / 700);
    ctx.strokeStyle = `rgba(125,255,61,${(0.45 + pulse * 0.4).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    const r = FIGHTER_SIZE * 0.78;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
      ctx.lineTo(Math.cos(ang) * (r + 4), Math.sin(ang) * (r + 4));
      ctx.stroke();
    }
    ctx.restore();
  }
  // STUNNED — yellow stars orbiting above the head (the universal stun read).
  if (f.stunTimer > 0 && !f.dead) {
    const cy = -(FIGHTER_SIZE + 14);
    const t = performance.now() / 280;
    ctx.fillStyle = '#ffd23d';
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2 + t;
      drawStar(ctx, Math.cos(ang) * 9, cy + Math.sin(ang) * 3, 4, 2.6, 1.1);
      ctx.fill();
    }
  }
  // LOADED (Gambler) — a brief gold "lucky" pop the instant a low roll fires LOADED
  // DICE (not a persistent state): a star + sparkle burst above the head, expanding
  // and fading.
  if (f.loadedFx > 0) {
    const a = f.loadedFx / 0.45;
    const cy = -(FIGHTER_SIZE + 8);
    ctx.fillStyle = `rgba(255,210,61,${a.toFixed(3)})`;
    drawStar(ctx, 0, cy, 4, 4 + (1 - a) * 3, 1.6);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,240,180,${a.toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + 0.4;
      const r1 = 7 + (1 - a) * 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 4, cy + Math.sin(ang) * 4);
      ctx.lineTo(Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx.stroke();
    }
  }

  ctx.restore();
  // No in-arena name label — the HUD already names both fighters, and dropping it
  // declutters the space above the head so the stun stars read clearly.
}
