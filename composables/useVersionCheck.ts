import { useRuntimeConfig } from '#app'
import semver from 'semver'

export const useVersionCheck = () => {
  const config = useRuntimeConfig()
  const currentVersion = config.public.lmixVersion
  const latestVersion = ref<string | null>(null)
  const hasUpdate = computed(() => {
    // Don't show updates in dev environment
    if (currentVersion === 'dev') return false
    // Don't show updates if version is unspecified
    if (currentVersion === 'unspecified') return false
    // Don't show updates if we haven't fetched the latest version yet
    if (!latestVersion.value) return false

    try {
      // Compare versions, ignoring the 'v' prefix
      return semver.gt(
        semver.clean(latestVersion.value) || '',
        semver.clean(currentVersion) || ''
      )
    }
    catch {
      return false
    }
  })

  const checkForUpdates = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/MichaelSchmidle/lmix/releases/latest')
      if (!response.ok) return

      const data = await response.json()
      latestVersion.value = data.tag_name
    }
    catch {
      // Silently fail - version check is not critical
    }
  }

  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    checkForUpdates
  }
}
