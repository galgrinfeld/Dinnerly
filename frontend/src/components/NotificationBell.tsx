import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  CircularProgress,
  Typography,
  Divider,
  Stack,
  Button,
  Paper,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications";
import { NotificationRead } from "../types/api";

export const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<NotificationRead[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load initial unread count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        setUnreadCount(response.count);
      } catch (error) {
        console.error("Failed to load unread count:", error);
      }
    };

    loadUnreadCount();

    // Poll for unread count changes every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
    loadNotifications();
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const formatRelativeTime = (createdAt: string): string => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <>
      <IconButton
        onClick={handleBellClick}
        sx={{
          color: "#2B2522",
          "&:hover": {
            backgroundColor: "rgba(138, 106, 47, 0.1)",
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          {menuOpen ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            maxWidth: 380,
            maxHeight: 500,
            backgroundColor: "#FEFBF3",
            border: "1px solid #E8DCC8",
          },
        }}
      >
        {/* Menu Header */}
        <Box
          sx={{
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#F9F6F0",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "#2B2522",
            }}
          >
            Notifications
          </Typography>
          {unreadNotifications.length > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                color: "#8A6A2F",
                padding: "4px 8px",
                "&:hover": {
                  backgroundColor: "rgba(138, 106, 47, 0.1)",
                },
              }}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider sx={{ borderColor: "#E8DCC8" }} />

        {/* Menu Content */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 150,
              padding: "24px",
            }}
          >
            <CircularProgress size={32} sx={{ color: "#8A6A2F" }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 120,
              padding: "24px",
              color: "#999",
            }}
          >
            <NotificationsNoneIcon
              sx={{
                fontSize: 40,
                color: "#D4C4B0",
                marginBottom: 1,
              }}
            />
            <Typography variant="body2">No notifications yet</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              maxHeight: "calc(500px - 120px)",
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: 6,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#F9F6F0",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#D4C4B0",
                borderRadius: 3,
                "&:hover": {
                  backgroundColor: "#B39760",
                },
              },
            }}
          >
            {notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id);
                  }
                }}
                sx={{
                  backgroundColor: notification.isRead ? "#FEFBF3" : "#FFF9F0",
                  borderLeft: notification.isRead
                    ? "4px solid transparent"
                    : "4px solid #8A6A2F",
                  paddingX: 2,
                  paddingY: 1.5,
                  whiteSpace: "normal",
                  minHeight: "auto",
                  alignItems: "flex-start",
                  "&:hover": {
                    backgroundColor: notification.isRead
                      ? "#F9F6F0"
                      : "#FFF5E6",
                  },
                  cursor: "pointer",
                }}
              >
                <Stack spacing={0.5} sx={{ width: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: notification.isRead ? 400 : 600,
                        color: "#2B2522",
                        flex: 1,
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#999",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {formatRelativeTime(notification.createdAt)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666",
                      fontSize: "0.85rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {notification.message}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </Box>
        )}
      </Menu>
    </>
  );
};
