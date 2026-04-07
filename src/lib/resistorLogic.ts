export const COLOR_CODES: Record<string, { value: number, multiplier: number, tolerance?: number }> = {
  black: { value: 0, multiplier: 1 },
  brown: { value: 1, multiplier: 10, tolerance: 1 },
  red: { value: 2, multiplier: 100, tolerance: 2 },
  orange: { value: 3, multiplier: 1000 },
  yellow: { value: 4, multiplier: 10000 },
  green: { value: 5, multiplier: 100000, tolerance: 0.5 },
  blue: { value: 6, multiplier: 1000000, tolerance: 0.25 },
  violet: { value: 7, multiplier: 10000000, tolerance: 0.1 },
  grey: { value: 8, multiplier: 100000000, tolerance: 0.05 },
  white: { value: 9, multiplier: 1000000000 },
  gold: { value: -1, multiplier: 0.1, tolerance: 5 },
  silver: { value: -1, multiplier: 0.01, tolerance: 10 },
};

export function calculateResistance(bands: string[]) {
  if (bands.length < 3) return null;

  const b1 = COLOR_CODES[bands[0].toLowerCase()];
  const b2 = COLOR_CODES[bands[1].toLowerCase()];
  const multiplierBand = COLOR_CODES[bands[bands.length - 2].toLowerCase()];
  const toleranceBand = bands.length >= 4 ? COLOR_CODES[bands[bands.length - 1].toLowerCase()] : null;

  if (!b1 || !b2 || !multiplierBand) return null;

  const baseValue = (b1.value * 10) + b2.value;
  const resistance = baseValue * multiplierBand.multiplier;
  const tolerance = toleranceBand?.tolerance || 20;

  return {
    resistance,
    formatted: formatResistance(resistance),
    tolerance,
  };
}

function formatResistance(ohms: number): string {
  if (ohms >= 1000000) return (ohms / 1000000).toFixed(1) + " MΩ";
  if (ohms >= 1000) return (ohms / 1000).toFixed(1) + " kΩ";
  return ohms + " Ω";
}
