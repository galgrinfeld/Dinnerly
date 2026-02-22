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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
      setDeleteConfirmOpen(false);
      await deleteRecipe(recipe.id);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete recipe';
      setDeleteError(message);
      setDeleting(false);
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
            <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
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

            {/* Instructions */}
            {recipe.instructionsHtml && recipe.instructionsHtml.trim() && (
              <Box sx={{ my: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Instructions
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#fafafa',
                    p: 2,
                    borderRadius: 1,
                    '& p': { margin: '0.5rem 0' },
                    '& ol': { marginLeft: '1.5rem' },
                    '& ul': { marginLeft: '1.5rem' },
                  }}
                  dangerouslySetInnerHTML={{ __html: recipe.instructionsHtml }}
                />
              </Box>
            )}

            {/* No instructions message */}
            {(!recipe.instructionsHtml || !recipe.instructionsHtml.trim()) && (
              <Typography variant="body2" sx={{ my: 3, color: '#999', fontStyle: 'italic' }}>
                No instructions provided
              </Typography>
            )}

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Ingredients ({recipe.ingredients.length})
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Ingredient</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Quantity
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Note</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Optional
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recipe.ingredients.map((ing, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{ing.ingredientName}</TableCell>
                        <TableCell align="right">{ing.quantity || '—'}</TableCell>
                        <TableCell>{ing.unit}</TableCell>
                        <TableCell>{ing.note || '—'}</TableCell>
                        <TableCell align="center">{ing.optional ? '✓' : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ mt: 3, color: '#999', fontStyle: 'italic' }}>
                No ingredients listed
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
