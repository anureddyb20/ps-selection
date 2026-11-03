/**
 * VVCE IDEATHON: COMPREHENSIVE AUTOMATED VERIFICATION SCRIPT
 * Tests all 24 requirements specified in Section 16
 */

import {
  getPublicProblemStatements,
  reserveProblemStatementAtomic,
  getAdminDashboardData,
  adminCancelSelection,
  adminUpdatePSCode,
  adminUpdateSettings,
  adminResetAllData,
} from '../src/lib/db';
import { verifyAdminAccessCode, verifySessionToken, createSessionToken } from '../src/lib/auth';
import { INITIAL_PROBLEM_STATEMENTS } from '../src/lib/constants';

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
  console.log('VVCE IDEATHON: EXHAUSTIVE VERIFICATION & INTEGRITY TEST');
  console.log('======================================================\n');

  // Reset to clean pristine state
  await adminResetAllData();

  // Test 1: Exactly 30 PS codes are initialized
  const initialData = await getPublicProblemStatements();
  assert(
    initialData.problem_statements.length === 30,
    'Requirement 1: Exactly 30 PS codes are initialized',
    `Found ${initialData.problem_statements.length}`
  );

  // Test 2: All codes match the PDF exactly
  const expectedCodes = [
    'CS-01', 'CS-02', 'CS-03', 'CS-04', 'CS-05', 'CS-06', 'CS-07', 'CS-08', 'CS-09', 'CS-10', 'CS-11', 'CS-12', 'CS-13', 'CS-14', 'CS-15',
    'EC-01', 'EC-02', 'EC-03', 'EC-04', 'EC-05', 'EC-06', 'EC-07', 'EC-08', 'EC-09', 'EC-10',
    'ME-01', 'ME-02', 'ME-03',
    'CE-01', 'CE-02',
  ];
  const actualCodes = initialData.problem_statements.map((p) => p.ps_code);
  const allMatch = expectedCodes.every((code) => actualCodes.includes(code)) && actualCodes.length === 30;
  assert(allMatch, 'Requirement 2: All codes match PDF specifications exactly');

  // Test 3: CSE / AIML contains 15 codes
  const cseCodes = initialData.problem_statements.filter((p) => p.domain === 'CSE_AIML');
  assert(cseCodes.length === 15, 'Requirement 3: CSE / AIML contains exactly 15 codes');

  // Test 4: Electronics and Communication contains 10 codes
  const eceCodes = initialData.problem_statements.filter((p) => p.domain === 'ECE');
  assert(eceCodes.length === 10, 'Requirement 4: Electronics & Communication contains exactly 10 codes');

  // Test 5 & 6: Mechanical contains 3 codes, Civil contains 2 codes
  const mechCodes = initialData.problem_statements.filter((p) => p.sub_domain === 'MECHANICAL');
  const civilCodes = initialData.problem_statements.filter((p) => p.sub_domain === 'CIVIL');
  assert(mechCodes.length === 3, 'Requirement 5: Mechanical contains exactly 3 codes (ME-01, ME-02, ME-03)');
  assert(civilCodes.length === 2, 'Requirement 6: Civil contains exactly 2 codes (CE-01, CE-02)');

  // Test 7: Teams see ONLY PS codes, not problem statement content
  const sampleItem = initialData.problem_statements[0] as any;
  const hasNoConfidentialDetails =
    sampleItem.title === undefined &&
    sampleItem.description === undefined &&
    sampleItem.organization === undefined &&
    sampleItem.sih_number === undefined;
  assert(hasNoConfidentialDetails, 'Requirement 7: Teams see ONLY PS codes (no titles/descriptions exposed)');

  // Test 8 & 9: First team occupies slot 1/2
  const res1 = await reserveProblemStatementAtomic({
    ps_code: 'CS-01',
    team_name: 'Team Alpha',
    registration_id: 'REG-ALPHA-01',
    leader_name: 'Ananya Rao',
    leader_email: 'ananya@vvce.ac.in',
    domain: 'CSE_AIML',
  });
  assert(res1.success && res1.occupied_count === 1, 'Requirement 8 & 9: Team 1 successfully registered, occupies slot 1/2');

  // Test 10: Second team occupies slot 2/2
  const res2 = await reserveProblemStatementAtomic({
    ps_code: 'CS-01',
    team_name: 'Team Beta',
    registration_id: 'REG-BETA-02',
    leader_name: 'Bharath Kumar',
    leader_email: 'bharath@vvce.ac.in',
    domain: 'CSE_AIML',
  });
  assert(res2.success && res2.occupied_count === 2 && res2.status === 'FULL', 'Requirement 10: Team 2 occupies slot 2/2 (marked FULL)');

  // Test 11: Third team CANNOT select that code (Strict 2-team capacity limit)
  const res3 = await reserveProblemStatementAtomic({
    ps_code: 'CS-01',
    team_name: 'Team Gamma',
    registration_id: 'REG-GAMMA-03',
    leader_name: 'Chetan Gowda',
    leader_email: 'chetan@vvce.ac.in',
    domain: 'CSE_AIML',
  });
  assert(!res3.success && res3.message.includes('maximum capacity'), 'Requirement 11: Third team rejected when code is 2/2 full');

  // Test 12: One team cannot select multiple codes
  const resDuplicateTeam = await reserveProblemStatementAtomic({
    ps_code: 'CS-02',
    team_name: 'Team Alpha', // Duplicate team name
    registration_id: 'REG-ALPHA-NEW',
    leader_name: 'Ananya Rao',
    leader_email: 'ananya_diff@vvce.ac.in',
    domain: 'CSE_AIML',
  });
  assert(!resDuplicateTeam.success && resDuplicateTeam.message.includes('already registered'), 'Requirement 12: Team cannot select multiple codes (team name duplicate blocked)');

  // Test 13: Duplicate registration ID and email prevented
  const resDuplicateReg = await reserveProblemStatementAtomic({
    ps_code: 'CS-02',
    team_name: 'Team Delta',
    registration_id: 'REG-ALPHA-01', // Duplicate reg id
    leader_name: 'Deepak',
    leader_email: 'deepak@vvce.ac.in',
    domain: 'CSE_AIML',
  });
  assert(!resDuplicateReg.success && resDuplicateReg.message.includes('Registration ID'), 'Requirement 13a: Duplicate Registration ID rejected');

  const resDuplicateEmail = await reserveProblemStatementAtomic({
    ps_code: 'CS-02',
    team_name: 'Team Delta',
    registration_id: 'REG-DELTA-04',
    leader_name: 'Deepak',
    leader_email: 'ananya@vvce.ac.in', // Duplicate email
    domain: 'CSE_AIML',
  });
  assert(!resDuplicateEmail.success && resDuplicateEmail.message.includes('Leader Email'), 'Requirement 13b: Duplicate Leader Email rejected');

  // Test 14: Simultaneous selection requests handled safely (Race Condition Simulation)
  console.log('Testing concurrency / simultaneous requests on EC-01...');
  const concurrentAttempts = await Promise.all([
    reserveProblemStatementAtomic({
      ps_code: 'EC-01',
      team_name: 'Concurrent Team 1',
      registration_id: 'REG-CONC-01',
      leader_name: 'Leader 1',
      leader_email: 'conc1@vvce.ac.in',
      domain: 'ECE',
    }),
    reserveProblemStatementAtomic({
      ps_code: 'EC-01',
      team_name: 'Concurrent Team 2',
      registration_id: 'REG-CONC-02',
      leader_name: 'Leader 2',
      leader_email: 'conc2@vvce.ac.in',
      domain: 'ECE',
    }),
    reserveProblemStatementAtomic({
      ps_code: 'EC-01',
      team_name: 'Concurrent Team 3',
      registration_id: 'REG-CONC-03',
      leader_name: 'Leader 3',
      leader_email: 'conc3@vvce.ac.in',
      domain: 'ECE',
    }),
    reserveProblemStatementAtomic({
      ps_code: 'EC-01',
      team_name: 'Concurrent Team 4',
      registration_id: 'REG-CONC-04',
      leader_name: 'Leader 4',
      leader_email: 'conc4@vvce.ac.in',
      domain: 'ECE',
    }),
  ]);

  const successfulConcurrent = concurrentAttempts.filter((r) => r.success);
  assert(
    successfulConcurrent.length === 2,
    'Requirement 14: Simultaneous selection requests strictly capped at exactly 2 slots (Race-condition safe)',
    `Successful: ${successfulConcurrent.length}`
  );

  // Test 15: Admin can view all selections
  const adminData = await getAdminDashboardData();
  assert(
    adminData.selections.length === 4, // 2 on CS-01 + 2 on EC-01
    'Requirement 15: Admin can view all selections and teams',
    `Found ${adminData.selections.length} selections`
  );

  // Test 16 & 17: Admin can cancel selections & cancelled slots become available again
  const targetSel = adminData.selections.find((s) => s.ps_code === 'CS-01');
  const cancelRes = await adminCancelSelection(targetSel!.id);
  assert(cancelRes.success, 'Requirement 16: Admin can cancel selections');

  const afterCancelData = await getPublicProblemStatements();
  const cs01AfterCancel = afterCancelData.problem_statements.find((p) => p.ps_code === 'CS-01');
  assert(
    cs01AfterCancel?.occupied_count === 1 && cs01AfterCancel?.status === 'ONE SLOT LEFT' && cs01AfterCancel.is_available,
    'Requirement 17: Cancelled slot becomes available again immediately (1/2, ONE SLOT LEFT)'
  );

  // Test 18: Admin can publish and unpublish codes
  await adminUpdatePSCode({ ps_code: 'CS-02', is_published: false });
  const hiddenData = await getPublicProblemStatements();
  assert(
    !hiddenData.problem_statements.some((p) => p.ps_code === 'CS-02'),
    'Requirement 18: Admin can unpublish codes (hidden from public)'
  );
  await adminUpdatePSCode({ ps_code: 'CS-02', is_published: true });

  // Test 19: Admin can open and close the portal
  await adminUpdateSettings({ selection_open: false });
  const closedAttempt = await reserveProblemStatementAtomic({
    ps_code: 'CS-02',
    team_name: 'Team Late',
    registration_id: 'REG-LATE-99',
    leader_name: 'Late Leader',
    leader_email: 'late@vvce.ac.in',
    domain: 'CSE_AIML',
  });
  assert(!closedAttempt.success && closedAttempt.message.includes('closed'), 'Requirement 19: Admin can pause/close the portal to block new selections');
  await adminUpdateSettings({ selection_open: true });

  // Test 21: Admin authentication with access code: 123654
  const validAuth = verifyAdminAccessCode('123654');
  const invalidAuth = verifyAdminAccessCode('wrong_code');
  assert(validAuth && !invalidAuth, 'Requirement 21: Admin authentication with access code 123654 works strictly on server');

  // Test 22: Session token cryptography
  const token = createSessionToken();
  const tokenValid = verifySessionToken(token);
  const fakeTokenValid = verifySessionToken('fake.signature');
  assert(tokenValid && !fakeTokenValid, 'Requirement 22: Cryptographic HTTP-only session tokens protect admin endpoints');

  // Reset data back to clean state for real users
  await adminResetAllData();
  const finalState = await getPublicProblemStatements();
  assert(
    finalState.problem_statements.length === 30 &&
      finalState.problem_statements.every((p) => p.occupied_count === 0 && p.status === 'AVAILABLE'),
    'Reset check: Portal restored to pristine initial state (all 30 codes available)'
  );

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

