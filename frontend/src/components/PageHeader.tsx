import React from 'react';
import { Box, Button, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  variant?: 'contained' | 'outlined';
  color?: 'primary' | 'error' | 'inherit';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  primaryAction?: PageHeaderAction;
  secondaryAction?: PageHeaderAction;
}

/**
 * PageHeader - A reusable, responsive page header component
 * 
 * Features:
 * - Responsive layout (desktop: actions on right, mobile: actions below text)
 * - Supports title, subtitle, and optional primary/secondary action buttons
 * - Maintains beige/earthy theme consistency
 * 
 * @example
 * <PageHeader
 *   title="My Recipes"
 *   primaryAction={{
 *     label: "Create Recipe",
 *     onClick: () => navigate("/addRecipe"),
 *     icon: <AddIcon />
 *   }}
 * />
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const actionButtons = (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        width: isMobile ? '100%' : 'auto',
        justifyContent: isMobile ? 'flex-start' : 'flex-end',
      }}
    >
      {secondaryAction && (
        <Button
          variant={secondaryAction.variant || 'outlined'}
          color={secondaryAction.color || 'primary'}
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
          startIcon={secondaryAction.icon}
          fullWidth={isMobile}
          sx={{
            textTransform: 'none',
            ...(secondaryAction.variant === 'outlined' && {
              borderColor: '#B39760',
              color: '#2B2522',
              '&:hover': {
                backgroundColor: 'rgba(138, 106, 47, 0.05)',
              },
            }),
          }}
        >
          {secondaryAction.label}
        </Button>
      )}
      {primaryAction && (
        <Button
          variant={primaryAction.variant || 'contained'}
          color={primaryAction.color || 'primary'}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          startIcon={primaryAction.icon}
          fullWidth={isMobile}
          sx={{
            textTransform: 'none',
            ...(primaryAction.variant === 'contained' && primaryAction.color !== 'error' && {
              backgroundColor: '#8A6A2F',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#6F5623',
              },
            }),
          }}
        >
          {primaryAction.label}
        </Button>
      )}
    </Stack>
  );

  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 2 : 0,
      }}
    >
      {/* Text Content */}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: '#2B2522',
            mb: subtitle ? 1 : 0,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              color: '#5C524E',
              fontSize: '0.95rem',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Actions */}
      {(primaryAction || secondaryAction) && !isMobile && actionButtons}

      {/* Mobile Actions */}
      {(primaryAction || secondaryAction) && isMobile && (
        <Box sx={{ width: '100%' }}>
          {actionButtons}
        </Box>
      )}
    </Box>
  );
};
