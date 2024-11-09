// formkit.config.{ts|js}
import { defineFormKitConfig } from '@formkit/vue'
import { genesisIcons } from '@formkit/icons'
import { createAutoAnimatePlugin } from '@formkit/addons'
import { createProPlugin, taglist } from '@formkit/pro'
import { rootClasses } from './formkit.theme'

// Create the Pro plugin
const proPlugin = createProPlugin('fk-81a7006971b', {
  taglist,
})

export default defineFormKitConfig({
  config: {
    rootClasses: rootClasses,
  },
  icons: {
    ...genesisIcons,
  },
  plugins: [
    proPlugin,
    createAutoAnimatePlugin(),
  ],
})