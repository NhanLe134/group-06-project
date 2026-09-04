export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  status: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const response = await fetch(`${API_BASE_URL}/menu`)
  if (!response.ok) {
    throw new Error(`Khong the tai menu (HTTP ${response.status})`)
  }
  return response.json() as Promise<MenuItem[]>
}
