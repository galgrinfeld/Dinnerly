import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Tab,
  Tabs,
  Paper,
  Avatar,
  Stack,
  InputAdornment,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  MailOutline as MailOutlineIcon,
  PersonSearch as PersonSearchIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { PageHeader } from "../components/PageHeader";
import { FriendProfilePopover } from "../components/FriendProfilePopover";
import { TabPanel } from "../components/TabPanel";
import { EmptyStateBlock } from "../components/EmptyStateBlock";
import {
  sendFriendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getUserProfile,
} from "../api/friends";
import {
  FriendRequestRead,
  UserRead,
  UserProfileRead,
} from "../types/api";

const panelSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E3DDD4",
  borderRadius: 2,
  boxShadow: "0 1px 2px rgba(31, 27, 24, 0.04)",
};

const getInitial = (user?: Pick<UserRead, "displayName" | "email">): string => {
  return user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";
};

export const Friends: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [incomingRequests, setIncomingRequests] = useState<FriendRequestRead[]>(
    []
  );
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestRead[]>(
    []
  );
  const [friends, setFriends] = useState<UserRead[]>([]);

  // Profile popover state
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [profilePopoverAnchor, setProfilePopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedFriendProfile, setSelectedFriendProfile] = useState<UserProfileRead | null>(null);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [incomingRes, outgoingRes, friendsRes] = await Promise.all([
        getIncomingRequests(),
        getOutgoingRequests(),
        getFriends(),
      ]);
      setIncomingRequests(incomingRes);
      setOutgoingRequests(outgoingRes);
      setFriends(friendsRes.friends);
    } catch (err) {
      setError("Failed to load friend data. Please try again.");
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await sendFriendRequest(email);
      setSuccess(`Friend request sent to ${email}`);
      setEmail("");
      // Reload data
      await loadAllData();
    } catch (err: any) {
      const errorMsg =
        err.detail ||
        err.message ||
        "Failed to send friend request. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await acceptFriendRequest(requestId);
      setSuccess("Friend request accepted");
      await loadAllData();
    } catch (err: any) {
      const errorMsg =
        err.detail || err.message || "Failed to accept friend request";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await rejectFriendRequest(requestId);
      setSuccess("Friend request rejected");
      await loadAllData();
    } catch (err: any) {
      const errorMsg =
        err.detail || err.message || "Failed to reject friend request";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle open profile popover
  const handleOpenProfilePopover = async (event: React.MouseEvent<HTMLElement>, friend: UserRead) => {
    setProfilePopoverAnchor(event.currentTarget);
    
    try {
      // Fetch full profile with shared events count
      const fullProfile = await getUserProfile(friend.id);
      setSelectedFriendProfile(fullProfile);
      setProfilePopoverOpen(true);
    } catch (err) {
      console.error('Failed to load friend profile:', err);
      // Fall back to basic profile
      const basicProfile: UserProfileRead = {
        id: friend.id,
        email: friend.email,
        displayName: friend.displayName,
        friendshipStatus: "friend",
        sharedEventCount: 0,
      };
      setSelectedFriendProfile(basicProfile);
      setProfilePopoverOpen(true);
    }
  };

  // Handle close profile popover
  const handleCloseProfilePopover = () => {
    setProfilePopoverOpen(false);
    setProfilePopoverAnchor(null);
    setSelectedFriendProfile(null);
  };

  // Handle view shared events
  const handleViewSharedEvents = () => {
    if (selectedFriendProfile) {
      // Navigate to shared events or show filter
      // For now, just close the popover
      handleCloseProfilePopover();
    }
  };

  if (loadingData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader
          title="Friends"
          subtitle="Manage invitations and shared planning connections."
        />
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Friends"
        subtitle="Manage invitations and shared planning connections."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 360px) 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            ...panelSx,
            p: 3,
            position: { md: "sticky" },
            top: { md: 88 },
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" sx={{ color: "#241F1C", fontWeight: 700, mb: 0.5 }}>
                Add Friend
              </Typography>
              <Typography variant="body2" sx={{ color: "#625852", lineHeight: 1.5 }}>
                Send a request by email.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSendRequest} sx={{ display: "grid", gap: 1.5 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              disabled={loading}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon sx={{ color: "#7A5E2B" }} fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#241F1C",
                "&:hover": { backgroundColor: "#15110F" },
              }}
              disabled={loading}
              startIcon={<PersonAddIcon />}
              type="submit"
            >
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </Box>

            <Divider />

            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: "#625852" }}>
                  Friends
                </Typography>
                <Chip size="small" label={friends.length} sx={{ backgroundColor: "#F3EFE8" }} />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: "#625852" }}>
                  Incoming
                </Typography>
                <Chip size="small" label={incomingRequests.length} sx={{ backgroundColor: "#F3EFE8" }} />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: "#625852" }}>
                  Pending
                </Typography>
                <Chip size="small" label={outgoingRequests.length} sx={{ backgroundColor: "#F3EFE8" }} />
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ ...panelSx, overflow: "hidden" }}>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          aria-label="friend tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: "1px solid #E3DDD4",
            minHeight: 54,
            "& .MuiTab-root": {
              color: "#625852",
              textTransform: "none",
              fontWeight: 650,
              minHeight: 54,
              "&.Mui-selected": {
                color: "#7A5E2B",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#7A5E2B",
              height: 3,
            },
          }}
        >
          <Tab label={`Friends (${friends.length})`} id="friend-tab-0" />
          <Tab
            label={`Incoming Requests (${incomingRequests.length})`}
            id="friend-tab-1"
          />
          <Tab
            label={`Outgoing Requests (${outgoingRequests.length})`}
            id="friend-tab-2"
          />
        </Tabs>

        {/* Friends List Tab */}
        <TabPanel value={tabValue} index={0} idPrefix="friend" sx={{ py: 3 }}>
          {friends.length === 0 ? (
            <EmptyStateBlock
              icon={<PeopleIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
              title="No friends yet"
              message="Send a request to start planning shared meals."
            />
          ) : (
            <List disablePadding>
              {friends.map((friend, idx) => (
                <React.Fragment key={friend.id}>
                  {idx > 0 && <Divider />}
                  <ListItem 
                    sx={{ 
                      cursor: "pointer",
                      px: 3,
                      py: 1.75,
                      "&:hover": { backgroundColor: "rgba(43, 37, 34, 0.04)" },
                    }}
                    onClick={(e) => handleOpenProfilePopover(e, friend)}
                  >
                    <Avatar sx={{ mr: 2, backgroundColor: "#7A5E2B", color: "#FFFFFF", fontWeight: 700 }}>
                      {getInitial(friend)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography 
                          sx={{ 
                            color: "#241F1C",
                            fontWeight: 650,
                          }}
                        >
                          {friend.displayName || friend.email}
                        </Typography>
                      }
                      secondary={friend.displayName ? friend.email : undefined}
                      secondaryTypographyProps={{ sx: { color: "#625852" } }}
                    />
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Friends"
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: "rgba(46, 125, 50, 0.35)", color: "#2E7D32" }}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Incoming Requests Tab */}
        <TabPanel value={tabValue} index={1} idPrefix="friend" sx={{ py: 3 }}>
          {incomingRequests.length === 0 ? (
            <EmptyStateBlock
              icon={<PersonSearchIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
              title="No incoming requests"
              message="New invitations will appear here."
            />
          ) : (
            <List disablePadding>
              {incomingRequests.map((request, idx) => (
                <React.Fragment key={request.id}>
                  {idx > 0 && <Divider />}
                  <ListItem sx={{ px: 3, py: 1.75, pr: { xs: 3, sm: 13 } }}>
                    <Avatar sx={{ mr: 2, backgroundColor: "#7A5E2B", color: "#FFFFFF", fontWeight: 700 }}>
                      {getInitial(request.sender)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: "#241F1C", fontWeight: 650 }}>
                          {request.sender?.displayName || request.sender?.email || "Unknown"}
                        </Typography>
                      }
                      secondary={request.sender?.email}
                      secondaryTypographyProps={{ sx: { color: "#625852" } }}
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          edge="end"
                          aria-label="accept"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={loading}
                          sx={{
                            color: "#2E7D32",
                            border: "1px solid rgba(46, 125, 50, 0.25)",
                            borderRadius: 1,
                          }}
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="reject"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={loading}
                          sx={{
                            color: "#D32F2F",
                            border: "1px solid rgba(211, 47, 47, 0.25)",
                            borderRadius: 1,
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Outgoing Requests Tab */}
        <TabPanel value={tabValue} index={2} idPrefix="friend" sx={{ py: 3 }}>
          {outgoingRequests.length === 0 ? (
            <EmptyStateBlock
              icon={<ScheduleIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
              title="No pending requests"
              message="Sent requests that are waiting for a response will appear here."
            />
          ) : (
            <List disablePadding>
              {outgoingRequests.map((request, idx) => (
                <React.Fragment key={request.id}>
                  {idx > 0 && <Divider />}
                  <ListItem sx={{ px: 3, py: 1.75 }}>
                    <Avatar sx={{ mr: 2, backgroundColor: "#7A5E2B", color: "#FFFFFF", fontWeight: 700 }}>
                      {getInitial(request.receiver)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: "#241F1C", fontWeight: 650 }}>
                          {request.receiver?.displayName || request.receiver?.email || "Unknown"}
                        </Typography>
                      }
                      secondary={request.receiver?.email}
                      secondaryTypographyProps={{ sx: { color: "#625852" } }}
                    />
                    <Chip
                      label="Pending"
                      variant="outlined"
                      size="small"
                      sx={{ color: "#7A5E2B", borderColor: "#CFC5B7", backgroundColor: "#F8F3EA" }}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
        </Paper>
      </Box>

      {/* Profile Popover */}
      {selectedFriendProfile && (
        <FriendProfilePopover
          open={profilePopoverOpen}
          anchorEl={profilePopoverAnchor}
          onClose={handleCloseProfilePopover}
          userEmail={selectedFriendProfile.email}
          userName={selectedFriendProfile.displayName}
          friendshipStatus={selectedFriendProfile.friendshipStatus as "friend" | "pending" | "blocked" | "none"}
          sharedEventCount={selectedFriendProfile.sharedEventCount}
          onViewSharedEvents={selectedFriendProfile.sharedEventCount > 0 ? handleViewSharedEvents : undefined}
        />
      )}
    </Container>
  );
};
