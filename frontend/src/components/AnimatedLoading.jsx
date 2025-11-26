import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';
import {
  LocalPizza as PizzaIcon,
  Fastfood as FastfoodIcon,
  LocalDrink as DrinkIcon,
  Cake as CakeIcon,
  Restaurant as RestaurantIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
`;

const AnimatedLoading = ({ message = 'Loading...' }) => {
  const theme = useTheme();
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  // Food/Product icons array using theme colors
  const icons = [
    { Icon: PizzaIcon, color: theme.palette.error.main, name: 'Pizza' },
    { Icon: FastfoodIcon, color: theme.palette.warning.main, name: 'Burger' },
    { Icon: DrinkIcon, color: theme.palette.success.main, name: 'Drink' },
    { Icon: CakeIcon, color: theme.palette.secondary.main, name: 'Dessert' },
    { Icon: RestaurantIcon, color: theme.palette.info.main, name: 'Food' }
  ];

  useEffect(() => {
    // Change icon every 1 second (1000ms pause + animation time)
    const interval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % icons.length);
    }, 1500); // 1s pause + 0.5s for animation

    return () => clearInterval(interval);
  }, []);

  const { Icon, color } = icons[currentIconIndex];

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={message}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: 3
      }}
    >
      {/* Icon Animation Container */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'relative',
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIconIndex}
            initial={{ 
              x: -150, 
              opacity: 0,
              scale: 0.5,
              rotate: -45
            }}
            animate={{ 
              x: 0, 
              opacity: 1,
              scale: 1,
              rotate: 0
            }}
            exit={{ 
              x: 150, 
              opacity: 0,
              scale: 0.5,
              rotate: 45
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon 
              sx={{ 
                fontSize: '80px',
                color: color,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
              }} 
            />
          </motion.div>
        </AnimatePresence>

        {/* Background Circle */}
        <Box
          sx={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}33, ${color}66)`, // approx 20% and 40% opacity
            zIndex: -1,
            animation: `${pulse} 2s ease-in-out infinite`
          }}
        />
      </Box>

      {/* Loading Text */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 1
          }}
        >
          {message}
        </Typography>

        {/* Animated Dots */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: color
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AnimatedLoading;

