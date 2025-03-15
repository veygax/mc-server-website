import { NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const EXAROTON_API_KEY = process.env.EXAROTON_API_KEY
const EXAROTON_SERVER_ID = process.env.EXAROTON_SERVER_ID

export async function POST(request: Request) {
  try {
    const { action, password } = await request.json()

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'verify') {
      return NextResponse.json({ success: true })
    }

    if (!['start', 'stop'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const response = await fetch(
      `https://api.exaroton.com/v1/servers/${EXAROTON_SERVER_ID}/${action}/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${EXAROTON_API_KEY}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to ${action} server`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server control error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 