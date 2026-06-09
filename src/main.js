import './styles.css';

const key = 'hxwl-13-home-energy';
const priceKey = 'hxwl-13-home-energy-price';
const applianceKey = 'hxwl-13-home-energy-appliances';
const seed = [
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-04', slot: '晚间', hours: 5.5, watts: 900, note: '睡前开启' },
  { id: crypto.randomUUID(), appliance: '电热水器', date: '2026-06-04', slot: '傍晚', hours: 1.2, watts: 1800, note: '洗澡前加热' },
  { id: crypto.randomUUID(), appliance: '洗衣机', date: '2026-06-05', slot: '上午', hours: 1, watts: 420, note: '快洗模式' },
  { id: crypto.randomUUID(), appliance: '台式电脑', date: '2026-06-05', slot: '下午', hours: 4, watts: 260, note: '剪辑文件' },
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-06', slot: '午后', hours: 3.5, watts: 900, note: '客厅降温' }
];
const applianceSeed = [
  { id: crypto.randomUUID(), name: '空调', watts: 900, slot: '晚间', note: '卧室挂机' },
  { id: crypto.randomUUID(), name: '电热水器', watts: 1800, slot: '傍晚', note: '60L储水式' },
  { id: crypto.randomUUID(), name: '洗衣机', watts: 420, slot: '上午', note: '滚筒式' },
  { id: crypto.randomUUID(), name: '台式电脑', watts: 260, slot: '下午', note: '含显示器' },
  { id: crypto.randomUUID(), name: '冰箱', watts: 120, slot: '全天', note: '风冷无霜' },
  { id: crypto.randomUUID(), name: '微波炉', watts: 800, slot: '午间', note: '加热饭菜' }
];

let records = JSON.parse(localStorage.getItem(key) || 'null') || seed;
let appliances = JSON.parse(localStorage.getItem(applianceKey) || 'null') || applianceSeed;
let editingId = null;
let editingApplianceId = null;
let priceSettings = JSON.parse(localStorage.getItem(priceKey) || 'null') || { price: 0.56, month: new Date().toISOString().slice(0, 7) };

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="hero">
      <div>
        <p>hxwl-13 · port 5113</p>
        <h1>家庭用电习惯观察</h1>
      </div>
      <button id="sample">载入示例</button>
    </header>

    <section class="layout">
      <form id="form" class="panel">
        <h2>用电记录</h2>
        <select name="applianceSelect" id="applianceSelect">
          <option value="">选择已有电器（可选）</option>
        </select>
        <input name="appliance" placeholder="电器名称" required />
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
      <div class="panelHead"><h2>记录列表</h2><input id="search" placeholder="搜索电器或备注" /></div>
      <div class="tableWrap"><table><thead><tr><th>日期</th><th>电器</th><th>时段</th><th>耗电</th><th>备注</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    </section>
  </main>
`;

const form = document.querySelector('#form');
const search = document.querySelector('#search');
const priceForm = document.querySelector('#priceForm');
const applianceForm = document.querySelector('#applianceForm');
const applianceSelect = document.querySelector('#applianceSelect');
const applianceFormContainer = document.querySelector('#applianceFormContainer');
const addApplianceBtn = document.querySelector('#addApplianceBtn');
const cancelApplianceBtn = document.querySelector('#cancelApplianceBtn');

priceForm.elements.price.value = priceSettings.price;
priceForm.elements.month.value = priceSettings.month;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const item = { ...data, hours: Number(data.hours), watts: Number(data.watts), id: editingId || crypto.randomUUID() };
  delete item.applianceSelect;
  records = editingId ? records.map((record) => (record.id === editingId ? item : record)) : [item, ...records];
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

search.addEventListener('input', render);
document.querySelector('#sample').addEventListener('click', () => {
  records = seed;
  appliances = applianceSeed;
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

function save() {
  localStorage.setItem(key, JSON.stringify(records));
  localStorage.setItem(applianceKey, JSON.stringify(appliances));
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

function render() {
  const filtered = records.filter((record) => [record.appliance, record.note, record.slot].join(' ').includes(search.value.trim()));
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
  renderAppliances();
  document.querySelector('#rows').innerHTML = filtered.sort((a, b) => b.date.localeCompare(a.date)).map((record) => `<tr><td>${record.date}</td><td>${record.appliance}</td><td>${record.slot}</td><td>${kwh(record).toFixed(2)}kWh</td><td>${record.note || ''}</td><td><button data-edit="${record.id}">编辑</button><button data-del="${record.id}">删除</button></td></tr>`).join('');
  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => {
    records = records.filter((record) => record.id !== button.dataset.del);
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
