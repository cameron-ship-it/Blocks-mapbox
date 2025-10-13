/**
 * Blocks NYC Design System
 * 
 * Central theme configuration for the Blocks NYC apartment search experience.
 * Visual language inspired by architectural studios with subtle motion and high legibility.
 */

export const theme = {
  // Color Palette
  colors: {
    ink: '#0A0A0A',
    ink2: '#111111',
    charcoal: '#1E1E1E',
    gray1: '#F5F5F5',
    gray2: '#EDEDED',
    gray3: '#DCDCDC',
    accentBlue: '#3D8BFF',
    accentRed: '#FF6B6B',
    success: '#16A34A',
    warning: '#F59E0B',
    textPrimary: '#0A0A0A',
    textSecondary: '#525252',
    border: '#E5E7EB',
  },

  // Typography
  typography: {
    fonts: {
      primary: 'Inter',
      display: 'DM Sans',
    },
    sizes: {
      h1: { size: '32px', lineHeight: '36px', weight: 700 },
      h2: { size: '24px', lineHeight: '28px', weight: 700 },
      h3: { size: '20px', lineHeight: '24px', weight: 600 },
      body: { size: '16px', lineHeight: '24px', weight: 400 },
      label: { size: '14px', lineHeight: '20px', weight: 500 },
    },
  },

  // Border Radius
  radius: {
    default: '16px',
    card: '24px',
    button: '12px',
  },

  // Shadows
  shadows: {
    card: '0px 2px 8px 0px rgba(0, 0, 0, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
    popover: '0px 4px 16px 0px rgba(0, 0, 0, 0.08), 0px 2px 4px 0px rgba(0, 0, 0, 0.06)',
  },

  // Motion
  motion: {
    duration: {
      fast: '180ms',
      normal: '200ms',
      slow: '220ms',
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // easeInOut
  },

  // Layout
  layout: {
    maxWidth: '960px',
    gutterMobile: '20px',
    gutterDesktop: '20px',
  },

  // Steps
  steps: [
    { id: 'budget', label: 'Budget' },
    { id: 'borough', label: 'Borough' },
    { id: 'neighborhood', label: 'Neighborhood' },
    { id: 'blocks', label: 'Blocks' },
    { id: 'review', label: 'Review' },
  ] as const,
} as const;

export type Theme = typeof theme;
export type StepId = typeof theme.steps[number]['id'];
