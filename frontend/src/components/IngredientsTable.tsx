import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Box,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { IngredientRow, IngredientUnit, createEmptyIngredientRow } from "../types/recipe";

const UNIT_OPTIONS: IngredientUnit[] = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "unit", "slice", "to_taste"];

interface IngredientsTableProps {
  ingredients: IngredientRow[];
  onChange: (next: IngredientRow[]) => void;
}

export const IngredientsTable: React.FC<IngredientsTableProps> = ({ ingredients, onChange }) => {
  const handleChange = (index: number, field: keyof IngredientRow, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    // Keep at least one empty row
    if (updated.length === 0) {
      onChange([createEmptyIngredientRow()]);
    } else {
      onChange(updated);
    }
  };

  const handleAddIngredient = () => {
    onChange([...ingredients, createEmptyIngredientRow()]);
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell sx={{ fontWeight: "bold" }}>Ingredient</TableCell>
            <TableCell sx={{ fontWeight: "bold", width: 100 }}>Qty</TableCell>
            <TableCell sx={{ fontWeight: "bold", width: 110 }}>Unit</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Note</TableCell>
            <TableCell sx={{ fontWeight: "bold", width: 100, textAlign: "center" }}>Optional</TableCell>
            <TableCell sx={{ fontWeight: "bold", width: 60, textAlign: "center" }}>Remove</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ingredients.map((ingredient, index) => (
            <TableRow key={ingredient.id}>
              <TableCell>
                <TextField
                  size="small"
                  fullWidth
                  value={ingredient.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  placeholder="e.g. Tomato"
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  value={ingredient.quantity}
                  onChange={(e) => handleChange(index, "quantity", e.target.value)}
                  placeholder="0"
                  inputProps={{ step: "0.01" }}
                />
              </TableCell>
              <TableCell>
                <Select
                  size="small"
                  value={ingredient.unit}
                  onChange={(e) => handleChange(index, "unit", e.target.value as IngredientUnit)}
                  fullWidth
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  fullWidth
                  value={ingredient.note}
                  onChange={(e) => handleChange(index, "note", e.target.value)}
                  placeholder="Optional"
                />
              </TableCell>
              <TableCell sx={{ textAlign: "center" }}>
                <Checkbox
                  checked={ingredient.optional}
                  onChange={(e) => handleChange(index, "optional", e.target.checked)}
                />
              </TableCell>
              <TableCell sx={{ textAlign: "center" }}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemove(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          <TableRow
            onClick={handleAddIngredient}
            sx={{
              cursor: "pointer",
              "&:hover": { backgroundColor: "#f9f9f9" },
            }}
          >
            <TableCell colSpan={6}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 1,
                  color: "#666",
                  fontSize: "0.95rem",
                }}
              >
                <AddIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                ----- Add ingredient -----
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
