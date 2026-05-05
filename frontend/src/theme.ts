/**
 * MUI Theme for Dinnerly with Nespresso-inspired design.
 * Clean white header, anthracite primary, bronze accents.
 */
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    background: {
      default: "#FFFFFF", // white
      paper: "#FFFFFF",
    },
    primary: {
      main: "#2B2522",         // espresso/anthracite brand
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#8A6A2F",         // bronze/gold accent
      contrastText: "#FFFFFF",
    },
    text: {
      primary: "#171717",      // anthracite
      secondary: "#5C524E",    // muted text
    },
    divider: "#B39760",  // bronze-toned border
    action: {
      hover: "rgba(43, 37, 34, 0.06)",
      selected: "rgba(138, 106, 47, 0.14)", // subtle bronze selected state
      disabledOpacity: 0.38,
    },
    success: {
      main: "#2E7D32",
    },
    warning: {
      main: "#ED6C02",
    },
    error: {
      main: "#D32F2F",
    },
    info: {
      main: "#0288D1",
    },
  },
  typography: {
    fontFamily: '"Heebo","Inter","Arial",sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    // AppBar styling - clean white header
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#171717",
          borderBottom: "1px solid #B39760",
          boxShadow: "none",
        },
      },
    },
    // Toolbar sizing
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
        },
      },
    },
    // Button styling
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          "&:focus": {
            outline: "none",
          },
        },
        containedSecondary: {
          backgroundColor: "#8A6A2F",
          "&:hover": {
            backgroundColor: "#7A5D29",
          },
        },
        outlinedPrimary: {
          borderColor: "#B39760",
          "&:hover": {
            backgroundColor: "rgba(43, 37, 34, 0.04)",
          },
        },
      },
    },
    // Paper/Card styling
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    // Card styling - subtle modern design
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(151, 111, 39, 0.18)",
          boxShadow: "0 10px 28px rgba(0, 0, 0, 0.06)",
          borderRadius: "16px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.1)",
          },
        },
      },
    },
    // Input styling
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          "& fieldset": {
            borderColor: "#B39760",
          },
          "&:hover fieldset": {
            borderColor: "#A68B5B",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#8A6A2F",
          },
        },
      },
    },
    // TextField default variant
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    // Table head styling with light bronze tint
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#8A6A2F",
            fontWeight: 700,
            color: "#FFFFFF",
          },
        },
      },
    },
    // Table styling
    MuiTable: {
      styleOverrides: {
        root: {
          border: "1px solid #B39760",
        },
      },
    },
    // Chip styling
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    // Alert styling
    MuiAlert: {
      styleOverrides: {
        standardError: {
          backgroundColor: "rgba(211, 47, 47, 0.08)",
          color: "#D32F2F",
        },
        standardSuccess: {
          backgroundColor: "rgba(46, 125, 50, 0.08)",
          color: "#2E7D32",
        },
        standardWarning: {
          backgroundColor: "rgba(237, 108, 2, 0.08)",
          color: "#ED6C02",
        },
        standardInfo: {
          backgroundColor: "rgba(2, 136, 209, 0.08)",
          color: "#0288D1",
        },
      },
    },
    // List item styling
    MuiListItem: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(43, 37, 34, 0.04)",
          },
        },
      },
    },
    // CssBaseline for body
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          backgroundColor: "#FFFFFF",
        },
      },
    },
  },
});
