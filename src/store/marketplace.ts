import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PromptItem {
  id: string
  title: string
  price: number
  sampleImages: string
  seller: {
    name: string | null
    avatar: string | null
  }
}

interface MarketplaceState {
  cart: PromptItem[]
  wishlist: PromptItem[]
  addToCart: (item: PromptItem) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  addToWishlist: (item: PromptItem) => void
  removeFromWishlist: (id: string) => void
  isInCart: (id: string) => boolean
  isInWishlist: (id: string) => boolean
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      
      addToCart: (item) => {
        const { cart } = get()
        if (!cart.some((i) => i.id === item.id)) {
          set({ cart: [...cart, item] })
        }
      },
      
      removeFromCart: (id) => {
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== id)
        }))
      },
      
      clearCart: () => set({ cart: [] }),
      
      addToWishlist: (item) => {
        const { wishlist } = get()
        if (!wishlist.some((i) => i.id === item.id)) {
          set({ wishlist: [...wishlist, item] })
        }
      },
      
      removeFromWishlist: (id) => {
        set((state) => ({
          wishlist: state.wishlist.filter((i) => i.id !== id)
        }))
      },
      
      isInCart: (id) => get().cart.some((i) => i.id === id),
      isInWishlist: (id) => get().wishlist.some((i) => i.id === id),
    }),
    {
      name: 'maghgo-marketplace-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
)
