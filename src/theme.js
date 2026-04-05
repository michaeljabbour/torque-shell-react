import { createTheme } from '@mui/material/styles';

/**
 * Creates the default MUI theme for the Torque shell.
 * @param {object} themeConfig - Optional theme overrides from config.shell.theme
 * @returns MUI theme object
 */
export function createDefaultTheme(themeConfig = {}) {
  const mode = themeConfig.mode || 'dark';
  const primaryColor = themeConfig.primary || '#5ee6b8';

  const darkPalette = {
    background: {
      default: '#0d1117',
      paper: '#151b23',
    },
    text: {
      primary: '#e6edf3',
      secondary: '#9da5b4',
      disabled: '#656d76',
    },
    divider: 'rgba(255,255,255,0.08)',
  };

  return createTheme({
    palette: {
      mode,
      primary: { main: primaryColor },
      ...(mode === 'dark' ? darkPalette : {}),
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  });
}
