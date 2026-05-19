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
// translated/rotated into the sprite's local space. Only reads f.size,
// f.color, f.accent, f.shape.
function drawShape(c, f) {
  switch (f.shape) {
    case 'cross': {
      // Priest — vertical scepter icon: dark shaft, horizontal crossguard, glowing orb at tip.
      // Forward direction = orb tip (right side).
      c.strokeStyle = f.color;
      c.lineWidth = 4;
      c.lineCap = 'round';
      // Main shaft (forward-pointing)
      c.beginPath();
      c.moveTo(-f.size * 0.9, 0);
      c.lineTo(f.size * 0.55, 0);
      c.stroke();
      // Crossguard (perpendicular, near orb)
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(f.size * 0.3, -f.size * 0.55);
      c.lineTo(f.size * 0.3, f.size * 0.55);
      c.stroke();
      // Glow halo behind orb
      c.fillStyle = `rgba(255,232,61,0.35)`;
      c.beginPath();
      c.arc(f.size * 0.75, 0, f.size * 0.45, 0, Math.PI * 2);
      c.fill();
      // Orb (bright accent)
      c.fillStyle = f.accent;
      c.beginPath();
      c.arc(f.size * 0.75, 0, f.size * 0.3, 0, Math.PI * 2);
      c.fill();
      // Inner highlight on orb
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(f.size * 0.65, -f.size * 0.1, f.size * 0.1, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'axe': {
      // Berserker — clenched fist punching forward (+x). Shape key stays 'axe'.
      const s = f.size;
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
      const s = f.size;
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
      c.moveTo(-f.size * 0.65, -f.size * 0.85);
      c.lineTo(f.size * 0.5, -f.size * 0.7);
      c.lineTo(f.size * 0.95, 0);
      c.lineTo(f.size * 0.5, f.size * 0.7);
      c.lineTo(-f.size * 0.65, f.size * 0.85);
      c.lineTo(-f.size * 0.55, 0);
      c.closePath();
      c.fill();
      // Shield rim (lighter highlight)
      c.strokeStyle = f.accent;
      c.lineWidth = 2;
      c.stroke();
      // Cross emblem (vertical + horizontal arms)
      c.fillStyle = f.accent;
      c.fillRect(-f.size * 0.05, -f.size * 0.55, f.size * 0.18, f.size * 1.1);
      c.fillRect(-f.size * 0.4, -f.size * 0.1, f.size * 0.85, f.size * 0.18);
      // Central rivet/boss
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(f.size * 0.05, 0, f.size * 0.1, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'keg': {
      // Sapper — a round bomb with a lit fuse. A bomb reads from just two
      // things: a dark round body + a lit fuse. The old version had two
      // crossed strap ellipses that read as an ATOM symbol — dropped. Now a
      // plain sphere with a soft highlight (3D read) and the fuse.
      const s = f.size;
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
      c.arc(0, 0, f.size * 0.85, -Math.PI * 0.45, Math.PI * 0.45);
      c.stroke();
      // Bowstring (taut, pulled back to anchor at left)
      c.strokeStyle = '#e0d0a0';
      c.lineWidth = 1.3;
      c.beginPath();
      const topY = Math.sin(-Math.PI * 0.45) * f.size * 0.85;
      const botY = Math.sin(Math.PI * 0.45) * f.size * 0.85;
      const topX = Math.cos(-Math.PI * 0.45) * f.size * 0.85;
      const botX = Math.cos(Math.PI * 0.45) * f.size * 0.85;
      c.moveTo(topX, topY);
      c.lineTo(-f.size * 0.6, 0);
      c.lineTo(botX, botY);
      c.stroke();
      // Bow grip wrap (center of bow, lighter color)
      c.strokeStyle = f.accent;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(f.size * 0.85, -f.size * 0.12);
      c.lineTo(f.size * 0.85, f.size * 0.12);
      c.stroke();
      // Arrow shaft
      c.strokeStyle = '#5a4a2a';
      c.lineWidth = 2.2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-f.size * 0.6, 0);
      c.lineTo(f.size * 1.2, 0);
      c.stroke();
      // Arrowhead
      c.fillStyle = f.accent;
      c.beginPath();
      c.moveTo(f.size * 1.35, 0);
      c.lineTo(f.size * 1.05, -4);
      c.lineTo(f.size * 1.05, 4);
      c.closePath();
      c.fill();
      // Fletching at back (small triangle)
      c.fillStyle = '#c44';
      c.beginPath();
      c.moveTo(-f.size * 0.6, 0);
      c.lineTo(-f.size * 0.85, -f.size * 0.18);
      c.lineTo(-f.size * 0.75, 0);
      c.lineTo(-f.size * 0.85, f.size * 0.18);
      c.closePath();
      c.fill();
      break;
    }
    case 'mask': {
      // Jester — a symmetric harlequin diamond mask: red/blue split, jester-cap
      // points along the top. The mask IS the whole sprite (no weapon).
      const m = f.size * 0.9;   // half-height / half-width of the diamond
      // Left half — red triangle.
      c.fillStyle = '#ff2e2e';
      c.beginPath();
      c.moveTo(0, -m);
      c.lineTo(-m, 0);
      c.lineTo(0, m);
      c.closePath();
      c.fill();
      // Right half — blue triangle, same size (symmetric now the dagger's gone).
      c.fillStyle = '#2e9eff';
      c.beginPath();
      c.moveTo(0, -m);
      c.lineTo(m, 0);
      c.lineTo(0, m);
      c.closePath();
      c.fill();
      // Cream outline around the diamond.
      c.strokeStyle = f.color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, -m);
      c.lineTo(-m, 0);
      c.lineTo(0, m);
      c.lineTo(m, 0);
      c.closePath();
      c.stroke();
      // Center divide (vertical).
      c.beginPath();
      c.moveTo(0, -m);
      c.lineTo(0, m);
      c.stroke();
      // Eye slits — one per half, mirrored.
      c.fillStyle = f.color;
      c.fillRect(-f.size * 0.5, -f.size * 0.15, f.size * 0.22, 2.5);
      c.fillRect(f.size * 0.28, -f.size * 0.15, f.size * 0.22, 2.5);
      // Three jester-cap points along the top — left red, center, right blue.
      c.fillStyle = '#ff2e2e';
      c.beginPath();
      c.moveTo(-f.size * 0.32, -f.size * 0.62);
      c.lineTo(-f.size * 0.46, -f.size * 1.08);
      c.lineTo(-f.size * 0.12, -f.size * 0.74);
      c.closePath();
      c.fill();
      c.fillStyle = f.color;
      c.beginPath();
      c.moveTo(-f.size * 0.13, -f.size * 0.74);
      c.lineTo(0, -f.size * 1.16);
      c.lineTo(f.size * 0.13, -f.size * 0.74);
      c.closePath();
      c.fill();
      c.fillStyle = '#2e9eff';
      c.beginPath();
      c.moveTo(f.size * 0.12, -f.size * 0.74);
      c.lineTo(f.size * 0.46, -f.size * 1.08);
      c.lineTo(f.size * 0.32, -f.size * 0.62);
      c.closePath();
      c.fill();
      break;
    }
    case 'cannon': {
      // Cannoneer — a bold cannon, barrel as the hero element, on a small
      // wheel. Forward = barrel direction (+x). Composed so the visual mass is
      // centred on the origin and fills the frame. s is scaled up a touch so
      // it fills the frame like the other sprites (raw geometry was ~1.75).
      const s = f.size * 1.15;
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
      const s = f.size;
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
      const s = f.size;
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
      const s = f.size * 1.2;
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
      // total length. Cutting edge down. Forward = blade tip (+x).
      const s = f.size;
      // --- Pommel (kashira) — small end cap ---
      c.fillStyle = "#2a2a2a";
      c.fillRect(-s * 0.95, -s * 0.14, s * 0.07, s * 0.28);
      // --- Grip (tsuka) — dark wrapped handle ---
      c.fillStyle = "#1a1a1a";
      c.fillRect(-s * 0.88, -s * 0.12, s * 0.5, s * 0.24);
      // wrap (ito) — a few single diagonal bindings; sparse so the dark
      // handle still shows through (dense crosses made it look solid gold).
      c.strokeStyle = f.accent;
      c.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) {
        const gx = -s * 0.82 + i * s * 0.15;
        c.beginPath();
        c.moveTo(gx, -s * 0.12);
        c.lineTo(gx + s * 0.09, s * 0.12);
        c.stroke();
      }
      // --- Tsuba (guard) — a thin tall guard, not a fat bead ---
      c.fillStyle = "#3a3a3a";
      c.fillRect(-s * 0.4, -s * 0.26, s * 0.07, s * 0.52);
      // --- Blade — straight rectangular body that tapers to a long sharp
      // point. The SPINE (back) is the top edge and runs dead straight all
      // the way to the point; the CUTTING EDGE is the bottom and angles up
      // over a long run to meet it (a long taper reads as sharp). ---
      const top = -s * 0.08, bot = s * 0.07;     // spine / cutting-edge lines
      c.fillStyle = "#e4ecf4";
      c.beginPath();
      c.moveTo(-s * 0.33, top);                  // spine, at the guard
      c.lineTo(s * 1.0, top);                    // spine runs dead straight to the point
      c.lineTo(s * 0.5, bot);                    // long taper: edge angles up to the point
      c.lineTo(-s * 0.33, bot);                  // cutting edge runs straight back
      c.closePath();
      c.fill();
      // Cutting-edge highlight — bright line just inside the lower edge,
      // along the straight section only.
      c.strokeStyle = "#ffffff";
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(-s * 0.3, bot - s * 0.02);
      c.lineTo(s * 0.46, bot - s * 0.02);
      c.stroke();
      break;
    }
    case 'hat': {
      // Witch — a pointed witch hat. The fighter faces +x (right), so the hat's
      // tip droops BACKWARD (to -x / upper-left), trailing behind like hair or
      // a cloak. The cone has a clean horizontal base so the band stripe sits
      // flush on it — the lean comes only from the drooping tip, not a skewed
      // body. Faceted straight-line geometry so it stays crisp at 64px.
      const s = f.size;
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
      const s = f.size;
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
      c.moveTo(f.size * 0.95, -f.size * 0.1);          // forward tip / brow point
      c.quadraticCurveTo(f.size * 0.2, -f.size * 1.05, -f.size * 0.55, -f.size * 0.55); // up over the crown
      c.quadraticCurveTo(-f.size * 0.95, 0, -f.size * 0.5, f.size * 0.8);  // down the back
      c.quadraticCurveTo(f.size * 0.1, f.size * 1.0, f.size * 0.85, f.size * 0.45); // along the chin
      c.closePath();
      c.fill();
      // Inner shadow of the hood opening (the dark face void)
      c.fillStyle = '#0a0010';
      c.beginPath();
      c.ellipse(f.size * 0.3, f.size * 0.05, f.size * 0.5, f.size * 0.6, -0.2, 0, Math.PI * 2);
      c.fill();
      // Glowing void eye — accent-colored, set inside the hood shadow
      const eyeGrad = c.createRadialGradient(f.size * 0.42, 0, 0.5, f.size * 0.42, 0, f.size * 0.32);
      eyeGrad.addColorStop(0, '#fff');
      eyeGrad.addColorStop(0.4, f.accent);
      eyeGrad.addColorStop(1, 'rgba(192,80,255,0)');
      c.fillStyle = eyeGrad;
      c.beginPath();
      c.arc(f.size * 0.42, 0, f.size * 0.32, 0, Math.PI * 2);
      c.fill();
      // Leech-tendrils — short curved wisps curling off the back of the hood
      const tw = performance.now() / 420;
      c.strokeStyle = f.accent;
      c.lineWidth = 1.8;
      c.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = Math.PI * 0.9 + i * 0.42 + Math.sin(tw + i) * 0.12;
        const bx = Math.cos(a) * f.size * 0.7, by = Math.sin(a) * f.size * 0.7;
        c.beginPath();
        c.arc(bx, by, f.size * 0.3, a - 0.4, a + 1.0);
        c.stroke();
      }
      break;
    }
    case 'dice': {
      // Gambler — a single die tilted forward. The face shown reflects the
      // WILDCARD roll: while the die tumbles (aimTimer) the pip count flickers;
      // once it settles it shows the rolled face; at rest it shows a 5.
      const s = f.size * 0.82;
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

function drawFighter(f) {
  if (f.dead) return;

  // Ronin iai dash trail — drawn in world space BEFORE translating to fighter position.
  // Fades over the 0.15s strike window. Drawn first so the sprite renders on top.
  if (f.ability === 'iai' && f.iaiStrike > 0 && f.iaiTrail) {
    const fade = f.iaiStrike / 0.15;
    const t = f.iaiTrail;
    const dx = t.x2 - t.x1;
    const dy = t.y2 - t.y1;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      const ang = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(t.x1, t.y1);
      ctx.rotate(ang);
      // Soft outer streak (wide, faded)
      const grad = ctx.createLinearGradient(0, 0, len, 0);
      grad.addColorStop(0, `rgba(232,192,32,${fade * 0.0})`);
      grad.addColorStop(0.3, `rgba(232,192,32,${fade * 0.4})`);
      grad.addColorStop(1, `rgba(255,232,80,${fade * 0.7})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -6 * fade);
      ctx.lineTo(len, -3 * fade);
      ctx.lineTo(len, 3 * fade);
      ctx.lineTo(0, 6 * fade);
      ctx.closePath();
      ctx.fill();
      // Bright inner core line
      ctx.strokeStyle = `rgba(255,255,255,${fade * 0.9})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();
      ctx.restore();

      // Afterimage silhouettes along the dash path (3 fading copies)
      for (let i = 1; i <= 3; i++) {
        const p = i / 4; // 0.25, 0.5, 0.75
        const ax = t.x1 + dx * p;
        const ay = t.y1 + dy * p;
        const aFade = fade * (1 - p) * 0.4;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.fillStyle = `rgba(232,192,32,${aFade})`;
        ctx.beginPath();
        ctx.arc(0, 0, f.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.strokeStyle = f.team === 'red' ? '#ff2e2e' : '#2e9eff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, f.size + 3, 0, Math.PI * 2);
  ctx.stroke();

  // readyGlow — marks an armed defensive passive. A soft halo gives it
  // presence and colour; a crisp bright RIM at the halo's edge gives the hard
  // edge the eye actually catches (a glow alone read as too subtle on a phone).
  function readyGlow(rgb) {
    const pulse = 0.6 + Math.sin(performance.now() / 450) * 0.25;
    const rim = f.size + 10;
    // Soft glow body
    const g = ctx.createRadialGradient(0, 0, f.size * 0.55, 0, 0, rim + 3);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(0.6, `rgba(${rgb},${(pulse * 0.4).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rim + 3, 0, Math.PI * 2);
    ctx.fill();
    // Crisp bright rim — the defined edge that makes it pop
    ctx.strokeStyle = `rgba(${rgb},${(0.7 + pulse * 0.3).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, rim, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Wizard mana shield ready — soft purple glow while the Wizard has a live
  // orb to spend (the shield is powered by orbs, so glow = shield available).
  if (f.ability === 'cast' && !f.dead
      && game.projectiles.some(p => p.kind === 'orb' && p.team === f.team)) {
    readyGlow('199,125,255');
  }

  // Jester dodge ready — soft cream glow while Uncanny Dodge is armed.
  if (f.ability === 'blink' && f.dodgeReady) {
    readyGlow('232,216,184');
  }

  // Jester invuln window: opaque ghost ring
  if (f.ability === 'blink' && f.dodgeInvuln > 0) {
    const a = f.dodgeInvuln / 0.3;
    ctx.strokeStyle = `rgba(255,255,255,${a * 0.9})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, f.size + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Duelist parry window: bright silver ring — drawn INSIDE the team-colour
  // border (which sits at f.size + 3) so it reads as on the fighter.
  if (f.ability === 'riposte' && f.parryTimer > 0) {
    const a = f.parryTimer / 0.25;
    ctx.strokeStyle = `rgba(192,192,232,${a * 0.95})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, f.size + 1, 0, Math.PI * 2);
    ctx.stroke();
    // Inner glow
    ctx.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, f.size - 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Duelist COUNTER — quick snap-thrust toward the attacker on reactive hit.
  if (f.ability === 'riposte' && f.counterAnim > 0) {
    const progress = 1 - (f.counterAnim / 0.16);
    const alpha = (1 - progress * 0.85).toFixed(2);
    const thrustLen = f.size + 16;
    ctx.save();
    ctx.rotate(f.counterDir);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(192,192,232,${alpha})`;
    ctx.lineWidth = 2 - progress * 1.2;
    ctx.beginPath();
    ctx.moveTo(f.size + 1, 0);
    ctx.lineTo(thrustLen, 0);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${(+alpha * 0.8).toFixed(2)})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(thrustLen - 4, 0);
    ctx.lineTo(thrustLen, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Berserker bloodrage indicator
  if (f.ability === 'tackle' && f.hp < f.maxHp * 0.5) {
    const pulse = 0.4 + Math.sin(performance.now() / 100) * 0.3;
    ctx.fillStyle = `rgba(255,50,50,${pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, 0, f.size + 8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (f.flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (f.flash * 4).toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(0, 0, f.size + 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Negate flash — a hit was nullified (dodge / brace / parry). Expanding white ring.
  if (f.negateFlash > 0) {
    const p = 1 - (f.negateFlash / 0.25); // 0 -> 1
    ctx.strokeStyle = 'rgba(255,255,255,' + ((1 - p) * 0.9).toFixed(2) + ')';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, f.size + 4 + p * 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Aim telegraph — Cannoneer's charging cannon
  if (f.aimTimer > 0 && f.aimAbility === 'cannon') {
    const totalCast = 1.0;
    const progress = 1 - (f.aimTimer / totalCast); // 0 → 1
    const pulse = 0.5 + Math.sin(f.aimTimer * 20) * 0.5;

    // Aim line pointing toward enemy (gets more visible as charge progresses)
    const enemy = f.team === 'red' ? game.blue : game.red;
    if (enemy && !enemy.dead) {
      const ang = Math.atan2(enemy.y - f.y, enemy.x - f.x);
      // Faint aim trail
      ctx.strokeStyle = `rgba(255,140,26,${progress * 0.35})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * (f.size + 4), Math.sin(ang) * (f.size + 4));
      ctx.lineTo(Math.cos(ang) * 200, Math.sin(ang) * 200);
      ctx.stroke();
      ctx.setLineDash([]);

      // Growing ember at the barrel tip
      const tipX = Math.cos(ang) * (f.size + 6);
      const tipY = Math.sin(ang) * (f.size + 6);
      const r = 3 + progress * 6 + pulse * 1.5;
      ctx.fillStyle = `rgba(255,140,26,${0.3 + progress * 0.4})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, r + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,200,80,${0.5 + progress * 0.4})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,220,${progress})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Aim telegraph — Priest's signature divine charge
  if (f.aimTimer > 0 && f.aimAbility === 'lightning') {
    const totalCast = 0.45;
    const progress = 1 - (f.aimTimer / totalCast); // 0 → 1
    const pulse = 0.5 + Math.sin(f.aimTimer * 25) * 0.5;

    // Charging halo behind the priest
    const haloR = f.size + 8 + progress * 6;
    const haloAlpha = 0.15 + progress * 0.35;
    ctx.fillStyle = `rgba(255,232,61,${haloAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();
    // Inner brighter halo
    ctx.fillStyle = `rgba(255,255,200,${haloAlpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(0, 0, haloR * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting sparkle orbs
    const orbCount = 3;
    const orbitSpeed = progress * 8 + 2;
    const orbitR = f.size + 4 + progress * 4;
    for (let i = 0; i < orbCount; i++) {
      const a = (i / orbCount) * Math.PI * 2 + f.aimTimer * orbitSpeed;
      const ox = Math.cos(a) * orbitR;
      const oy = Math.sin(a) * orbitR;
      ctx.fillStyle = '#ffe83d';
      ctx.beginPath();
      ctx.arc(ox, oy, 2 + pulse, 0, Math.PI * 2);
      ctx.fill();
      // bright core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ox, oy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = f.color;
  // All fighters rotate to face the enemy except during a dash, where they
  // follow velocity so the sprite reads the direction of the charge.
  let rotatedForShape = false;
  if (f.rotates) {
    let facing;
    const isDashing = f.dashTimer > 0 || f.iaiStrike > 0;
    if (isDashing) {
      const sp = Math.hypot(f.vx, f.vy);
      facing = sp > 5 ? Math.atan2(f.vy, f.vx) : (f.lastFacing || 0);
    } else {
      const enemy = f.team === 'red' ? game.blue : game.red;
      facing = (enemy && !enemy.dead)
        ? Math.atan2(enemy.y - f.y, enemy.x - f.x)
        : (f.lastFacing || 0);
    }
    f.lastFacing = facing;
    ctx.save();
    // Never let a sprite go upside-down. A sprite's forward is its local +x.
    // If `facing` points into the left half (cos < 0), rotating there would
    // invert the sprite — so instead mirror it horizontally and rotate by the
    // reflected angle. The sprite stays right-side-up, tilts at most ±90°, and
    // still aims correctly (Archer's bow, Cannoneer's barrel still track).
    if (Math.cos(facing) < 0) {
      ctx.scale(-1, 1);
      ctx.rotate(Math.PI - facing);
    } else {
      ctx.rotate(facing);
    }
    rotatedForShape = true;
  }
  drawShape(ctx, f);
  if (rotatedForShape) ctx.restore();

  // Reaper sweep — full 360° blood-colored ring with rotating blade
  if (f.ability === 'sweep' && f.sweepTimer > 0) {
    const progress = 1 - (f.sweepTimer / 0.3);
    const ringR = f.size + 14;
    // Outer faint ring
    ctx.strokeStyle = 'rgba(170,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    // Rotating blade arc — half-circle that spins through 360+
    const bladeBase = progress * Math.PI * 4;
    ctx.fillStyle = 'rgba(200,30,30,0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, ringR + 4, bladeBase, bladeBase + Math.PI * 0.5);
    ctx.arc(0, 0, ringR - 4, bladeBase + Math.PI * 0.5, bladeBase, true);
    ctx.closePath();
    ctx.fill();
    // Bright leading edge
    ctx.strokeStyle = '#ff4040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ringR + 2, bladeBase + Math.PI * 0.45, bladeBase + Math.PI * 0.5);
    ctx.stroke();
  }

  // Ronin iai windup — pulsing yellow glow that intensifies as windup completes
  if (f.ability === 'iai' && f.iaiWindup > 0) {
    const progress = 1 - (f.iaiWindup / 0.7); // 0 → 1 as windup completes
    const glowR = f.size + 8 + progress * 6;
    // Outer glow (pulsing)
    const pulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 8);
    ctx.strokeStyle = `rgba(232,192,32,${0.3 + pulse * 0.4})`;
    ctx.lineWidth = 2 + progress * 2;
    ctx.beginPath();
    ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.stroke();
    // Charging streak particles around the figure
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + progress * 4;
      const rr = f.size + 6 + Math.sin(progress * Math.PI * 6 + i) * 2;
      ctx.fillStyle = `rgba(255,220,60,${0.5 + pulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ronin iai strike — bright slash streak in the direction of the enemy
  if (f.ability === 'iai' && f.iaiStrike > 0) {
    const enemy = f.team === 'red' ? game.blue : game.red;
    const ang = enemy ? Math.atan2(enemy.y - f.y, enemy.x - f.x) : (f.lastFacing || 0);
    ctx.save();
    ctx.rotate(ang);
    const fade = f.iaiStrike / 0.15;
    // Long horizontal slash line
    ctx.strokeStyle = `rgba(255,240,180,${fade * 0.95})`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(f.size * 0.6, 0);
    ctx.lineTo(f.size + 35, 0);
    ctx.stroke();
    // Bright core line
    ctx.strokeStyle = `rgba(255,255,255,${fade})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(f.size * 0.6, 0);
    ctx.lineTo(f.size + 35, 0);
    ctx.stroke();
    // Glow at slash tip
    ctx.fillStyle = `rgba(255,232,60,${fade * 0.7})`;
    ctx.beginPath();
    ctx.arc(f.size + 35, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (f.swingTimer > 0) {
    const enemy = f.team === 'red' ? game.blue : game.red;
    const ang = enemy ? Math.atan2(enemy.y - f.y, enemy.x - f.x) : 0;
    ctx.save();
    ctx.rotate(ang);
    const progress = 1 - (f.swingTimer / 0.3); // 0 → 1
    if (f.ability === 'riposte') {
      // Duelist — rapier thrust: a thin spike that snaps out then retracts.
      // ctx is already rotated to face the enemy; +x is the thrust direction.
      const thrustLen = f.size + 6 + (1 - progress) * 22;
      const alpha = (1 - progress * 0.55).toFixed(2);
      ctx.lineCap = 'round';
      // Blade shaft
      ctx.strokeStyle = `rgba(192,192,232,${alpha})`;
      ctx.lineWidth = 2.5 - progress * 1.5;
      ctx.beginPath();
      ctx.moveTo(f.size + 2, 0);
      ctx.lineTo(thrustLen, 0);
      ctx.stroke();
      // Bright tip glint
      ctx.strokeStyle = `rgba(255,255,255,${(+alpha * 0.9).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(thrustLen - 5, 0);
      ctx.lineTo(thrustLen, 0);
      ctx.stroke();
    } else {
      // Knight — broad sword swing: curved arc sweeping through 90°.
      const baseAng = -Math.PI * 0.4 + progress * Math.PI * 0.8;
      const innerR = f.size + 4;
      const outerR = f.size + 22;
      ctx.fillStyle = 'rgba(220,230,240,0.85)';
      ctx.beginPath();
      ctx.arc(0, 0, outerR, baseAng - 0.4, baseAng + 0.05);
      ctx.arc(0, 0, innerR, baseAng + 0.05, baseAng - 0.4, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, outerR, baseAng - 0.05, baseAng + 0.05);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (f.dashTimer > 0) {
    // Ghost copies of the fighter's actual shape trailing along the velocity.
    // Two frames shown at ~2 and ~4 frames behind current position.
    const alpha = Math.min(f.dashTimer * 2.5, 0.45);
    for (let i = 1; i <= 2; i++) {
      ctx.save();
      ctx.translate(-f.vx * 0.033 * i, -f.vy * 0.033 * i);
      ctx.globalAlpha = alpha / i;
      drawShape(ctx, f);
      ctx.restore();
    }
  }

  ctx.restore();

  ctx.fillStyle = f.team === 'red' ? '#ff2e2e' : '#2e9eff';
  ctx.font = 'bold 8px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.fillText(f.name, f.x, f.y - f.size - 8);
}

