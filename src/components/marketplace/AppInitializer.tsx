'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/store/marketplace'
import { isNative, registerPushNotifications, hideSplash } from '@/lib/native-bridge'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

export function AppInitializer() {
  const initialized = useRef(false)
  const { user } = useStore()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Hide splash screen on native
    hideSplash()

    // Register service worker for web
    if (!isNative && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Register push notifications on native
    if (isNative && user) {
      registerPushNotifications().then(deviceToken => {
        if (deviceToken) {
          saveDeviceToken(deviceToken)
        }
      })
    }
  }, [user])

  return null
}

async function saveDeviceToken(token: string) {
  try {
    const supabase = createSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    await fetch('/api/user/device-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ token, platform: 'android' }),
    })
  } catch (e) {
    console.error('[push] failed to save device token', e)
  }
}
