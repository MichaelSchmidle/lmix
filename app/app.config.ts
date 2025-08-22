export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: 'cursor-pointer',
      },
    },
    colors: {
      primary: 'indigo',
      neutral: 'stone',
    },
    container: {
      base: 'max-w-prose py-3 sm:py-4.5 lg:py-6 space-y-12',
    },
    form: {
      base: 'space-y-6',
    },
    icons: {
      arrowLeft: 'i-ph-arrow-left',
      arrowRight: 'i-ph-arrow-right',
      check: 'i-ph-check',
      chevronDoubleLeft: 'i-ph-caret-double-left',
      chevronDoubleRight: 'i-ph-caret-double-right',
      chevronDown: 'i-ph-caret-down',
      chevronLeft: 'i-ph-caret-left',
      chevronRight: 'i-ph-caret-right',
      chevronUp: 'i-ph-caret-up',
      close: 'i-ph-x',
      ellipsis: 'i-ph-dots-three',
      external: 'i-ph-arrow-square-out',
      file: 'i-ph-file-text',
      folder: 'i-ph-folder',
      folderOpen: 'i-ph-folder-open',
      loading: 'i-ph-circle-notch',
      minus: 'i-ph-minus',
      plus: 'i-ph-plus',
      search: 'i-ph-magnifying-glass',
      upload: 'i-ph-upload',
      arrowUp: 'i-ph-arrow-up',
      arrowDown: 'i-ph-arrow-down',
      caution: 'i-ph-warning-circle',
      copy: 'i-ph-copy',
      copyCheck: 'i-ph-check-circle',
      dark: 'i-ph-moon',
      error: 'i-ph-x-circle',
      eye: 'i-ph-eye',
      eyeOff: 'i-ph-eye-slash',
      hash: 'i-ph-hash',
      info: 'i-ph-info',
      light: 'i-ph-sun',
      menu: 'i-ph-list',
      panelClose: 'i-ph-sidebar-simple',
      panelOpen: 'i-ph-sidebar-simple',
      reload: 'i-ph-arrow-counter-clockwise',
      stop: 'i-ph-stop',
      success: 'i-ph-check-circle',
      system: 'i-ph-desktop',
      tip: 'i-ph-lightbulb',
      warning: 'i-ph-warning',
    },
    input: {
      slots: {
        root: 'w-full',
      },
    },
  },
  uiPro: {
    dashboardNavbar: {
      slots: {
        root: 'sm:px-4',
        title: 'overflow-hidden text-ellipsis',
      },
    },
    dashboardPanel: {
      slots: {
        body: 'px-4 py-3 sm:px-4 sm:py-4',
      },
    },
    dashboardSidebar: {
      slots: {
        body: 'py-3',
        footer: 'py-3',
      },
    },
    dashboardToolbar: {
      slots: {
        root: 'sm:px-4',
      },
    },
  },
})
