import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering - this route uses headers via getServerSession
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    // Check environment variable (without exposing the actual key)
    const debugInfo = {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT_SET',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    // If API key exists, try a minimal OpenAI call
    if (apiKey) {
      try {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey })

        // Simple models list call to verify API key works
        const models = await client.models.list()

        return NextResponse.json({
          ...debugInfo,
          openaiConnectionTest: 'SUCCESS',
          modelsAvailable: models.data.length,
        })
      } catch (openaiError) {
        const errorMessage = openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error'
        return NextResponse.json({
          ...debugInfo,
          openaiConnectionTest: 'FAILED',
          openaiError: errorMessage,
        })
      }
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: errorMessage,
    }, { status: 500 })
  }
}
