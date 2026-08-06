'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Stats {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  totalCustomers: number;
  newCustomersToday: number;
  totalProducts: number;
  lowStockProducts: number;
}

interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

interface SalesDay {
  date: string;
  orders: number;
  revenue: number;
}

interface DashboardData {
  stats: Stats;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  lowStockItems: LowStockItem[];
  salesByDay: SalesDay[];
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) return <div className="card text-center p-3">Failed to load analytics data.</div>;

  const { stats, topProducts, recentOrders, lowStockItems, salesByDay } = data;

  // Find max sales revenue to scale the chart bars
  const maxRevenue = Math.max(...salesByDay.map(d => d.revenue), 100);

  return (
    <div>
      {/* Header & Quick Action Buttons */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <div className="brutal-badge-slanted brutal-badge-yellow" style={{ marginBottom: '0.5rem' }}>
            STORE ANALYTICS OVERVIEW
          </div>
          <h1 className="admin-page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, margin: 0 }}>
            ADMIN <span style={{ color: 'var(--accent-purple)' }}>DASHBOARD</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
            Real-time performance metrics, inventory alerts, and recent sales telemetry.
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link href="/admin/products" className="btn btn-primary btn-sm" style={{ boxShadow: '3px 3px 0px #000' }}>
            + ADD PRODUCT
          </Link>
          <Link href="/admin/coupons" className="btn btn-purple btn-sm" style={{ boxShadow: '3px 3px 0px #000' }}>
            + NEW COUPON
          </Link>
          <Link href="/admin/orders" className="btn btn-blue btn-sm" style={{ boxShadow: '3px 3px 0px #000' }}>
            PENDING ORDERS ({stats.pendingOrders})
          </Link>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: '#FFF', border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', padding: '1.5rem', borderLeft: '8px solid var(--accent-yellow)' }}>
          <div className="stat-card-label" style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>TOTAL REVENUE</div>
          <div className="stat-card-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 900, color: '#000', margin: '0.35rem 0' }}>${stats.totalRevenue.toFixed(2)}</div>
          <div className="stat-card-change positive" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'green' }}>This Month: ${stats.monthRevenue.toFixed(2)}</div>
        </div>

        <div className="stat-card" style={{ background: '#FFF', border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', padding: '1.5rem', borderLeft: '8px solid var(--accent-pink)' }}>
          <div className="stat-card-label" style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>TOTAL ORDERS</div>
          <div className="stat-card-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 900, color: '#000', margin: '0.35rem 0' }}>{stats.totalOrders}</div>
          <div className="stat-card-change info" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{stats.pendingOrders} pending fulfillment</div>
        </div>

        <div className="stat-card" style={{ background: '#FFF', border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', padding: '1.5rem', borderLeft: '8px solid var(--accent-blue)' }}>
          <div className="stat-card-label" style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ACTIVE CUSTOMERS</div>
          <div className="stat-card-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 900, color: '#000', margin: '0.35rem 0' }}>{stats.totalCustomers}</div>
          <div className="stat-card-change positive" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'green' }}>+{stats.newCustomersToday} new today</div>
        </div>

        <div className="stat-card" style={{ background: '#FFF', border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', padding: '1.5rem', borderLeft: '8px solid var(--accent-red)' }}>
          <div className="stat-card-label" style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>LOW STOCK ALERTS</div>
          <div className="stat-card-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-red)' }}>{stats.lowStockProducts}</div>
          <div className="stat-card-change negative" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-red)' }}>Items with &lt;= 5 units remaining</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-container" style={{ background: '#FFF', border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', padding: '1.75rem', marginBottom: '2rem' }}>
        <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2.5px solid #000', paddingBottom: '0.75rem' }}>
          <div className="chart-title" style={{ fontStyle: 'italic', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>7-DAY REVENUE & SALES TRENDS</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, background: 'var(--accent-yellow)', border: '2px solid #000', padding: '0.25rem 0.65rem', borderRadius: '4px' }}>
            Today: ${stats.todayRevenue.toFixed(2)}
          </div>
        </div>
        <div className="chart-bars">
          {salesByDay.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No sales recorded in the last 7 days.</div>
          ) : (
            salesByDay.map(day => {
              const heightPercent = (day.revenue / maxRevenue) * 100;
              return (
                <div key={day.date} className="chart-bar-wrapper">
                  <div style={{ fontSize: '0.75rem', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                    ${day.revenue.toFixed(0)}
                  </div>
                  <div
                    className="chart-bar"
                    style={{ height: `${Math.max(heightPercent, 5)}%`, background: 'var(--accent-purple)', border: '2px solid #000' }}
                    title={`Date: ${day.date}, Revenue: $${day.revenue.toFixed(2)}, Orders: ${day.orders}`}
                  />
                  <div className="chart-bar-label" style={{ fontWeight: 800, fontSize: '0.75rem', marginTop: '0.5rem' }}>{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-2" style={{ marginTop: '2rem' }}>
        {/* Recent Orders */}
        <div className="card">
          <div className="flex-between mb-2">
            <h3 style={{ fontFamily: 'var(--font-mono)' }}>RECENT ORDERS</h3>
            <Link href="/admin/orders" className="btn btn-sm btn-ghost" style={{ border: '2px solid var(--border-color)' }}>
              All Orders →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        <Link href={`/admin/orders/${order.id}`} style={{ color: 'var(--accent-purple)' }}>
                          {order.order_number}
                        </Link>
                      </td>
                      <td>{order.customer_name || 'Guest'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>${order.total.toFixed(2)}</td>
                      <td>
                        <span className={`badge status-${order.status}`}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Performing & Low Stock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Selling Products */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>TOP SELLING PRODUCTS</h3>
            {topProducts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No products sold yet.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{p.sold}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-pink)' }}>
                          ${p.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Low Stock Items */}
          <div className="card" style={{ borderLeft: '6px solid var(--accent-red)' }}>
            <div className="flex-between mb-2">
              <h3 style={{ fontFamily: 'var(--font-mono)' }}>LOW STOCK ALERTS</h3>
              <Link href="/admin/products" className="btn btn-sm btn-ghost" style={{ border: '2px solid var(--border-color)' }}>
                Stock Manager
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <p style={{ color: 'var(--text-green)', fontWeight: 600 }}>All products fully stocked!</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th>Stock Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{p.sku || 'N/A'}</td>
                        <td>{p.name}</td>
                        <td>
                          <span className="badge badge-red" style={{ fontFamily: 'var(--font-mono)' }}>{p.quantity} units</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
