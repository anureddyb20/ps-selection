import { NextRequest, NextResponse } from 'next/server';
import { isRequestAuthorizedAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/db';

export const dynamic = 'force-dynamic';

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  if (!isRequestAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';

  const data = await getAdminDashboardData();
  const selections = data.selections;

  if (format === 'csv') {
    const headers = [
      'Sl No',
      'PS Code',
      'Domain',
      'Sub Domain',
      'Team Name',
      'Registration ID',
      'Leader Name',
      'Leader Email',
      'Selected At',
      'Status',
    ];

    const rows = selections.map((item, idx) => [
      idx + 1,
      item.ps_code,
      item.domain,
      item.sub_domain || 'N/A',
      item.team_name,
      item.registration_id,
      item.leader_name,
      item.leader_email,
      new Date(item.selected_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      item.status,
    ]);

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((row) => row.map(escapeCsvField).join(',')),
    ].join('\r\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="VVCE_Ideathon_PS_Selections_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // Excel HTML/XML format natively opened by MS Excel, Apple Numbers & Google Sheets
  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>PS Selections</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #999; padding: 8px; }
        td { border: 1px solid #ccc; padding: 6px; }
      </style>
    </head>
    <body>
      <h2>VVCE IDEATHON - PROBLEM STATEMENT SELECTION MASTER REPORT</h2>
      <p>Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      <table>
        <thead>
          <tr>
            <th>Sl No</th>
            <th>PS Code</th>
            <th>Domain</th>
            <th>Sub Domain</th>
            <th>Team Name</th>
            <th>Registration ID</th>
            <th>Leader Name</th>
            <th>Leader Email</th>
            <th>Selection Timestamp</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${selections
            .map(
              (item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><b>${item.ps_code}</b></td>
              <td>${item.domain}</td>
              <td>${item.sub_domain || 'N/A'}</td>
              <td>${item.team_name}</td>
              <td>${item.registration_id}</td>
              <td>${item.leader_name}</td>
              <td>${item.leader_email}</td>
              <td>${new Date(item.selected_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
              <td>${item.status}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  return new NextResponse(excelContent, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="VVCE_Ideathon_PS_Selections_${new Date().toISOString().slice(0, 10)}.xls"`,
    },
  });
}

