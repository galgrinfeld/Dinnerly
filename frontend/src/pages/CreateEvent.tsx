import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField } from "@mui/material";
import { EventFormPage } from "./EventFormPage";
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
      const result = await createEvent({
        name,
        targetServings,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/events/${result.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const nameError = submitted && !name.trim();

  return (
    <EventFormPage
      title="Create New Event"
      subtitle="Start by naming your event and setting the target servings. You'll add participants and recipes next."
      submitLabel="Create Event"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={loading}
      error={error}
      success={success}
    >
      {/* Event Name */}
      <TextField
        label="Event Name"
        fullWidth
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
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
        onChange={(e) => {
          setTargetServings(Math.max(1, parseInt(e.target.value) || 1));
          setError(null);
        }}
        inputProps={{ min: 1 }}
        disabled={loading}
      />
    </EventFormPage>
  );
};

export default CreateEvent;
