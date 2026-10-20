'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Faq { id: string; question: string; answer: string }

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/faqs')
      .then(r => r.json())
      .then(d => { setFaqs(d.faqs || []); setOpen(d.faqs?.[0]?.id ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '850px' }}>
      <div className="brutal-badge-slanted brutal-badge-purple" style={{ marginBottom: '1rem' }}>HELP CENTER</div>
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontStyle: 'italic', fontWeight: 900, marginBottom: '2rem' }}>
        FREQUENTLY ASKED <span style={{ color: 'var(--accent-purple)' }}>QUESTIONS</span>
      </h1>
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : faqs.length === 0 ? (
        <p style={{ fontWeight: 700 }}>No questions yet. <Link href="/contact" style={{ textDecoration: 'underline' }}>Contact us</Link> and we will help.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {faqs.map(f => (
            <div key={f.id} style={{ border: '3px solid #000', borderRadius: '10px', background: '#FFF', boxShadow: '4px 4px 0px #000', overflow: 'hidden' }}>
              <button
                onClick={() => setOpen(open === f.id ? null : f.id)}
                aria-expanded={open === f.id}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: open === f.id ? 'var(--accent-yellow)' : '#FFF', border: 'none', fontWeight: 900, fontSize: '1rem', textAlign: 'left' }}
              >
                <span>{f.question}</span><span style={{ fontSize: '1.4rem' }}>{open === f.id ? '−' : '+'}</span>
              </button>
              {open === f.id && <div style={{ padding: '1rem 1.25rem', borderTop: '3px solid #000', lineHeight: 1.7, fontWeight: 600, whiteSpace: 'pre-line' }}>{f.answer}</div>}
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: '2rem', fontWeight: 700 }}>
        Still need help? <Link href="/contact" style={{ textDecoration: 'underline' }}>Contact us</Link> or <Link href="/track-order" style={{ textDecoration: 'underline' }}>track an order</Link>.
      </p>
    </div>
  );
}
