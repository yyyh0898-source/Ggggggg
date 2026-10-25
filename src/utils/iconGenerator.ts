/**
 * Generates the authentic Freecam mod icon (Modrinth XeEZ3fK2 / Freecam Fabric style)
 * as a high-resolution 256x256 PNG data URL and byte array for .levipack packaging.
 */

export function generateFreecamModIcon(theme: 'cyan' | 'neon' | 'bedrock' | 'dark' = 'cyan'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background rounded rectangle
  const radius = 48;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(256 - radius, 0);
  ctx.quadraticCurveTo(256, 0, 256, radius);
  ctx.lineTo(256, 256 - radius);
  ctx.quadraticCurveTo(256, 256, 256 - radius, 256);
  ctx.lineTo(radius, 256);
  ctx.quadraticCurveTo(0, 256, 0, 256 - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();

  // Theme Gradients
  let bgGrad = ctx.createLinearGradient(0, 0, 256, 256);
  let accentColor = '#06b6d4'; // Cyan
  let glowColor = 'rgba(6, 182, 212, 0.4)';
  let accentSecondary = '#3b82f6';

  if (theme === 'cyan') {
    bgGrad.addColorStop(0, '#0c2438');
    bgGrad.addColorStop(0.5, '#071624');
    bgGrad.addColorStop(1, '#030a10');
    accentColor = '#22d3ee';
    glowColor = 'rgba(34, 211, 238, 0.45)';
    accentSecondary = '#0284c7';
  } else if (theme === 'neon') {
    bgGrad.addColorStop(0, '#1e1035');
    bgGrad.addColorStop(1, '#090514');
    accentColor = '#a855f7';
    glowColor = 'rgba(168, 85, 247, 0.5)';
    accentSecondary = '#ec4899';
  } else if (theme === 'bedrock') {
    bgGrad.addColorStop(0, '#064e3b');
    bgGrad.addColorStop(1, '#022c22');
    accentColor = '#10b981';
    glowColor = 'rgba(16, 185, 129, 0.45)';
    accentSecondary = '#059669';
  } else {
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    accentColor = '#38bdf8';
    glowColor = 'rgba(56, 189, 248, 0.4)';
    accentSecondary = '#6366f1';
  }

  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Subtle border
  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  // Tech grid background lines
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.5;
  for (let i = 20; i < 256; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  ctx.restore();

  // Glowing Outer Ring
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 24;

  // Freecam Camera Body Outline
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 5;

  // Camera Body (Main rectangle with rounded edges)
  const cx = 128;
  const cy = 136;
  const cw = 110;
  const ch = 76;
  const cr = 16;

  ctx.beginPath();
  ctx.moveTo(cx - cw/2 + cr, cy - ch/2);
  ctx.lineTo(cx + cw/2 - cr, cy - ch/2);
  ctx.quadraticCurveTo(cx + cw/2, cy - ch/2, cx + cw/2, cy - ch/2 + cr);
  ctx.lineTo(cx + cw/2, cy + ch/2 - cr);
  ctx.quadraticCurveTo(cx + cw/2, cy + ch/2, cx + cw/2 - cr, cy + ch/2);
  ctx.lineTo(cx - cw/2 + cr, cy + ch/2);
  ctx.quadraticCurveTo(cx - cw/2, cy + ch/2, cx - cw/2, cy + ch/2 - cr);
  ctx.lineTo(cx - cw/2, cy - ch/2 + cr);
  ctx.quadraticCurveTo(cx - cw/2, cy - ch/2, cx - cw/2 + cr, cy - ch/2);
  ctx.closePath();

  const camGrad = ctx.createLinearGradient(0, cy - ch/2, 0, cy + ch/2);
  camGrad.addColorStop(0, '#334155');
  camGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = camGrad;
  ctx.fill();
  ctx.stroke();

  // Camera Pentaprism top bump
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy - ch/2);
  ctx.lineTo(cx - 18, cy - ch/2 - 18);
  ctx.lineTo(cx + 18, cy - ch/2 - 18);
  ctx.lineTo(cx + 28, cy - ch/2);
  ctx.closePath();
  ctx.fillStyle = '#475569';
  ctx.fill();
  ctx.stroke();

  // Flash / Sensor LED
  ctx.beginPath();
  ctx.arc(cx + 36, cy - ch/2 + 16, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444'; // Red recording LED
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 12;
  ctx.fill();

  // Main Camera Lens (Outer Ring)
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(cx, cy + 4, 34, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  // Lens Glass & Reflection
  const lensGrad = ctx.createRadialGradient(cx - 8, cy - 4, 2, cx, cy + 4, 26);
  lensGrad.addColorStop(0, accentColor);
  lensGrad.addColorStop(0.4, accentSecondary);
  lensGrad.addColorStop(1, '#020617');
  ctx.beginPath();
  ctx.arc(cx, cy + 4, 24, 0, Math.PI * 2);
  ctx.fillStyle = lensGrad;
  ctx.fill();

  // Aperture Blades / Crosshair
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 4);
  ctx.lineTo(cx + 12, cy + 4);
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx, cy + 16);
  ctx.stroke();

  // Lens Glass Glint
  ctx.beginPath();
  ctx.arc(cx - 8, cy - 4, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();

  // Floating Wings / Freecam Freedom Motion Orbits
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 68, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 68, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();

  // Version & Mod Label
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREECAM', cx, 48);

  ctx.fillStyle = accentColor;
  ctx.font = '600 13px "Fira Code", monospace';
  ctx.fillText('v1.26.52 • LEVIPACK', cx, 230);

  return canvas.toDataURL('image/png');
}

/**
 * Converts a base64 Data URL to a Uint8Array for zip packaging
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
