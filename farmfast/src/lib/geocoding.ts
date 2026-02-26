// Geocoding service to convert pincode/address to coordinates

interface GeocodingResult {
  lat: number
  lon: number
  display_name: string
}

export async function getCoordinatesFromPincode(pincode: string): Promise<GeocodingResult> {
  try {
    // Use OpenStreetMap Nominatim API (free)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'FarmFast/1.0'
        }
      }
    )

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('Pincode not found')
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      display_name: data[0].display_name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    throw new Error('Failed to geocode pincode')
  }
}

export async function getCoordinatesFromAddress(address: string): Promise<GeocodingResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&country=India&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'FarmFast/1.0'
        }
      }
    )

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('Address not found')
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      display_name: data[0].display_name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    throw new Error('Failed to geocode address')
  }
}
