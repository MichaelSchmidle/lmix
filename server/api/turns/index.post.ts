import OpenAI from 'openai'
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from 'zod'
import { LMiXError } from '~/types/errors'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

// Request body schema
const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'function', 'tool']),
    content: z.string(),
    name: z.string().optional(),
    function_call: z.unknown().optional(),
    tool_calls: z.unknown().optional(),
  }))
})

type RequestBody = z.infer<typeof requestSchema>

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
  const config = useRuntimeConfig()
  
  const openai = new OpenAI({
    apiKey: '',
    baseURL: 'http://localhost:1234/v1',
  })

  return defineEventHandler(async (event) => {
    try {
      // Validate request body
      const body = await readBody(event)
      const result = requestSchema.safeParse(body)
      
      if (!result.success) {
        throw new LMiXError(
          'Invalid request body',
          'VALIDATION_ERROR',
          result.error.errors
        )
      }

      // Set up proper streaming response headers
      setHeader(event, 'Content-Type', 'text/event-stream')
      setHeader(event, 'Cache-Control', 'no-cache')
      setHeader(event, 'Connection', 'keep-alive')

      try {
        const stream = await openai.chat.completions.create({
          messages: result.data.messages as ChatCompletionMessageParam[],
          model: 'llama-3.2-1b-instruct',
          response_format: zodResponseFormat(modelResponseSchema, 'response'),
          stream: true,
        })

        // Convert to ReadableStream
        return new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || ''
                if (content) {
                  if (import.meta.dev) {
                    console.debug('Stream chunk:', content)
                  }
                  controller.enqueue(new TextEncoder().encode(content))
                }
              }
              // Stream complete
              controller.close()
            }
            catch (error) {
              const streamError = new LMiXError(
                'Failed to process stream chunk',
                'STREAM_ERROR',
                error
              )
              if (import.meta.dev) {
                console.error('Streaming error:', streamError)
              }
              controller.error(streamError)
            }
          }
        })
      }
      catch (error) {
        throw new LMiXError(
          'Failed to create chat completion',
          'API_ERROR',
          error
        )
      }
    }
    catch (error) {
      if (import.meta.dev) {
        console.error('API error:', error)
      }

      if (error instanceof LMiXError) {
        throw createError({
          statusCode: error.code === 'VALIDATION_ERROR' ? 400 : 500,
          message: error.message,
          data: import.meta.dev ? error.details : undefined
        })
      }

      throw createError({
        statusCode: 500,
        message: 'Internal server error',
        data: import.meta.dev ? error : undefined
      })
    }
  })
})