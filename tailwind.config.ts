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
          "900": "#56093b",
          "800": "#770752",
          "700": "#970c69",
          "600": "#b91281",
          "500": "#db179a",
          "400": "#fb2bb3",
          "300": "#fc6bbf",
          "200": "#fc94cd",
          "100": "#fbb8db",
          "50": "#fad9ea"
        },
        "orange": {
          "950": "#261906",
          "900": "#502f03",
          "800": "#754504",
          "700": "#995d07",
          "600": "#bb730c",
          "500": "#dd8910",
          "400": "#fb9b13",
          "300": "#fcb566",
          "200": "#fbcb99",
          "100": "#fbd7b4",
          "50": "#fbddc0"
        },
        "lime": {
          "950": "#181e05",
          "900": "#283d00",
          "800": "#3c5a00",
          "700": "#507700",
          "600": "#649200",
          "500": "#77ad00",
          "400": "#87c400",
          "300": "#97d714",
          "200": "#a6e72b",
          "100": "#b1f139",
          "50": "#b6f541"
        },
        "cyan": {
          "950": "#071e2d",
          "900": "#073046",
          "800": "#054362",
          "700": "#09567d",
          "600": "#0e6b99",
          "500": "#1280b7",
          "400": "#1696d5",
          "300": "#1cacf4",
          "200": "#67c0fd",
          "100": "#a1d3fb",
          "50": "#cfe6fa"
        },
        "indigo": {
          "950": "#230955",
          "900": "#350e85",
          "800": "#4811b7",
          "700": "#5d19e7",
          "600": "#793bee",
          "500": "#9058f0",
          "400": "#a573f2",
          "300": "#b88df5",
          "200": "#caa8f7",
          "100": "#dac3f7",
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