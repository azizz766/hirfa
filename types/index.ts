export type User = {
  id: string
  phone: string
  name: string
  role: 'artist' | 'client' | 'admin'
  language: string
  theme: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ArtistProfile = {
  id: string
  user_id: string
  city: string | null
  country: string | null
  bio: string | null
  categories: string[]
  years_experience: number
  status: 'pending' | 'approved' | 'rejected'
  rating_avg: number
  orders_count: number
  response_time: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  // joined from public.users
  users?: Pick<User, 'name' | 'avatar_url'>
}

export type OpenBrief = {
  id: string
  client_id: string
  title: string
  description: string
  category: string
  budget_min: number | null
  budget_max: number | null
  currency: string
  deadline: string | null
  status: 'open' | 'closed' | 'awarded'
  offers_count: number
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  client_id: string
  artist_id: string
  service_id: string | null
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'delivered' | 'disputed'
  description: string
  artist_price: number | null
  client_price: number | null
  currency: string
  desired_delivery: string | null
  created_at: string
  updated_at: string
}
