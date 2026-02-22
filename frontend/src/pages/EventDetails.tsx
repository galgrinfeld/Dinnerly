import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getEvent, attachRecipe, getShoppingList } from '../api/events';
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

  // Dialog state for attaching recipes
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | ''>('');
  const [desiredServings, setDesiredServings] = useState<number>(1);
  const [attachingRecipe, setAttachingRecipe] = useState(false);

  // Expanded sources rows
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

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
      setOpenDialog(false);
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Event not found</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ textTransform: 'none' }}
        >
          Back to Home
        </Button>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Event header */}
      <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {event.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Target Servings: {event.targetServings}
          </Typography>
        </CardContent>
      </Card>

      {/* Attached recipes section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Attached Recipes
          </Typography>
          {event.recipes && event.recipes.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#2B2522' }}>
                  <TableCell sx={{ color: 'white' }}>Recipe Name</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">
                    Desired Servings
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {event.recipes?.map((recipe: EventRecipeRead) => {
                  const recipeInfo = recipes.find(r => r.id === recipe.recipeId);
                  return (
                    <TableRow key={recipe.recipeId}>
                      <TableCell>{recipeInfo?.name || 'Unknown Recipe'}</TableCell>
                      <TableCell align="right">{recipe.desiredServings}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No recipes attached yet
            </Typography>
          )}
          <Button
            variant="contained"
            sx={{
              mt: 2,
              backgroundColor: '#8A6A2F',
              '&:hover': { backgroundColor: '#6B5223' },
              textTransform: 'none',
            }}
            onClick={() => setOpenDialog(true)}
          >
            Add Recipe
          </Button>
        </CardContent>
      </Card>

      {/* Shopping list section */}
      {shoppingList && shoppingList.items.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Shopping List
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#2B2522' }}>
                  <TableCell sx={{ color: 'white', width: '30%' }}>Ingredient</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">
                    Qty
                  </TableCell>
                  <TableCell sx={{ color: 'white', width: '10%' }}>Unit</TableCell>
                  <TableCell sx={{ color: 'white', width: '10%' }}>Optional</TableCell>
                  <TableCell sx={{ color: 'white', width: '5%' }}>Sources</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shoppingList.items.map((item: ShoppingListItem) => (
                  <React.Fragment key={item.ingredientId}>
                    <TableRow>
                      <TableCell>{item.ingredientName}</TableCell>
                      <TableCell align="right">{item.quantity?.toString() ?? '—'}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.optional ? '✓' : '—'}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpandedSources(item.ingredientId)}
                          sx={{ p: 0 }}
                        >
                          {expandedSources.has(item.ingredientId) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {expandedSources.has(item.ingredientId) && (
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        <TableCell colSpan={5} sx={{ py: 2, pl: 4 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Sources:
                          </Typography>
                          <Stack spacing={1}>
                            {item.sources.map((source: any, idx: number) => (
                              <Box key={idx}>
                                <Typography variant="body2">
                                  <strong>{source.recipeName}</strong>: {source.originalQuantity} {source.unit}
                                  {source.scaledQuantity !== source.originalQuantity &&
                                    ` → ${source.scaledQuantity} ${source.unit} (scaled)`}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Attach Recipe Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Recipe to Event</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <FormControl fullWidth>
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
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={attachingRecipe}>
            Cancel
          </Button>
          <Button
            onClick={handleAttachRecipe}
            variant="contained"
            disabled={attachingRecipe || !selectedRecipeId}
            sx={{
              backgroundColor: '#8A6A2F',
              '&:hover': { backgroundColor: '#6B5223' },
            }}
          >
            {attachingRecipe ? 'Adding...' : 'Add to Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export { EventDetails };

export default EventDetails;
