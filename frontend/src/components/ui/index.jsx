/**
 * SimplePOS UI Components - Material Design 3
 * 
 * Reusable, simplified UI primitives for consistent styling.
 * These components wrap MUI with sensible defaults.
 */

import React from 'react';
import {
  Box,
  Card as MuiCard,
  CardContent,
  Typography,
  IconButton as MuiIconButton,
  Button as MuiButton,
  Chip as MuiChip,
  TextField as MuiTextField,
  InputAdornment,
  Paper as MuiPaper,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

// ============================================
// PRODUCT CARD - Compact, space-efficient
// ============================================
export function ProductCard({ 
  name, 
  price, 
  image, 
  onClick, 
  selected = false,
  compact = true,
  ...props 
}) {
  return (
    <MuiCard
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: 'primary.main',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        ...props.sx,
      }}
      {...props}
    >
      {/* Image - compact aspect ratio */}
      <Box
        sx={{
          position: 'relative',
          paddingTop: compact ? '75%' : '100%', // 4:3 or 1:1
          bgcolor: 'action.hover',
          overflow: 'hidden',
        }}
      >
        {image && (
          <Box
            component="img"
            src={image}
            alt={name}
            loading="lazy"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </Box>
      
      {/* Content - minimal padding */}
      <Box sx={{ p: 1, textAlign: 'center' }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            fontSize: '0.75rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.6em',
          }}
        >
          {name}
        </Typography>
        {price !== undefined && (
          <Typography
            variant="caption"
            color="primary"
            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
          >
            ${parseFloat(price).toFixed(2)}
          </Typography>
        )}
      </Box>
    </MuiCard>
  );
}

// ============================================
// CART ITEM - Compact list item
// ============================================
export function CartItem({
  name,
  price,
  quantity,
  onIncrease,
  onDecrease,
  onRemove,
  ...props
}) {
  const total = (parseFloat(price) * quantity).toFixed(2);
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        px: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        ...props.sx,
      }}
      {...props}
    >
      {/* Item info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            fontSize: '0.8rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ${parseFloat(price).toFixed(2)} ea
        </Typography>
      </Box>
      
      {/* Quantity controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <MuiIconButton size="small" onClick={onDecrease} sx={{ p: 0.5 }}>
          <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>−</Box>
        </MuiIconButton>
        <Typography
          variant="body2"
          sx={{ minWidth: 24, textAlign: 'center', fontWeight: 500 }}
        >
          {quantity}
        </Typography>
        <MuiIconButton size="small" onClick={onIncrease} sx={{ p: 0.5 }}>
          <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>+</Box>
        </MuiIconButton>
      </Box>
      
      {/* Total */}
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, minWidth: 50, textAlign: 'right' }}
      >
        ${total}
      </Typography>
    </Box>
  );
}

// ============================================
// CATEGORY CHIP - For filtering
// ============================================
export function CategoryChip({ 
  label, 
  icon, 
  selected = false, 
  onClick,
  color,
  ...props 
}) {
  return (
    <MuiChip
      label={label}
      icon={icon}
      onClick={onClick}
      sx={{
        bgcolor: selected ? (color || 'primary.main') : 'action.hover',
        color: selected ? 'primary.contrastText' : 'text.primary',
        fontWeight: selected ? 600 : 400,
        '&:hover': {
          bgcolor: selected ? (color || 'primary.main') : 'action.selected',
        },
        ...props.sx,
      }}
      {...props}
    />
  );
}

// ============================================
// SEARCH INPUT - Simplified search field
// ============================================
export function SearchInput({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  ...props 
}) {
  return (
    <MuiTextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box component="span" sx={{ opacity: 0.5 }}>🔍</Box>
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'action.hover',
        },
        ...props.sx,
      }}
      {...props}
    />
  );
}

// ============================================
// SECTION HEADER - Consistent section titles
// ============================================
export function SectionHeader({ title, action, ...props }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        ...props.sx,
      }}
      {...props}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}

// ============================================
// STAT CARD - For displaying metrics
// ============================================
export function StatCard({ label, value, icon, trend, ...props }) {
  return (
    <MuiPaper
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        ...props.sx,
      }}
      {...props}
    >
      {icon && (
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
          }}
        >
          {icon}
        </Box>
      )}
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {trend && (
          <Typography
            variant="caption"
            color={trend > 0 ? 'success.main' : 'error.main'}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </Typography>
        )}
      </Box>
    </MuiPaper>
  );
}

// ============================================
// LOADING SPINNER - Centered loading state
// ============================================
export function Loading({ message, size = 40, ...props }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        ...props.sx,
      }}
      {...props}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

// ============================================
// EMPTY STATE - For empty lists/grids
// ============================================
export function EmptyState({ icon, title, description, action, ...props }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 4,
        textAlign: 'center',
        ...props.sx,
      }}
      {...props}
    >
      {icon && (
        <Box sx={{ fontSize: 48, opacity: 0.3, mb: 1 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}

// ============================================
// ORDER BADGE - For active orders bar
// ============================================
export function OrderBadge({ 
  name, 
  status = 'pending', 
  waitTime, 
  onClick,
  selected = false,
  ...props 
}) {
  const statusColors = {
    pending: 'warning.main',
    active: 'info.main',
    ready: 'success.main',
    paid: 'success.main',
  };
  
  const getTimeColor = (minutes) => {
    if (minutes >= 10) return 'error.main';
    if (minutes >= 5) return 'warning.main';
    return 'success.main';
  };
  
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 0.75,
        minWidth: 56,
        borderRadius: 1,
        cursor: 'pointer',
        bgcolor: selected ? 'primary.main' : 'action.hover',
        border: 1,
        borderColor: selected ? 'primary.light' : 'transparent',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: selected ? 'primary.main' : 'action.selected',
          transform: 'scale(1.05)',
        },
        ...props.sx,
      }}
      {...props}
    >
      {/* Status dot */}
      {waitTime !== undefined && (
        <Box
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: getTimeColor(waitTime),
          }}
        />
      )}
      
      {/* Name */}
      <Typography
        variant="caption"
        sx={{
          fontWeight: selected ? 600 : 400,
          fontSize: '0.65rem',
          maxWidth: 52,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </Typography>
    </Box>
  );
}

// Re-export MUI components with defaults
export { MuiButton as Button, MuiChip as Chip, MuiTextField as TextField };
