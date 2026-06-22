export const DARK_COLORS = {
  background: '#0f1117',      // Deep slate / dark background
  surface: '#1a1d27',         // Darker gray-blue cards
  textPrimary: '#e8eaed',     // Off-white for high contrast and readability
  textSecondary: '#9aa0a6',   // Soft gray for details
  primary: '#ffffff',         // Absolute white for high-contrast actions on dark
  accent: '#d4af37',          // Brand gold accent remains the same
  border: 'rgba(255,255,255,0.10)', // White ghost border for dark screen dividers
  inputBackground: '#252836', // Muted dark input fields
  
  // Status Colors (Adjusted for dark mode visibility)
  status: {
    concluido: {
      background: '#163b24',  // Dark green container
      text: '#4ade80',        // Bright light green text
    },
    confirmado: {
      background: '#0c3247',  // Dark blue container
      text: '#38bdf8',        // Bright light blue text
    },
    cancelado: {
      background: '#3b1414',  // Dark red container
      text: '#ff8a80',        // Bright light red text
    },
    pendente: {
      background: '#3d240d',  // Dark amber container
      text: '#fbbf24',        // Bright light amber text
    }
  },

  terracota: '#d4af37',       // Brand gold
};
