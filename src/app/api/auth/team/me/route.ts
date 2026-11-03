import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedTeamFromRequest } from '@/lib/auth';
import { getTeamProfile } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getAuthenticatedTeamFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false, team: null }, { status: 401 });
  }

  const profile = await getTeamProfile(session.id);
  if (!profile) {
    return NextResponse.json({ authenticated: false, team: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    team: profile,
  });
}

