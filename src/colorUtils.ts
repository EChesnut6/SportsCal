/**
 * Utility functions for color manipulation and CSS variable injection
 */

/**
 * Directly updates CSS custom properties for a league on :root without triggering React re-renders.
 */
export function applyLeagueColor(league: string, color: string) {
  const root = document.documentElement;
  root.style.setProperty(`--color-${league}`, color);

  // Parse Hex to RGBA for Glow
  let r = 0, g = 0, b = 0;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  }
  root.style.setProperty(`--glow-${league}`, `rgba(${r}, ${g}, ${b}, 0.2)`);
}
