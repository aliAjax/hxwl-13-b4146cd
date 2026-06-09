import './styles.css';

const key = 'hxwl-13-home-energy';
const priceKey = 'hxwl-13-home-energy-price';
const applianceKey = 'hxwl-13-home-energy-appliances';
const goalKey = 'hxwl-13-home-energy-goal';
const memberKey = 'hxwl-13-home-energy-members';
const seed = [
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-04', slot: '晚间', hours: 5.5, watts: 900, note: '睡前开启', member: '爸爸' },
  { id: crypto.randomUUID(), appliance: '电热水器', date: '2026-06-04', slot: '傍晚', hours: 1.2, watts: 1800, note: '洗澡前加热', member: '妈妈' },
  { id: crypto.randomUUID(), appliance: '洗衣机', date: '2026-06-05', slot: '上午', hours: 1, watts: 420, note: '快洗模式', member: '妈妈' },
  { id: crypto.randomUUID(), appliance: '台式电脑', date: '2026-06-05', slot: '下午', hours: 4, watts: 260, note: '剪辑文件', member: '小明' },
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-06', slot: '午后', hours: 3.5, watts: 900, note: '客厅降温', member: '' }
];
const applianceSeed = [
  { id: crypto.randomUUID(), name: '空调', watts: 900, slot: '晚间', note: '卧室挂机' },
  { id: crypto.randomUUID(), name: '电热水器', watts: 1800, slot: '傍晚', note: '60L储水式' },
  { id: crypto.randomUUID(), name: '洗衣机', watts: 420, slot: '上午', note: '滚筒式' },
  { id: crypto.randomUUID(), name: '台式电脑', watts: 260, slot: '下午', note: '含显示器' },
  { id: crypto.randomUUID(), name: '冰箱', watts: 120, slot: '全天', note: '风冷无霜' },
  { id: crypto.randomUUID(), name: '微波炉', watts: 800, slot: '午间', note: '加热饭菜' }
];
const memberSeed = [
  { id: crypto.randomUUID(), name: '爸爸', note: '主要使用者' },
  { id: crypto.randomUUID(), name: '妈妈', note: '主要使用者' },
  { id: crypto.randomUUID(), name: '小明', note: '孩子' },
  { id: crypto.randomUUID(), name: '小红', note: '孩子' }
];

const UNASSIGNED_LABEL = '未分配';

function getMemberName(record) {
  return record.member || record.member === '' ? (record.member || UNASSIGNED_LABEL) : UNASSIGNED_LABEL;
}

function normalizeRecords(records) {
  return records.map(record => ({
    ...record,
    member: record.member !== undefined ? record.member : ''
  }));
}

let records = normalizeRecords(JSON.parse(localStorage.getItem(key) || 'null') || seed);
let appliances = JSON.parse(localStorage.getItem(applianceKey) || 'null') || applianceSeed;
let members = JSON.parse(localStorage.getItem(memberKey) || 'null') || memberSeed;
let editingId = null;
let editingApplianceId = null;
let editingMemberId = null;
let editingMemberOldName = null;
let priceSettings = JSON.parse(localStorage.getItem(priceKey) || 'null') || { price: 0.56, month: new Date().toISOString().slice(0, 7) };
let goalSettings = JSON.parse(localStorage.getItem(goalKey) || 'null') || null;
let lastNotifiedOverTarget = false;
let batchAssignMode = false;
let selectedRecordIds = [];

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="hero">
      <div>
        <p>hxwl-13 · port 5113</p>
        <h1>家庭用电习惯观察</h1>
      </div>
      <button id="sample">载入示例</button>
    </header>

    <section class="panel energyGoalPanel" id="energyGoalSection">
      <div class="panelHead">
        <h2>🎯 本月节能目标</h2>
        <div class="goalActions">
          <button id="setGoalBtn" class="primary">设置目标</button>
        </div>
      </div>
      <div id="goalProgressContainer">
        <div class="goalSummary">
          <div class="goalStat">
            <span>当前累计耗电</span>
            <strong id="goalCurrent">0 kWh</strong>
          </div>
          <div class="goalStat">
            <span>目标额度</span>
            <strong id="goalTarget">-- kWh</strong>
          </div>
          <div class="goalStat">
            <span>剩余额度</span>
            <strong id="goalRemaining">-- kWh</strong>
          </div>
        </div>
        <div class="progressBarWrap">
          <div class="progressBar">
            <div class="progressFill" id="goalProgressFill"></div>
          </div>
          <div class="progressLabels">
            <span id="goalPercent">0%</span>
            <span id="goalHint">请先设置本月节能目标</span>
          </div>
        </div>
      </div>
      <div id="goalFormContainer" style="display:none; margin-top:16px;">
        <form id="goalForm" class="goalForm">
          <div class="goalFormRow">
            <label>
              <span>目标月份</span>
              <input name="month" type="month" required />
            </label>
            <label>
              <span>目标耗电量 (kWh)</span>
              <input name="target" type="number" min="0.1" step="0.1" placeholder="请输入目标耗电量" required />
            </label>
          </div>
          <div class="goalFormRow">
            <button type="submit" class="primary">保存目标</button>
            <button type="button" id="cancelGoalBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:11px 24px;">取消</button>
          </div>
        </form>
      </div>
    </section>

    <section class="panel" id="csvImportSection">
      <div class="panelHead">
        <h2>CSV导入预览</h2>
        <div class="csvActions">
          <label class="csvUploadBtn">
            <input type="file" id="csvFileInput" accept=".csv" style="display:none" />
            <span>选择CSV文件</span>
          </label>
          <button id="downloadTemplateBtn" class="primary">下载模板</button>
        </div>
      </div>
      <div id="csvDropZone" class="csvDropZone">
        <p>拖拽CSV文件到此处，或点击上方按钮选择文件</p>
        <p class="csvHint">CSV需包含：日期、电器、成员（可选）、时段、使用时长、功率、备注</p>
      </div>
      <div id="csvPreviewContainer" style="display:none; margin-top:18px;">
        <div id="csvStats" class="csvStats"></div>
        <div class="tableWrap"><table class="csvPreviewTable">
          <thead>
            <tr>
              <th>行号</th>
              <th>日期</th>
              <th>电器</th>
              <th>成员</th>
              <th>时段</th>
              <th>使用时长(h)</th>
              <th>功率(W)</th>
              <th>备注</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody id="csvPreviewRows"></tbody>
        </table></div>
        <div style="margin-top:16px; display:flex; gap:12px; justify-content:flex-end;">
          <button id="cancelCsvBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:11px 24px;">取消</button>
          <button id="confirmCsvBtn" class="primary">确认导入</button>
        </div>
      </div>
    </section>

    <section class="panel" id="memberStatsSection">
      <div class="panelHead">
        <h2>👨‍👩‍👧‍👦 家庭成员用电归因</h2>
        <div class="goalActions">
          <button id="batchAssignBtn" class="primary">批量分配成员</button>
        </div>
      </div>
      <div id="memberStatsContainer" class="memberStatsGrid"></div>
    </section>

    <section class="panel" id="memberManagementSection" style="display:none;">
      <div class="panelHead"><h2>家庭成员管理</h2><button class="primary" id="addMemberBtn">新增成员</button></div>
      <div id="memberFormContainer" style="display:none; margin-top:16px;">
        <form id="memberForm" class="layout" style="grid-template-columns: 1fr 1fr auto; gap:12px; margin-bottom:16px;">
          <input name="name" placeholder="成员姓名" required />
          <input name="note" placeholder="备注" />
          <button class="primary">保存</button>
          <button type="button" id="cancelMemberBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:11px 14px;">取消</button>
        </form>
      </div>
      <div class="tableWrap"><table><thead><tr><th>成员姓名</th><th>备注</th><th></th></tr></thead><tbody id="memberRows"></tbody></table></div>
    </section>

    <section class="layout">
      <form id="form" class="panel">
        <h2>用电记录</h2>
        <select name="applianceSelect" id="applianceSelect">
          <option value="">选择已有电器（可选）</option>
        </select>
        <input name="appliance" placeholder="电器名称" required />
        <select name="member" id="memberSelect">
          <option value="">使用成员（可选）</option>
        </select>
        <input name="date" type="date" required />
        <select name="slot" required>
          <option value="">使用时段</option>
          <option>清晨</option><option>上午</option><option>午间</option><option>午后</option><option>傍晚</option><option>晚间</option><option>深夜</option><option>全天</option>
        </select>
        <div class="pair">
          <input name="hours" type="number" min="0" step="0.1" placeholder="使用时长h" required />
          <input name="watts" type="number" min="0" step="1" placeholder="估算功率W" required />
        </div>
        <textarea name="note" placeholder="备注"></textarea>
        <button class="primary">保存记录</button>
      </form>

      <div>
        <section class="summary" id="summary"></section>
        <section class="panel">
          <h2>每日估算耗电</h2>
          <div class="chart" id="dailyChart"></div>
        </section>
      </div>
    </section>

    <section class="panel">
      <div class="panelHead"><h2>电器档案</h2><button class="primary" id="addApplianceBtn">新增电器</button></div>
      <div id="applianceFormContainer" style="display:none; margin-top:16px;">
        <form id="applianceForm" class="layout" style="grid-template-columns: 1fr 1fr 1fr 1fr auto; gap:12px; margin-bottom:16px;">
          <input name="name" placeholder="电器名称" required />
          <input name="watts" type="number" min="0" step="1" placeholder="额定功率W" required />
          <select name="slot" required>
            <option value="">默认时段</option>
            <option>清晨</option><option>上午</option><option>午间</option><option>午后</option><option>傍晚</option><option>晚间</option><option>深夜</option><option>全天</option>
          </select>
          <input name="note" placeholder="备注" />
          <button class="primary">保存</button>
          <button type="button" id="cancelApplianceBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:11px 14px;">取消</button>
        </form>
      </div>
      <div class="tableWrap"><table><thead><tr><th>电器名称</th><th>额定功率</th><th>默认时段</th><th>备注</th><th></th></tr></thead><tbody id="applianceRows"></tbody></table></div>
    </section>

    <section class="cards">
      <div class="panel"><h2>电器耗电占比</h2><div class="chart small" id="applianceChart"></div></div>
      <div class="panel"><h2>高耗电时段</h2><div class="chart small" id="slotChart"></div></div>
    </section>

    <section class="layout">
      <form id="priceForm" class="panel">
        <h2>月度电费估算</h2>
        <input name="price" type="number" min="0" step="0.01" placeholder="每度电单价(元)" required />
        <input name="month" type="month" required />
        <button class="primary">更新估算</button>
      </form>
      <div>
        <section class="summary" id="monthlySummary"></section>
        <section class="panel">
          <h2>当月每日耗电</h2>
          <div class="chart" id="monthlyChart"></div>
        </section>
      </div>
    </section>

    <section class="panel">
      <div class="panelHead">
        <h2>记录列表</h2>
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
          <div id="batchAssignControls" style="display:none; gap:12px; align-items:center;">
            <select id="batchMemberSelect">
              <option value="">选择分配成员</option>
            </select>
            <button id="confirmBatchAssignBtn" class="primary">确认分配</button>
            <button id="cancelBatchAssignBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:11px 24px;">取消</button>
            <span id="selectedCount" style="color:#5c6982; font-size:13px;">已选 0 条</span>
          </div>
          <input id="search" placeholder="搜索电器或备注" />
        </div>
      </div>
      <div class="tableWrap"><table><thead><tr><th id="selectAllHeader" style="display:none;"><input type="checkbox" id="selectAllCheckbox" /></th><th>日期</th><th>电器</th><th>成员</th><th>时段</th><th>耗电</th><th>备注</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    </section>
  </main>
`;

const form = document.querySelector('#form');
const search = document.querySelector('#search');
const priceForm = document.querySelector('#priceForm');
const applianceForm = document.querySelector('#applianceForm');
const memberForm = document.querySelector('#memberForm');
const applianceSelect = document.querySelector('#applianceSelect');
const memberSelect = document.querySelector('#memberSelect');
const batchMemberSelect = document.querySelector('#batchMemberSelect');
const applianceFormContainer = document.querySelector('#applianceFormContainer');
const memberFormContainer = document.querySelector('#memberFormContainer');
const memberManagementSection = document.querySelector('#memberManagementSection');
const addApplianceBtn = document.querySelector('#addApplianceBtn');
const cancelApplianceBtn = document.querySelector('#cancelApplianceBtn');
const addMemberBtn = document.querySelector('#addMemberBtn');
const cancelMemberBtn = document.querySelector('#cancelMemberBtn');
const setGoalBtn = document.querySelector('#setGoalBtn');
const cancelGoalBtn = document.querySelector('#cancelGoalBtn');
const goalForm = document.querySelector('#goalForm');
const goalFormContainer = document.querySelector('#goalFormContainer');
const toastContainer = document.querySelector('#toastContainer');
const batchAssignBtn = document.querySelector('#batchAssignBtn');
const batchAssignControls = document.querySelector('#batchAssignControls');
const cancelBatchAssignBtn = document.querySelector('#cancelBatchAssignBtn');
const confirmBatchAssignBtn = document.querySelector('#confirmBatchAssignBtn');
const selectAllHeader = document.querySelector('#selectAllHeader');
const selectAllCheckbox = document.querySelector('#selectAllCheckbox');
const selectedCountSpan = document.querySelector('#selectedCount');

priceForm.elements.price.value = priceSettings.price;
priceForm.elements.month.value = priceSettings.month;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const item = { ...data, hours: Number(data.hours), watts: Number(data.watts), id: editingId || crypto.randomUUID() };
  delete item.applianceSelect;

  const beforeTotal = getCurrentMonthTotal();
  records = editingId ? records.map((record) => (record.id === editingId ? item : record)) : [item, ...records];
  const afterTotal = getCurrentMonthTotal();

  if (beforeTotal > goalSettings?.target && afterTotal <= goalSettings?.target) {
    lastNotifiedOverTarget = false;
  }

  editingId = null;
  form.reset();
  save();
  render();
});

applianceSelect.addEventListener('change', (event) => {
  const selectedId = event.target.value;
  if (!selectedId) return;
  const appliance = appliances.find((a) => a.id === selectedId);
  if (appliance) {
    form.elements.appliance.value = appliance.name;
    form.elements.watts.value = appliance.watts;
    form.elements.slot.value = appliance.slot;
  }
});

addApplianceBtn.addEventListener('click', () => {
  editingApplianceId = null;
  applianceForm.reset();
  applianceFormContainer.style.display = 'block';
});

cancelApplianceBtn.addEventListener('click', () => {
  editingApplianceId = null;
  applianceForm.reset();
  applianceFormContainer.style.display = 'none';
});

applianceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(applianceForm).entries());
  const item = { ...data, watts: Number(data.watts), id: editingApplianceId || crypto.randomUUID() };
  appliances = editingApplianceId ? appliances.map((a) => (a.id === editingApplianceId ? item : a)) : [item, ...appliances];
  editingApplianceId = null;
  applianceForm.reset();
  applianceFormContainer.style.display = 'none';
  save();
  render();
});

addMemberBtn.addEventListener('click', () => {
  editingMemberId = null;
  editingMemberOldName = null;
  memberForm.reset();
  memberFormContainer.style.display = 'block';
});

cancelMemberBtn.addEventListener('click', () => {
  editingMemberId = null;
  editingMemberOldName = null;
  memberForm.reset();
  memberFormContainer.style.display = 'none';
});

memberForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(memberForm).entries());
  const item = { ...data, id: editingMemberId || crypto.randomUUID() };
  if (editingMemberId && editingMemberOldName && editingMemberOldName !== item.name) {
    records = records.map((record) => (
      record.member === editingMemberOldName ? { ...record, member: item.name } : record
    ));
  }
  members = editingMemberId ? members.map((m) => (m.id === editingMemberId ? item : m)) : [item, ...members];
  editingMemberId = null;
  editingMemberOldName = null;
  memberForm.reset();
  memberFormContainer.style.display = 'none';
  save();
  render();
});

batchAssignBtn.addEventListener('click', () => {
  batchAssignMode = !batchAssignMode;
  if (batchAssignMode) {
    memberManagementSection.style.display = 'block';
    batchAssignControls.style.display = 'flex';
    selectAllHeader.style.display = 'table-cell';
    batchAssignBtn.textContent = '退出批量分配';
    batchAssignBtn.style.background = '#dc2626';
  } else {
    memberManagementSection.style.display = 'none';
    batchAssignControls.style.display = 'none';
    selectAllHeader.style.display = 'none';
    batchAssignBtn.textContent = '批量分配成员';
    batchAssignBtn.style.background = '';
    selectedRecordIds = [];
    selectAllCheckbox.checked = false;
  }
  render();
});

cancelBatchAssignBtn.addEventListener('click', () => {
  batchAssignMode = false;
  memberManagementSection.style.display = 'none';
  batchAssignControls.style.display = 'none';
  selectAllHeader.style.display = 'none';
  batchAssignBtn.textContent = '批量分配成员';
  batchAssignBtn.style.background = '';
  selectedRecordIds = [];
  selectAllCheckbox.checked = false;
  render();
});

confirmBatchAssignBtn.addEventListener('click', () => {
  const targetMember = batchMemberSelect.value;
  if (selectedRecordIds.length === 0) {
    showToast('warning', '请选择记录', '请先勾选要分配的记录');
    return;
  }
  if (!targetMember) {
    showToast('warning', '请选择成员', '请选择要分配的家庭成员');
    return;
  }
  records = records.map(record => {
    if (selectedRecordIds.includes(record.id)) {
      return { ...record, member: targetMember };
    }
    return record;
  });
  showToast('success', '分配成功', `已将 ${selectedRecordIds.length} 条记录分配给「${targetMember}」`);
  selectedRecordIds = [];
  selectAllCheckbox.checked = false;
  save();
  render();
});

selectAllCheckbox.addEventListener('change', (e) => {
  const filtered = records.filter((record) => [record.appliance, record.note, record.slot].join(' ').includes(search.value.trim()));
  if (e.target.checked) {
    selectedRecordIds = filtered.map(r => r.id);
  } else {
    selectedRecordIds = [];
  }
  render();
});

search.addEventListener('input', render);
document.querySelector('#sample').addEventListener('click', () => {
  const beforeTotal = getCurrentMonthTotal();
  records = seed;
  appliances = applianceSeed;
  const afterTotal = getCurrentMonthTotal();

  if (beforeTotal > goalSettings?.target && afterTotal <= goalSettings?.target) {
    lastNotifiedOverTarget = false;
  }

  save();
  render();
});
priceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(priceForm).entries());
  priceSettings = { price: Number(data.price), month: data.month };
  localStorage.setItem(priceKey, JSON.stringify(priceSettings));
  render();
});

setGoalBtn.addEventListener('click', () => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  goalForm.reset();
  if (goalSettings) {
    goalForm.elements.month.value = goalSettings.month;
    goalForm.elements.target.value = goalSettings.target;
  } else {
    goalForm.elements.month.value = currentMonth;
  }
  goalFormContainer.style.display = 'block';
});

cancelGoalBtn.addEventListener('click', () => {
  goalFormContainer.style.display = 'none';
  goalForm.reset();
});

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(goalForm).entries());
  const targetValue = Number(data.target);
  if (targetValue <= 0) {
    showToast('error', '目标值无效', '请设置大于0的目标耗电量');
    return;
  }
  goalSettings = { month: data.month, target: targetValue };
  localStorage.setItem(goalKey, JSON.stringify(goalSettings));
  lastNotifiedOverTarget = false;
  goalFormContainer.style.display = 'none';
  showToast('success', '目标已设置', `本月节能目标：${goalSettings.target} kWh`);
  render();
});

let parsedCsvData = [];

const csvFileInput = document.querySelector('#csvFileInput');
const csvDropZone = document.querySelector('#csvDropZone');
const csvPreviewContainer = document.querySelector('#csvPreviewContainer');
const csvPreviewRows = document.querySelector('#csvPreviewRows');
const csvStats = document.querySelector('#csvStats');
const csvUploadBtn = document.querySelector('.csvUploadBtn');
const cancelCsvBtn = document.querySelector('#cancelCsvBtn');
const confirmCsvBtn = document.querySelector('#confirmCsvBtn');
const downloadTemplateBtn = document.querySelector('#downloadTemplateBtn');

const validSlots = ['清晨', '上午', '午间', '午后', '傍晚', '晚间', '深夜', '全天'];
const headerMap = {
  '日期': 'date', 'date': 'date', '时间': 'date',
  '电器': 'appliance', '电器名称': 'appliance', 'appliance': 'appliance',
  '成员': 'member', '使用成员': 'member', '家庭成员': 'member', 'member': 'member',
  '时段': 'slot', '使用时段': 'slot', 'slot': 'slot',
  '使用时长': 'hours', '时长': 'hours', '小时': 'hours', 'hours': 'hours',
  '功率': 'watts', '功率(W)': 'watts', '瓦': 'watts', 'watts': 'watts',
  '备注': 'note', '说明': 'note', 'note': 'note'
};

function parseCsv(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = false; }
      } else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(current.trim()); current = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(current.trim());
        if (row.some(cell => cell !== '')) rows.push([...row]);
        row.length = 0; current = '';
      } else { current += ch; }
    }
  }
  if (current || row.length) { row.push(current.trim()); rows.push(row); }
  return rows;
}

function mapHeaders(headerRow) {
  const mapped = [];
  for (let i = 0; i < headerRow.length; i++) {
    const h = headerRow[i].trim();
    mapped.push(headerMap[h] || null);
  }
  return mapped;
}

function validateRow(row, index, headers) {
  const errors = [];
  const warnings = [];
  const data = {};
  const fieldStatus = {};

  for (let i = 0; i < headers.length; i++) {
    const key = headers[i];
    const value = row[i] || '';
    if (key) data[key] = value;
  }

  if (!data.date || data.date.trim() === '') {
    errors.push('日期不能为空');
    fieldStatus.date = 'invalid';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) && !/^\d{4}\/\d{2}\/\d{2}$/.test(data.date)) {
    errors.push('日期格式错误，应为YYYY-MM-DD或YYYY/MM/DD');
    fieldStatus.date = 'invalid';
  } else {
    const normalizedDate = data.date.replace(/\//g, '-');
    const parts = normalizedDate.split('-').map(Number);
    const [year, month, day] = parts;
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime()) ||
        d.getFullYear() !== year ||
        d.getMonth() !== month - 1 ||
        d.getDate() !== day) {
      errors.push('日期无效，不存在该日期');
      fieldStatus.date = 'invalid';
    } else {
      data.date = normalizedDate;
      fieldStatus.date = 'valid';
    }
  }

  if (!data.appliance || data.appliance.trim() === '') {
    errors.push('电器名称不能为空');
    fieldStatus.appliance = 'invalid';
  } else {
    fieldStatus.appliance = 'valid';
  }

  if (!data.slot || data.slot.trim() === '') {
    errors.push('时段不能为空');
    fieldStatus.slot = 'invalid';
  } else if (!validSlots.includes(data.slot.trim())) {
    errors.push(`时段必须是：${validSlots.join('、')}`);
    fieldStatus.slot = 'invalid';
  } else {
    data.slot = data.slot.trim();
    fieldStatus.slot = 'valid';
  }

  if (data.hours === undefined || data.hours === '' || data.hours === null) {
    errors.push('使用时长不能为空');
    fieldStatus.hours = 'invalid';
  } else {
    const hours = Number(data.hours);
    if (isNaN(hours)) {
      errors.push('使用时长必须是数字');
      fieldStatus.hours = 'invalid';
    } else if (hours < 0) {
      errors.push('使用时长不能为负数');
      fieldStatus.hours = 'invalid';
    } else if (hours > 24) {
      errors.push('使用时长不能超过24小时');
      fieldStatus.hours = 'invalid';
    } else {
      data.hours = hours;
      fieldStatus.hours = 'valid';
      if (hours === 0) warnings.push('使用时长为0');
    }
  }

  if (data.watts === undefined || data.watts === '' || data.watts === null) {
    errors.push('功率不能为空');
    fieldStatus.watts = 'invalid';
  } else {
    const watts = Number(data.watts);
    if (isNaN(watts)) {
      errors.push('功率必须是数字');
      fieldStatus.watts = 'invalid';
    } else if (watts < 0) {
      errors.push('功率不能为负数');
      fieldStatus.watts = 'invalid';
    } else if (watts > 10000) {
      warnings.push('功率数值较大，请确认');
      fieldStatus.watts = 'warning';
    } else {
      data.watts = watts;
      fieldStatus.watts = 'valid';
    }
  }

  if (!data.note || data.note.trim() === '') {
    fieldStatus.note = 'valid';
    data.note = '';
  } else {
    fieldStatus.note = 'valid';
  }

  return {
    rowNumber: index + 1,
    data,
    errors,
    warnings,
    fieldStatus,
    isValid: errors.length === 0
  };
}

function renderCsvPreview(validatedRows) {
  const validCount = validatedRows.filter(r => r.isValid).length;
  const invalidCount = validatedRows.length - validCount;

  csvStats.innerHTML = `
    <span class="stat total">共 ${validatedRows.length} 条记录</span>
    <span class="stat valid">有效 ${validCount} 条</span>
    <span class="stat invalid">无效 ${invalidCount} 条</span>
  `;

  csvPreviewRows.innerHTML = validatedRows.map(row => {
    const allErrors = [...row.errors, ...row.warnings].join('；');
    const statusClass = row.isValid ? 'valid' : 'invalid';
    const statusText = row.isValid ? '有效' : '无效';

    return `
      <tr>
        <td>${row.rowNumber}</td>
        <td class="${row.fieldStatus.date}">${row.data.date || ''}
          ${row.fieldStatus.date === 'invalid' ? `<span class="errorTooltip">${row.errors.find(e => e.includes('日期')) || ''}</span>` : ''}
        </td>
        <td class="${row.fieldStatus.appliance}">${row.data.appliance || ''}
          ${row.fieldStatus.appliance === 'invalid' ? `<span class="errorTooltip">${row.errors.find(e => e.includes('电器')) || ''}</span>` : ''}
        </td>
        <td>${row.data.member || ''}</td>
        <td class="${row.fieldStatus.slot}">${row.data.slot || ''}
          ${row.fieldStatus.slot === 'invalid' ? `<span class="errorTooltip">${row.errors.find(e => e.includes('时段')) || ''}</span>` : ''}
        </td>
        <td class="${row.fieldStatus.hours}">${row.data.hours !== undefined && row.data.hours !== null ? row.data.hours : ''}
          ${row.fieldStatus.hours !== 'valid' ? `<span class="errorTooltip">${row.errors.find(e => e.includes('时长')) || row.warnings.find(e => e.includes('时长')) || ''}</span>` : ''}
        </td>
        <td class="${row.fieldStatus.watts}">${row.data.watts !== undefined && row.data.watts !== null ? row.data.watts : ''}
          ${row.fieldStatus.watts !== 'valid' ? `<span class="errorTooltip">${row.errors.find(e => e.includes('功率')) || row.warnings.find(e => e.includes('功率')) || ''}</span>` : ''}
        </td>
        <td>${row.data.note || ''}</td>
        <td>
          <span class="statusBadge ${statusClass}">${statusText}</span>
          ${allErrors ? `<span class="errorTooltip">${allErrors}</span>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  csvPreviewContainer.style.display = 'block';
  csvDropZone.style.display = 'none';
}

function handleCsvFile(file) {
  if (!file.name.endsWith('.csv')) {
    alert('请选择CSV格式的文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const rows = parseCsv(text);
      if (rows.length < 2) {
        alert('CSV文件内容为空或格式不正确');
        return;
      }

      const headers = mapHeaders(rows[0]);
      if (!headers.includes('date') || !headers.includes('appliance') || !headers.includes('slot')) {
        alert('CSV表头不匹配，请确保包含：日期、电器、时段、使用时长、功率等字段');
        return;
      }

      const validated = rows.slice(1).map((row, i) => validateRow(row, i, headers));
      parsedCsvData = validated;
      renderCsvPreview(validated);
    } catch (err) {
      alert('解析CSV文件失败：' + err.message);
    }
  };
  reader.readAsText(file, 'UTF-8');
}

csvFileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleCsvFile(e.target.files[0]);
});

csvUploadBtn.addEventListener('click', () => csvFileInput.click());

csvDropZone.addEventListener('click', () => csvFileInput.click());

['dragenter', 'dragover'].forEach(eventName => {
  csvDropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    csvDropZone.classList.add('dragOver');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  csvDropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    csvDropZone.classList.remove('dragOver');
  });
});

csvDropZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleCsvFile(file);
});

cancelCsvBtn.addEventListener('click', () => {
  parsedCsvData = [];
  csvPreviewContainer.style.display = 'none';
  csvDropZone.style.display = 'block';
  csvFileInput.value = '';
});

confirmCsvBtn.addEventListener('click', () => {
  if (!parsedCsvData.length) return;

  const validRows = parsedCsvData.filter(r => r.isValid);
  if (validRows.length === 0) {
    alert('没有可导入的有效记录');
    return;
  }

  const newRecords = validRows.map(r => ({
    id: crypto.randomUUID(),
    date: r.data.date,
    appliance: r.data.appliance,
    member: r.data.member || '',
    slot: r.data.slot,
    hours: r.data.hours,
    watts: r.data.watts,
    note: r.data.note || ''
  }));

  const beforeTotal = getCurrentMonthTotal();
  records = [...newRecords, ...records];
  const afterTotal = getCurrentMonthTotal();

  if (beforeTotal > goalSettings?.target && afterTotal <= goalSettings?.target) {
    lastNotifiedOverTarget = false;
  }

  save();
  render();

  const invalidCount = parsedCsvData.length - validRows.length;
  if (invalidCount > 0) {
    alert(`成功导入 ${validRows.length} 条记录\n${invalidCount} 条无效记录已跳过`);
  } else {
    alert(`成功导入 ${validRows.length} 条记录`);
  }

  parsedCsvData = [];
  csvPreviewContainer.style.display = 'none';
  csvDropZone.style.display = 'block';
  csvFileInput.value = '';
});

downloadTemplateBtn.addEventListener('click', () => {
  const template = '日期,电器,成员,时段,使用时长,功率,备注\n2026-06-09,空调,爸爸,晚间,5.5,900,睡前开启\n2026-06-09,电热水器,妈妈,傍晚,1.2,1800,洗澡前加热\n';
  const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '用电记录模板.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

function showToast(type, title, message, duration = 4000) {
  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '🚨',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toastIcon">${icons[type] || icons.info}</span>
    <div class="toastContent">
      <p class="toastTitle">${title}</p>
      <p class="toastMessage">${message}</p>
    </div>
    <button class="toastClose" aria-label="关闭">×</button>
  `;

  toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector('.toastClose');
  closeBtn.addEventListener('click', () => hideToast(toast));

  if (duration > 0) {
    setTimeout(() => hideToast(toast), duration);
  }

  return toast;
}

function hideToast(toast) {
  if (!toast || toast.classList.contains('hiding')) return;
  toast.classList.add('hiding');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

function getCurrentMonthTotal() {
  const currentMonth = goalSettings ? goalSettings.month : new Date().toISOString().slice(0, 7);
  const monthlyRecords = records.filter((record) => record.date.startsWith(currentMonth));
  return monthlyRecords.reduce((sum, record) => sum + kwh(record), 0);
}

function checkAndNotifyGoal() {
  if (!goalSettings) return;

  const currentTotal = getCurrentMonthTotal();
  const target = goalSettings.target;
  const isOverTarget = target <= 0 || currentTotal > target;
  const isNearTarget = target > 0 && currentTotal >= target * 0.9 && currentTotal <= target;

  if (isOverTarget && !lastNotifiedOverTarget) {
    const overAmount = (currentTotal - target).toFixed(2);
    showToast(
      'error',
      '⚠️ 节能目标已超标！',
      `本月已耗电 ${currentTotal.toFixed(2)} kWh，超出目标 ${overAmount} kWh。请节约用电！`,
      6000
    );
    lastNotifiedOverTarget = true;
  } else if (isNearTarget && !lastNotifiedOverTarget) {
    const remaining = (target - currentTotal).toFixed(2);
    showToast(
      'warning',
      '⚡ 接近节能目标',
      `本月已耗电 ${currentTotal.toFixed(2)} kWh，剩余额度 ${remaining} kWh。请注意控制用电！`,
      5000
    );
  }
}

function renderEnergyGoal() {
  const currentTotal = getCurrentMonthTotal();
  const goalCurrentEl = document.querySelector('#goalCurrent');
  const goalTargetEl = document.querySelector('#goalTarget');
  const goalRemainingEl = document.querySelector('#goalRemaining');
  const goalProgressFill = document.querySelector('#goalProgressFill');
  const goalPercentEl = document.querySelector('#goalPercent');
  const goalHintEl = document.querySelector('#goalHint');
  const progressLabels = document.querySelector('.progressLabels');
  const goalStats = document.querySelectorAll('.goalStat');

  goalCurrentEl.textContent = `${currentTotal.toFixed(2)} kWh`;

  if (!goalSettings) {
    goalTargetEl.textContent = '-- kWh';
    goalRemainingEl.textContent = '-- kWh';
    goalProgressFill.style.width = '0%';
    goalProgressFill.className = 'progressFill';
    goalPercentEl.textContent = '0%';
    goalHintEl.textContent = '请先设置本月节能目标';
    progressLabels.className = 'progressLabels';
    goalStats.forEach(stat => stat.className = 'goalStat');
    return;
  }

  const target = goalSettings.target;
  const remaining = target - currentTotal;
  const percent = target > 0 ? Math.min((currentTotal / target) * 100, 100) : (currentTotal > 0 ? 100 : 0);
  const isOverTarget = target <= 0 || currentTotal > target;
  const isNearTarget = target > 0 && currentTotal >= target * 0.9 && !isOverTarget;

  goalTargetEl.textContent = `${target.toFixed(2)} kWh`;
  goalRemainingEl.textContent = `${remaining.toFixed(2)} kWh`;
  goalPercentEl.textContent = `${percent.toFixed(1)}%`;

  goalProgressFill.style.width = `${Math.min(percent, 100)}%`;
  goalProgressFill.className = 'progressFill';
  progressLabels.className = 'progressLabels';

  goalStats.forEach((stat, index) => {
    stat.className = 'goalStat';
    if (index === 2 && remaining < 0) {
      stat.classList.add('overTarget');
    } else if (index === 2 && target > 0 && remaining < target * 0.1 && remaining >= 0) {
      stat.classList.add('warning');
    }
  });

  if (isOverTarget) {
    goalProgressFill.classList.add('overTarget');
    progressLabels.classList.add('overTarget');
    goalHintEl.textContent = `已超出目标 ${Math.abs(remaining).toFixed(2)} kWh，请注意节约用电！`;
  } else if (isNearTarget) {
    goalProgressFill.classList.add('warning');
    progressLabels.classList.add('warning');
    goalHintEl.textContent = `即将达到目标，剩余 ${remaining.toFixed(2)} kWh`;
  } else {
    goalHintEl.textContent = `目标月份：${goalSettings.month}`;
  }
}

function save() {
  localStorage.setItem(key, JSON.stringify(records));
  localStorage.setItem(applianceKey, JSON.stringify(appliances));
  localStorage.setItem(memberKey, JSON.stringify(members));
}

function kwh(record) {
  return record.hours * record.watts / 1000;
}

function getDaysInMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function renderMonthly() {
  const { price, month } = priceSettings;
  const monthlyRecords = records.filter((record) => record.date.startsWith(month));
  const monthlyTotal = monthlyRecords.reduce((sum, record) => sum + kwh(record), 0);
  const estimatedCost = monthlyTotal * price;
  const daysInMonth = getDaysInMonth(month);
  const dailyAverage = estimatedCost / daysInMonth;
  const daysWithData = [...new Set(monthlyRecords.map((r) => r.date))].length;

  document.querySelector('#monthlySummary').innerHTML = [
    ['当月总耗电', `${monthlyTotal.toFixed(2)}kWh`],
    ['预计电费', `¥${estimatedCost.toFixed(2)}`],
    ['日均费用', `¥${dailyAverage.toFixed(2)}`],
    ['活跃天数', `${daysWithData}/${daysInMonth}天`]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');

  drawBars('#monthlyChart', groupSum(monthlyRecords, 'date').sort((a, b) => a.label.localeCompare(b.label)), 'kWh');
}

function renderApplianceSelect() {
  applianceSelect.innerHTML = '<option value="">选择已有电器（可选）</option>' +
    appliances.map((a) => `<option value="${a.id}">${a.name} (${a.watts}W)</option>`).join('');
}

function renderAppliances() {
  document.querySelector('#applianceRows').innerHTML = appliances.map((a) => `
    <tr>
      <td>${a.name}</td>
      <td>${a.watts}W</td>
      <td>${a.slot}</td>
      <td>${a.note || ''}</td>
      <td>
        <button data-edit-appliance="${a.id}">编辑</button>
        <button data-del-appliance="${a.id}">删除</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-del-appliance]').forEach((button) => button.addEventListener('click', () => {
    appliances = appliances.filter((a) => a.id !== button.dataset.delAppliance);
    save();
    render();
  }));

  document.querySelectorAll('[data-edit-appliance]').forEach((button) => button.addEventListener('click', () => {
    const appliance = appliances.find((a) => a.id === button.dataset.editAppliance);
    editingApplianceId = appliance.id;
    Object.entries(appliance).forEach(([name, value]) => {
      if (applianceForm.elements[name]) applianceForm.elements[name].value = value;
    });
    applianceFormContainer.style.display = 'block';
  }));
}

function renderMemberSelect() {
  const memberOptions = members.map((m) => `<option value="${m.name}">${m.name}</option>`).join('');
  memberSelect.innerHTML = '<option value="">使用成员（可选）</option>' + memberOptions;
  batchMemberSelect.innerHTML = '<option value="">选择分配成员</option>' + memberOptions;
}

function renderMembers() {
  document.querySelector('#memberRows').innerHTML = members.map((m) => `
    <tr>
      <td>${m.name}</td>
      <td>${m.note || ''}</td>
      <td>
        <button data-edit-member="${m.id}">编辑</button>
        <button data-del-member="${m.id}">删除</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-del-member]').forEach((button) => button.addEventListener('click', () => {
    const memberToDelete = members.find((m) => m.id === button.dataset.delMember);
    records = records.map(record => {
      if (record.member === memberToDelete.name) {
        return { ...record, member: '' };
      }
      return record;
    });
    members = members.filter((m) => m.id !== button.dataset.delMember);
    save();
    render();
  }));

  document.querySelectorAll('[data-edit-member]').forEach((button) => button.addEventListener('click', () => {
    const member = members.find((m) => m.id === button.dataset.editMember);
    editingMemberId = member.id;
    editingMemberOldName = member.name;
    Object.entries(member).forEach(([name, value]) => {
      if (memberForm.elements[name]) memberForm.elements[name].value = value;
    });
    memberFormContainer.style.display = 'block';
  }));
}

function getMemberStats() {
  const stats = new Map();
  const allMemberNames = [...members.map(m => m.name), UNASSIGNED_LABEL];

  allMemberNames.forEach(name => {
    stats.set(name, {
      name,
      totalKwh: 0,
      totalCost: 0,
      recordCount: 0,
      appliances: new Map()
    });
  });

  records.forEach(record => {
    const memberName = getMemberName(record);
    const memberStat = stats.get(memberName) || stats.get(UNASSIGNED_LABEL);
    const kwhValue = kwh(record);
    const cost = kwhValue * priceSettings.price;

    memberStat.totalKwh += kwhValue;
    memberStat.totalCost += cost;
    memberStat.recordCount += 1;

    const applianceCount = memberStat.appliances.get(record.appliance) || { count: 0, kwh: 0 };
    applianceCount.count += 1;
    applianceCount.kwh += kwhValue;
    memberStat.appliances.set(record.appliance, applianceCount);
  });

  const totalAllKwh = records.reduce((sum, record) => sum + kwh(record), 0);

  return [...stats.values()]
    .filter(s => s.recordCount > 0)
    .map(s => ({
      ...s,
      costPercent: totalAllKwh > 0 ? (s.totalKwh / totalAllKwh * 100) : 0,
      topAppliances: [...s.appliances.entries()]
        .sort((a, b) => b[1].kwh - a[1].kwh)
        .slice(0, 3)
        .map(([name, data]) => ({ name, count: data.count, kwh: data.kwh })),
      appliances: undefined
    }))
    .sort((a, b) => b.totalKwh - a.totalKwh);
}

function renderMemberStats() {
  const stats = getMemberStats();
  const container = document.querySelector('#memberStatsContainer');

  if (stats.length === 0) {
    container.innerHTML = '<p class="empty">暂无数据，请先添加用电记录</p>';
    return;
  }

  const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#be185d'];

  container.innerHTML = stats.map((stat, index) => {
    const color = colors[index % colors.length];
    const topAppliancesHtml = stat.topAppliances.length > 0
      ? stat.topAppliances.map(app =>
          `<span class="topAppliance">${app.name} (${app.count}次)</span>`
        ).join('')
      : '<span class="empty">暂无</span>';

    return `
      <div class="memberStatCard">
        <div class="memberStatHeader" style="border-left-color: ${color};">
          <div class="memberAvatar" style="background: ${color};">
            ${stat.name.charAt(0)}
          </div>
          <div class="memberInfo">
            <h3>${stat.name}</h3>
            <span class="memberRecordCount">${stat.recordCount} 条记录</span>
          </div>
        </div>
        <div class="memberStatBody">
          <div class="memberStatItem">
            <span class="statLabel">估算耗电</span>
            <span class="statValue">${stat.totalKwh.toFixed(2)} kWh</span>
          </div>
          <div class="memberStatItem">
            <span class="statLabel">电费占比</span>
            <span class="statValue">${stat.costPercent.toFixed(1)}%</span>
          </div>
          <div class="memberStatItem">
            <span class="statLabel">估算费用</span>
            <span class="statValue">¥${stat.totalCost.toFixed(2)}</span>
          </div>
          <div class="memberStatItem fullWidth">
            <span class="statLabel">高频使用电器</span>
            <div class="topAppliances">
              ${topAppliancesHtml}
            </div>
          </div>
        </div>
        <div class="memberStatProgress">
          <div class="progressBarBg">
            <div class="progressBarFill" style="width: ${Math.min(stat.costPercent, 100)}%; background: ${color};"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function render() {
  const filtered = records.filter((record) => [record.appliance, record.note, record.slot, getMemberName(record)].join(' ').includes(search.value.trim()));
  const total = records.reduce((sum, record) => sum + kwh(record), 0);
  document.querySelector('#summary').innerHTML = [
    ['总估算耗电', `${total.toFixed(2)}kWh`],
    ['记录数', records.length],
    ['最高单次', `${Math.max(...records.map(kwh), 0).toFixed(2)}kWh`]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');
  drawBars('#dailyChart', groupSum(filtered, 'date'), 'kWh');
  drawDonut('#applianceChart', groupSum(filtered, 'appliance'));
  drawBars('#slotChart', groupSum(filtered, 'slot'), 'kWh');
  renderMonthly();
  renderApplianceSelect();
  renderMemberSelect();
  renderAppliances();
  renderMembers();
  renderMemberStats();
  renderEnergyGoal();
  checkAndNotifyGoal();

  selectedCountSpan.textContent = `已选 ${selectedRecordIds.length} 条`;
  const allSelected = filtered.length > 0 && filtered.every(r => selectedRecordIds.includes(r.id));
  selectAllCheckbox.checked = allSelected;

  document.querySelector('#rows').innerHTML = filtered.sort((a, b) => b.date.localeCompare(a.date)).map((record) => {
    const isChecked = selectedRecordIds.includes(record.id);
    const memberName = getMemberName(record);
    const memberLabel = memberName === UNASSIGNED_LABEL
      ? `<span class="unassignedMember">${UNASSIGNED_LABEL}</span>`
      : memberName;

    return `<tr>
      ${batchAssignMode ? `<td><input type="checkbox" class="recordCheckbox" data-id="${record.id}" ${isChecked ? 'checked' : ''} /></td>` : ''}
      <td>${record.date}</td>
      <td>${record.appliance}</td>
      <td>${memberLabel}</td>
      <td>${record.slot}</td>
      <td>${kwh(record).toFixed(2)}kWh</td>
      <td>${record.note || ''}</td>
      <td><button data-edit="${record.id}">编辑</button><button data-del="${record.id}">删除</button></td>
    </tr>`;
  }).join('');

  document.querySelectorAll('.recordCheckbox').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const recordId = e.target.dataset.id;
      if (e.target.checked) {
        if (!selectedRecordIds.includes(recordId)) {
          selectedRecordIds.push(recordId);
        }
      } else {
        selectedRecordIds = selectedRecordIds.filter(id => id !== recordId);
      }
      render();
    });
  });

  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => {
    const beforeTotal = getCurrentMonthTotal();
    records = records.filter((record) => record.id !== button.dataset.del);
    selectedRecordIds = selectedRecordIds.filter(id => id !== button.dataset.del);
    const afterTotal = getCurrentMonthTotal();
    if (beforeTotal > goalSettings?.target && afterTotal <= goalSettings?.target) {
      lastNotifiedOverTarget = false;
    }
    save();
    render();
  }));
  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
    const record = records.find((item) => item.id === button.dataset.edit);
    editingId = record.id;
    form.elements.applianceSelect.value = '';
    Object.entries(record).forEach(([name, value]) => {
      if (form.elements[name]) form.elements[name].value = value;
    });
  }));
}

function groupSum(data, field) {
  const map = new Map();
  data.forEach((record) => map.set(record[field], (map.get(record[field]) || 0) + kwh(record)));
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function drawBars(selector, data, unit) {
  const el = document.querySelector(selector);
  if (!data.length) return (el.innerHTML = '<p class="empty">暂无数据</p>');
  const max = Math.max(...data.map((item) => item.value), 1);
  el.innerHTML = `<svg viewBox="0 0 500 240">${data.slice(0, 6).map((item, index) => `<text x="22" y="${43 + index * 36}">${item.label}</text><rect x="150" y="${23 + index * 36}" width="${(item.value / max) * 300}" height="20" rx="4"/><text x="${160 + (item.value / max) * 300}" y="${39 + index * 36}">${item.value.toFixed(2)}${unit}</text>`).join('')}</svg>`;
}

function drawDonut(selector, data) {
  const el = document.querySelector(selector);
  if (!data.length) return (el.innerHTML = '<p class="empty">暂无数据</p>');
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 25;
  const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'];
  const rings = data.slice(0, 5).map((item, index) => {
    const len = (item.value / total) * 100;
    const node = `<circle cx="135" cy="105" r="68" fill="none" stroke="${colors[index]}" stroke-width="28" stroke-dasharray="${len} ${100 - len}" stroke-dashoffset="${offset}" pathLength="100"/>`;
    offset -= len;
    return node;
  }).join('');
  const legend = data.slice(0, 5).map((item, index) => `<rect x="260" y="${52 + index * 30}" width="14" height="14" fill="${colors[index]}"/><text x="285" y="${64 + index * 30}">${item.label} ${Math.round(item.value / total * 100)}%</text>`).join('');
  el.innerHTML = `<svg viewBox="0 0 500 220">${rings}<circle cx="135" cy="105" r="44" fill="white"/><text x="135" y="112">${total.toFixed(1)}kWh</text>${legend}</svg>`;
}

render();
