'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface Review {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  title: string;
  comment: string;
  is_approved: number;
  created_at: string;
}

export default function AdminReviewsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReviews = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/reviews?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      showToast('Error loading reviews', 'error');
    }
    setLoading(false);
  }, [token, statusFilter, showToast]);

  useEffect(() => {
    if (token) fetchReviews();
  }, [token, fetchReviews]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_approved: true })
      });
      if (res.ok) {
        showToast('Review approved');
        fetchReviews();
      }
    } catch {
      showToast('Failed to approve review', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Review deleted');
        fetchReviews();
      }
    } catch {
      showToast('Failed to delete review', 'error');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => i < rating ? '★' : '☆').join('');
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="brutal-badge-slanted brutal-badge-yellow" style={{ marginBottom: '0.5rem' }}>
            FEEDBACK MODERATION
          </div>
          <h1 className="admin-page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, margin: 0 }}>
            CUSTOMER <span style={{ color: 'var(--accent-purple)' }}>REVIEWS</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
            Approve, reject, or moderate user reviews before public storefront display.
          </p>
        </div>
      </div>

      <div className="shop-toolbar mb-2" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '8px', boxShadow: '3px 3px 0px #000', padding: '0.85rem 1.25rem', marginBottom: '1.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="input"
          style={{ maxWidth: '220px', boxShadow: 'none', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">ALL REVIEWS</option>
          <option value="pending">PENDING APPROVAL</option>
          <option value="approved">APPROVED ONLY</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : reviews.length === 0 ? (
        <div className="card text-center p-3" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '12px' }}>No submitted product reviews found.</div>
      ) : (
        <div className="admin-table-wrapper" style={{ border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', background: '#FFF', overflow: 'hidden' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>PRODUCT</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>AUTHOR</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>RATING</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>REVIEW COMMENT</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>DATE</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>STATUS</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} style={{ borderBottom: '2px solid #EEE' }}>
                  <td style={{ padding: '1rem', fontWeight: 800, fontSize: '0.9rem' }}>{r.product_name}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{r.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{r.user_email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-yellow" style={{ transform: 'none', fontFamily: 'var(--font-mono)', fontWeight: 900 }}>
                      {renderStars(r.rating)} {r.rating}/5
                    </span>
                  </td>
                  <td style={{ padding: '1rem', maxWidth: '350px' }}>
                    {r.title && <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>{r.title}</div>}
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>{r.comment}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${r.is_approved === 1 ? 'badge-green' : 'badge-orange'}`} style={{ transform: 'none' }}>
                      {r.is_approved === 1 ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div className="admin-table-actions" style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                      {r.is_approved === 0 && (
                        <button onClick={() => handleApprove(r.id)} className="btn btn-sm btn-success" style={{ padding: '0.35rem 0.65rem' }}>
                          APPROVE
                        </button>
                      )}
                      <button onClick={() => handleDelete(r.id)} className="btn btn-sm btn-danger" style={{ padding: '0.35rem 0.65rem' }}>
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

