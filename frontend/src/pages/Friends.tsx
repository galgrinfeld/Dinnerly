import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Card,
  CardContent,
  CardHeader,
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
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { PageHeader } from "../components/PageHeader";
import { FriendProfilePopover } from "../components/FriendProfilePopover";
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`friend-tabpanel-${index}`}
      aria-labelledby={`friend-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <PageHeader
          title="Friends"
          subtitle="Manage your friend connections"
        />
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title="Friends"
        subtitle="Manage your friend connections"
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

      {/* Send Friend Request Card */}
      <Card sx={{ mb: 3, backgroundColor: "#fafaf8" }}>
        <CardHeader
          title="Add Friend"
          subheader="Find and connect with other users"
        />
        <CardContent>
          <Box component="form" onSubmit={handleSendRequest} sx={{ display: "flex", gap: 1 }}>
            <TextField
              label="Enter email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              disabled={loading}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#8b7355",
                "&:hover": { backgroundColor: "#6f5a46" },
              }}
              disabled={loading}
              startIcon={<PersonAddIcon />}
              onClick={handleSendRequest}
            >
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Paper sx={{ backgroundColor: "#fafaf8" }}>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          aria-label="friend tabs"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              color: "#666",
              "&.Mui-selected": {
                color: "#8b7355",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#8b7355",
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
        <TabPanel value={tabValue} index={0}>
          {friends.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <PeopleIcon sx={{ fontSize: 48, color: "#ccc", mb: 2 }} />
              <Typography color="textSecondary">
                You don't have any friends yet. Start by sending friend requests!
              </Typography>
            </Box>
          ) : (
            <List>
              {friends.map((friend, idx) => (
                <React.Fragment key={friend.id}>
                  {idx > 0 && <Divider />}
                  <ListItem 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                    onClick={(e) => handleOpenProfilePopover(e, friend)}
                  >
                    <Avatar sx={{ mr: 2, backgroundColor: "#8b7355" }}>
                      {friend.displayName?.[0]?.toUpperCase() ||
                        friend.email[0].toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography 
                          sx={{ 
                            color: '#8A6A2F',
                            fontWeight: 500,
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {friend.displayName || "Unknown"}
                        </Typography>
                      }
                      secondary={friend.email}
                    />
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Friends"
                      color="success"
                      variant="outlined"
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Incoming Requests Tab */}
        <TabPanel value={tabValue} index={1}>
          {incomingRequests.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="textSecondary">
                No incoming friend requests
              </Typography>
            </Box>
          ) : (
            <List>
              {incomingRequests.map((request, idx) => (
                <React.Fragment key={request.id}>
                  {idx > 0 && <Divider />}
                  <ListItem>
                    <Avatar sx={{ mr: 2, backgroundColor: "#8b7355" }}>
                      {request.sender?.displayName?.[0]?.toUpperCase() ||
                        request.sender?.email[0].toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={request.sender?.displayName || "Unknown"}
                      secondary={request.sender?.email}
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          edge="end"
                          aria-label="accept"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={loading}
                          color="success"
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="reject"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={loading}
                          color="error"
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
        <TabPanel value={tabValue} index={2}>
          {outgoingRequests.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="textSecondary">
                No outgoing friend requests
              </Typography>
            </Box>
          ) : (
            <List>
              {outgoingRequests.map((request, idx) => (
                <React.Fragment key={request.id}>
                  {idx > 0 && <Divider />}
                  <ListItem>
                    <Avatar sx={{ mr: 2, backgroundColor: "#8b7355" }}>
                      {request.receiver?.displayName?.[0]?.toUpperCase() ||
                        request.receiver?.email[0].toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={request.receiver?.displayName || "Unknown"}
                      secondary={request.receiver?.email}
                    />
                    <Chip
                      label="Pending"
                      variant="outlined"
                      sx={{ color: "#f9a825", borderColor: "#f9a825" }}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>

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
