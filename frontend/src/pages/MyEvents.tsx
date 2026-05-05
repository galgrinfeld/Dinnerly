import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { listEvents } from "../api/events";
import { EventRead, EventMemberRead } from "../types/api";
import { EventSummaryCard } from "../components/EventSummaryCard";
import { EmptyStateBlock } from "../components/EmptyStateBlock";
import { me } from "../api/auth";
import { UserRead } from "../types/api";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index } = props;

  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </Box>
  );
};

export const MyEvents: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserRead | null>(null);

  useEffect(() => {
    // Fetch current user
    me()
      .then((user) => {
        setCurrentUser(user);
      })
      .catch((err) => {
        console.error("Failed to load user:", err);
        setCurrentUser(null);
      });

    // Fetch events
    listEvents()
      .then((data) => {
        setEvents(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load events");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const isOwner = (event: EventRead): boolean => {
    if (!currentUser) return false;
    const ownerMember = event.members?.find((m) => m.role === "owner");
    return ownerMember?.email === currentUser.email;
  };

  const ownedEvents = events.filter((event) => isOwner(event));
  const sharedEvents = events.filter((event) => !isOwner(event));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewEvent = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#2B2522" }}>
          My Events
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/events/new")}
          sx={{
            backgroundColor: "#8A6A2F",
            color: "#fff",
            textTransform: "none",
            "&:hover": { backgroundColor: "#6F5623" },
          }}
        >
          Create Event
        </Button>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {events.length === 0 ? (
        <EmptyStateBlock
          emoji="🎉"
          title="No events yet"
          message="Create or join your first event to get started with Dinnerly."
        />
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="event tabs">
              <Tab
                label={`All Events (${events.length})`}
                sx={{
                  textTransform: "none",
                  fontSize: "1rem",
                  color: tabValue === 0 ? "#8A6A2F" : "#5C524E",
                  fontWeight: tabValue === 0 ? 700 : 500,
                  "&.Mui-selected": {
                    color: "#8A6A2F",
                  },
                }}
              />
              <Tab
                label={`Owned by Me (${ownedEvents.length})`}
                sx={{
                  textTransform: "none",
                  fontSize: "1rem",
                  color: tabValue === 1 ? "#8A6A2F" : "#5C524E",
                  fontWeight: tabValue === 1 ? 700 : 500,
                  "&.Mui-selected": {
                    color: "#8A6A2F",
                  },
                }}
              />
              <Tab
                label={`Shared with Me (${sharedEvents.length})`}
                sx={{
                  textTransform: "none",
                  fontSize: "1rem",
                  color: tabValue === 2 ? "#8A6A2F" : "#5C524E",
                  fontWeight: tabValue === 2 ? 700 : 500,
                  "&.Mui-selected": {
                    color: "#8A6A2F",
                  },
                }}
              />
            </Tabs>
          </Box>

          {/* All Events Tab */}
          <TabPanel value={tabValue} index={0}>
            {events.length === 0 ? (
              <EmptyStateBlock
                emoji="🎉"
                title="No events yet"
                message="Create or join your first event to get started with Dinnerly."
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 3,
                }}
              >
                {events.map((event) => (
                  <EventSummaryCard
                    key={event.id}
                    event={event}
                    onViewEvent={handleViewEvent}
                  />
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Owned Events Tab */}
          <TabPanel value={tabValue} index={1}>
            {ownedEvents.length === 0 ? (
              <EmptyStateBlock
                emoji="📝"
                title="No events owned yet"
                message="Create your first event to start planning meals with friends."
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 3,
                }}
              >
                {ownedEvents.map((event) => (
                  <EventSummaryCard
                    key={event.id}
                    event={event}
                    onViewEvent={handleViewEvent}
                  />
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Shared Events Tab */}
          <TabPanel value={tabValue} index={2}>
            {sharedEvents.length === 0 ? (
              <EmptyStateBlock
                emoji="🤝"
                title="No events shared yet"
                message="Ask friends to invite you to their events."
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 3,
                }}
              >
                {sharedEvents.map((event) => (
                  <EventSummaryCard
                    key={event.id}
                    event={event}
                    onViewEvent={handleViewEvent}
                  />
                ))}
              </Box>
            )}
          </TabPanel>
        </>
      )}
    </Container>
  );
};
