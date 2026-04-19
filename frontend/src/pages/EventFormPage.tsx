import React from "react";
import {
  Container,
  Card,
  Box,
  Typography,
  Stack,
  Button,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

interface EventFormPageProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  children: React.ReactNode;
}

export const EventFormPage: React.FC<EventFormPageProps> = ({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onCancel,
  isLoading,
  error,
  success,
  children,
}) => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Page Header */}
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: "#171717",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "#5C524E",
            fontSize: "0.95rem",
          }}
        >
          {subtitle}
        </Typography>
      </Stack>

      {/* Alerts */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {success && (
          <Alert severity="success" sx={{ borderRadius: "12px" }}>
            ✓ Success! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {error}
          </Alert>
        )}
      </Stack>

      {/* Form Card */}
      <Card
        sx={{
          border: "1px solid #E8E4DF",
          boxShadow: "0 4px 12px rgba(43, 37, 34, 0.06)",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2.5,
              color: "#171717",
              fontSize: "1.05rem",
            }}
          >
            Event Details
          </Typography>
          <Divider sx={{ mb: 3, borderColor: "#E8E4DF" }} />

          <Stack spacing={3}>{children}</Stack>
        </Box>
      </Card>

      {/* Action Bar - Bottom */}
      <Box
        sx={{
          mt: 4,
          pt: 3,
          borderTop: "1px solid #E8E4DF",
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={onSubmit}
          disabled={isLoading || success}
          sx={{
            minWidth: "140px",
            backgroundColor: "#2B2522",
            "&:hover": {
              backgroundColor: "#1a1410",
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            submitLabel
          )}
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={onCancel}
          disabled={isLoading || success}
          sx={{
            minWidth: "120px",
            borderColor: "#B39760",
            color: "#2B2522",
            "&:hover": {
              backgroundColor: "rgba(138, 106, 47, 0.05)",
            },
          }}
        >
          Cancel
        </Button>
      </Box>
    </Container>
  );
};
