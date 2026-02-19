import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { createEvent } from "../api/events";

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [targetServings, setTargetServings] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): { valid: boolean; error: string | null } => {
    if (!name.trim()) {
      return { valid: false, error: "Event name is required" };
    }
    if (targetServings <= 0) {
      return { valid: false, error: "Target servings must be at least 1" };
    }
    return { valid: true, error: null };
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const validation = validateForm();

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createEvent({
        name,
        targetServings,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName("");
    setTargetServings(4);
    setError(null);
    setSuccess(false);
    setSubmitted(false);
  };

  const nameError = submitted && !name.trim();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: "bold" }}>
        Create Event
      </Typography>

      <Stack spacing={3}>
        {/* Success Alert */}
        {success && (
          <Alert severity="success">
            Event created successfully! Redirecting to home...
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {/* Event Name */}
        <TextField
          label="Event Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          helperText={nameError ? "Event name is required" : ""}
          placeholder="e.g. Dinner Party"
          disabled={loading}
        />

        {/* Target Servings */}
        <TextField
          label="Target Servings"
          type="number"
          value={targetServings}
          onChange={(e) => setTargetServings(Math.max(1, parseInt(e.target.value) || 1))}
          inputProps={{ min: 1 }}
          disabled={loading}
        />

        {/* Actions */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={loading || success}
            sx={{ position: "relative" }}
          >
            {loading ? <CircularProgress size={24} /> : "Create Event"}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleReset}
            disabled={loading || success}
          >
            Reset
          </Button>
          <Button
            variant="text"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default CreateEvent;
