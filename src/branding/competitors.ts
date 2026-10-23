import claudeCodeLogo from '../assets/logos/claude-code.svg'
import codexLogo from '../assets/logos/openai-codex.png'
import copilotLogo from '../assets/logos/github-copilot.png'
import cursorLogo from '../assets/logos/cursor.png'
import geminiLogo from '../assets/logos/gemini.png'

export interface CompetitorBrand {
  logo: string
  /** Hull tint used behind the logo on the grid. */
  tint: string
}

export const COMPETITOR_BRANDS: Record<string, CompetitorBrand> = {
  copilot: { logo: copilotLogo, tint: '#e9ecf2' },
  cursor: { logo: cursorLogo, tint: '#ecebe8' },
  'claude-code': { logo: claudeCodeLogo, tint: '#f6e7df' },
  codex: { logo: codexLogo, tint: '#e6f0ec' },
  gemini: { logo: geminiLogo, tint: '#e6ecfb' },
}

export function brandFor(shipId: string): CompetitorBrand | undefined {
  return COMPETITOR_BRANDS[shipId]
}
