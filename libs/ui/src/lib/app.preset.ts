// Preset corporativo derivado del sistema visual de prime-showcase: Aura + paleta Implementos.
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

const IMPLEMENTOS_NEUTRAL = {
  0: '#ffffff',
  50: '#f9fafb',
  100: '#f2f3f6',
  200: '#e2e4e7',
  300: '#ced0d4',
  400: '#97999d',
  500: '#636569',
  600: '#484a4e',
  700: '#37393d',
  800: '#232427',
  900: '#151619',
  950: '#07080a',
} as const;
export const AppPreset = definePreset(Aura, {
  components: {
    togglebutton: {
      colorScheme: {
        light: {
          root: {
            background: '{surface.200}',
            hoverBackground: '{surface.200}',
            checkedBackground: '{surface.200}',
            borderColor: '{surface.200}',
            checkedBorderColor: '{surface.200}',
            color: '{surface.600}',
          },
        },
        dark: {
          root: {
            background: '{surface.700}',
            hoverBackground: '{surface.700}',
            checkedBackground: '{surface.700}',
            borderColor: '{surface.700}',
            checkedBorderColor: '{surface.700}',
            color: '{surface.300}',
          },
        },
      },
    },
    paginator: {
      colorScheme: {
        light: { navButton: { selectedBackground: '{primary.100}', selectedColor: '{primary.700}' } },
        dark: { navButton: { selectedBackground: '{primary.900}', selectedColor: '{primary.100}' } },
      },
    },
    button: {
      colorScheme: {
        light: {
          root: {
            secondary: {
              background: '{surface.200}',
              hoverBackground: '{surface.300}',
              activeBackground: '{surface.400}',
              borderColor: '{surface.200}',
              hoverBorderColor: '{surface.300}',
              activeBorderColor: '{surface.400}',
              color: '{surface.700}',
              hoverColor: '{surface.800}',
              activeColor: '{surface.900}',
              focusRing: { color: '{surface.500}', shadow: 'none' },
            },
          },
        },
        dark: {
          root: {
            secondary: {
              background: '{surface.700}',
              hoverBackground: '{surface.600}',
              activeBackground: '{surface.500}',
              borderColor: '{surface.700}',
              hoverBorderColor: '{surface.600}',
              activeBorderColor: '{surface.500}',
              color: '{surface.100}',
              hoverColor: '{surface.50}',
              activeColor: '{surface.0}',
              focusRing: { color: '{surface.300}', shadow: 'none' },
            },
          },
        },
      },
    },
    message: {
      colorScheme: {
        light: {
          error: {
            simple: { color: '{rose.500}' },
            color: '{rose.500}',
            borderColor: '{rose.200}',
          },
        },
        dark: {
          error: {
            simple: { color: '{rose.400}' },
            color: '{rose.400}',
          },
        },
      },
    },
  },
  semantic: {
    transitionDuration: '0s',
    primary: {
      50: '#f0f7ff',
      100: '#d9ecff',
      200: '#b1d8ff',
      300: '#7abbf8',
      400: '#4496de',
      500: '#006db6',
      600: '#005996',
      700: '#004678',
      800: '#00355d',
      900: '#002646',
      950: '#001831',
    },
    accent: {
      50: '#ebfbf6',
      100: '#d4f4ec',
      200: '#afe6d9',
      300: '#7fd1bf',
      400: '#49b5a1',
      500: '#00937f',
      600: '#007666',
      700: '#005c4f',
      800: '#00443a',
      900: '#003028',
      950: '#001d17',
    },
    colorScheme: {
      light: {
        surface: IMPLEMENTOS_NEUTRAL,
        // Measured in prime-showcase-mu.vercel.app; its published focus palette differs from local main.
        focusRing: { color: '#b2ddf9' },
        formField: { focusBorderColor: '#0074c2', invalidBorderColor: '{rose.500}' },
        content: { hoverBackground: '{surface.200}' },
        text: { muted: { color: '{surface.600}' } },
      },
      dark: {
        surface: IMPLEMENTOS_NEUTRAL,
        focusRing: { color: '#27a0f1' },
        formField: { focusBorderColor: '#27a0f1', invalidBorderColor: '{rose.400}' },
        content: { hoverBackground: '{surface.700}' },
        text: { muted: { color: '{surface.300}' } },
      },
    },
    focusRing: {
      width: '0',
      style: 'none',
      offset: '0',
      shadow: '0 0 0 0.2rem {focus.ring.color}',
    },
  },
});

export const PRIMENG_OPTIONS = {
  darkModeSelector: '.p-dark',
  cssLayer: {
    name: 'primeng',
    order: 'theme, base, primeng',
  },
} as const;
