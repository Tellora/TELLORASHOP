import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { status } = await request.json();
    if (!['new', 'read', 'replied'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    getDb().prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    getDb().prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
