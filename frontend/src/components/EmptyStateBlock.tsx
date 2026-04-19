import React from "react";
import { Box, Typography } from "@mui/material";

interface EmptyStateBlockProps {
  emoji?: string;
  title: string;
  message: string;
}

export const EmptyStateBlock: React.FC<EmptyStateBlockProps> = ({
  emoji = "📭",
  title,
  message,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        px: 3,
        backgroundColor: "#FAFAF8",
        borderRadius: 2,
        border: "1px dashed #B39760",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          fontSize: "3rem",
          mb: 2,
          opacity: 0.7,
        }}
      >
        {emoji}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#2B2522",
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "#5C524E",
          maxWidth: 280,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};
