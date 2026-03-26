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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import { getEvent, attachRecipe, getShoppingList, deleteEvent } from '../api/events';
import { listRecipes } from '../api/recipes';
import {
  EventRead,
  EventRecipeRead,
  RecipeListItem,
  ShoppingListResponse,
  ShoppingListItem,
} from '../types/api';

/**
 * EventDetails page - displays event with attached recipes and unified shopping list.
 * Allows attaching additional recipes with desired servings.
 */
const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // State
  const [event, setEvent] = useState<EventRead | null>(null);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for attaching recipes
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | ''>('');
  const [desiredServings, setDesiredServings] = useState<number>(1);
  const [attachingRecipe, setAttachingRecipe] = useState(false);

  // Expanded sources rows
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  
  // Edit mode for recipes
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [editServings, setEditServings] = useState<number>(1);

  // Delete event state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load event, recipes, and shopping list
  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        setError(null);

        const [eventData, recipesData, shoppingListData] = await Promise.all([
          getEvent(parseInt(eventId, 10)),
          listRecipes(),
          getShoppingList(parseInt(eventId, 10)),
        ]);

        setEvent(eventData);
        setRecipes(recipesData);
        setShoppingList(shoppingListData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId]);

  // Handle attaching recipe
  const handleAttachRecipe = async () => {
    if (!eventId || !selectedRecipeId) return;

    try {
      setAttachingRecipe(true);
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
      setError(err instanceof Error ? err.message : 'Failed to attach recipe');
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
      {/* Back button and page title */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          Back to Home
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Event Details
        </Typography>
      </Box>

      {/* Error alert */}
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

      <Stack spacing={3}>
        {/* Event Info Section */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                {event.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Target Servings: {event.targetServings}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/events/${event.id}/edit`)}
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
            </Stack>
          </Box>
        </Paper>

        {/* Attached Recipes Section */}
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
                const recipeInfo = recipes.find(r => r.id === recipe.recipeId);
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
                      <Typography variant="body2">
                        {recipeInfo?.name || 'Unknown Recipe'}
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
            <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
              Shopping List
            </Typography>
            <TableContainer component={Paper}  sx={{  overflow: 'hidden', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(138, 106, 47, 0.08)' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Ingredient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '80px' }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '80px' }}>Optional</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '60px' }}> </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shoppingList.items.map((item: ShoppingListItem) => (
                    <React.Fragment key={item.ingredientId}>
                      <TableRow 
                        onClick={() => toggleExpandedSources(item.ingredientId)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(138, 106, 47, 0.05)' } 
                        }}
                      >
                        <TableCell>{item.ingredientName}</TableCell>
                        <TableCell align="right">{item.quantity?.toString() ?? '—'}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          {item.optional && <Chip label="Optional" size="small" variant="outlined" />}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandedSources(item.ingredientId);
                            }}
                            sx={{ p: 0 }}
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
                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                          <TableCell colSpan={5} sx={{ py: 2, pl: 4 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                              Sources:
                            </Typography>
                            <Stack spacing={0.5}>
                              {item.sources.map((source: any, idx: number) => (
                                <Typography key={idx} variant="caption" color="textSecondary">
                                  <strong>{source.recipeName}</strong>: {source.originalQuantity} {source.unit}
                                  {source.scaledQuantity !== source.originalQuantity &&
                                    ` → ${source.scaledQuantity} ${source.unit} (scaled)`}
                                </Typography>
                              ))}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
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
    </Container>
  );
};

export { EventDetails };


