import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Box,
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { RecipeListItem } from "../types/api";
import { formatCookingTime } from "../utils/formatters";

interface RecipeCarouselCardProps {
  recipe: RecipeListItem;
  onViewDetails: (recipeId: number) => void;
}

export const RecipeCarouselCard: React.FC<RecipeCarouselCardProps> = ({
  recipe,
  onViewDetails,
}) => {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        overflow: "hidden",
        "&:hover .card-action": {
          color: "#654B20",
        },
      }}
      onClick={() => onViewDetails(recipe.id)}
    >
      {/* Recipe Image or Placeholder */}
      {recipe.imageUrl ? (
        <CardMedia
          component="img"
          image={recipe.imageUrl}
          alt={recipe.name}
          sx={{ aspectRatio: "4 / 3", height: "auto", objectFit: "cover" }}
        />
      ) : (
        <Box
          sx={{
            aspectRatio: "4 / 3",
            backgroundColor: "#EEE8DE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#7A5E2B",
            fontWeight: 600,
            fontSize: "0.875rem",
            textAlign: "center",
            px: 2,
          }}
        >
          No Image
        </Box>
      )}

      {/* Card Content */}
      <CardContent sx={{ flexGrow: 1, p: 2.25 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 700,
            color: "#241F1C",
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: "2.8em",
          }}
        >
          {recipe.name}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#625852",
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            minHeight: "1.2em",
          }}
        >
          {recipe.description || "No description provided"}
        </Typography>

        {/* Metadata Row */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
            pt: 1,
            borderTop: "1px solid #E8E1D8",
            color: "#6E625A",
            fontSize: "0.875rem",
            fontWeight: 650,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <RestaurantIcon sx={{ fontSize: "1rem" }} />
            <span>{recipe.baseServings} servings</span>
          </Box>
          {recipe.cookingTimeMinutes && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: "1rem" }} />
              <span>{formatCookingTime(recipe.cookingTimeMinutes)}</span>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Card Actions */}
      <CardActions sx={{ px: 2.25, pb: 2.25, pt: 0 }}>
        <Button
          className="card-action"
          variant="text"
          endIcon={<ArrowForwardIcon />}
          onClick={(event) => {
            event.stopPropagation();
            onViewDetails(recipe.id);
          }}
          sx={{
            color: "#7A5E2B",
            px: 0,
            fontWeight: 760,
            "&:hover": { backgroundColor: "transparent" },
          }}
        >
          View Recipe
        </Button>
      </CardActions>
    </Card>
  );
};
