'use client';
import Link from 'next/link';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--accent-yellow)', textAlign: 'center' }}>
      <div style={{ maxWidth: '520px', background: '#FFF', border: '4px solid #000', boxShadow: '8px 8px 0 #000', borderRadius: '16px', padding: '2.5rem' }}>
        <h1 style={{ fontStyle: 'italic', fontWeight: 900, marginBottom: '0.75rem' }}>SOMETHING WENT WRONG</h1>
        <p style={{ fontWeight: 700, marginBottom: '1.5rem' }}>An unexpected error occurred. Please try again, and if it keeps happening let us know.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => reset()}>TRY AGAIN</button>
          <Link href="/" className="btn">GO HOME</Link>
        </div>
      </div>
    </div>
  );
}
