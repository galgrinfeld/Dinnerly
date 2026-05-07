import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';

import { getEvent, attachRecipe, getShoppingList, deleteEvent, listParticipants, addParticipant, removeParticipant, assignIngredient, unassignIngredient, updateEvent, leaveEvent } from '../api/events';
import { listRecipes } from '../api/recipes';
import { me } from '../api/auth';
import { getFriends, getOutgoingRequests, sendFriendRequest, getUserProfile } from '../api/friends';
import {
  EventRead,
  EventRecipeRead,
  RecipeListItem,
  ShoppingListResponse,
  ShoppingListItem,
  EventMemberRead,
  EventUpdateRequest,
  UserRead,
  FriendRequestRead,
  FriendsListResponse,
  UserProfileRead,
} from '../types/api';
import { FriendsInviteDialog } from '../components/FriendsInviteDialog';
import { FriendProfilePopover } from '../components/FriendProfilePopover';

/**
 * EventDetails page - displays event with attached recipes and unified shopping list.
 * Allows attaching additional recipes with desired servings.
 */
const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // State
  const [currentUser, setCurrentUser] = useState<UserRead | null>(null);
  const [event, setEvent] = useState<EventRead | null>(null);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListResponse | null>(null);
  const [members, setMembers] = useState<EventMemberRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for attaching recipes
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | ''>('');
  const [desiredServings, setDesiredServings] = useState<number>(1);
  const [attachingRecipe, setAttachingRecipe] = useState(false);

  // Participants form state
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [friendsInviteDialogOpen, setFriendsInviteDialogOpen] = useState(false);

  // Expanded sources rows
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  
  // Edit mode for recipes
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [editServings, setEditServings] = useState<number>(1);

  // Edit mode for event details
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editEventData, setEditEventData] = useState({
    name: '',
    eventDate: null as Dayjs | null,
    targetServings: 0,
  });
  const [savingEvent, setSavingEvent] = useState(false);

  // Ingredient assignment state - track pending changes
  const [pendingAssignments, setPendingAssignments] = useState<Map<number, number | null>>(new Map());
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Delete event state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Leave event state
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // Friends state
  const [friendsData, setFriendsData] = useState<FriendsListResponse | null>(null);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestRead[]>([]);
  const [sendingFriendRequest, setSendingFriendRequest] = useState<Record<string, boolean>>({});

  // Profile popover state
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [profilePopoverAnchor, setProfilePopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<UserProfileRead | null>(null);

  // Calculate current user's role
  const currentUserRole = currentUser
    ? members.find(m => m.email === currentUser.email)?.role
    : undefined;

  const isOwner = currentUserRole === 'owner';
  const isParticipant = currentUserRole === 'participant';

  // Determine friend status of a participant
  const getFriendStatus = (email: string): 'friend' | 'pending' | 'blocked' | 'none' => {
    if (!friendsData) return 'none';
    
    // Check if user is in friends list
    if (friendsData.friends.some(f => f.email === email)) {
      return 'friend';
    }
    
    // Check if there's an outgoing request
    if (outgoingRequests.some(r => r.receiver?.email === email)) {
      return 'pending';
    }
    
    return 'none';
  };

  // Load event, recipes, shopping list, participants, current user, and friends
  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        setError(null);

        // Load current user first
        const userData = await me();
        setCurrentUser(userData);

        const [eventData, recipesData, shoppingListData, membersData] = await Promise.all([
          getEvent(parseInt(eventId, 10)),
          listRecipes(),
          getShoppingList(parseInt(eventId, 10)),
          listParticipants(parseInt(eventId, 10)),
        ]);

        setEvent(eventData);
        setRecipes(recipesData);
        setShoppingList(shoppingListData);
        setMembers(membersData);

        // Load friends data in background
        try {
          const [friendsResponse, outgoing] = await Promise.all([
            getFriends(),
            getOutgoingRequests(),
          ]);
          setFriendsData(friendsResponse);
          setOutgoingRequests(outgoing);
        } catch (friendErr) {
          console.error('Failed to load friends:', friendErr);
          // Don't show error - friends loading is secondary
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load event';
        setError(message);
        
        // If it's a 403 error, redirect to home
        if (message.includes('Access denied') || message.includes('403')) {
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, navigate]);

  // Handle attaching recipe
  const handleAttachRecipe = async () => {
    if (!eventId || !selectedRecipeId) return;

    try {
      setAttachingRecipe(true);
      setError(null);
      const updatedEvent = await attachRecipe(parseInt(eventId, 10), {
        recipeId: selectedRecipeId as number,
        desiredServings,
      });

      setEvent(updatedEvent);
      setSelectedRecipeId('');
      setDesiredServings(1);

      // Reload shopping list
      const updatedShoppingList = await getShoppingList(parseInt(eventId, 10));
      setShoppingList(updatedShoppingList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to attach recipe';
      setError(message);
      
      // Show specific error for 403
      if (message.includes('Access denied') || message.includes('permission')) {
        setError('You do not have permission to attach recipes to this event.');
      }
    } finally {
      setAttachingRecipe(false);
    }
  };

  // Toggle expanded sources row
  const toggleExpandedSources = (ingredientId: number) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(ingredientId)) {
      newExpanded.delete(ingredientId);
    } else {
      newExpanded.add(ingredientId);
    }
    setExpandedSources(newExpanded);
  };

  // Handle edit recipe servings
  const handleEditRecipe = (recipeId: number, currentServings: number) => {
    setEditingRecipeId(recipeId);
    setEditServings(currentServings);
  };

  // Handle save recipe servings
  const handleSaveRecipeServings = async (recipeId: number) => {
    if (!eventId) return;
    
    try {
      const updatedEvent = await attachRecipe(parseInt(eventId, 10), {
        recipeId,
        desiredServings: editServings,
      });
      setEvent(updatedEvent);
      setEditingRecipeId(null);
      
      // Reload shopping list
      const updatedShoppingList = await getShoppingList(parseInt(eventId, 10));
      setShoppingList(updatedShoppingList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe servings');
    }
  };

  // Handle delete recipe (placeholder for now)
  const handleDeleteRecipe = () => {
    // TODO: Implement backend endpoint for deleting recipes from events
    setError('Delete recipe feature coming soon - need backend support');
  };

  // Handle add participant
  const handleAddParticipant = async () => {
    if (!eventId || !newParticipantEmail.trim()) return;

    try {
      setAddingParticipant(true);
      setError(null);
      const newMember = await addParticipant(parseInt(eventId, 10), {
        email: newParticipantEmail.trim().toLowerCase(),
      });
      setMembers([...members, newMember]);
      setNewParticipantEmail('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add participant';
      setError(message);
      
      // Show specific error for 403
      if (message.includes('Access denied') || message.includes('Only event owner')) {
        setError('Only the event owner can add participants.');
      }
    } finally {
      setAddingParticipant(false);
    }
  };

  // Handle invite multiple friends from FriendsInviteDialog
  const handleInviteFriends = async (emails: string[]): Promise<void> => {
    if (!eventId) return;

    try {
      for (const email of emails) {
        const newMember = await addParticipant(parseInt(eventId, 10), {
          email: email.trim().toLowerCase(),
        });
        setMembers((prev) => [...prev, newMember]);
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle remove participant
  const handleRemoveParticipant = async (memberId: number) => {
    if (!eventId) return;

    try {
      await removeParticipant(parseInt(eventId, 10), memberId);
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove participant';
      setError(message);
      
      // Show specific error for 403
      if (message.includes('Access denied') || message.includes('Only event owner')) {
        setError('Only the event owner can remove participants.');
      }
    }
  };

  // Handle send friend request
  const handleSendFriendRequest = async (email: string) => {
    try {
      setSendingFriendRequest(prev => ({ ...prev, [email]: true }));
      const response = await sendFriendRequest(email);
      
      // Update outgoing requests list
      if (response.request) {
        setOutgoingRequests(prev => [...prev, response.request!]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
    } finally {
      setSendingFriendRequest(prev => ({ ...prev, [email]: false }));
    }
  };

  // Handle open profile popover
  const handleOpenProfilePopover = async (event: React.MouseEvent<HTMLElement>, member: EventMemberRead) => {
    setProfilePopoverAnchor(event.currentTarget);
    
    try {
      const isCurrentUser = currentUser && currentUser.email.toLowerCase() === member.email.toLowerCase();
      
      // Try to find display name from friends list
      let displayName = undefined;
      if (friendsData) {
        const friend = friendsData.friends.find(f => f.email.toLowerCase() === member.email.toLowerCase());
        displayName = friend?.displayName;
      }
      
      // Fetch full profile data if userId is available
      let profile: UserProfileRead = {
        id: member.id,
        email: member.email,
        displayName,
        friendshipStatus: getFriendStatus(member.email) || 'none',
        sharedEventCount: 0,
        isCurrentUser: isCurrentUser || undefined,
      };
      
      // If we have userId, fetch the full profile
      if (member.userId) {
        try {
          profile = await getUserProfile(member.userId);
          profile.isCurrentUser = isCurrentUser || undefined;
        } catch (err) {
          console.error('Failed to fetch full profile, using basic info:', err);
          // Fall back to basic profile
        }
      }
      
      setSelectedMemberProfile(profile);
      setProfilePopoverOpen(true);
    } catch (err) {
      console.error('Failed to load member profile:', err);
    }
  };

  // Handle close profile popover
  const handleCloseProfilePopover = () => {
    setProfilePopoverOpen(false);
    setProfilePopoverAnchor(null);
    setSelectedMemberProfile(null);
  };

  // Handle view shared events
  const handleViewSharedEvents = () => {
    if (selectedMemberProfile) {
      // Navigate to events page filtered by this user
      navigate('/my-events');
    }
  };

  // Handle assign ingredient to participant
  const handleAssignIngredient = (ingredientId: number, eventMemberId: number | null) => {
    // Mark as pending change, don't save yet
    const newPending = new Map(pendingAssignments);
    if (eventMemberId === null) {
      newPending.delete(ingredientId);
    } else {
      newPending.set(ingredientId, eventMemberId);
    }
    setPendingAssignments(newPending);
  };

  // Handle save all pending assignments
  const handleSaveAssignments = async () => {
    if (!eventId || pendingAssignments.size === 0) return;

    try {
      setSavingAssignments(true);
      
      // Send all pending assignments to backend
      const savePromises = Array.from(pendingAssignments.entries()).map(
        ([ingredientId, eventMemberId]) => {
          if (eventMemberId === null) {
            return unassignIngredient(parseInt(eventId, 10), ingredientId);
          } else {
            return assignIngredient(parseInt(eventId, 10), ingredientId, eventMemberId);
          }
        }
      );

      await Promise.all(savePromises);

      // Clear pending changes
      setPendingAssignments(new Map());

      // Reload shopping list to reflect changes
      const updatedShoppingList = await getShoppingList(parseInt(eventId, 10));
      setShoppingList(updatedShoppingList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignments');
    } finally {
      setSavingAssignments(false);
    }
  };

  // Handle enable edit mode for event details
  const handleEnableEditEvent = () => {
    if (!event || !isOwner) {
      setError('Only event owner can edit event details');
      return;
    }
    setEditEventData({
      name: event.name,
      eventDate: dayjs(event.eventDate),
      targetServings: event.targetServings,
    });
    setIsEditingEvent(true);
  };

  // Handle save event details
  const handleSaveEvent = async () => {
    if (!event || !eventId) return;

    if (!editEventData.name.trim()) {
      setError('Event name is required');
      return;
    }
    if (!editEventData.eventDate) {
      setError('Event date is required');
      return;
    }
    if (editEventData.targetServings <= 0) {
      setError('Target servings must be greater than 0');
      return;
    }

    try {
      setSavingEvent(true);
      setError(null);

      const payload: EventUpdateRequest = {
        name: editEventData.name.trim(),
        eventDate: editEventData.eventDate.format('YYYY-MM-DD'),
        targetServings: editEventData.targetServings,
      };

      const updatedEvent = await updateEvent(event.id, payload);
      setEvent(updatedEvent);
      setIsEditingEvent(false);
      
      // Navigate back to home after successful save
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update event';
      setError(message);
      
      // Show specific error for 403
      if (message.includes('Access denied') || message.includes('permission') || message.includes('owner')) {
        setError('Only the event owner can edit event details.');
      }
    } finally {
      setSavingEvent(false);
    }
  };

  // Handle cancel edit event
  const handleCancelEditEvent = () => {
    setIsEditingEvent(false);
  };

  // Handle delete event
  const handleDeleteEventClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteEvent = async () => {
    if (!event) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      // Close dialog first
      setDeleteConfirmOpen(false);
      // Delete the event
      await deleteEvent(event.id);
      // Navigate to home after successful deletion
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event';
      setDeleteError(message);
      
      // If 403, show error that only owner can delete
      if (message.includes('Access denied') || message.includes('permission')) {
        setDeleteError('You do not have permission to delete this event. Only the owner can delete events.');
      }
      
      // Reopen dialog on error so user can retry
      setTimeout(() => {
        setDeleteConfirmOpen(true);
      }, 100);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeleteEvent = () => {
    setDeleteConfirmOpen(false);
    setDeleteError(null);
  };

  // Handle leave event
  const handleLeaveEventClick = () => {
    setLeaveConfirmOpen(true);
  };

  const handleConfirmLeaveEvent = async () => {
    if (!eventId) return;
    try {
      setLeaving(true);
      setLeaveError(null);
      setLeaveConfirmOpen(false);
      await leaveEvent(parseInt(eventId, 10));
      // Navigate to home after successfully leaving
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave event';
      setLeaveError(message);
      // Reopen dialog on error
      setTimeout(() => {
        setLeaveConfirmOpen(true);
      }, 100);
    } finally {
      setLeaving(false);
    }
  };

  const handleCancelLeaveEvent = () => {
    setLeaveConfirmOpen(false);
    setLeaveError(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Event not found</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Back button and page header */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ textTransform: 'none', mb: 3 }}
      >
        Back to Home
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            {event?.name || 'Event Details'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage event details, recipes, and shopping list.
          </Typography>
        </Box>
        
        {/* Role badge */}
        {currentUserRole && (
          <Chip
            label={currentUserRole === 'owner' ? 'Owner' : 'Participant'}
            color={currentUserRole === 'owner' ? 'primary' : 'default'}
            sx={{
              backgroundColor: currentUserRole === 'owner' ? '#8A6A2F' : '#e8e8e8',
              color: currentUserRole === 'owner' ? '#fff' : '#171717',
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Error alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {deleteError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {deleteError}
        </Alert>
      )}

      {leaveError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {leaveError}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Event Info Section */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          {isEditingEvent && isOwner ? (
            // Edit mode (only for owner)
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={2}>
                <TextField
                  label="Event Name"
                  value={editEventData.name}
                  onChange={(e) => setEditEventData({ ...editEventData, name: e.target.value })}
                  fullWidth
                  size="small"
                />
                <DatePicker
                  label="Event Date"
                  value={editEventData.eventDate}
                  onChange={(newDate) => setEditEventData({ ...editEventData, eventDate: newDate })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <TextField
                  label="Target Servings"
                  type="number"
                  value={editEventData.targetServings}
                  onChange={(e) => setEditEventData({ ...editEventData, targetServings: parseInt(e.target.value, 10) || 0 })}
                  inputProps={{ min: 1 }}
                  fullWidth
                  size="small"
                />
                <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveEvent}
                    disabled={savingEvent}
                    sx={{
                      backgroundColor: "#8A6A2F",
                      "&:hover": { backgroundColor: "#6F5624" },
                    }}
                  >
                    {savingEvent ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEditEvent}
                    disabled={savingEvent}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </LocalizationProvider>
          ) : (
            // View mode
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                  {event.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Date: {new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Target Servings: {event.targetServings}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {isOwner && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleEnableEditEvent}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteEventClick}
                    >
                      Delete
                    </Button>
                  </>
                )}
                {isParticipant && (
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<LogoutIcon />}
                    onClick={handleLeaveEventClick}
                  >
                    Leave Event
                  </Button>
                )}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Participants Section */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Participants
          </Typography>
          
          {/* Add participant form (owner only) */}
          {isOwner && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Enter email"
                value={newParticipantEmail}
                onChange={(e) => setNewParticipantEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddParticipant();
                }}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleAddParticipant}
                disabled={addingParticipant || !newParticipantEmail.trim()}
                sx={{
                  backgroundColor: "#8A6A2F",
                  "&:hover": { backgroundColor: "#6F5624" },
                }}
              >
                {addingParticipant ? 'Adding...' : 'Add'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={() => setFriendsInviteDialogOpen(true)}
                disabled={addingParticipant}
                sx={{
                  color: "#8A6A2F",
                  borderColor: "#8A6A2F",
                  "&:hover": { 
                    backgroundColor: "#f5f1eb",
                    borderColor: "#6F5624",
                  },
                }}
              >
                Invite Friends
              </Button>
            </Stack>
          )}

          {/* Participants list */}
          {members && members.length > 0 ? (
            <List disablePadding>
              {members.map((member) => {
                const friendStatus = getFriendStatus(member.email);
                const isCurrentUser = currentUser && currentUser.email.toLowerCase() === member.email.toLowerCase();
                const showAddFriendButton = !isCurrentUser && member.role !== 'owner' && friendStatus === 'none';
                
                return (
                  <ListItem
                    key={member.id}
                    disableGutters
                    sx={{
                      py: 1,
                      px: 1,
                      borderRadius: 1,
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={(e) => handleOpenProfilePopover(e, member)}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#8A6A2F',
                          '&:hover': { textDecoration: 'underline' },
                          fontWeight: 500,
                        }}
                      >
                        {member.email}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        {isCurrentUser ? (
                          <>
                            <Chip label="Me" size="small" variant="outlined" sx={{ borderColor: '#8A6A2F', color: '#8A6A2F', fontWeight: 500 }} />
                            {member.role === 'owner' && (
                              <Chip
                                label="owner"
                                size="small"
                                variant="outlined"
                                sx={{
                                  backgroundColor: 'rgba(138, 106, 47, 0.1)',
                                }}
                              />
                            )}
                          </>
                        ) : (
                          <>
                            <Chip
                              label={member.role}
                              size="small"
                              variant="outlined"
                              sx={{
                                backgroundColor: member.role === 'owner' ? 'rgba(138, 106, 47, 0.1)' : undefined,
                              }}
                            />
                            {member.status === 'invited' && (
                              <Chip label="Invited" size="small" color="warning" variant="outlined" />
                            )}
                            {friendStatus === 'friend' && (
                              <Chip label="Friend" size="small" variant="outlined" sx={{ borderColor: '#4CAF50', color: '#2E7D32' }} />
                            )}
                            {friendStatus === 'pending' && (
                              <Chip label="Pending invite" size="small" color="info" variant="outlined" />
                            )}
                            {friendStatus === 'none' && (
                              <Typography variant="caption" sx={{ color: '#999', fontStyle: 'italic' }}>
                                Not a friend
                              </Typography>
                            )}
                          </>
                        )}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {showAddFriendButton && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSendFriendRequest(member.email)}
                          disabled={sendingFriendRequest[member.email]}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            color: '#8A6A2F',
                            borderColor: '#8A6A2F',
                            '&:hover': {
                              backgroundColor: 'rgba(138, 106, 47, 0.08)',
                              borderColor: '#6F5624',
                            },
                          }}
                        >
                          {sendingFriendRequest[member.email] ? 'Sending...' : 'Add Friend'}
                        </Button>
                      )}
                      {isOwner && member.role !== 'owner' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveParticipant(member.id)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
              No participants yet
            </Typography>
          )}
        </Paper>
        <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          Attached Recipes
        </Typography>
        <Paper variant="outlined" sx={{ p: 2.5}}>
          {/* Attach Recipe Form Row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <FormControl sx={{ flex: 1, minWidth: 200 }}>
              <InputLabel>Recipe</InputLabel>
              <Select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value as number)}
                label="Recipe"
              >
                {recipes.map((recipe: RecipeListItem) => (
                  <MenuItem key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.baseServings} servings)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Desired Servings"
              type="number"
              value={desiredServings}
              onChange={(e) => setDesiredServings(parseInt(e.target.value, 10) || 1)}
              inputProps={{ min: 1 }}
              sx={{ minWidth: 140 }}
            />
            <Button
              variant="contained"
              onClick={handleAttachRecipe}
              disabled={attachingRecipe || !selectedRecipeId}
              sx={{ alignSelf: { xs: 'auto', sm: 'flex-end' } }}
            >
              {attachingRecipe ? 'Adding...' : 'Attach'}
            </Button>
          </Stack>

          {/* Recipes List */}
          {event.recipes && event.recipes.length > 0 ? (
            <List disablePadding>
              {event.recipes?.map((recipe: EventRecipeRead) => {
                const isEditing = editingRecipeId === recipe.recipeId;
                return (
                  <ListItem 
                    key={recipe.recipeId} 
                    disableGutters 
                    sx={{ 
                      py: 1.5,
                      px: 1,
                      borderRadius: 1,
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="body2"
                        onClick={() => navigate(`/recipes/${recipe.recipeId}`)}
                        sx={{ 
                          cursor: 'pointer',
                          color: '#8A6A2F',
                          textDecoration: 'underline',
                          '&:hover': { textDecoration: 'underline', opacity: 0.8 }
                        }}
                      >
                        {recipe.recipeName}
                      </Typography>
                    </Box>
                    {isEditing ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          type="number"
                          value={editServings}
                          onChange={(e) => setEditServings(parseInt(e.target.value, 10) || 1)}
                          inputProps={{ min: 1 }}
                          size="small"
                          sx={{ width: 80 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleSaveRecipeServings(recipe.recipeId)}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setEditingRecipeId(null)}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`${recipe.desiredServings} servings`}
                          size="small"
                          variant="outlined"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleEditRecipe(recipe.recipeId, recipe.desiredServings)}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRecipe()}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    )}
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
              No recipes attached yet
            </Typography>
          )}
        </Paper>

        {/* Shopping List Section */}
        {shoppingList && shoppingList.items.length > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2B2522', fontSize: '1.05rem' }}>
                Shopping List
              </Typography>
              {pendingAssignments.size > 0 && (
                <Button
                  variant="contained"
                  onClick={handleSaveAssignments}
                  disabled={savingAssignments}
                  sx={{
                    backgroundColor: "#8A6A2F",
                    "&:hover": { backgroundColor: "#6F5624" },
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  {savingAssignments ? `Saving ${pendingAssignments.size} change(s)...` : `Save Changes (${pendingAssignments.size})`}
                </Button>
              )}
            </Box>
            <TableContainer 
              component={Paper}
              sx={{
                overflow: 'hidden',
                borderColor: 'divider',
                border: '1px solid #E8E4DF',
                boxShadow: '0 4px 12px rgba(43, 37, 34, 0.06)',
                borderRadius: '12px',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: '#FAFAF8',
                    borderBottom: '1px solid #E8E4DF',
                  }}>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      color: '#2B2522',
                      py: 1.5,
                    }}>
                      Ingredient
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      color: '#2B2522',
                      py: 1.5,
                    }} align="right">
                      Qty
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      color: '#2B2522',
                      width: '80px',
                      py: 1.5,
                    }}>
                      Unit
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      color: '#2B2522',
                      width: '80px',
                      py: 1.5,
                    }}>
                      Optional
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      color: '#2B2522',
                      width: '150px',
                      py: 1.5,
                    }}>
                      Assigned To
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      width: '56px',
                      py: 1.5,
                    }}> </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shoppingList.items.map((item: ShoppingListItem) => {
                    const hasPendingChange = pendingAssignments.has(item.ingredientId);
                    const displayValue = pendingAssignments.has(item.ingredientId)
                      ? (pendingAssignments.get(item.ingredientId) ?? '').toString()
                      : (item.assignedMemberId ?? '').toString();
                    
                    return (
                    <React.Fragment key={item.ingredientId}>
                      <TableRow 
                        onClick={() => toggleExpandedSources(item.ingredientId)}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: hasPendingChange ? 'rgba(138, 106, 47, 0.08)' : undefined,
                          borderBottom: '1px solid #E8E4DF',
                          '&:hover': { backgroundColor: 'rgba(138, 106, 47, 0.04)' },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <TableCell sx={{ py: 1.5, pr: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{item.ingredientName}</span>
                            {hasPendingChange && (
                              <Chip 
                                label="Pending" 
                                size="small" 
                                sx={{ 
                                  height: '22px',
                                  backgroundColor: 'rgba(245, 127, 23, 0.12)',
                                  color: '#D97706',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  '& .MuiChip-label': { px: 0.75 }
                                }} 
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5, color: '#666' }}>
                          {item.quantity?.toString() ?? '—'}
                        </TableCell>
                        <TableCell sx={{ py: 1.5, color: '#666' }}>
                          {item.unit}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          {item.optional && (
                            <Chip 
                              label="Optional" 
                              size="small" 
                              variant="outlined"
                              sx={{
                                height: '22px',
                                borderColor: '#D9D6CF',
                                color: '#666',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                '& .MuiChip-label': { px: 0.75 }
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell 
                          onClick={(e) => e.stopPropagation()}
                          sx={{ py: 1.5, pr: 0.5 }}
                        >
                          <FormControl size="small" sx={{ minWidth: 140 }} onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={displayValue}
                              onChange={(e) => {
                                const value = (e.target.value as string);
                                handleAssignIngredient(
                                  item.ingredientId,
                                  value === "" ? null : parseInt(value, 10)
                                );
                              }}
                              sx={{
                                fontSize: '0.9rem',
                                '& .MuiOutlinedInput-root': {
                                  borderColor: '#D9D6CF',
                                }
                              }}
                            >
                              <MenuItem value="">
                                <em>Unassigned</em>
                              </MenuItem>
                              {members.map((member) => (
                                <MenuItem key={member.id} value={member.id}>
                                  {member.email}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell 
                          onClick={(e) => e.stopPropagation()}
                          sx={{ py: 1.5, px: 0, textAlign: 'center' }}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandedSources(item.ingredientId);
                            }}
                            sx={{ 
                              p: 0.5,
                              color: '#8A6A2F',
                              '&:hover': { backgroundColor: 'rgba(138, 106, 47, 0.08)' }
                            }}
                          >
                            {expandedSources.has(item.ingredientId) ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {expandedSources.has(item.ingredientId) && (
                        <TableRow sx={{ backgroundColor: '#FAFAF8', borderBottom: '1px solid #E8E4DF' }}>
                          <TableCell colSpan={6} sx={{ py: 2, pl: 4, pr: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#2B2522' }}>
                              Sources:
                            </Typography>
                            <Stack spacing={0.75}>
                              {item.sources.map((source: any, idx: number) => (
                                <Typography key={idx} variant="caption" sx={{ color: '#999', lineHeight: 1.5 }}>
                                  <strong style={{ color: '#2B2522' }}>{source.recipeName}</strong>: {source.originalQuantity} {source.unit}
                                  {source.scaledQuantity !== source.originalQuantity &&
                                    ` → ${source.scaledQuantity} ${source.unit} (scaled)`}
                                </Typography>
                              ))}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Stack>

      {/* Delete Event Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDeleteEvent}>
        <DialogTitle>Delete Event?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete this event? This will remove all attached recipes.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteEvent} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteEvent}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Event Confirmation Dialog */}
      <Dialog open={leaveConfirmOpen} onClose={handleCancelLeaveEvent}>
        <DialogTitle>Leave Event?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to leave this event? You will no longer have access to it.
          </Typography>
          {leaveError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {leaveError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLeaveEvent} disabled={leaving}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLeaveEvent}
            color="error"
            variant="contained"
            disabled={leaving}
          >
            {leaving ? 'Leaving...' : 'Leave'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Friends Invite Dialog */}
      <FriendsInviteDialog
        open={friendsInviteDialogOpen}
        onClose={() => setFriendsInviteDialogOpen(false)}
        onInvite={handleInviteFriends}
        currentMembers={members.map((m) => m.email.toLowerCase())}
      />

      {/* Profile Popover */}
      {selectedMemberProfile && (
        <FriendProfilePopover
          open={profilePopoverOpen}
          anchorEl={profilePopoverAnchor}
          onClose={handleCloseProfilePopover}
          userEmail={selectedMemberProfile.email}
          userName={selectedMemberProfile.displayName}
          friendshipStatus={selectedMemberProfile.friendshipStatus as "friend" | "pending" | "blocked" | "none"}
          sharedEventCount={selectedMemberProfile.sharedEventCount}
          isCurrentUser={selectedMemberProfile.isCurrentUser}
          onViewSharedEvents={selectedMemberProfile.sharedEventCount > 0 ? handleViewSharedEvents : undefined}
        />
      )}
    </Container>
  );
};

export { EventDetails };


