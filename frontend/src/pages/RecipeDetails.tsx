import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
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
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getRecipe, deleteRecipe } from '../api/recipes';
import { RecipeRead } from '../types/api';
import { formatCookingTime } from '../utils/formatters';

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
  const [imageError, setImageError] = useState(false);

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Page Header - Top Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ color: '#5C524E', borderColor: '#E8E4DF' }}
          >
            Back to Home
          </Button>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
              sx={{
                backgroundColor: '#2B2522',
                '&:hover': { backgroundColor: '#1a1410' },
              }}
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

        {/* Recipe Header Section - 2 Column Layout */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3,
          }}
        >
          {/* Left: Recipe Details */}
          <Card
            sx={{
              border: '1px solid #E8E4DF',
              boxShadow: '0 4px 12px rgba(43, 37, 34, 0.06)',
            }}
          >
            <Box sx={{ p: 3 }}>
              {/* Title */}
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: '#171717',
                  mb: 2,
                }}
              >
                {recipe.name}
              </Typography>

              {/* Description */}
              {recipe.description && (
                <Typography
                  variant="body1"
                  sx={{
                    mb: 2.5,
                    color: '#5C524E',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                  }}
                >
                  {recipe.description}
                </Typography>
              )}

              {/* Divider */}
              <Divider sx={{ my: 2.5, borderColor: '#E8E4DF' }} />

              {/* Stats Row - Base Servings and Cooking Time */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {/* Base Servings Stat Badge */}
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    backgroundColor: '#F9F7F4',
                    border: '1px solid #E8E4DF',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      color: '#8A6A2F',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Base Servings: <strong>{recipe.baseServings}</strong>
                  </Typography>
                </Box>

                {/* Cooking Time Stat Badge */}
                {recipe.cookingTimeMinutes && (
                  <Box
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 1,
                      borderRadius: '8px',
                      backgroundColor: '#F9F7F4',
                      border: '1px solid #E8E4DF',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.85rem',
                        color: '#8A6A2F',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Cooking Time: <strong>{formatCookingTime(recipe.cookingTimeMinutes)}</strong>
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Card>

          {/* Right: Recipe Image */}
          <Card
            sx={{
              border: '1px solid #E8E4DF',
              boxShadow: '0 4px 12px rgba(43, 37, 34, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: 'fit-content',
            }}
          >
            {/* Image Preview */}
            {recipe.imageUrl && !imageError ? (
              <Box
                component="img"
                src={recipe.imageUrl}
                onError={() => setImageError(true)}
                sx={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'cover',
                }}
                alt={recipe.name}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '220px',
                  backgroundColor: '#F9F7F4',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ fontSize: '3rem', opacity: 0.15, mb: 1 }}>
                  🍳
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    color: '#8A6A2F',
                    textAlign: 'center',
                    px: 2,
                  }}
                >
                  {imageError ? 'Image not available' : 'No image'}
                </Typography>
              </Box>
            )}
          </Card>
        </Box>

        {/* Ingredients Section - Full Width Card */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <Card
            sx={{
              border: '1px solid #E8E4DF',
              boxShadow: '0 4px 12px rgba(43, 37, 34, 0.06)',
            }}
          >
            <Box sx={{ p: 3 }}>
              {/* Section Header */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#171717',
                  mb: 2.5,
                  fontSize: '1.05rem',
                }}
              >
                Ingredients ({recipe.ingredients.length})
              </Typography>
              <Divider sx={{ mb: 2.5, borderColor: '#E8E4DF' }} />

              {/* Ingredients List */}
              <List disablePadding sx={{ mt: 0 }}>
                {recipe.ingredients.map((ing, idx) => {
                  const hasNote = ing.note && ing.note.trim().length > 0;
                  const isToTaste = ing.quantity === null || ing.unit === 'to_taste';

                  return (
                    <ListItem
                      key={idx}
                      disableGutters
                      sx={{
                        py: 1.2,
                        display: 'flex',
                        alignItems: 'flex-start',
                        '&:hover': { backgroundColor: 'transparent' },
                        '&:not(:last-child)': {
                          borderBottom: '1px solid #F0EDEB',
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="flex-start"
                        sx={{ width: '100%' }}
                      >
                        {/* Quantity and Unit - Fixed Width Column */}
                        <Box
                          sx={{
                            minWidth: '70px',
                            display: 'flex',
                            gap: 0.75,
                            alignItems: 'baseline',
                            flexShrink: 0,
                          }}
                        >
                          {isToTaste ? (
                            <Typography
                              sx={{
                                fontSize: '0.9rem',
                                color: '#5C524E',
                                fontStyle: 'italic',
                              }}
                            >
                              to taste
                            </Typography>
                          ) : (
                            <>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.95rem',
                                  color: '#171717',
                                }}
                              >
                                {ing.quantity}
                              </Typography>
                              {ing.unit !== 'unit' && (
                                <Typography
                                  sx={{
                                    fontSize: '0.85rem',
                                    color: '#8A6A2F',
                                    fontWeight: 500,
                                  }}
                                >
                                  {ing.unit}
                                </Typography>
                              )}
                            </>
                          )}
                        </Box>

                        {/* Ingredient Name - Flex */}
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            sx={{
                              fontSize: '0.95rem',
                              color: '#171717',
                              fontWeight: 500,
                            }}
                          >
                            {ing.ingredientName}
                          </Typography>

                          {/* Note */}
                          {hasNote && (
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.8rem',
                                color: '#8A7660',
                                mt: 0.5,
                                fontStyle: 'italic',
                              }}
                            >
                              {ing.note}
                            </Typography>
                          )}
                        </Box>

                        {/* Optional Badge */}
                        {ing.optional && (
                          <Chip
                            size="small"
                            label="Optional"
                            sx={{
                              height: '24px',
                              fontSize: '0.75rem',
                              backgroundColor: '#F9F7F4',
                              color: '#8A6A2F',
                              border: '1px solid #E8E4DF',
                              fontWeight: 500,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Stack>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Card>
        )}

        {/* Instructions Section - Full Width Card */}
        {recipe.instructionsHtml && recipe.instructionsHtml.trim() && (
          <Card
            sx={{
              border: '1px solid #E8E4DF',
              boxShadow: '0 4px 12px rgba(43, 37, 34, 0.06)',
            }}
          >
            <Box sx={{ p: 3 }}>
              {/* Section Header */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#171717',
                  mb: 2.5,
                  fontSize: '1.05rem',
                }}
              >
                Instructions
              </Typography>
              <Divider sx={{ mb: 2.5, borderColor: '#E8E4DF' }} />

              {/* Instructions Content */}
              <Box
                sx={{
                  '& p': {
                    margin: 0,
                    marginBottom: '1rem',
                    lineHeight: 1.7,
                    fontSize: '0.95rem',
                    color: '#171717',
                  },
                  '& p:last-child': {
                    marginBottom: 0,
                  },
                  '& ol': {
                    margin: 0,
                    paddingLeft: '1.5rem',
                    lineHeight: 1.8,
                  },
                  '& ul': {
                    margin: 0,
                    paddingLeft: '1.5rem',
                    lineHeight: 1.8,
                  },
                  '& li': {
                    marginBottom: '0.5rem',
                    color: '#171717',
                    fontSize: '0.95rem',
                  },
                  '& li:last-child': {
                    marginBottom: 0,
                  },
                  '& strong': {
                    fontWeight: 600,
                    color: '#171717',
                  },
                  '& em': {
                    color: '#5C524E',
                    fontStyle: 'italic',
                  },
                }}
              >
                <Box dangerouslySetInnerHTML={{ __html: recipe.instructionsHtml }} />
              </Box>
            </Box>
          </Card>
        )}
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
