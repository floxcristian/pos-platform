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

type ColorScheme = 'light' | 'dark';
type ButtonTone =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warn'
  | 'help'
  | 'danger'
  | 'contrast'
  | 'plain';
type ButtonRamp = 'surface' | 'primary' | 'green' | 'sky' | 'orange' | 'purple' | 'red';

interface ButtonInteractionTokens {
  color: string;
  hoverBackground: string;
  activeBackground: string;
}

// Text and outlined variants share one foreground token across all states.
// Select its shade against the strongest (active) background, including labeled calendar actions.
function buttonInteraction(ramp: ButtonRamp, mode: ColorScheme): ButtonInteractionTokens {
  if (ramp === 'surface') {
    return mode === 'light'
      ? { color: '{surface.800}', hoverBackground: '{surface.300}', activeBackground: '{surface.400}' }
      : { color: '{surface.200}', hoverBackground: '{surface.600}', activeBackground: '{surface.500}' };
  }
  return mode === 'light'
    ? {
        color: `{${ramp}.${ramp === 'primary' ? 700 : 900}}`,
        hoverBackground: `{${ramp}.200}`,
        activeBackground: `{${ramp}.300}`,
      }
    : {
        color: `{${ramp}.100}`,
        hoverBackground: `{${ramp}.800}`,
        activeBackground: `{${ramp}.700}`,
      };
}

function buttonInteractionPalette(mode: ColorScheme): Record<ButtonTone, ButtonInteractionTokens> {
  return {
    primary: buttonInteraction('primary', mode),
    secondary: buttonInteraction('surface', mode),
    success: buttonInteraction('green', mode),
    info: buttonInteraction('sky', mode),
    warn: buttonInteraction('orange', mode),
    help: buttonInteraction('purple', mode),
    danger: buttonInteraction('red', mode),
    contrast: buttonInteraction('surface', mode),
    // Aura retains plain for its legacy neutral variant.
    plain: buttonInteraction('surface', mode),
  };
}

const NEUTRAL_HOVER = {
  light: { hoverBackground: '{surface.300}', hoverColor: '{surface.800}' },
  dark: { hoverBackground: '{surface.600}', hoverColor: '{surface.100}' },
} as const;

function toastInteraction(ramp: 'blue' | 'green' | 'yellow' | 'red', mode: ColorScheme) {
  return {
    color: `{${ramp}.${mode === 'light' ? 900 : 100}}`,
    closeButton: { hoverBackground: `{${ramp}.${mode === 'light' ? 300 : 700}}` },
  };
}

export const AppPreset = definePreset(Aura, {
  components: {
    togglebutton: {
      colorScheme: {
        light: {
          root: {
            background: '{surface.200}',
            ...NEUTRAL_HOVER.light,
            checkedBackground: '{surface.200}',
            borderColor: '{surface.200}',
            checkedBorderColor: '{surface.200}',
            color: '{surface.600}',
          },
          icon: { hoverColor: NEUTRAL_HOVER.light.hoverColor },
        },
        dark: {
          root: {
            background: '{surface.700}',
            ...NEUTRAL_HOVER.dark,
            checkedBackground: '{surface.700}',
            borderColor: '{surface.700}',
            checkedBorderColor: '{surface.700}',
            color: '{surface.300}',
          },
          icon: { hoverColor: NEUTRAL_HOVER.dark.hoverColor },
        },
      },
    },
    paginator: {
      colorScheme: {
        light: {
          navButton: {
            ...NEUTRAL_HOVER.light,
            selectedBackground: '{primary.100}',
            selectedColor: '{primary.700}',
          },
        },
        dark: {
          navButton: {
            ...NEUTRAL_HOVER.dark,
            selectedBackground: '{primary.900}',
            selectedColor: '{primary.100}',
          },
        },
      },
    },
    datepicker: {
      colorScheme: {
        light: {
          date: NEUTRAL_HOVER.light,
          selectMonth: NEUTRAL_HOVER.light,
          selectYear: NEUTRAL_HOVER.light,
        },
        dark: {
          date: NEUTRAL_HOVER.dark,
          selectMonth: NEUTRAL_HOVER.dark,
          selectYear: NEUTRAL_HOVER.dark,
        },
      },
    },
    toast: {
      colorScheme: {
        light: {
          info: toastInteraction('blue', 'light'),
          success: toastInteraction('green', 'light'),
          warn: toastInteraction('yellow', 'light'),
          error: toastInteraction('red', 'light'),
          secondary: {
            color: '{surface.800}',
            closeButton: { hoverBackground: '{surface.300}' },
          },
          contrast: { closeButton: { hoverBackground: '{surface.600}' } },
        },
        dark: {
          info: toastInteraction('blue', 'dark'),
          success: toastInteraction('green', 'dark'),
          warn: toastInteraction('yellow', 'dark'),
          error: toastInteraction('red', 'dark'),
          secondary: {
            color: '{surface.200}',
            closeButton: { hoverBackground: '{surface.600}' },
          },
          contrast: { closeButton: { hoverBackground: '{surface.300}' } },
        },
      },
    },
    button: {
      // The showcase tonal recipe is the shared filled-secondary style across the POS.
      colorScheme: {
        light: {
          text: buttonInteractionPalette('light'),
          outlined: buttonInteractionPalette('light'),
          root: {
            secondary: {
              background: '{primary.100}',
              hoverBackground: '{primary.200}',
              activeBackground: '{primary.300}',
              borderColor: '{primary.100}',
              hoverBorderColor: '{primary.200}',
              activeBorderColor: '{primary.300}',
              color: '{primary.700}',
              hoverColor: '{primary.700}',
              activeColor: '{primary.700}',
              focusRing: { color: '{focus.ring.color}', shadow: '{focus.ring.shadow}' },
            },
          },
        },
        dark: {
          text: buttonInteractionPalette('dark'),
          outlined: buttonInteractionPalette('dark'),
          root: {
            secondary: {
              background: '{primary.900}',
              hoverBackground: '{primary.800}',
              activeBackground: '{primary.700}',
              borderColor: '{primary.900}',
              hoverBorderColor: '{primary.800}',
              activeBorderColor: '{primary.700}',
              color: '{primary.100}',
              hoverColor: '{primary.100}',
              activeColor: '{primary.100}',
              focusRing: { color: '{focus.ring.color}', shadow: '{focus.ring.shadow}' },
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
