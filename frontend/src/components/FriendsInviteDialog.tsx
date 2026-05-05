/**
 * FriendsInviteDialog component - allows selecting and inviting friends to events.
 */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  CircularProgress,
  Box,
  Typography,
  Alert,
  Avatar,
} from "@mui/material";
import { getFriends } from "../api/friends";
import { UserRead } from "../types/api";

interface FriendsInviteDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (emails: string[]) => Promise<void>;
  currentMembers?: string[]; // emails of already invited members
}

export const FriendsInviteDialog: React.FC<FriendsInviteDialogProps> = ({
  open,
  onClose,
  onInvite,
  currentMembers = [],
}) => {
  const [friends, setFriends] = useState<UserRead[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  // Load friends when dialog opens
  useEffect(() => {
    if (open) {
      loadFriends();
    } else {
      setSelectedFriends(new Set());
    }
  }, [open]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    setError(null);
    try {
      const response = await getFriends();
      setFriends(response.friends);
    } catch (err) {
      setError("Failed to load friends");
      console.error(err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleToggleFriend = (email: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedFriends(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFriends.size === availableFriends.length) {
      setSelectedFriends(new Set());
    } else {
      const allEmails = availableFriends.map((f) => f.email);
      setSelectedFriends(new Set(allEmails));
    }
  };

  const handleInvite = async () => {
    const emailsToInvite = Array.from(selectedFriends);
    if (emailsToInvite.length === 0) return;

    setInviting(true);
    try {
      // Invite each friend one by one (assuming addParticipant handles one at a time)
      await onInvite(emailsToInvite);
      setSelectedFriends(new Set());
      onClose();
    } finally {
      setInviting(false);
    }
  };

  // Filter out friends who are already members
  const availableFriends = friends.filter(
    (f) => !currentMembers.includes(f.email.toLowerCase())
  );

  const allSelected =
    availableFriends.length > 0 &&
    selectedFriends.size === availableFriends.length;
  const someSelected =
    selectedFriends.size > 0 && selectedFriends.size < availableFriends.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite Friends to Event</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loadingFriends ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : availableFriends.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography color="textSecondary">
              {friends.length === 0
                ? "You don't have any friends yet. Add friends first!"
                : "All your friends are already invited to this event."}
            </Typography>
          </Box>
        ) : (
          <List>
            {/* Select All Option */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleSelectAll}
                dense
                sx={{
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={allSelected}
                    indeterminate={someSelected}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary="Select All" />
              </ListItemButton>
            </ListItem>

            {/* Friends List */}
            {availableFriends.map((friend) => (
              <ListItem key={friend.id} disablePadding>
                <ListItemButton
                  onClick={() => handleToggleFriend(friend.email)}
                  dense
                  sx={{
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedFriends.has(friend.email)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <Avatar sx={{ mr: 1, width: 32, height: 32, backgroundColor: "#8b7355" }}>
                    {friend.displayName?.[0]?.toUpperCase() ||
                      friend.email[0].toUpperCase()}
                  </Avatar>
                  <ListItemText
                    primary={friend.displayName || "Unknown"}
                    secondary={friend.email}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={inviting}>
          Cancel
        </Button>
        <Button
          onClick={handleInvite}
          variant="contained"
          disabled={selectedFriends.size === 0 || inviting || loadingFriends}
          sx={{
            backgroundColor: "#8b7355",
            "&:hover": { backgroundColor: "#6f5a46" },
          }}
        >
          {inviting
            ? "Inviting..."
            : `Invite (${selectedFriends.size})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
