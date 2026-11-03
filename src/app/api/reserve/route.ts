import { NextRequest, NextResponse } from 'next/server';
import { reserveProblemStatementAtomic } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ps_code,
      team_name,
      registration_id,
      leader_name,
      leader_email,
      domain,
    } = body;

    // Validate presence
    if (!ps_code || !team_name || !registration_id || !leader_name || !leader_email) {
      return NextResponse.json(
        {
          success: false,
          message: 'All fields (Team Name, Team Registration ID, Leader Name, Leader Email, PS Code) are required.',
        },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leader_email.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a valid email address for the Team Leader.',
        },
        { status: 400 }
      );
    }

    const result = await reserveProblemStatementAtomic({
      ps_code,
      team_name,
      registration_id,
      leader_name,
      leader_email,
      domain,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
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

