import { FullClassDataStore } from '../types';

export function exportSingleFileHtml(currentStore: FullClassDataStore): void {
  const storeJson = JSON.stringify(currentStore).replace(/</g, '\\u003c');
  
  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLASS PRO – Trợ Lý Giáo Viên Chủ Nhiệm (Bản Ngoại Tuyến)</title>
  <style>
    :root {
      --primary: #0d9488;
      --primary-dark: #0f766e;
      --primary-light: #ccfbf1;
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .offline-banner {
      background: linear-gradient(135deg, #0d9488, #0284c7);
      color: white;
      padding: 12px 20px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .container {
      max-width: 1280px;
      margin: 24px auto;
      padding: 0 16px;
    }
    .card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin-top: 12px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 10px 14px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #334155;
    }
    tr:hover { background: #f8fafc; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-present { background: #dcfce7; color: #15803d; }
    .badge-absent { background: #fee2e2; color: #b91c1c; }
    .badge-late { background: #fef3c7; color: #b45309; }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      border-top: 4px solid var(--primary);
    }
    .stat-val {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }
    .stat-lbl {
      font-size: 13px;
      color: var(--muted);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    }
    .btn:hover { background: var(--primary-dark); }
    @media print {
      .offline-banner, .btn, .no-print { display: none !important; }
      body { background: white !important; }
      .card { border: none !important; box-shadow: none !important; }
    }
  </style>
</head>
<body>
  <div class="offline-banner">
    <div>
      <strong>CLASS PRO – BẢN NGOẠI TUYẾN 100%</strong> · Lưu trữ trên máy của bạn
    </div>
    <div>
      <button class="btn" style="background: rgba(255,255,255,0.2);" onclick="window.print()">In danh sách / Báo cáo</button>
    </div>
  </div>

  <div class="container">
    <div id="app-root"></div>
  </div>

  <script>
    // Embedded Store Data
    const store = ${storeJson};
    const activeClass = store.classes.find(c => c.id === store.settings.activeClassId) || store.classes[0];
    const classStudents = store.students.filter(s => s.classId === activeClass.id);

    function render() {
      const root = document.getElementById('app-root');
      root.innerHTML = \`
        <div class="card">
          <div class="title">
            <span>🏫 \${activeClass.name} (\${activeClass.grade})</span>
            <span style="font-size: 14px; font-weight: normal; color: #64748b;">Năm học: \${activeClass.schoolYear} · GVCN: \${activeClass.teacherName}</span>
          </div>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-val">\${classStudents.length}</div>
              <div class="stat-lbl">Sĩ số học sinh</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">\${classStudents.reduce((sum, s) => sum + (s.coins || 0), 0)}</div>
              <div class="stat-lbl">Tổng điểm / Xu thi đua</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">\${store.rewards.length}</div>
              <div class="stat-lbl">Phần thưởng trong kho</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">\${store.announcements.length}</div>
              <div class="stat-lbl">Thông báo & Nhận xét</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="title">
            <span>📋 Danh Sách Học Sinh (\${classStudents.length} em)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">STT</th>
                <th style="width: 90px;">Mã HS</th>
                <th>Họ và tên</th>
                <th style="width: 100px;">Ngày sinh</th>
                <th style="width: 70px;">Giới tính</th>
                <th style="width: 70px;">Tổ</th>
                <th style="width: 130px;">Chức vụ</th>
                <th style="width: 80px;">Xu</th>
                <th>Ghi chú giáo viên</th>
              </tr>
            </thead>
            <tbody>
              \${classStudents.map((s, idx) => \`
                <tr>
                  <td style="text-align: center;">\${idx + 1}</td>
                  <td><strong>\${s.code}</strong></td>
                  <td>\${s.fullName}</td>
                  <td>\${s.birthDate}</td>
                  <td>\${s.gender}</td>
                  <td style="text-align: center;">Tổ \${s.team}</td>
                  <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">\${s.role}</span></td>
                  <td style="font-weight: 700; color: #0d9488;">\${s.coins}</td>
                  <td>\${s.notes || ''}</td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="title">
            <span>📢 Thông Báo & Lời Dặn Của Lớp</span>
          </div>
          \${store.announcements.filter(a => a.classId === activeClass.id).map(a => \`
            <div style="border-left: 3px solid #0d9488; padding: 10px 14px; margin-bottom: 12px; background: #f8fafc;">
              <h4 style="font-size: 15px; margin-bottom: 4px;">\${a.title}</h4>
              <p style="font-size: 13px; color: #475569;">\${a.content}</p>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Ngày đăng: \${a.date}</div>
            </div>
          \`).join('') || '<p style="color:#64748b;">Chưa có thông báo nào.</p>'}
        </div>
      \`;
    }

    render();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Class_Pro_${currentStore.classes[0]?.name || 'Lop'}_Offline.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
