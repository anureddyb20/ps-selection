import {
  getPublicProblemStatements,
  reserveProblemStatementAtomic,
  getTeamProfile,
  lookupTeam,
  adminResetAllData,
} from '../src/lib/db';
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

async function run() {
  console.log('\n======================================================');
  console.log('CRITICAL BUG FIX VERIFICATION (12 EXACT SCENARIOS)');
  console.log('======================================================\n');

  const dbPath = path.join(process.cwd(), 'data', 'database.json');
  let backupContent: string | null = null;
  if (fs.existsSync(dbPath)) {
    backupContent = fs.readFileSync(dbPath, 'utf-8');
  }

  try {
    await adminResetAllData();

    // 0. Verify PublicPSItem includes database id
    const initialPS = await getPublicProblemStatements();
    const allHaveId = initialPS.problem_statements.every((p) => Boolean(p.id && p.ps_code));
    assert(allHaveId, 'Setup: All public problem statements include database ID and ps_code');

    // Scenario 1: Select CS-01 in CSE/AIML
    const teamCS = (await lookupTeam('TEAM-CS')).team!;
    const resCS01 = await reserveProblemStatementAtomic({
      team_id: teamCS.id,
      ps_code: 'CS-01',
    });
    assert(resCS01.success && resCS01.ps_code === 'CS-01', 'Scenario 1: CS-01 selected successfully');

    // Scenario 2: Select EC-01 in ECE (verifying domain is ECE, NOT MECH_CIVIL)
    const teamEC1 = (await lookupTeam('TEAM-EC1')).team!;
    const ec01Item = initialPS.problem_statements.find((p) => p.ps_code === 'EC-01')!;
    const resEC01 = await reserveProblemStatementAtomic({
      team_id: teamEC1.id,
      ps_code: 'EC-01',
      ps_id: ec01Item.id,
    });
    assert(resEC01.success && resEC01.ps_code === 'EC-01', 'Scenario 2: EC-01 selected successfully');

    const profileEC1 = await getTeamProfile(teamEC1.id);
    assert(
      profileEC1?.selection?.ps_code === 'EC-01' && profileEC1.selection.domain === 'ECE',
      'Scenario 2b: ECE selection preserved as ECE domain (NOT switched to MECH_CIVIL)'
    );

    // Scenario 3: Select EC-10 in ECE
    const teamEC10 = (await lookupTeam('TEAM-EC10')).team!;
    const ec10Item = initialPS.problem_statements.find((p) => p.ps_code === 'EC-10')!;
    const resEC10 = await reserveProblemStatementAtomic({
      team_id: teamEC10.id,
      ps_code: 'EC-10',
      ps_id: ec10Item.id,
    });
    assert(resEC10.success && resEC10.ps_code === 'EC-10', 'Scenario 3: EC-10 selected successfully');

    const profileEC10 = await getTeamProfile(teamEC10.id);
    assert(
      profileEC10?.selection?.ps_code === 'EC-10' && profileEC10.selection.domain === 'ECE',
      'Scenario 3b: EC-10 domain is strictly ECE'
    );

    // Scenario 4: Select ME-01 in Mechanical
    const teamME = (await lookupTeam('TEAM-ME')).team!;
    const resME01 = await reserveProblemStatementAtomic({
      team_id: teamME.id,
      ps_code: 'ME-01',
    });
    assert(resME01.success && resME01.ps_code === 'ME-01', 'Scenario 4: ME-01 selected successfully in Mechanical');

    const profileME = await getTeamProfile(teamME.id);
    assert(
      profileME?.selection?.ps_code === 'ME-01' && profileME.selection.sub_domain === 'MECHANICAL',
      'Scenario 4b: ME-01 correctly categorized as MECHANICAL'
    );

    // Scenario 5: Select CE-01 in Civil
    const teamCE = (await lookupTeam('TEAM-CE')).team!;
    const resCE01 = await reserveProblemStatementAtomic({
      team_id: teamCE.id,
      ps_code: 'CE-01',
    });
    assert(resCE01.success && resCE01.ps_code === 'CE-01', 'Scenario 5: CE-01 selected successfully in Civil');

    const profileCE = await getTeamProfile(teamCE.id);
    assert(
      profileCE?.selection?.ps_code === 'CE-01' && profileCE.selection.sub_domain === 'CIVIL',
      'Scenario 5b: CE-01 correctly categorized as CIVIL'
    );

    // Scenario 6 & 7: Verify Domain Separation
    const freshPS = await getPublicProblemStatements();
    const cseList = freshPS.problem_statements.filter((p) => p.domain === 'CSE_AIML');
    const eceList = freshPS.problem_statements.filter((p) => p.domain === 'ECE');
    const mechList = freshPS.problem_statements.filter((p) => p.sub_domain === 'MECHANICAL');
    const civilList = freshPS.problem_statements.filter((p) => p.sub_domain === 'CIVIL');

    assert(cseList.length === 15, 'Scenario 6a: CSE/AIML has exactly 15 codes (CS-01 to CS-15)');
    assert(eceList.length === 10, 'Scenario 6b: ECE has exactly 10 codes (EC-01 to EC-10)');
    assert(mechList.length === 3, 'Scenario 6c: Mechanical has exactly 3 codes (ME-01 to ME-03)');
    assert(civilList.length === 2, 'Scenario 6d: Civil has exactly 2 codes (CE-01 to CE-02)');

    // Scenario 8 & 9: Persistence Check (Reload and verify selection remains)
    const reloadedProfileEC1 = await getTeamProfile(teamEC1.id);
    assert(
      Boolean(reloadedProfileEC1?.selection && reloadedProfileEC1.selection.ps_code === 'EC-01'),
      'Scenario 8 & 9: Persistence verified - EC-01 remains assigned after re-fetch'
    );

    // Scenario 10: Availability count updates correctly
    const cs01Fresh = freshPS.problem_statements.find((p) => p.ps_code === 'CS-01');
    const ec01Fresh = freshPS.problem_statements.find((p) => p.ps_code === 'EC-01');
    assert(
      cs01Fresh?.occupied_count === 1 && cs01Fresh.status === 'ONE SLOT LEFT',
      'Scenario 10a: CS-01 shows 1/2 occupied (ONE SLOT LEFT)'
    );
    assert(
      ec01Fresh?.occupied_count === 1 && ec01Fresh.status === 'ONE SLOT LEFT',
      'Scenario 10b: EC-01 shows 1/2 occupied (ONE SLOT LEFT)'
    );

    // Scenario 11: 2/2 Capacity limit
    const teamCS2 = (await lookupTeam('TEAM-CS2')).team!;
    const resCS01Slot2 = await reserveProblemStatementAtomic({
      team_id: teamCS2.id,
      ps_code: 'CS-01',
    });
    assert(resCS01Slot2.success && resCS01Slot2.occupied_count === 2, 'Scenario 11a: CS-01 accepts 2nd team (2/2)');

    const teamCS3 = (await lookupTeam('TEAM-CS3')).team!;
    const resCS01Slot3 = await reserveProblemStatementAtomic({
      team_id: teamCS3.id,
      ps_code: 'CS-01',
    });
    assert(!resCS01Slot3.success, 'Scenario 11b: 3rd team rejected on CS-01 (Capacity 2/2 enforced)');

    // Scenario 12: 1-PS per team limit
    const resDuplicateCE = await reserveProblemStatementAtomic({
      team_id: teamCE.id,
      ps_code: 'CE-02',
    });
    assert(!resDuplicateCE.success, 'Scenario 12: Team cannot select a second PS (1-PS limit enforced)');

  } finally {
    if (backupContent) {
      fs.writeFileSync(dbPath, backupContent, 'utf-8');
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
