import { supabase } from './supabase'

export interface BuyerProfile {
  id: string
  email: string
  name: string
  phone: string | null
  business_name: string | null
  pincode: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getBuyerProfile(userId: string): Promise<BuyerProfile | null> {
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching buyer profile:', error)
    return null
  }

  return data
}

export async function createBuyerProfile(profile: Partial<BuyerProfile>) {
  const { data, error } = await supabase
    .from('buyers')
    .insert([profile])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBuyerProfile(userId: string, updates: Partial<BuyerProfile>) {
  const { data, error } = await supabase
    .from('buyers')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
