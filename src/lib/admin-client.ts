/** Download a CSV export from /api/admin/export (needs the admin token in an Authorization header, so a plain link won't work). */
export async function downloadExport(type: 'orders' | 'products' | 'customers' | 'subscribers', token: string | null): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/export?type=${type}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export function authHeaders(token: string | null, json = true): HeadersInit {
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` };
}
