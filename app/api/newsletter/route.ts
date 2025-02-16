import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  try {
    const API_KEY = process.env.MAILCHIMP_API_KEY
    const API_SERVER = process.env.MAILCHIMP_API_SERVER
    const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID

    // Debug logging
    console.log('API Server:', API_SERVER)
    console.log('Audience ID:', AUDIENCE_ID)

    const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex')

    const data = {
      email_address: email,
      status: 'pending', // Changed to pending for double opt-in
    }

    // First check if member exists
    const checkResponse = await fetch(
      `https://${API_SERVER}/3.0/lists/${AUDIENCE_ID}/members/${emailHash}`,
      {
        headers: {
          Authorization: `apikey ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      }
    )

    if (checkResponse.status === 200) {
      const member = await checkResponse.json()
      if (member.status === 'subscribed') {
        return NextResponse.json(
          { error: 'Diese E-Mail-Adresse ist bereits angemeldet.' },
          { status: 400 }
        )
      }
    }

    // If member doesn't exist or isn't subscribed, try to add/update them
    const response = await fetch(
      `https://${API_SERVER}/3.0/lists/${AUDIENCE_ID}/members/${emailHash}`,
      {
        body: JSON.stringify(data),
        headers: {
          Authorization: `apikey ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'PUT', // Using PUT instead of POST for upsert
      }
    )

    const responseData = await response.json()

    if (response.status >= 400) {
      console.error('Mailchimp error:', responseData)
      return NextResponse.json(
        { error: responseData.detail || 'Ein Fehler ist aufgetreten.' },
        { status: response.status }
      )
    }

    return NextResponse.json(
      {
        message:
          'Bitte bestätigen Sie Ihre E-Mail-Adresse durch Klick auf den Link in der Bestätigungs-E-Mail.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Newsletter API error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist bei der Newsletter-Anmeldung aufgetreten.' },
      { status: 500 }
    )
  }
}
