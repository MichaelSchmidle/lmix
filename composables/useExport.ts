import { format } from '@formkit/tempo'
import { LMiXError } from '~/types/errors'

export const useExport = () => {
  const exportData = async () => {
    try {
      const response = await $fetch('/api/export', {
        responseType: 'text'
      })

      // Create blob from the JSON string
      const blob = new Blob([response], { type: 'application/json' })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${format(new Date(), 'YYYY-MM-DD HH-mm-ss')} LMiX Repertoire.json`
      document.body.appendChild(link) // Needed for Firefox
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (error) {
      throw new LMiXError(
        error instanceof Error ? error.message : 'Unknown error',
        'EXPORT_ERROR'
      )
    }
  }

  return {
    exportData
  }
}
