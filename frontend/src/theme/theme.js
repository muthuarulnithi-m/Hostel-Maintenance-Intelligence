import { createTheme, alpha } from '@mui/material/styles';

// ─── Brand Palette ────────────────────────────────────────────────────────────
const BRAND = {
  navy:       '#0F172A',   // sidebar background
  navyLight:  '#1E293B',   // sidebar hover / card bg
  navyBorder: '#334155',   // sidebar borders
  indigo:     '#4F46E5',   // primary accent
  indigoLight:'#6366F1',   // primary hover
  indigoPale: '#EEF2FF',   // primary tint on white bg
  teal:       '#0D9488',   // secondary accent
  amber:      '#F59E0B',   // warning / medium priority
  rose:       '#F43F5E',   // error / high / critical
  emerald:    '#10B981',   // success / resolved
  sky:        '#0EA5E9',   // info / in-progress
  slate50:    '#F8FAFC',   // page background
  slate100:   '#F1F5F9',
  slate200:   '#E2E8F0',
  slate400:   '#94A3B8',
  slate600:   '#475569',
  slate700:   '#334155',
  slate900:   '#0F172A',
};

const theme = createTheme({
  // ─── Palette ──────────────────────────────────────────────────────────────
  palette: {
    mode: 'light',
    primary: {
      main:        BRAND.indigo,
      light:       BRAND.indigoLight,
      dark:        '#3730A3',
      contrastText:'#FFFFFF',
    },
    secondary: {
      main:        BRAND.teal,
      contrastText:'#FFFFFF',
    },
    error: {
      main: BRAND.rose,
    },
    warning: {
      main: BRAND.amber,
    },
    success: {
      main: BRAND.emerald,
    },
    info: {
      main: BRAND.sky,
    },
    background: {
      default: BRAND.slate50,
      paper:   '#FFFFFF',
    },
    text: {
      primary:   BRAND.slate900,
      secondary: BRAND.slate600,
      disabled:  BRAND.slate400,
    },
    divider: BRAND.slate200,

    // Custom tokens available via theme.palette.brand
    brand: BRAND,
  },

  // ─── Typography ───────────────────────────────────────────────────────────
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h1: { fontSize: '2rem',    fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25 },
    h3: { fontSize: '1.5rem',  fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.35 },
    h5: { fontSize: '1.125rem',fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '1rem',    fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem',  fontWeight: 500, lineHeight: 1.57, color: BRAND.slate600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem',  lineHeight: 1.57, color: BRAND.slate600 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, color: BRAND.slate400 },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },

  // ─── Shape ────────────────────────────────────────────────────────────────
  shape: {
    borderRadius: 10,
  },

  // ─── Shadows ──────────────────────────────────────────────────────────────
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
    '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)',
    '0 20px 25px -5px rgb(0 0 0 / 0.07), 0 8px 10px -6px rgb(0 0 0 / 0.07)',
    ...Array(19).fill('none'),
  ],

  // ─── Component Overrides ──────────────────────────────────────────────────
  components: {

    // Button
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 18px',
          fontSize: '0.875rem',
          fontWeight: 600,
          transition: 'all 0.15s ease',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${BRAND.indigo} 0%, ${BRAND.indigoLight} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, #3730A3 0%, ${BRAND.indigo} 100%)`,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 12px ${alpha(BRAND.indigo, 0.35)}`,
          },
        },
        outlinedPrimary: {
          borderColor: BRAND.indigo,
          '&:hover': {
            backgroundColor: BRAND.indigoPale,
          },
        },
        sizeSmall: { padding: '5px 12px', fontSize: '0.8125rem' },
        sizeLarge: { padding: '11px 24px', fontSize: '0.9375rem' },
      },
    },

    // Card
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${BRAND.slate200}`,
          borderRadius: 12,
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
          },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          '&:last-child': { paddingBottom: 20 },
        },
      },
    },

    // Paper
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },

    // TextField
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#fff',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.indigo,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.indigo,
            borderWidth: 2,
          },
        },
        notchedOutline: {
          borderColor: BRAND.slate200,
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color: BRAND.slate600,
          '&.Mui-focused': { color: BRAND.indigo },
        },
      },
    },

    // Chip
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
        },
        sizeSmall: { height: 20, fontSize: '0.6875rem' },
      },
    },

    // Table
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: BRAND.slate50,
            color: BRAND.slate600,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: `2px solid ${BRAND.slate200}`,
            padding: '10px 16px',
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderBottom: `1px solid ${BRAND.slate100}`,
          padding: '12px 16px',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(BRAND.indigo, 0.03),
            cursor: 'pointer',
          },
          '&:last-child td': { border: 0 },
        },
      },
    },

    // AppBar
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: BRAND.slate900,
          borderBottom: `1px solid ${BRAND.slate200}`,
        },
      },
    },

    // Drawer
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND.navy,
          border: 'none',
        },
      },
    },

    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '20px 24px 12px',
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '12px 24px 20px' },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 24px 20px',
          gap: 8,
        },
      },
    },

    // Tooltip
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: BRAND.slate900,
          fontSize: '0.75rem',
          borderRadius: 6,
          padding: '5px 10px',
        },
        arrow: { color: BRAND.slate900 },
      },
    },

    // Divider
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: BRAND.slate200 },
      },
    },

    // Alert
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontSize: '0.875rem' },
        standardInfo:    { backgroundColor: alpha(BRAND.sky,     0.1), color: '#0369a1' },
        standardSuccess: { backgroundColor: alpha(BRAND.emerald, 0.1), color: '#065f46' },
        standardWarning: { backgroundColor: alpha(BRAND.amber,   0.1), color: '#92400e' },
        standardError:   { backgroundColor: alpha(BRAND.rose,    0.1), color: '#9f1239' },
      },
    },

    // Snackbar
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
        autoHideDuration: 4000,
      },
    },

    // ListItemButton (used in Sidebar)
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          padding: '8px 12px',
          transition: 'all 0.15s ease',
        },
      },
    },

    // Badge
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '0.6875rem',
          fontWeight: 700,
          minWidth: 18,
          height: 18,
        },
      },
    },
  },
});

export default theme;