import { NextRequest, NextResponse } from 'next/server';
import { reserveProblemStatementAtomic, getTeamProfile } from '@/lib/db';
import { getAuthenticatedTeamFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Team Session
    const session = getAuthenticatedTeamFromRequest(req);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required. Please sign in to select a problem statement.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { ps_code } = body;

    if (!ps_code) {
      return NextResponse.json(
        {
          success: false,
          message: 'Problem Statement code is required.',
        },
        { status: 400 }
      );
    }

    // 2. Perform Atomic Reservation
    const result = await reserveProblemStatementAtomic({
      team_id: session.id,
      ps_code,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    const updatedProfile = await getTeamProfile(session.id);

    return NextResponse.json(
      {
        ...result,
        team: updatedProfile,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Reservation API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected server error occurred during reservation. Please try again.',
      },
      { status: 500 }
    );
  }
}
