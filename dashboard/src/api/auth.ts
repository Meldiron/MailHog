import { API_BASE_URL } from './client'

export async function validateCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const encoded = btoa(`${email}:${password}`)

  try {
    const response = await fetch(`${API_BASE_URL}/api/v2/messages?start=0&limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${encoded}`,
      },
    })

    return response.ok
  } catch {
    throw new Error('Failed to connect to server')
  }
}
