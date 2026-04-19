import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Box,
  Alert,
  CircularProgress,
  TextField,
} from "@mui/material";
import { EventFormPage } from "./EventFormPage";
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
  const [success, setSuccess] = useState(false);

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
    setSaveError(null);
    setValidationError(null);
  };

  const handleServingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFormData({ ...formData, targetServings: isNaN(value) ? 0 : value });
    setSaveError(null);
    setValidationError(null);
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

      setSuccess(true);
      setTimeout(() => {
        navigate(`/events/${event.id}`, { replace: true });
      }, 1500);
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

  // Show loading spinner while fetching event data
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error if event failed to load
  if (loadError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      </Container>
    );
  }

  const error = saveError || validationError;

  return (
    <EventFormPage
      title="Edit Event"
      subtitle="Update the basic details of your event."
      submitLabel="Save Changes"
      onSubmit={handleSave}
      onCancel={handleCancel}
      isLoading={saving}
      error={error}
      success={success}
    >
      {/* Event Name */}
      <TextField
        label="Event Name"
        fullWidth
        value={formData.name}
        onChange={handleNameChange}
        error={!formData.name.trim() && validationError !== null}
        helperText={
          !formData.name.trim() && validationError !== null
            ? "Event name is required"
            : ""
        }
        placeholder="e.g. Dinner Party"
        disabled={saving}
      />

      {/* Target Servings */}
      <TextField
        label="Target Servings"
        type="number"
        value={formData.targetServings}
        onChange={handleServingsChange}
        error={formData.targetServings <= 0 && validationError !== null}
        helperText={
          formData.targetServings <= 0 && validationError !== null
            ? "Target servings must be greater than 0"
            : ""
        }
        inputProps={{ min: 1 }}
        disabled={saving}
      />
    </EventFormPage>
  );
};

export default EditEvent;
