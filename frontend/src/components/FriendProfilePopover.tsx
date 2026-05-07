import React, { useState } from "react";
import {
  Popover,
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  CircularProgress,
  Avatar,
  Divider,
} from "@mui/material";
import { Group as GroupIcon } from "@mui/icons-material";

interface FriendProfilePopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  userEmail: string;
  userName?: string;
  friendshipStatus?: "friend" | "pending" | "blocked" | "none";
  sharedEventCount?: number;
  isCurrentUser?: boolean;
  onViewSharedEvents?: () => void;
}

export const FriendProfilePopover: React.FC<FriendProfilePopoverProps> = ({
  open,
  anchorEl,
  onClose,
  userEmail,
  userName,
  friendshipStatus = "none",
  sharedEventCount = 0,
  isCurrentUser = false,
  onViewSharedEvents,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getFriendshipStatusColor = (
    status: string
  ): "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success" => {
    switch (status) {
      case "friend":
        return "success";
      case "pending":
        return "warning";
      case "blocked":
        return "error";
      default:
        return "default";
    }
  };

  const getFriendshipStatusLabel = (status: string): string => {
    switch (status) {
      case "friend":
        return "Friend";
      case "pending":
        return "Pending";
      case "blocked":
        return "Blocked";
      default:
        return "Not connected";
    }
  };

  // Create avatar initials from name or email
  const getAvatarText = (): string => {
    if (userName) {
      return userName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return userEmail[0].toUpperCase();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <Box
        sx={{
          p: 2,
          minWidth: 300,
          backgroundColor: "#FFFFFF",
          borderRadius: 1,
        }}
      >
        {/* Header with Avatar and Name */}
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: "#8A6A2F",
              color: "#FFFFFF",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {getAvatarText()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#171717", mb: 0.5 }}
            >
              {userName || userEmail}
            </Typography>
            <Typography variant="caption" sx={{ color: "#5C524E" }}>
              {userEmail}
            </Typography>
          </Box>
        </Stack>

        {/* Only show details if not current user or has shared events */}
        {!isCurrentUser && (
          <>
            <Divider sx={{ my: 1.5 }} />

            {/* Friendship Status */}
            <Stack spacing={1.5} sx={{ my: 2 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#5C524E", textTransform: "uppercase", fontSize: "0.7rem" }}
                >
                  Friendship Status
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip
                    label={getFriendshipStatusLabel(friendshipStatus)}
                    size="small"
                    color={getFriendshipStatusColor(friendshipStatus)}
                    variant="filled"
                  />
                </Stack>
              </Box>

              {/* Shared Events */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#5C524E", textTransform: "uppercase", fontSize: "0.7rem" }}
                >
                  Shared Events
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 0.5 }}
                >
                  <GroupIcon sx={{ fontSize: "1.2rem", color: "#8A6A2F" }} />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, color: "#171717" }}
                  >
                    {sharedEventCount} {sharedEventCount === 1 ? "event" : "events"}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            {/* Action Buttons */}
            {onViewSharedEvents && sharedEventCount > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setIsLoading(true);
                    onViewSharedEvents();
                    // Reset loading state after navigation/action completes
                    setTimeout(() => setIsLoading(false), 500);
                  }}
                  disabled={isLoading}
                  sx={{
                    color: "#8A6A2F",
                    borderColor: "#B39760",
                    "&:hover": {
                      borderColor: "#8A6A2F",
                      backgroundColor: "rgba(138, 106, 47, 0.04)",
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                  ) : (
                    "View Shared Events"
                  )}
                </Button>
              </>
            )}
          </>
        )}
      </Box>
    </Popover>
  );
};
