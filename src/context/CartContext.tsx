'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  compare_at_price?: number;
  quantity: number;
  image?: string;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const [hydrated, setHydrated] = useState(false);

  // Restore the saved cart once on the client (localStorage doesn't exist during SSR)
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { setItems(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setHydrated(true);
  }, []);

  // Only persist after restoring, otherwise the initial empty cart overwrites the saved one
  useEffect(() => {
    if (hydrated) localStorage.setItem('cart', JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === item.product_id);
      if (existing) {
        return prev.map(i => i.product_id === item.product_id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i);
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, subtotal, isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen(p => !p),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
