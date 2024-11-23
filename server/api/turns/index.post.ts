import { serverSupabaseClient } from '#supabase/server'
import { streamText, type CoreAssistantMessage, type CoreUserMessage, type CoreSystemMessage, CoreMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { Database } from '~/types/api'
import { Message, Turn } from '~/types/app'

export default defineEventHandler(async (event) => {
  const { production_uuid, assistant_uuid } = await readBody(event)
  const supabase = await serverSupabaseClient<Database>(event)

  // Get the assistant's model configuration
  const { data: assistant, error: assistantError } = await supabase
    .from('assistants')
    .select('*, model:models(*), persona:personas(*)')
    .eq('uuid', assistant_uuid)
    .single()

  if (assistantError) {
    throw new Error(assistantError.message)
  }

  if (!assistant) {
    throw new Error('Assistant not found')
  }

  if (!assistant.persona) {
    throw new Error('Assistant has no persona')
  }

  if (!assistant.model) {
    throw new Error('Assistant has no model')
  }

  // Get the production data
  const { data: production, error: productionError } = await supabase
    .from('productions')
    .select(`
      *,
      production_personas(
        persona:personas(*)
      ),
      persona_evolutions:production_persona_evolutions(*),
      production_assistants(
        assistant:assistants(*)
      ),
      production_relations(
        relation:relations(*)
      ),
      scenario:scenarios(*),
      world:worlds(*),
      turns(*)
    `)
    .eq('uuid', production_uuid)
    .single()

  if (productionError) {
    throw new Error(productionError.message)
  }

  if (!production) {
    throw new Error('Production not found')
  }

  // Convert turns from Supabase type to LMiX type
  const turns: Turn[] = production.turns.map((turn) => ({
    ...turn,
    message: turn.message as Message,
  }))

  // Create system message
  const systemMessage: CoreSystemMessage = {
    role: 'system',
    content: 'You are Jade, a beautiful and confident woman.',
  }

  // Create message history
  const messages: CoreMessage[] = [systemMessage]

  turns.forEach((turn) => {
    switch (turn.message.role) {
      case 'user':
        const userMessage: CoreUserMessage = {
          role: 'user',
          content: JSON.stringify(turn.message.content),
        }
        messages.push(userMessage)
        break
      case 'assistant':
        const assistantMessage: CoreAssistantMessage = {
          role: 'assistant',
          content: JSON.stringify(turn.message.content),
        }
        messages.push(assistantMessage)
        break
    }
  })

  // Create OpenAI instance with model's configuration
  const openai = createOpenAI({
    apiKey: assistant.model.api_key || '',
    baseURL: assistant.model.api_endpoint,
  })

  // Create the chat completion
  const result = streamText({
    model: openai(assistant.model.id),
    messages,
  })

  return result.toDataStreamResponse()
})
