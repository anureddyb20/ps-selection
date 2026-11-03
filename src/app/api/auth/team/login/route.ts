import { NextRequest, NextResponse } from 'next/server';
import { lookupTeam, getTeamProfile } from '@/lib/db';
import { createTeamSessionToken, TEAM_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { team_id } = body;

    if (!team_id) {
      return NextResponse.json(
        { success: false, message: 'Invalid Team ID. Please enter a registered Team ID.' },
        { status: 400 }
      );
    }

    const lookupResult = await lookupTeam(team_id);
    if (!lookupResult.success || !lookupResult.team) {
      return NextResponse.json(
        { success: false, message: 'Invalid Team ID. Please enter a registered Team ID.' },
        { status: 404 }
      );
    }

    const token = createTeamSessionToken(lookupResult.team);
    const profile = await getTeamProfile(lookupResult.team.id);

    const response = NextResponse.json({
      success: true,
      message: 'Team identified successfully.',
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
    console.error('Team verification error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred during lookup.' },
      { status: 500 }
    );
  }
}
