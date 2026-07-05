import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { SplashScreen } from '@capacitor/splash-screen'

export const isNative = Capacitor.isNativePlatform()
export const isAndroid = Capacitor.getPlatform() === 'android'

export async function registerPushNotifications(): Promise<string | null> {
  if (!isNative) return null
  try {
    let permStatus = await PushNotifications.checkPermissions()
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
    }
    if (permStatus.receive !== 'granted') return null

    const token = await new Promise<string | null>(async resolve => {
      const cleanup = await PushNotifications.addListener('registration', (t: { value: string }) => {
        cleanup.remove()
        resolve(t.value)
      })
      await PushNotifications.register()
    })

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('[native] push received', notification)
    })
    PushNotifications.addListener('pushNotificationActionPerformed', action => {
      console.log('[native] push action', action)
    })

    return token
  } catch (e) {
    console.error('[native] push registration error', e)
    return null
  }
}

export async function nativeGoogleLogin() {
  if (!isNative) return null
  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
    const result = await GoogleAuth.signIn()
    return {
      id: result.id,
      email: result.email,
      name: result.name,
      photoUrl: result.imageUrl,
      idToken: result.authentication?.idToken || null,
    }
  } catch (e) {
    console.error('[native] google login error', e)
    return null
  }
}

export async function nativeGoogleLogout() {
  if (!isNative) return
  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
    await GoogleAuth.signOut()
  } catch (e) {
    console.error('[native] google logout error', e)
  }
}

export async function nativePayment(options: {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  orderId: string
  prefill: { email: string; contact: string }
}) {
  if (!isNative) return null
  try {
    const { Checkout } = await import('capacitor-razorpay')
    const result = await Checkout.open({
      key: options.key,
      amount: String(Math.round(options.amount * 100)),
    })
    return result
    } catch (e: unknown) { 
      if ((e as { code?: number })?.code === 2) {
        return { cancelled: true }
      }
      console.error('[native] payment error', e)
    return null
  }
}

export async function hideSplash() {
  if (!isNative) return
  try {
    await SplashScreen.hide()
  } catch (e) {
    console.error('[native] splash hide error', e)
  }
}
