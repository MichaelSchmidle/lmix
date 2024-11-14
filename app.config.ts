export default defineAppConfig({
  ui: {
    primary: 'indigo',
    gray: 'neutral',

    icons: {
      dark: 'i-ph-moon-duotone',
      light: 'i-ph-sun-duotone',
      system: 'i-ph-devices',
      search: 'i-ph-magnifying-glass',
      external: 'i-ph-arrow-square-out',
      chevron: 'i-ph-caret-down',
      hash: 'i-ph-hash',
      menu: 'i-ph-list',
      close: 'i-ph-x',
      check: 'i-ph-check'
    },

    accordion: {
      default: {
        class: 'hover:bg-gray-200 dark:hover:bg-gray-800 w-full',
        closeIcon: 'i-ph-caret-up',
        openIcon: 'i-ph-caret-down',
      },
      item: {
        padding: '',
      },
    },
    button: {
      default: {
        loadingIcon: 'i-ph-circle-notch',
      },
    },
    container: {
      constrained: 'max-w-prose',
      padding: '',
    },
    notifications: {
      // Show toasts at the top right of the screen
      position: 'top-0 bottom-[unset]'
    },
    page: {
      hero: {
        icon: {
          base: 'h-12 w-12',
        },
        title: 'font-serif font-normal',
      },
    },
    select: {
      default: {
        selectedIcon: 'i-ph-check',
        trailingIcon: 'i-ph-caret-down',
      },
    },
    selectMenu: {
      default: {
        selectedIcon: 'i-ph-check',
      },
    },
    skeleton: {
      background: 'bg-gray-200 dark:bg-gray-800',
    },
    slideover: {
      overlay: {
        background: 'bg-white/80 dark:bg-black/80',
        base: 'backdrop-blur-sm',
      },
    },
    verticalNavigation: {
      active: 'before:bg-white dark:before:bg-black',
      inactive: 'hover:before:bg-gray-200 dark:hover:before:bg-gray-800',
    },
  },
})
