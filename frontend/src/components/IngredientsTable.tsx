import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Box,
  Button,
  Stack,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { IngredientRow, IngredientUnit, createEmptyIngredientRow } from "../types/recipe";
import { searchIngredients, IngredientOption } from "../api/ingredients";

const UNIT_OPTIONS: IngredientUnit[] = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "unit", "slice", "to_taste"];

interface IngredientsTableProps {
  ingredients: IngredientRow[];
  onChange: (next: IngredientRow[]) => void;
}

export const IngredientsTable: React.FC<IngredientsTableProps> = ({ ingredients, onChange }) => {
  const [ingredientOptions, setIngredientOptions] = useState<IngredientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIngredientOptions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchIngredients(query);
      setIngredientOptions(results);
    } catch (error) {
      console.error("Failed to search ingredients:", error);
      setIngredientOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value.trim()) {
      setIngredientOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Table sx={{ tableLayout: "auto" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#FAFAF8", borderBottom: "1px solid #E8E4DF" }}>
              <TableCell sx={{ fontWeight: 600, color: "#171717", py: 1.5, fontSize: "0.9rem" }}>
                Ingredient
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#171717",
                  width: 90,
                  py: 1.5,
                  fontSize: "0.9rem",
                }}
              >
                Qty
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#171717",
                  width: 100,
                  py: 1.5,
                  fontSize: "0.9rem",
                }}
              >
                Unit
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#171717",
                  py: 1.5,
                  fontSize: "0.9rem",
                }}
              >
                Note
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#171717",
                  width: 90,
                  textAlign: "center",
                  py: 1.5,
                  fontSize: "0.9rem",
                }}
              >
                Optional
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#171717",
                  width: 70,
                  textAlign: "center",
                  py: 1.5,
                  fontSize: "0.9rem",
                }}
              >
                Remove
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ingredients.map((ingredient, index) => (
              <TableRow
                key={ingredient.id}
                sx={{
                  borderBottom: "1px solid #E8E4DF",
                  "&:last-child": {
                    borderBottom: "none",
                  },
                  "&:hover": {
                    backgroundColor: "#FFFBF7",
                  },
                  transition: "background-color 0.15s",
                }}
              >
                <TableCell sx={{ py: 1.25, pl: 2, pr: 1 }}>
                  <Autocomplete
                    size="small"
                    fullWidth
                    freeSolo
                    loading={loading}
                    options={ingredientOptions}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : option.name
                    }
                    value={
                      ingredientOptions.find((opt) => opt.name === ingredient.name) ||
                      ingredient.name ||
                      null
                    }
                    inputValue={ingredient.name}
                    onInputChange={(_, newValue) => {
                      handleChange(index, "name", newValue);
                      handleInputChange(newValue);
                    }}
                    onChange={(_, newValue) => {
                      if (typeof newValue === "string") {
                        handleChange(index, "name", newValue);
                      } else if (newValue) {
                        handleChange(index, "name", newValue.name);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="e.g. Tomato"
                        variant="outlined"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: "0.9rem",
                          },
                        }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell sx={{ py: 1.25, px: 0.5 }}>
                  <TextField
                    size="small"
                    type="number"
                    value={ingredient.quantity}
                    onChange={(e) =>
                      handleChange(index, "quantity", e.target.value)
                    }
                    placeholder="0"
                    inputProps={{ step: "0.01" }}
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.9rem",
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 1.25, px: 0.5 }}>
                  <Select
                    size="small"
                    value={ingredient.unit}
                    onChange={(e) =>
                      handleChange(index, "unit", e.target.value as IngredientUnit)
                    }
                    fullWidth
                    variant="outlined"
                    sx={{
                      fontSize: "0.9rem",
                    }}
                  >
                    {UNIT_OPTIONS.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell sx={{ py: 1.25, px: 0.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={ingredient.note}
                    onChange={(e) => handleChange(index, "note", e.target.value)}
                    placeholder="Optional"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.9rem",
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: "center", py: 1.25, px: 0.5 }}>
                  <Checkbox
                    checked={ingredient.optional}
                    onChange={(e) =>
                      handleChange(index, "optional", e.target.checked)
                    }
                    sx={{
                      color: "#8A6A2F",
                      "&.Mui-checked": {
                        color: "#8A6A2F",
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: "center", py: 1.25, pr: 2 }}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemove(index)}
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(211, 47, 47, 0.08)",
                      },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: "1.1rem" }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Add Ingredient Button */}
      <Stack sx={{ justifyContent: "flex-start", pt: 1 }}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddIngredient}
          variant="outlined"
          size="small"
          sx={{
            width: "fit-content",
            borderColor: "#B39760",
            color: "#2B2522",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            "&:hover": {
              backgroundColor: "rgba(138, 106, 47, 0.05)",
              borderColor: "#A68B5B",
            },
          }}
        >
          Add Ingredient
        </Button>
      </Stack>
    </Box>
  );
};
