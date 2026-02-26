import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export type ListingChangeCallback = (payload: any) => void

export class RealtimeService {
  private channel: RealtimeChannel | null = null

  /**
   * Subscribe to real-time listing changes
   */
  subscribeToListings(callback: ListingChangeCallback) {
    // Create a channel for listings table
    this.channel = supabase
      .channel('listings-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'listings'
        },
        (payload) => {
          console.log('Listing change detected:', payload)
          callback(payload)
        }
      )
      .subscribe()

    return this.channel
  }

  /**
   * Subscribe to real-time offer changes for a specific listing
   */
  subscribeToOffers(listingId: string, callback: ListingChangeCallback) {
    this.channel = supabase
      .channel(`offers-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `listing_id=eq.${listingId}`
        },
        (payload) => {
          console.log('Offer change detected:', payload)
          callback(payload)
        }
      )
      .subscribe()

    return this.channel
  }

  /**
   * Unsubscribe from all real-time updates
   */
  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = null
    }
  }
}

// Singleton instance
export const realtimeService = new RealtimeService()
