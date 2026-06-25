/**
 * Utility to parse QR code text into colors or structured palettes.
 */

// Regular expression to check if a string is a simple hex color
const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function parsePaletteText(text) {
  if (!text) return null;
  const trimmed = text.trim();

  // 1. Check if it's a single hex color
  if (HEX_COLOR_REGEX.test(trimmed)) {
    const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    return {
      type: 'single-color',
      name: 'Color Individual',
      colors: [
        {
          name: 'Color Escaneado',
          hex: hex.toLowerCase()
        }
      ],
      rawText: trimmed
    };
  }

  // 2. Parse structured palette (typically Markdown format)
  const lines = trimmed.split(/\r?\n/);
  let paletteName = 'Paleta Escaneada';
  let categories = [];
  let currentCategory = null;

  // Track if we found any valid colors at all
  let totalColorsCount = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // A. Parse Palette Name (e.g. "# Paleta: girl cover gta 5" or "# girl cover gta 5")
    if (line.startsWith('#') && !line.startsWith('##')) {
      const match = line.match(/^#\s*(?:Paleta:\s*)?(.*)$/i);
      if (match && match[1]) {
        paletteName = match[1].trim();
      }
      continue;
    }

    // B. Parse Category (e.g. "## Color base" or "## Sombras")
    if (line.startsWith('##')) {
      const match = line.match(/^##\s*(.*)$/);
      if (match && match[1]) {
        const catName = match[1].trim();
        currentCategory = {
          name: catName,
          colors: []
        };
        categories.push(currentCategory);
      }
      continue;
    }

    // C. Parse Color lines (e.g. "- piel gta 5: #ffc98b" or " lengua: #f48c7f" or just "piel: #ffc98b")
    // Let's find if there is a hex color in the line
    const hexMatch = line.match(/(#[0-9a-fA-F]{3,8})/);
    if (hexMatch) {
      const hex = hexMatch[1].toLowerCase();
      
      // Extract color name: everything before the hex value and colons, stripping list symbols (- or *)
      let namePart = line.replace(hexMatch[1], '').trim();
      
      // Clean up punctuation at the end of namePart (like : or -) and bullet symbols at the start
      namePart = namePart
        .replace(/^[\s\-\*\+]+/, '') // Remove list bullets
        .replace(/[:\-\s]+$/, '')    // Remove trailing colons, dashes or spaces
        .trim();

      const colorName = namePart || `Color ${totalColorsCount + 1}`;

      // If we don't have a category yet, create a default one
      if (!currentCategory) {
        currentCategory = {
          name: 'General',
          colors: []
        };
        categories.push(currentCategory);
      }

      currentCategory.colors.push({
        name: colorName,
        hex: hex
      });
      totalColorsCount++;
    }
  }

  // If we couldn't parse any colors, but there's text, try to extract any hex codes in the entire text
  if (totalColorsCount === 0) {
    const allHexes = trimmed.match(/#[0-9a-fA-F]{3,8}/g);
    if (allHexes && allHexes.length > 0) {
      const uniqueHexes = [...new Set(allHexes)];
      const defaultCategory = {
        name: 'Colores Detectados',
        colors: uniqueHexes.map((hex, index) => ({
          name: `Color ${index + 1}`,
          hex: hex.toLowerCase()
        }))
      };
      categories.push(defaultCategory);
      totalColorsCount = uniqueHexes.length;
    }
  }

  // If we still have no colors, treat the whole thing as a text block
  if (totalColorsCount === 0) {
    return {
      type: 'text',
      name: 'Texto Escaneado',
      text: trimmed,
      rawText: trimmed
    };
  }

  return {
    type: 'palette',
    name: paletteName,
    categories: categories.filter(cat => cat.colors.length > 0),
    rawText: trimmed
  };
}
