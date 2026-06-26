/**
 * MUI Theme for Dinnerly.
 * Warm, restrained app styling for a production meal-planning tool.
 */
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    background: {
      default: "#F7F5F1",
      paper: "#FFFFFF",
    },
    primary: {
      main: "#241F1C",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#7A5E2B",
      contrastText: "#FFFFFF",
    },
    text: {
      primary: "#1F1B18",
      secondary: "#625852",
    },
    divider: "#E3DDD4",
    action: {
      hover: "rgba(43, 37, 34, 0.06)",
      selected: "rgba(122, 94, 43, 0.12)",
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
      fontWeight: 760,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 720,
      letterSpacing: 0,
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
    borderRadius: 8,
  },
  components: {
    // AppBar styling - clean white header
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#1F1B18",
          borderBottom: "1px solid #E3DDD4",
          boxShadow: "0 1px 0 rgba(31, 27, 24, 0.04)",
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
          borderRadius: 8,
          minHeight: 38,
          boxShadow: "none",
          "&:focus": {
            outline: "none",
          },
          "&.MuiButton-contained": {
            boxShadow: "none",
          },
          "&.MuiButton-contained:hover": {
            boxShadow: "none",
          },
        },
        containedSecondary: {
          backgroundColor: "#7A5E2B",
          "&:hover": {
            backgroundColor: "#654B20",
          },
        },
        outlinedPrimary: {
          borderColor: "#CFC5B7",
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
          border: "1px solid #E3DDD4",
          boxShadow: "0 1px 2px rgba(31, 27, 24, 0.04)",
          borderRadius: "8px",
          transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
          "&:hover": {
            borderColor: "#D2C7B8",
            boxShadow: "0 10px 24px rgba(31, 27, 24, 0.08)",
          },
        },
      },
    },
    // Input styling
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          borderRadius: 8,
          "& fieldset": {
            borderColor: "#D8D0C5",
          },
          "&:hover fieldset": {
            borderColor: "#B8AA98",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#7A5E2B",
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
            backgroundColor: "#F3EFE8",
            fontWeight: 700,
            color: "#241F1C",
          },
        },
      },
    },
    // Table styling
    MuiTable: {
      styleOverrides: {
        root: {
          border: "0",
        },
      },
    },
    // Chip styling
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
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
