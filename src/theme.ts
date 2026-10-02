export const theme = {
  colors: {
    // Primary Emerald Accents
    primary: '#059669', // Emerald 600
    primaryHover: '#047857',
    primaryLight: '#ecfdf5', // Emerald 50
    primaryBorder: '#a7f3d0', // Emerald 200

    // Canvas & Card Surfaces (Clean Minimal White)
    background: '#f8fafc', // Slate 50
    cardBg: '#ffffff', // Pure White
    cardBorder: '#e2e8f0', // Slate 200
    subtleBg: '#f1f5f9', // Slate 100

    // Typography
    textPrimary: '#0f172a', // Slate 900
    textSecondary: '#475569', // Slate 600
    textMuted: '#94a3b8', // Slate 400

    // Score Highlights (Soft Pastels)
    eagleBg: '#fef3c7', // Soft Amber
    eagleText: '#92400e',
    birdieBg: '#d1fae5', // Soft Mint
    birdieText: '#065f46',
    parBg: 'transparent',
    parText: '#0f172a',
    bogeyBg: '#ffedd5', // Soft Peach
    bogeyText: '#9a3412',
    doubleBogeyBg: '#fee2e2', // Soft Red
    doubleBogeyText: '#991b1b',

    // Payment App Brand Colors (Subtle & Crisp)
    venmo: '#008CFF',
    paypal: '#003087',
    cashapp: '#059669',
    zelle: '#7414CA',
  },
  shadows: {
    card: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    float: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    button: {
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    }
  }
};
