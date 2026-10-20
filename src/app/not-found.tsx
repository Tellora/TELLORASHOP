import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--accent-yellow)', textAlign: 'center' }}>
      <div style={{ maxWidth: '520px', background: '#FFF', border: '4px solid #000', boxShadow: '8px 8px 0 #000', borderRadius: '16px', padding: '2.5rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '4rem', lineHeight: 1 }}>404</div>
        <h1 style={{ fontStyle: 'italic', fontWeight: 900, margin: '0.75rem 0' }}>PAGE NOT FOUND</h1>
        <p style={{ fontWeight: 700, marginBottom: '1.5rem' }}>The page you are looking for does not exist or has moved.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary">GO HOME</Link>
          <Link href="/shop" className="btn">BROWSE SHOP</Link>
        </div>
      </div>
    </div>
  );
}
