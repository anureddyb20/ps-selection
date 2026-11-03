import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminAccessCode,
  createSessionToken,
  isRequestAuthorizedAdmin,
  ADMIN_COOKIE_NAME,
} from '@/lib/auth';
import {
  getAdminDashboardData,
  adminCancelSelection,
  adminManualAssign,
  adminUpdatePSCode,
  adminUpdateSettings,
  adminResetAllData,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isRequestAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const data = await getAdminDashboardData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin data.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. LOGIN ACTION (No prior auth token required)
    if (action === 'login') {
      const code = body.accessCode || body.password || '';
      if (!code) {
        return NextResponse.json(
          { success: false, message: 'Organizer access code is required.' },
          { status: 400 }
        );
      }

      if (verifyAdminAccessCode(code)) {
        const token = createSessionToken();
        const response = NextResponse.json({
          success: true,
          message: 'Admin authorization granted.',
        });

        // Set secure HTTP-only cookie
        response.cookies.set(ADMIN_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      }

      // Security: Never reveal the expected code
      return NextResponse.json(
        { success: false, message: 'Invalid organizer access code. Access denied.' },
        { status: 401 }
      );
    }

    // 2. ALL REMAINING ACTIONS REQUIRE VALID AUTHENTICATION
    if (!isRequestAuthorizedAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    // LOGOUT ACTION
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
      response.cookies.delete(ADMIN_COOKIE_NAME);
      return response;
    }

    // CHECK AUTH STATUS
    if (action === 'check-auth') {
      return NextResponse.json({ success: true, authorized: true });
    }

    // UPDATE INDIVIDUAL PS CODE (PUBLISH / UNPUBLISH / ENABLE / DISABLE SELECTION)
    if (action === 'update-ps') {
      const { ps_code, is_published, is_selection_open } = body;
      if (!ps_code) {
        return NextResponse.json({ success: false, message: 'ps_code is required.' }, { status: 400 });
      }

      const res = await adminUpdatePSCode({ ps_code, is_published, is_selection_open });
      return NextResponse.json(res);
    }

    // CANCEL A TEAM'S SELECTION (REOPENS SLOT IMMEDIATELY)
    if (action === 'cancel-selection') {
      const { selection_id } = body;
      if (!selection_id) {
        return NextResponse.json({ success: false, message: 'selection_id is required.' }, { status: 400 });
      }

      const res = await adminCancelSelection(selection_id);
      return NextResponse.json(res);
    }

    // MANUAL ASSIGNMENT (Respects 2-team capacity limit & duplicate restrictions)
    if (action === 'manual-assign') {
      const { ps_code, team_name, registration_id, leader_name, leader_email } = body;
      if (!ps_code || !team_name || !registration_id || !leader_name || !leader_email) {
        return NextResponse.json(
          { success: false, message: 'All team details and PS code are required.' },
          { status: 400 }
        );
      }

      const res = await adminManualAssign({
        ps_code,
        team_name,
        registration_id,
        leader_name,
        leader_email,
      });

      if (!res.success) {
        return NextResponse.json(res, { status: 409 });
      }

      return NextResponse.json(res);
    }

    // UPDATE PORTAL SETTINGS (PORTAL PUBLISHED, SELECTION OPEN)
    if (action === 'update-settings') {
      const { portal_published, selection_open, max_teams_per_ps, one_ps_per_team } = body;
      const updated = await adminUpdateSettings({
        ...(portal_published !== undefined ? { portal_published: Boolean(portal_published) } : {}),
        ...(selection_open !== undefined ? { selection_open: Boolean(selection_open) } : {}),
        ...(max_teams_per_ps !== undefined ? { max_teams_per_ps: Number(max_teams_per_ps) } : {}),
        ...(one_ps_per_team !== undefined ? { one_ps_per_team: Boolean(one_ps_per_team) } : {}),
      });

      return NextResponse.json({ success: true, settings: updated });
    }

    // RESET ALL DATA TO PRISTINE STATE
    if (action === 'reset-all') {
      const res = await adminResetAllData();
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Unknown admin action.' }, { status: 400 });
  } catch (error) {
    console.error('Admin POST handler error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

