import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, system } = await req.json()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
        max_tokens: 1000,
      }),
    })

    const data = await response.json()
    console.log('OpenAI raw response:', JSON.stringify(data))

    if (!response.ok) {
      const apiError = data?.error?.message ?? `OpenAI error ${response.status}`
      return NextResponse.json({ error: apiError }, { status: response.status })
    }

    const content = data.choices[0].message.content
    return NextResponse.json({ content })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
