'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface CMSPage {
  title: string;
  content: string;
  is_published: number;
}

export default function StaticCMSPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pages/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.page && data.page.is_published === 1) {
          setPage(data.page);
        } else {
          setPage(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setPage(null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (!page) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state-icon" style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '2rem', color: '#ccc' }}>404</div>
          <h3>Page not found</h3>
          <p>The page you are looking for does not exist or has been unpublished.</p>
          <Link href="/" className="btn btn-primary mt-2">BACK TO HOME</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3.5rem 0 6rem', maxWidth: '850px' }}>
      <div className="brutal-badge-slanted brutal-badge-purple" style={{ marginBottom: '1.25rem', transform: 'rotate(-2deg)' }}>
        INFORMATION & POLICIES
      </div>
      <div className="card" style={{ background: '#FFF', border: '3.5px solid #000', boxShadow: '6px 6px 0px #000', borderRadius: '16px', padding: '2.5rem 3rem' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontStyle: 'italic', fontWeight: 900, marginBottom: '2rem', borderBottom: '3px solid #000', paddingBottom: '1rem', textTransform: 'uppercase' }}>
          {page.title}
        </h1>
        <div
          className="cms-content"
          style={{ lineHeight: 1.8, fontSize: '1.05rem', fontWeight: 500 }}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
        <div style={{ marginTop: '3rem', borderTop: '3px solid #000', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn btn-sm btn-dark" style={{ boxShadow: '2px 2px 0px #000' }}>← BACK TO HOME</Link>
          <Link href="/shop" className="btn btn-sm btn-primary" style={{ boxShadow: '2px 2px 0px #000' }}>EXPLORE SHOP →</Link>
        </div>
      </div>
    </div>
  );
}
