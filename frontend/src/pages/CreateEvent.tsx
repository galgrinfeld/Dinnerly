import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { EventFormPage } from "./EventFormPage";
import { createEvent } from "../api/events";

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState<Dayjs | null>(dayjs());
  const [targetServings, setTargetServings] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): { valid: boolean; error: string | null } => {
    if (!name.trim()) {
      return { valid: false, error: "Event name is required" };
    }
    if (!eventDate) {
      return { valid: false, error: "Event date is required" };
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
        eventDate: eventDate!.format("YYYY-MM-DD"),
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
  const dateError = submitted && !eventDate;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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

        {/* Event Date */}
        <DatePicker
          label="Event Date"
          value={eventDate}
          onChange={(newDate) => {
            setEventDate(newDate);
            setError(null);
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              error: dateError,
              helperText: dateError ? "Event date is required" : "",
              disabled: loading,
            },
          }}
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
    </LocalizationProvider>
  );
};

export default CreateEvent;
