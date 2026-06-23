import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import EventIcon from "@mui/icons-material/Event";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PeopleIcon from "@mui/icons-material/People";
import { PageHeader } from "../components/PageHeader";
import { listEvents } from "../api/events";
import { EventRead } from "../types/api";
import { EventSummaryCard } from "../components/EventSummaryCard";
import { EmptyStateBlock } from "../components/EmptyStateBlock";
import { me } from "../api/auth";
import { UserRead } from "../types/api";

// Types for sorting and filtering
type EventSortOption = "newest" | "oldest" | "soonest" | "name-asc" | "name-desc" | "servings-low" | "servings-high";
type EventFilterOption = "all" | "upcoming" | "past";

// Helper function to sort events
const sortEvents = (events: EventRead[], sortOption: EventSortOption): EventRead[] => {
  const sorted = [...events];
  
  switch (sortOption) {
    case "newest":
      return sorted.reverse();
    case "oldest":
      return sorted;
    case "soonest":
      return sorted.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "servings-low":
      return sorted.sort((a, b) => a.targetServings - b.targetServings);
    case "servings-high":
      return sorted.sort((a, b) => b.targetServings - a.targetServings);
    default:
      return sorted;
  }
};

// Helper function to filter events by date (upcoming/past)
const filterEventsByDate = (events: EventRead[], filterOption: EventFilterOption): EventRead[] => {
  if (filterOption === "all") return events;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return events.filter((event) => {
    const eventDate = new Date(event.eventDate);
    eventDate.setHours(0, 0, 0, 0);
    
    if (filterOption === "upcoming") {
      return eventDate >= today;
    } else {
      return eventDate < today;
    }
  });
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<EventSortOption>("soonest");
  const [filterOption, setFilterOption] = useState<EventFilterOption>("all");

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

  // Apply filtering and sorting to events based on current controls
  const filteredAndSortedEvents = useMemo(() => {
    let result = events;
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter((event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply date filter (upcoming/past)
    result = filterEventsByDate(result, filterOption);
    
    // Apply sorting
    result = sortEvents(result, sortOption);
    
    return result;
  }, [events, searchQuery, sortOption, filterOption]);

  // Apply filtering and sorting to owned events
  const filteredOwnedEvents = useMemo(() => {
    return filteredAndSortedEvents.filter((event) => isOwner(event));
  }, [filteredAndSortedEvents, currentUser]);

  // Apply filtering and sorting to shared events
  const filteredSharedEvents = useMemo(() => {
    return filteredAndSortedEvents.filter((event) => !isOwner(event));
  }, [filteredAndSortedEvents, currentUser]);

  // Apply filtering and sorting to archived events (past events only)
  const filteredArchivedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return filteredAndSortedEvents.filter((event) => {
      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    });
  }, [filteredAndSortedEvents]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewEvent = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  // Helper function to check if any filters are active
  const hasActiveFilters = searchQuery || filterOption !== "all" || sortOption !== "soonest";

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSortOption("soonest");
    setFilterOption("all");
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
      <PageHeader
        title="My Events"
        subtitle="View your events and shared gatherings."
        primaryAction={{
          label: "Create Event",
          icon: <AddIcon />,
          onClick: () => navigate("/events/new"),
        }}
      />

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {events.length === 0 ? (
        <EmptyStateBlock
          icon={<EventIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
          title="No events yet"
          message="Create or join your first event to get started with Dinnerly."
        />
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="event tabs">
              <Tab
                label={`All Events (${filteredAndSortedEvents.length})`}
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
                label={`Owned by Me (${filteredOwnedEvents.length})`}
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
                label={`Shared with Me (${filteredSharedEvents.length})`}
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
              <Tab
                label={`Archive (${filteredArchivedEvents.length})`}
                sx={{
                  textTransform: "none",
                  fontSize: "1rem",
                  color: tabValue === 3 ? "#8A6A2F" : "#5C524E",
                  fontWeight: tabValue === 3 ? 700 : 500,
                  "&.Mui-selected": {
                    color: "#8A6A2F",
                  },
                }}
              />
            </Tabs>
          </Box>

          {/* Controls Toolbar */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              alignItems: { sm: "flex-end" },
            }}
          >
            {/* Search Input */}
            <TextField
              placeholder="Search events by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                flex: 1,
                minWidth: { xs: "100%", sm: 200 },
                "& .MuiOutlinedInput-root": {
                  borderColor: "#B39760",
                },
              }}
            />

            {/* Sort Dropdown */}
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 160 },
              }}
            >
              <InputLabel id="event-sort-label" sx={{ color: "#5C524E" }}>
                Sort by
              </InputLabel>
              <Select
                labelId="event-sort-label"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as EventSortOption)}
                label="Sort by"
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#B39760",
                  },
                }}
              >
                <MenuItem value="soonest">Soonest first</MenuItem>
                <MenuItem value="newest">Newest first</MenuItem>
                <MenuItem value="oldest">Oldest first</MenuItem>
                <MenuItem value="name-asc">Name A-Z</MenuItem>
                <MenuItem value="name-desc">Name Z-A</MenuItem>
                <MenuItem value="servings-low">Servings low to high</MenuItem>
                <MenuItem value="servings-high">Servings high to low</MenuItem>
              </Select>
            </FormControl>

            {/* Date Filter Dropdown */}
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 140 },
              }}
            >
              <InputLabel id="event-date-filter-label" sx={{ color: "#5C524E" }}>
                Date
              </InputLabel>
              <Select
                labelId="event-date-filter-label"
                value={filterOption}
                onChange={(e) => setFilterOption(e.target.value as EventFilterOption)}
                label="Date"
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#B39760",
                  },
                }}
              >
                <MenuItem value="all">All events</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="past">Past</MenuItem>
              </Select>
            </FormControl>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                size="small"
                onClick={clearAllFilters}
                startIcon={<ClearIcon />}
                sx={{
                  color: "#8A6A2F",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </Button>
            )}
          </Box>

          {/* Active Filters Display */}
          {(searchQuery || filterOption !== "all") && (
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {searchQuery && (
                <Chip
                  label={`Search: "${searchQuery}"`}
                  size="small"
                  onDelete={() => setSearchQuery("")}
                  sx={{ backgroundColor: "#F5E6D3", color: "#5C524E" }}
                />
              )}
              {filterOption !== "all" && (
                <Chip
                  label={`${filterOption === "upcoming" ? "Upcoming" : "Past"} events`}
                  size="small"
                  onDelete={() => setFilterOption("all")}
                  sx={{ backgroundColor: "#F5E6D3", color: "#5C524E" }}
                />
              )}
            </Box>
          )}

          {/* All Events Tab */}
          <TabPanel value={tabValue} index={0}>
            {filteredAndSortedEvents.length === 0 ? (
              <EmptyStateBlock
                icon={<EventIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
                title="No events found"
                message={
                  searchQuery
                    ? `No events match "${searchQuery}". Try a different search term.`
                    : filterOption !== "all"
                    ? `No ${filterOption} events found.`
                    : "No events yet. Create or join your first event to get started."
                }
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: 3,
                }}
              >
                {filteredAndSortedEvents.map((event) => (
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
            {filteredOwnedEvents.length === 0 ? (
              <EmptyStateBlock
                icon={<EditNoteIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
                title="No events owned yet"
                message={
                  searchQuery
                    ? `No owned events match "${searchQuery}".`
                    : filterOption !== "all"
                    ? `No ${filterOption} owned events found.`
                    : "Create your first event to start planning meals with friends."
                }
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: 3,
                }}
              >
                {filteredOwnedEvents.map((event) => (
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
            {filteredSharedEvents.length === 0 ? (
              <EmptyStateBlock
                icon={<PeopleIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
                title="No events shared yet"
                message={
                  searchQuery
                    ? `No shared events match "${searchQuery}".`
                    : filterOption !== "all"
                    ? `No ${filterOption} shared events found.`
                    : "Ask friends to invite you to their events."
                }
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: 3,
                }}
              >
                {filteredSharedEvents.map((event) => (
                  <EventSummaryCard
                    key={event.id}
                    event={event}
                    onViewEvent={handleViewEvent}
                  />
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Archive Tab */}
          <TabPanel value={tabValue} index={3}>
            {filteredArchivedEvents.length === 0 ? (
              <EmptyStateBlock
                icon={<EventIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
                title="No past events"
                message={
                  searchQuery
                    ? `No archived events match "${searchQuery}".`
                    : "Your past events will appear here once they've occurred."
                }
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: 3,
                }}
              >
                {filteredArchivedEvents.map((event) => (
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
