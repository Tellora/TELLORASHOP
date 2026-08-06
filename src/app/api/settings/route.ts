import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');

    let settings;
    if (group) {
      settings = db.prepare('SELECT * FROM settings WHERE group_name = ?').all(group);
    } else {
      settings = db.prepare('SELECT * FROM settings').all();
    }

    // Convert to key-value map
    const settingsMap: Record<string, string> = {};
    for (const s of settings as Array<{ key: string; value: string }>) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const db = getDb();
    const { v4: uuid } = require('uuid');

    for (const [key, value] of Object.entries(body)) {
      const existing = db.prepare('SELECT id FROM settings WHERE key = ?').get(key);
      if (existing) {
        db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(value), key);
      } else {
        db.prepare('INSERT INTO settings (id, key, value, group_name) VALUES (?, ?, ?, ?)').run(uuid(), key, String(value), 'general');
      }
    }

    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsMap: Record<string, string> = {};
    for (const s of settings as Array<{ key: string; value: string }>) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
