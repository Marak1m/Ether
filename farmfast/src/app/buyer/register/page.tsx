'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Mail, Lock, User, Phone, Building, MapPin, ArrowRight } from 'lucide-react'
import { signUp, createBuyerProfile } from '@/lib/auth'
import { getCoordinatesFromPincode } from '@/lib/geocoding'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    businessName: '',
    pincode: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear field-level error on change
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[e.target.name]; return next })
    }
  }

  // Auto-geocode pincode when it reaches 6 digits
  useEffect(() => {
    const pincode = formData.pincode.replace(/\s/g, '')
    if (!/^\d{6}$/.test(pincode)) return

    let cancelled = false
    setGeocoding(true)
    getCoordinatesFromPincode(pincode)
      .then(coords => {
        if (cancelled) return
        // Auto-fill address from geocoded display_name if address is still empty
        if (!formData.address && coords.display_name) {
          // Reformat: remove leading pincode if Nominatim puts it first, then append pincode at end
          const parts = coords.display_name.split(',').map((s: string) => s.trim())
          const withoutPincode = parts.filter((p: string) => p !== pincode)
          const formatted = `${withoutPincode.join(', ')} - ${pincode}`
          setFormData(prev => ({ ...prev, address: formatted }))
        }
      })
      .catch(() => { /* ignore geocoding errors silently */ })
      .finally(() => { if (!cancelled) setGeocoding(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.pincode])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Full name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    if (!formData.pincode.trim()) errors.pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(formData.pincode.replace(/\s/g, ''))) errors.pincode = 'Enter a valid 6-digit pincode'
    if (!formData.address.trim()) errors.address = 'Address is required'
    if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)
    try {
      // Sign up user
      const { user } = await signUp(formData.email, formData.password, formData.name)

      if (!user) {
        throw new Error('Failed to create user')
      }

      // Get coordinates from pincode
      let latitude = null
      let longitude = null
      const pincode = formData.pincode.replace(/\s/g, '')
      if (pincode) {
        try {
          const coords = await getCoordinatesFromPincode(pincode)
          latitude = coords.lat
          longitude = coords.lon
        } catch (err) {
          console.error('Failed to geocode pincode:', err)
        }
      }

      // Create buyer profile
      await createBuyerProfile({
        id: user.id,
        email: formData.email,
        name: formData.name,
        phone: formData.phone || null,
        business_name: formData.businessName || null,
        pincode: pincode || null,
        address: formData.address || null,
        latitude,
        longitude,
      })

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <Link href="/landing" className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            FarmFast
          </span>
        </Link>

        {/* Registration Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <h1 className="text-3xl font-bold mb-2 text-center text-black">Create Buyer Account</h1>
          <p className="text-gray-600 text-center mb-8">
            Join FarmFast to source quality produce directly from farmers
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={inputClass('name')}
                  />
                </div>
                {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="buyer@example.com"
                    className={inputClass('email')}
                  />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={inputClass('password')}
                  />
                </div>
                {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={inputClass('confirmPassword')}
                  />
                </div>
                {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className={inputClass('phone')}
                  />
                </div>
                {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Raj Traders"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="411001"
                    maxLength={6}
                    className={inputClass('pincode')}
                  />
                  {geocoding && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">
                      Locating…
                    </span>
                  )}
                </div>
                {fieldErrors.pincode && <p className="mt-1 text-xs text-red-600">{fieldErrors.pincode}</p>}
                {!fieldErrors.pincode && (
                  <p className="mt-1 text-xs text-gray-400">Enter your 6-digit pincode — address will auto-fill</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="Shop No. 5, Market Road, Pune"
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.address ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {fieldErrors.address && <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              {loading ? 'Creating Account...' : (
                <>
                  Create Account
                  <ArrowRight className="inline ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/buyer/login"
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/landing"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
