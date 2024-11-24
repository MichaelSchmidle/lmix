import OpenAI from 'openai'
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from 'zod'

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
  const openai = new OpenAI({
    apiKey: '',
    baseURL: 'http://localhost:1234/v1',
  })

  return defineEventHandler(async (event: any) => {
    try {
      const { messages } = await readBody(event)

      // Set up proper streaming response headers
      setHeader(event, 'Content-Type', 'text/event-stream')
      setHeader(event, 'Cache-Control', 'no-cache')
      setHeader(event, 'Connection', 'keep-alive')

      const stream = await openai.chat.completions.create({
        messages,
        model: 'darkidol-llama-3.1-8b-instruct-1.2-uncensored',
        response_format: zodResponseFormat(modelResponseSchema, 'response'),
        stream: true,
      })

      // Convert to ReadableStream
      return new ReadableStream({
        async start(controller) {
          try {
            let accumulatedJson = ''

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || ''

              if (content) {
                accumulatedJson += content

                try {
                  // Try to parse accumulated JSON to see if it's complete
                  const parsedJson = JSON.parse(accumulatedJson)

                  // Validate against schema
                  const validated = modelResponseSchema.parse(parsedJson)

                  // Send the validated chunk
                  controller.enqueue(new TextEncoder().encode(JSON.stringify(validated) + '\n'))
                  accumulatedJson = '' // Reset for next potential JSON object
                }
                catch (e: any) {
                  console.log('API: Parse/validate error:', e.message)
                  // If parsing fails, continue accumulating
                  continue
                }
              }
            }

            controller.close()
          }
          catch (error) {
            console.error('API: Stream error:', error)
            controller.error(error)
          }
        }
      })
    }
    catch (error) {
      console.error('API Error:', error)
      throw createError({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  })
})