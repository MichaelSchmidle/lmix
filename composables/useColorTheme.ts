import { useState, useCookie } from '#app'

export type ColorTheme = 'cyan' | 'indigo'

export const useColorTheme = () => {
  // Use Nuxt's state management
  const theme = useState<ColorTheme>('color-theme', () => 'cyan')
  const themeCookie = useCookie('nuxt-ui-primary')
  const appConfig = useAppConfig()

  const setTheme = (color: ColorTheme) => {
    // Update state
    theme.value = color

    // Update app config
    appConfig.ui.primary = color
    appConfig.ui.gray = color === 'cyan' ? 'slate' : 'stone'

    // Update CSS variables
    if (process.client) {
      document.documentElement.style.setProperty(
        '--color-white',
        color === 'cyan' ? '#e5e7e8' : '#e7e6e7'
      )
      document.documentElement.style.setProperty(
        '--color-black',
        color === 'cyan' ? '#181919' : '#19181b'
      )
    }

    // Store preference
    themeCookie.value = color
  }

  // Initialize theme from cookie
  const initTheme = () => {
    if (themeCookie.value) {
      setTheme(themeCookie.value as ColorTheme)
    }
  }

  return {
    theme,
    setTheme,
    initTheme
  }
} 