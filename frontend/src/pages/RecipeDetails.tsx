import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getRecipe, deleteRecipe } from '../api/recipes';
import { RecipeRead } from '../types/api';

/**
 * RecipeDetails page - displays recipe with ingredients and actions to edit/delete.
 */
const RecipeDetails: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<RecipeRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipe = async () => {
      if (!recipeId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getRecipe(parseInt(recipeId, 10));
        console.log("Recipe data received:", data);
        setRecipe(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load recipe';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [recipeId]);

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recipe) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      // Close dialog first
      setDeleteConfirmOpen(false);
      // Delete the recipe
      await deleteRecipe(recipe.id);
      // Navigate to home after successful deletion
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete recipe';
      setDeleteError(message);
      setDeleting(false);
      // Reopen dialog to show error
      setDeleteConfirmOpen(true);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !recipe) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Alert severity="error">{error || 'Recipe not found'}</Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header with back button and actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </Stack>
        </Box>

        {/* Recipe Details Card */}
        <Card sx={{ borderTop: 4, borderTopColor: '#8A6A2F' }}>
          <CardContent>
            <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
              {recipe.name}
            </Typography>

            {recipe.description && (
              <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                {recipe.description}
              </Typography>
            )}

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Base Servings: {recipe.baseServings}
            </Typography>

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Ingredients ({recipe.ingredients.length})
                </Typography>
                <List disablePadding>
                  {recipe.ingredients.map((ing, idx) => {
                    // Check if note exists
                    const hasNote = ing.note && ing.note.trim().length > 0;

                    // Determine if we should show "to taste"
                    const isToTaste = ing.quantity === null || ing.unit === 'to_taste';

                    return (
                      <ListItem key={idx} disableGutters sx={{ py: 0.75, '&:hover': { backgroundColor: 'transparent' } }}>
                        <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ width: '100%' }}>
                          {/* Left block for quantity + unit (fixed width for alignment) */}
                          <Box sx={{ minWidth: 40, display: 'flex', gap: 0.5, alignItems: 'baseline' }}>
                            {isToTaste ? (
                              <Typography sx={{ fontSize: '0.95rem' }}>to taste</Typography>
                            ) : (
                              <>
                                <Typography sx={{ fontWeight: 600 }}>{ing.quantity}</Typography>
                                {ing.unit !== 'unit' && (
                                  <Typography sx={{ fontSize: '0.95rem' }}>{ing.unit}</Typography>
                                )}
                              </>
                            )}
                          </Box>

                          {/* Ingredient Name */}
                          <Typography>{ing.ingredientName}</Typography>

                          {/* Note */}
                          {hasNote && (
                            <Typography variant="body2" color="text.secondary">
                              * {ing.note}
                            </Typography>
                          )}

                          {/* Optional Chip */}
                          {ing.optional && (
                            <Chip
                              size="small"
                              label="Optional"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ mt: 3, color: '#999', fontStyle: 'italic' }}>
                No ingredients listed
              </Typography>
            )}

            {/* Instructions */}
            {recipe.instructionsHtml && recipe.instructionsHtml.trim() && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Instructions
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#fafafa',
                    '& p': { m: 0, mb: 1, lineHeight: 1.6, fontSize: '0.95rem' },
                    '& p:last-child': { mb: 0 },
                    '& ol': { m: 0, pl: 3, lineHeight: 1.8 },
                    '& ul': { m: 0, pl: 3, lineHeight: 1.8 },
                    '& li': { mb: 0.5 },
                  }}
                >
                  <Box dangerouslySetInnerHTML={{ __html: recipe.instructionsHtml }} />
                </Box>
              </Box>
            )}

            {/* No instructions message */}
            {(!recipe.instructionsHtml || !recipe.instructionsHtml.trim()) && (
              <Typography variant="body2" sx={{ mt: 3, color: '#999', fontStyle: 'italic' }}>
                No instructions provided
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Recipe</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
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

export { RecipeDetails };
