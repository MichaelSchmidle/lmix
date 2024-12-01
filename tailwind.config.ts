import type { Config } from 'tailwindcss'

export default {
  content: [
    './formkit.theme.ts',
  ],
  theme: {
    extend: {
      colors: {
        "white": "#e7e6e7",
        "black": "#19181b",
        "stone": { // indigo-based gray scale
          "950": "#1d1a23",
          "900": "#201d25",
          "800": "#2a282d",
          "700": "#3c3b3f",
          "600": "#57555b",
          "500": "#78767c",
          "400": "#9b999d",
          "300": "#b9b8ba",
          "200": "#d0d0d1",
          "100": "#dededf",
          "50": "#e3e2e3"
        },
        "slate": { // cyan-based gray scale
          "950": "#1b1c1c",
          "900": "#1e1f1f",
          "800": "#28292a",
          "700": "#3a3c3d",
          "600": "#545658",
          "500": "#74787a",
          "400": "#969b9d",
          "300": "#b5b9bc",
          "200": "#ced1d2",
          "100": "#dddee0",
          "50": "#e1e3e4"
        },
        "rose": {
          "950": "#370725",
          "900": "#3d0729",
          "800": "#500837",
          "700": "#73074f",
          "600": "#a10e70",
          "500": "#db179a",
          "400": "#fc5cbb",
          "300": "#fd99cf",
          "200": "#fbbfdd",
          "100": "#fad3e7",
          "50": "#fad9ea"
        },
        "orange": {
          "950": "#261906",
          "900": "#2b1b06",
          "800": "#3a2405",
          "700": "#563303",
          "600": "#7b4a04",
          "500": "#a86709",
          "400": "#d8850f",
          "300": "#fda330",
          "200": "#fbc58c",
          "100": "#fbd7b4",
          "50": "#fbddc0"
        },
        "lime": {
          "950": "#181e05",
          "900": "#192104",
          "800": "#202d03",
          "700": "#2b4200",
          "600": "#3f5f00",
          "500": "#598300",
          "400": "#74a900",
          "300": "#8cca00",
          "200": "#a2e326",
          "100": "#b1f139",
          "50": "#89fc73"
        },
        "cyan": {
          "950": "#071e2d",
          "900": "#072131",
          "800": "#072c41",
          "700": "#05405e",
          "600": "#095d86",
          "500": "#1280b7",
          "400": "#1ba5ea",
          "300": "#6fc2fd",
          "200": "#aad6fb",
          "100": "#c7e2fb",
          "50": "#cfe6fa"
        },
        "indigo": {
          "950": "#230955",
          "900": "#260a5e",
          "800": "#320d7c",
          "700": "#4611b1",
          "600": "#6623ec",
          "500": "#9058f0",
          "400": "#b285f4",
          "300": "#ccabf7",
          "200": "#ddc8f7",
          "100": "#e7d9f8",
          "50": "#eadef9"
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Andale Mono', 'monospace'],
      },
      ringOpacity: {
        DEFAULT: '1'
      },
      typography: {
        DEFAULT: {
          css: {
            'body': {
              scrollBehavior: 'smooth',
            },
            'code::before': {
              content: '""'
            },
            'code::after': {
              content: '""'
            },
            code: {
              color: '#ebebec',
              backgroundColor: '#2a282d',
              borderRadius: '0.25rem',
              paddingLeft: '0.375rem',
              paddingRight: '0.375rem',
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              fontWeight: '400',
            },
          }
        },
        invert: {
          css: {
            code: {
              color: '#d0d0d1',
              backgroundColor: '#18141f',
            },
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config 