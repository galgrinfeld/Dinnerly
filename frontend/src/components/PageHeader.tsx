import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";

interface PageHeaderAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "contained" | "outlined";
  color?: "primary" | "error";
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  primaryAction?: PageHeaderAction;
  secondaryAction?: PageHeaderAction;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4,
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 2, sm: 0 },
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#2B2522",
            marginBottom: subtitle ? 0.5 : 0,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              color: "#666",
              fontSize: "0.95rem",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {(primaryAction || secondaryAction) && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            width: { xs: "100%", sm: "auto" },
          }}
        >
          {primaryAction && (
            <Button
            variant={primaryAction.variant || "contained"}
              startIcon={primaryAction.icon}
              onClick={primaryAction.onClick}
              sx={{
                backgroundColor:
                  primaryAction.variant === "outlined"
                    ? "transparent"
                    : "#8A6A2F",
                color:
                  primaryAction.variant === "outlined" ? "#B39760" : "white",
                border:
                  primaryAction.variant === "outlined"
                    ? "1px solid #B39760"
                    : "none",
                "&:hover": {
                  backgroundColor:
                    primaryAction.variant === "outlined"
                      ? "rgba(179, 151, 96, 0.1)"
                      : "#6F5623",
                },
                textTransform: "none",
                fontSize: "0.95rem",
                padding: "9px 18px",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || "outlined"}
              startIcon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
              color={secondaryAction.color || "inherit"}
              sx={{
                backgroundColor:
                  secondaryAction.variant === "outlined"
                    ? "transparent"
                    : undefined,
                borderColor:
                  secondaryAction.variant === "outlined" ? "#B39760" : undefined,
                color:
                  secondaryAction.variant === "outlined"
                    ? "#B39760"
                    : undefined,
                "&:hover": {
                  backgroundColor:
                    secondaryAction.variant === "outlined"
                      ? "rgba(179, 151, 96, 0.1)"
                      : undefined,
                },
                textTransform: "none",
                fontSize: "0.95rem",
                padding: "9px 18px",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
};
