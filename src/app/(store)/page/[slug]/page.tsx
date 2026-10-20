import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CMSPage { title: string; content: string }

function loadPage(slug: string): CMSPage | undefined {
  return getDb().prepare('SELECT title, content FROM pages WHERE slug = ? AND is_published = 1').get(slug) as CMSPage | undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = loadPage(slug);
  if (!page) return { title: 'Page not found', robots: { index: false } };
  const text = page.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return { title: page.title, description: text.slice(0, 160) };
}

// Content is written by store admins in the CMS, so it is rendered as trusted HTML.
export default async function StaticCMSPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = loadPage(slug);
  if (!page) notFound();

  return (
    <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '6rem', maxWidth: '850px' }}>
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
        <div style={{ marginTop: '3rem', borderTop: '3px solid #000', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link href="/" className="btn btn-sm btn-dark" style={{ boxShadow: '2px 2px 0px #000' }}>← BACK TO HOME</Link>
          <Link href="/shop" className="btn btn-sm btn-primary" style={{ boxShadow: '2px 2px 0px #000' }}>EXPLORE SHOP →</Link>
        </div>
      </div>
    </div>
  );
}
