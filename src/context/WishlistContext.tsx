'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

interface WishlistContextType {
  ids: Set<string>;
  count: number;
  has: (productId: string) => boolean;
  /** Returns 'added' | 'removed', or 'login' when the visitor isn't signed in. */
  toggle: (productId: string) => Promise<'added' | 'removed' | 'login' | 'error'>;
}

const WishlistContext = createContext<WishlistContextType>({
  ids: new Set(),
  count: 0,
  has: () => false,
  toggle: async () => 'login',
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token || !user) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(d => {
        if (!cancelled) setIds(new Set((d.items || []).map((i: { product_id: string }) => i.product_id)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, user]);

  const toggle = useCallback(async (productId: string) => {
    if (!token) return 'login' as const;
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: productId }),
      });
      if (res.status === 401) return 'login' as const;
      if (!res.ok) return 'error' as const;
      const data = await res.json();
      setIds(prev => {
        const next = new Set(prev);
        if (data.action === 'added') next.add(productId); else next.delete(productId);
        return next;
      });
      return data.action === 'added' ? 'added' as const : 'removed' as const;
    } catch {
      return 'error' as const;
    }
  }, [token]);

  return (
    <WishlistContext.Provider value={{ ids, count: ids.size, has: id => ids.has(id), toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
