import React from "react";
import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

interface EmptyStateBlockProps {
  emoji?: string;
  icon?: React.ReactNode;
  title: string;
  message: string;
}

export const EmptyStateBlock: React.FC<EmptyStateBlockProps> = ({
  emoji,
  icon,
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
        backgroundColor: "#FFFFFF",
        borderRadius: 1,
        border: "1px dashed #D6CCBD",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          fontSize: "3rem",
          mb: 2,
          opacity: 0.75,
        }}
      >
        {icon || emoji || <InboxIcon sx={{ fontSize: "3rem" }} />}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#241F1C",
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "#625852",
          maxWidth: 280,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};
