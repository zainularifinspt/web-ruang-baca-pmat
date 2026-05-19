import { NextResponse } from 'next/server';
import { insertAttendanceRow, fetchAttendanceRows } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      visitor_name,
      nim_nip,
      visitor_status,
      study_program,
      purpose,
    } = body;

    if (!visitor_name || !purpose) {
      return NextResponse.json({ error: 'visitor_name and purpose are required' }, { status: 400 });
    }

    const payload = {
      visitor_name,
      nim_nip: nim_nip ?? '',
      visitor_status: visitor_status ?? 'Umum',
      study_program: study_program ?? '',
      purpose,
      attendance_status: 'Berhasil',
    };

    const result = await insertAttendanceRow(payload);
    if (result.error || !result.row) {
      return NextResponse.json({ error: result.error ?? 'Insert failed' }, { status: 500 });
    }

    return NextResponse.json({ row: result.row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? undefined;
    const visitorStatus = url.searchParams.get('visitorStatus') ?? undefined;
    const purpose = url.searchParams.get('purpose') ?? undefined;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : 50;

    const result = await fetchAttendanceRows(limit, { search: search ?? undefined, visitorStatus, purpose });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ rows: result.rows }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
