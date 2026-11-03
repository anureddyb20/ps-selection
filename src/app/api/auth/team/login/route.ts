import { NextRequest, NextResponse } from 'next/server';
import { authenticateTeam, getTeamProfile } from '@/lib/db';
import { createTeamSessionToken, TEAM_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { team_id, password } = body;

    if (!team_id || !password) {
      return NextResponse.json(
        { success: false, message: 'Team ID and Password are required.' },
        { status: 400 }
      );
    }

    const authResult = await authenticateTeam(team_id, password);
    if (!authResult.success || !authResult.team) {
      return NextResponse.json(
        { success: false, message: authResult.message || 'Invalid Team ID or Password.' },
        { status: 401 }
      );
    }

    const token = createTeamSessionToken(authResult.team);
    const profile = await getTeamProfile(authResult.team.id);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      team: profile,
    });

    response.cookies.set(TEAM_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Team login error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred during sign in.' },
      { status: 500 }
    );
  }
}
