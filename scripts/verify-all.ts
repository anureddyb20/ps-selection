/**
 * IDEATHON VVCE: COMPREHENSIVE AUTOMATED VERIFICATION SCRIPT
 * Tests Team ID Entry, PS Selection, 2-Team Capacity Limit, Concurrency, and Admin Operations
 */

import {
  getPublicProblemStatements,
  reserveProblemStatementAtomic,
  getAdminDashboardData,
  adminCancelSelection,
  adminUpdatePSCode,
  adminUpdateSettings,
  adminResetAllData,
  adminCreateTeam,
  lookupTeam,
  getTeamProfile,
} from '../src/lib/db';
import {
  verifyAdminAccessCode,
  verifySessionToken,
  createSessionToken,
  createTeamSessionToken,
  verifyTeamSessionToken,
} from '../src/lib/auth';

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`\x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passed++;
  } else {
    console.error(`\x1b[31m✘ FAIL\x1b[0m: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('IDEATHON VVCE: TEAM ID LOOKUP & SELECTION VERIFICATION');
  console.log('======================================================\n');

  // Backup existing data so tests don't overwrite user selections
  const dbPath = path.join(process.cwd(), 'data', 'database.json');
  let backupContent: string | null = null;
  if (fs.existsSync(dbPath)) {
    backupContent = fs.readFileSync(dbPath, 'utf-8');
  }

  try {
    // Reset to clean pristine state for test run
    await adminResetAllData();

  // Test 0: Verify NO pre-seeded team accounts exist
  const initialAdmin = await getAdminDashboardData();
  assert(
    initialAdmin.teams.length === 0,
    'Requirement 0: Database starts with zero pre-seeded dummy team accounts'
  );

  // Test 1: Exactly 30 PS codes are initialized
  const initialData = await getPublicProblemStatements();
  assert(
    initialData.problem_statements.length === 30,
    'Requirement 1: Exactly 30 PS codes are initialized',
    `Found ${initialData.problem_statements.length}`
  );

  // Test 2: All codes match PDF specifications exactly
  const expectedCodes = [
    'CS-01', 'CS-02', 'CS-03', 'CS-04', 'CS-05', 'CS-06', 'CS-07', 'CS-08', 'CS-09', 'CS-10', 'CS-11', 'CS-12', 'CS-13', 'CS-14', 'CS-15',
    'EC-01', 'EC-02', 'EC-03', 'EC-04', 'EC-05', 'EC-06', 'EC-07', 'EC-08', 'EC-09', 'EC-10',
    'ME-01', 'ME-02', 'ME-03',
    'CE-01', 'CE-02',
  ];
  const actualCodes = initialData.problem_statements.map((p) => p.ps_code);
  const allMatch = expectedCodes.every((code) => actualCodes.includes(code)) && actualCodes.length === 30;
  assert(allMatch, 'Requirement 2: All 30 codes match PDF specifications exactly');

  // Test 3: Domain distribution
  const cseCodes = initialData.problem_statements.filter((p) => p.domain === 'CSE_AIML');
  const eceCodes = initialData.problem_statements.filter((p) => p.domain === 'ECE');
  const mechCodes = initialData.problem_statements.filter((p) => p.sub_domain === 'MECHANICAL');
  const civilCodes = initialData.problem_statements.filter((p) => p.sub_domain === 'CIVIL');

  assert(cseCodes.length === 15, 'Requirement 3: CSE / AIML contains exactly 15 codes (CS-01 to CS-15)');
  assert(eceCodes.length === 10, 'Requirement 4: Electronics & Communication contains exactly 10 codes (EC-01 to EC-10)');
  assert(mechCodes.length === 3, 'Requirement 5: Mechanical contains exactly 3 codes (ME-01 to ME-03)');
  assert(civilCodes.length === 2, 'Requirement 6: Civil contains exactly 2 codes (CE-01 to CE-02)');

  // Test 7: Teams see ONLY PS codes, not confidential case study content
  const sampleItem = initialData.problem_statements[0] as any;
  const isSanitized =
    sampleItem.title === undefined &&
    sampleItem.description === undefined &&
    sampleItem.organization === undefined &&
    sampleItem.sih_number === undefined;
  assert(isSanitized, 'Requirement 7: Participating teams see ONLY PS codes (titles/descriptions strictly hidden)');

  // Test 8: Dynamic Team ID Entry (No pre-existing accounts required)
  const team101Lookup = await lookupTeam('101');
  assert(
    team101Lookup.success && team101Lookup.team?.team_id === '101' && team101Lookup.team?.team_name === '101',
    'Requirement 8: Entering any Team ID (e.g. 101) succeeds dynamically and registers on the fly'
  );

  const emptyLookup = await lookupTeam('   ');
  assert(
    !emptyLookup.success && emptyLookup.message === 'Please enter your Team ID.',
    'Requirement 8b: Empty Team ID prompt requires valid input'
  );

  // Test 9: Team Session cryptographic token
  const teamToken = createTeamSessionToken(team101Lookup.team!);
  const decodedSession = verifyTeamSessionToken(teamToken);
  assert(decodedSession?.team_id === '101', 'Requirement 9: Team session token signs and verifies correctly');

  // Test 10 & 11: Slot 1/2 and Slot 2/2 allocation
  const res1 = await reserveProblemStatementAtomic({
    team_id: team101Lookup.team!.id,
    ps_code: 'CS-01',
  });
  assert(res1.success && res1.occupied_count === 1, 'Requirement 10: Team 101 occupies slot 1/2 on CS-01');

  const team102Lookup = await lookupTeam('102');
  const res2 = await reserveProblemStatementAtomic({
    team_id: team102Lookup.team!.id,
    ps_code: 'CS-01',
  });
  assert(res2.success && res2.occupied_count === 2 && res2.status === 'FULL', 'Requirement 11: Team 102 occupies slot 2/2 on CS-01 (marked FULL)');

  // Test 12: Third team CANNOT select that code (Strict 2-team limit)
  const team103Lookup = await lookupTeam('103');
  const res3 = await reserveProblemStatementAtomic({
    team_id: team103Lookup.team!.id,
    ps_code: 'CS-01',
  });
  assert(!res3.success && res3.message.includes('filled'), 'Requirement 12: Third team rejected when PS has reached 2/2 capacity');

  // Test 13: One PS per team (Team 101 cannot select another PS)
  const resDuplicate = await reserveProblemStatementAtomic({
    team_id: team101Lookup.team!.id,
    ps_code: 'CS-02',
  });
  assert(!resDuplicate.success && resDuplicate.message.includes('already reserved'), 'Requirement 13: Team cannot select multiple PS codes (Strict 1-PS per team enforced)');

  // Test 14: Race Condition / Concurrency test
  console.log('Testing concurrency on EC-01 with simultaneous requests...');
  const conc1 = (await lookupTeam('CONC-1')).team!;
  const conc2 = (await lookupTeam('CONC-2')).team!;
  const conc3 = (await lookupTeam('CONC-3')).team!;
  const conc4 = (await lookupTeam('CONC-4')).team!;

  const concurrentAttempts = await Promise.all([
    reserveProblemStatementAtomic({ team_id: conc1.id, ps_code: 'EC-01' }),
    reserveProblemStatementAtomic({ team_id: conc2.id, ps_code: 'EC-01' }),
    reserveProblemStatementAtomic({ team_id: conc3.id, ps_code: 'EC-01' }),
    reserveProblemStatementAtomic({ team_id: conc4.id, ps_code: 'EC-01' }),
  ]);

  const successfulConcurrent = concurrentAttempts.filter((r) => r.success);
  assert(
    successfulConcurrent.length === 2,
    'Requirement 14: Simultaneous selection requests strictly capped at exactly 2 slots (Race-condition safe)',
    `Successful: ${successfulConcurrent.length}`
  );

  // Test 15: Admin Dashboard can view all selections and team IDs
  const adminData = await getAdminDashboardData();
  const sel101 = adminData.selections.find((s) => s.team_code === '101' && s.ps_code === 'CS-01');
  const sel102 = adminData.selections.find((s) => s.team_code === '102' && s.ps_code === 'CS-01');
  assert(
    Boolean(sel101 && sel102 && adminData.selections.length === 4),
    'Requirement 15: Team ID (101, 102) and confirmed PS codes (CS-01) are strictly visible in Admin Portal'
  );

  // Test 16: Admin cancel selection & slot reopens
  const targetSel = adminData.selections.find((s) => s.ps_code === 'CS-01');
  const cancelRes = await adminCancelSelection(targetSel!.id);
  assert(cancelRes.success, 'Requirement 16: Admin can cancel selections');

  const afterCancelData = await getPublicProblemStatements();
  const cs01AfterCancel = afterCancelData.problem_statements.find((p) => p.ps_code === 'CS-01');
  assert(
    cs01AfterCancel?.occupied_count === 1 && cs01AfterCancel?.status === 'ONE SLOT LEFT' && cs01AfterCancel.is_available,
    'Requirement 17: Cancelled slot becomes available again immediately (1/2, ONE SLOT LEFT)'
  );

  // Test 18: Admin authentication with access code: 123654
  assert(
    verifyAdminAccessCode('123654') && !verifyAdminAccessCode('invalid_code'),
    'Requirement 18: Admin authentication with access code 123654 works strictly on server'
  );

  // Reset data to pristine state
  await adminResetAllData();
  const cleanData = await getPublicProblemStatements();
  assert(
    cleanData.problem_statements.length === 30 &&
      cleanData.problem_statements.every((p) => p.occupied_count === 0 && p.status === 'AVAILABLE'),
    'Reset check: Portal restored to pristine initial state (all 30 codes at 0/2)'
  );
  } finally {
    // Restore original database state if it had active selections
    if (backupContent) {
      fs.writeFileSync(dbPath, backupContent, 'utf-8');
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
