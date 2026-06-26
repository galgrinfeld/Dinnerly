import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Stack,
  Chip,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleIcon from "@mui/icons-material/People";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { EventRead } from "../types/api";

interface EventSummaryCardProps {
  event: EventRead;
  onViewEvent: (eventId: number) => void;
  badge?: string;
}

export const EventSummaryCard: React.FC<EventSummaryCardProps> = ({
  event,
  onViewEvent,
  badge,
}) => {
  const recipeCount = event.recipes?.length || 0;
  const memberCount = event.members?.length || 0;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        overflow: "visible",
        position: "relative",
        cursor: "pointer",
        "&:hover .card-action": {
          color: "#654B20",
        },
      }}
      onClick={() => onViewEvent(event.id)}
    >
      {/* Badge */}
      {badge && (
        <Chip
          label={badge}
          size="small"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            backgroundColor: "#7A5E2B",
            color: "#FFFFFF",
            fontWeight: 600,
            zIndex: 10,
          }}
        />
      )}
      {/* Card Header with Event Title */}
      <CardContent sx={{ p: 2.25, pb: 2, minWidth: 0, flex: 1 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 700,
            color: "#241F1C",
            mb: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {event.name}
        </Typography>

        {/* Event Metadata */}
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          {/* Event Date */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "#625852",
              fontSize: "0.875rem",
              minWidth: 0,
            }}
          >
            <EventIcon sx={{ fontSize: "1rem", flexShrink: 0 }} />
            <Typography variant="body2">
              <strong>{new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </Typography>
          </Box>

          {/* Target Servings */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "#625852",
              fontSize: "0.875rem",
              minWidth: 0,
            }}
          >
            <RestaurantIcon sx={{ fontSize: "1rem", flexShrink: 0 }} />
            <Typography variant="body2">
              Target: <strong>{event.targetServings} servings</strong>
            </Typography>
          </Box>

          {/* Recipe Count */}
          {recipeCount > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#625852",
                fontSize: "0.875rem",
                minWidth: 0,
              }}
            >
              <MenuBookIcon sx={{ fontSize: "1rem", flexShrink: 0 }} />
              <Typography variant="body2">
                <strong>{recipeCount}</strong> {recipeCount === 1 ? "recipe" : "recipes"}
              </Typography>
            </Box>
          )}

          {/* Member Count */}
          {memberCount > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#625852",
                fontSize: "0.875rem",
                minWidth: 0,
              }}
            >
              <PeopleIcon sx={{ fontSize: "1rem", flexShrink: 0 }} />
              <Typography variant="body2">
                <strong>{memberCount}</strong> {memberCount === 1 ? "participant" : "participants"}
              </Typography>
            </Box>
          )}

          {/* Status Chips */}
          {event.members && event.members.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1, minWidth: 0 }}>
              {event.members.slice(0, 2).map((member) => (
                <Chip
                  key={member.id}
                  label={member.email.split("@")[0]}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: "#D6CCBD",
                    color: "#625852",
                    fontSize: "0.75rem",
                  }}
                />
              ))}
              {memberCount > 2 && (
                <Chip
                  label={`+${memberCount - 2}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: "#D6CCBD",
                    color: "#625852",
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </Box>
          )}
        </Stack>
      </CardContent>

      {/* Card Actions */}
      <CardActions sx={{ px: 2.25, pb: 2.25, pt: 0, mt: "auto", minWidth: 0 }}>
        <Button
          className="card-action"
          variant="text"
          endIcon={<ArrowForwardIcon />}
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onViewEvent(event.id);
          }}
          sx={{
            color: "#7A5E2B",
            px: 0,
            fontWeight: 760,
            "&:hover": { backgroundColor: "transparent" },
          }}
        >
          View Event
        </Button>
      </CardActions>
    </Card>
  );
};
