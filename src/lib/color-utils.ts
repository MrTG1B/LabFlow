
/**
 * Generates a consistent, visually pleasing HSL color from a string.
 * @param str The input string to hash.
 * @returns An HSL color string (e.g., "240 60% 70%").
 */
export function generateColorFromString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }

    const hue = Math.abs(hash) % 360;
    const saturation = 60 + (Math.abs(hash) % 15); // Saturation between 60-75%
    const lightness = 65 + (Math.abs(hash) % 10); // Lightness between 65-75%

    return `${hue} ${saturation}% ${lightness}%`;
}
