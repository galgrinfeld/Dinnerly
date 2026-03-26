import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Stack,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { getEvent, updateEvent } from "../api/events";
import { EventUpdateRequest, EventRead } from "../types/api";

export const EditEvent: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<EventRead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    targetServings: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load event data on mount
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        setLoadError(null);
        const data = await getEvent(parseInt(eventId, 10));
        setEvent(data);
        setFormData({
          name: data.name,
          targetServings: data.targetServings,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load event";
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleServingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFormData({ ...formData, targetServings: isNaN(value) ? 0 : value });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setValidationError("Event name is required");
      return false;
    }
    if (formData.targetServings <= 0) {
      setValidationError("Target servings must be greater than 0");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !event) return;

    try {
      setSaving(true);
      setSaveError(null);

      const payload: EventUpdateRequest = {
        name: formData.name.trim(),
        targetServings: formData.targetServings,
      };

      await updateEvent(event.id, payload);

      // Navigate back to EventDetails on success
      navigate(`/events/${event.id}`, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update event";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (event) {
      navigate(`/events/${event.id}`);
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{loadError}</Alert>
        <Button onClick={() => navigate("/")} sx={{ mt: 2 }}>
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Edit Event
      </Typography>

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      {validationError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}

      <Stack spacing={3}>
        <TextField
          label="Event Name"
          value={formData.name}
          onChange={handleNameChange}
          fullWidth
          disabled={saving}
          error={!!validationError && !formData.name.trim()}
        />

        <TextField
          label="Target Servings"
          type="number"
          value={formData.targetServings}
          onChange={handleServingsChange}
          fullWidth
          disabled={saving}
          inputProps={{ min: 1 }}
          error={!!validationError && formData.targetServings <= 0}
        />

        <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            fullWidth
          >
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={saving}
            fullWidth
          >
            Cancel
          </Button>
        </Box>
      </Stack>
    </Container>
  );
};
