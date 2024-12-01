import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/api'
import { format } from '@formkit/tempo'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient<Database>(event)

    // Fetch all data in parallel
    const [
      { data: models },
      { data: personas },
      { data: assistants },
      { data: relations },
      { data: scenarios },
      { data: worlds },
    ] = await Promise.all([
      client.from('models').select('*'),
      client.from('personas').select('*'),
      client.from('assistants').select('*'),
      client.from('relations').select('*'),
      client.from('scenarios').select('*'),
      client.from('worlds').select('*'),
    ])

    // Remove API keys from models
    const sanitizedModels = models?.map(({ api_key, ...model }) => model) ?? []

    const exportData = {
      models: sanitizedModels,
      personas: personas ?? [],
      assistants: assistants ?? [],
      relations: relations ?? [],
      scenarios: scenarios ?? [],
      worlds: worlds ?? [],
    }

    // Generate filename with current timestamp
    const timestamp = format(new Date(), 'YYYY-MM-DD HH-mm-ss')

    setHeader(event, 'Content-Type', 'application/json')
    setHeader(event, 'Content-Disposition', `attachment; filename="${timestamp} LMiX Repertoire.json"`)

    return JSON.stringify(exportData, null, 2)
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to export data'
    })
  }
})
