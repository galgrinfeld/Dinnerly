import React from "react";
import { Box, BoxProps } from "@mui/material";

interface TabPanelProps {
  children?: React.ReactNode;
  idPrefix?: string;
  index: number;
  value: number;
  sx?: BoxProps["sx"];
}

export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  idPrefix,
  index,
  value,
  sx = { py: 2 },
}) => {
  const panelId = idPrefix ? `${idPrefix}-tabpanel-${index}` : undefined;
  const tabId = idPrefix ? `${idPrefix}-tab-${index}` : undefined;

  return (
    <Box role="tabpanel" hidden={value !== index} id={panelId} aria-labelledby={tabId}>
      {value === index && <Box sx={sx}>{children}</Box>}
    </Box>
  );
};
