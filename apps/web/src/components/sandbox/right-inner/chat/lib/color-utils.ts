/**
 * Color conversion utilities for working with OKLCH and RGB color spaces
 */

/**
 * Convert OKLCH color values to RGB
 * @param l Lightness (0-1)
 * @param c Chroma (0-1)
 * @param h Hue in degrees (0-360)
 * @returns RGB values as [r, g, b] where each component is 0-1
 */
export function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
    // Convert hue from degrees to radians
    const hRad = (h * Math.PI) / 180

    // Convert OKLCH to OKLab
    const a = c * Math.cos(hRad)
    const b = c * Math.sin(hRad)

    // Convert OKLab to linear RGB using the correct OKLab matrix
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b
    const s_ = l - 0.0894841775 * a - 1.291485548 * b

    const l_cubed = l_ * l_ * l_
    const m_cubed = m_ * m_ * m_
    const s_cubed = s_ * s_ * s_

    // Convert to linear RGB using the correct transformation matrix
    let r = +4.0767416621 * l_cubed - 3.3077115913 * m_cubed + 0.2309699292 * s_cubed
    let g = -1.2684380046 * l_cubed + 2.6097574011 * m_cubed - 0.3413193965 * s_cubed
    let bl = -0.0041960863 * l_cubed - 0.7034186147 * m_cubed + 1.707614701 * s_cubed

    // Apply gamma correction (linear RGB to sRGB)
    r = r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : 12.92 * r
    g = g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : 12.92 * g
    bl = bl > 0.0031308 ? 1.055 * bl ** (1 / 2.4) - 0.055 : 12.92 * bl

    // Clamp values to [0, 1] and return
    return [Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, bl))]
}

/**
 * Parse an OKLCH color string and convert to RGB
 * @param oklchString CSS OKLCH color string (e.g., "oklch(0.7 0.15 270)")
 * @returns RGB values as [r, g, b] where each component is 0-1
 */
export function parseOklchColor(oklchString: string): [number, number, number] {
    const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    if (!match) {
        console.warn(`Could not parse oklch color: ${oklchString}`)
        return [1, 1, 1] // fallback to white
    }

    const l = Number.parseFloat(match[1])
    const c = Number.parseFloat(match[2])
    const h = Number.parseFloat(match[3])

    return oklchToRgb(l, c, h)
}

/**
 * Get the value of a CSS custom property from the document root
 * @param property CSS custom property name (e.g., "--primary")
 * @returns The computed value of the CSS custom property
 */
export function getCSSCustomProperty(property: string): string {
    const root = document.documentElement
    const value = getComputedStyle(root).getPropertyValue(property).trim()
    return value
}
