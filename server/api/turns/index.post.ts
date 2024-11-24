import { serverSupabaseClient } from '#supabase/server'
import { CoreSystemMessage, streamObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Database } from '~/types/api'
import { z } from 'zod'

const systemOpenPrompt = readFileSync(resolve('./prompts/systemOpen.md'), 'utf-8')
const systemClosePrompt = readFileSync(resolve('./prompts/systemClose.md'), 'utf-8')

// Schema for what the model generates (subset of Content type)
const modelResponseSchema = z.object({
  performance: z.string(),
  vectors: z.object({
    location: z.string().optional(),
    posture: z.string().optional(),
    direction: z.string().optional(),
    momentum: z.string().optional(),
  }).optional(),
  evolution: z.object({
    self_perception: z.string().optional(),
    private_knowledge: z.string().optional(),
    note_to_future_self: z.string().optional(),
  }).optional(),
  meta: z.string().optional(),
})

export default defineLazyEventHandler(async () => {
  return defineEventHandler(async (event: any) => {
    try {
      const { messages, production_uuid, assistant_uuid } = await readBody(event)
      const supabase = await serverSupabaseClient<Database>(event)

      // Get the production data
      const { data: production, error: productionError } = await supabase
        .from('productions')
        .select(`
          *,
          world:worlds (*),
          scenario:scenarios (*),
          production_assistants (*,
            assistant:assistants (*,
              persona:personas (*)
            )
          )
        `)
        .eq('uuid', production_uuid)
        .single()

      if (productionError) {
        throw new Error(productionError.message)
      }

      if (!production) {
        throw new Error('Production not found')
      }

      // Find the assistant in the production's assistants
      const assistant = production.production_assistants
        .find(pa => pa.assistant?.uuid === assistant_uuid)?.assistant

      if (!assistant?.persona) {
        throw new Error('Assistant or persona not found')
      }

      const systemMessages: CoreSystemMessage[] = []

      const systemOpenMessage: CoreSystemMessage = {
        role: 'system',
        content: systemOpenPrompt,
      }

      systemMessages.push(systemOpenMessage)

      // Create a system message with the assistant's persona
      const assistantPersonaSystemMessage: CoreSystemMessage = {
        role: 'system',
        content: [
          '# YOUR PERSONA: ' + assistant.persona.name,
          assistant.persona.self_perception,
          assistant.persona.public_perception,
          assistant.persona.private_knowledge,
          assistant.persona.public_knowledge,
        ].join('\n\n'),
      }

      systemMessages.push(assistantPersonaSystemMessage)

      const systemCloseMessage: CoreSystemMessage = {
        role: 'system',
        content: systemClosePrompt,
      }

      const openai = createOpenAI({
        apiKey: '',
        baseURL: 'http://localhost:1234/v1',
      })

      // Ensure we have messages
      if (!messages || !messages.length) {
        throw new Error('No messages provided')
      }

      const result = streamObject({
        model: openai('llama-3.2-1b-instruct-uncensored'),
        schema: modelResponseSchema,
        messages: [
          ...systemMessages,
          // Include all messages from history
          ...messages.map((msg: { role: string; content: string }) => ({
            role: msg.role,
            content: JSON.stringify({
              performance: msg.content
            })
          })),
          systemCloseMessage
        ],
      })

      // Set up proper streaming response
      setHeader(event, 'Content-Type', 'application/json')
      setHeader(event, 'Transfer-Encoding', 'chunked')
      setHeader(event, 'Cache-Control', 'no-cache')
      
      // Convert to ReadableStream
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.partialObjectStream) {
              controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'))
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })
    } catch (error) {
      console.error('API Error:', error)
      throw createError({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  })
})