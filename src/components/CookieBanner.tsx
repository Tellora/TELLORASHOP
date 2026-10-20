'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const KEY = 'cookie_consent';

/**
 * Asks for consent before loading analytics. Without an analytics ID there is nothing optional to consent to,
 * so the banner stays hidden.
 */
export default function CookieBanner({ analyticsId }: { analyticsId: string }) {
  const [choice, setChoice] = useState<'accepted' | 'declined' | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice((localStorage.getItem(KEY) as 'accepted' | 'declined' | null) || null);
  }, []);

  const decide = (value: 'accepted' | 'declined') => {
    localStorage.setItem(KEY, value);
    setChoice(value);
  };

  if (!analyticsId || choice === undefined) return null;

  return (
    <>
      {choice === 'accepted' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(analyticsId)});`}
          </Script>
        </>
      )}
      {choice === null && (
        <div role="dialog" aria-label="Cookie consent" style={{ position: 'fixed', left: '1rem', right: '1rem', bottom: '1rem', zIndex: 600, maxWidth: '640px', margin: '0 auto', background: '#FFF', border: '3px solid #000', boxShadow: '5px 5px 0 #000', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <p style={{ flex: '1 1 260px', margin: 0, fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.5 }}>
            We use cookies to understand how the store is used and improve it. See our <Link href="/page/privacy-policy" style={{ textDecoration: 'underline' }}>privacy policy</Link>.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-sm" style={{ border: '2px solid #000' }} onClick={() => decide('declined')}>DECLINE</button>
            <button className="btn btn-sm btn-primary" onClick={() => decide('accepted')}>ACCEPT</button>
          </div>
        </div>
      )}
    </>
  );
}
