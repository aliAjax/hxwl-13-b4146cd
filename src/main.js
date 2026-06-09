import './styles.css';

const key = 'hxwl-13-home-energy';
const settingsKey = 'hxwl-13-price-settings';
const seed = [
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-04', slot: '晚间', hours: 5.5, watts: 900, note: '睡前开启' },
  { id: crypto.randomUUID(), appliance: '电热水器', date: '2026-06-04', slot: '傍晚', hours: 1.2, watts: 1800, note: '洗澡前加热' },
  { id: crypto.randomUUID(), appliance: '洗衣机', date: '2026-06-05', slot: '上午', hours: 1, watts: 420, note: '快洗模式' },
  { id: crypto.randomUUID(), appliance: '台式电脑', date: '2026-06-05', slot: '下午', hours: 4, watts: 260, note: '剪辑文件' },
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-06', slot: '午后', hours: 3.5, watts: 900, note: '客厅降温' }
];
const defaultSettings = { price: 0.56, month: new Date().toISOString().slice(0, 7) };

let records = JSON.parse(localStorage.getItem(key) || 'null') || seed;
let settings = JSON.parse(localStorage.getItem(settingsKey) || 'null') || defaultSettings;
let editingId = null;

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
        <input name="appliance" placeholder="电器" required />
        <input name="date" type="date" required />
        <select name="slot" required>
          <option value="">使用时段</option>
          <option>清晨</option><option>上午</option><option>午后</option><option>傍晚</option><option>晚间</option><option>深夜</option>
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

    <section class="cards">
      <div class="panel"><h2>电器耗电占比</h2><div class="chart small" id="applianceChart"></div></div>
      <div class="panel"><h2>高耗电时段</h2><div class="chart small" id="slotChart"></div></div>
    </section>

    <section class="panel">
      <div class="panelHead"><h2>记录列表</h2><input id="search" placeholder="搜索电器或备注" /></div>
      <div class="tableWrap"><table><thead><tr><th>日期</th><th>电器</th><th>时段</th><th>耗电</th><th>备注</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    </section>

    <section class="layout">
      <form id="priceForm" class="panel">
        <h2>月度电费估算</h2>
        <div class="pair">
          <div>
            <label>每度电单价（元）</label>
            <input name="price" type="number" min="0" step="0.01" placeholder="0.56" required />
          </div>
          <div>
            <label>统计月份</label>
            <input name="month" type="month" required />
          </div>
        </div>
        <button class="primary">更新设置</button>
      </form>

      <div>
        <section class="summary" id="priceSummary"></section>
        <section class="panel">
          <h2>每日电费估算</h2>
          <div class="chart" id="dailyPriceChart"></div>
        </section>
      </div>
    </section>
  </main>
`;

const form = document.querySelector('#form');
const search = document.querySelector('#search');
const priceForm = document.querySelector('#priceForm');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const item = { ...data, hours: Number(data.hours), watts: Number(data.watts), id: editingId || crypto.randomUUID() };
  records = editingId ? records.map((record) => (record.id === editingId ? item : record)) : [item, ...records];
  editingId = null;
  form.reset();
  save();
  render();
});
search.addEventListener('input', render);
document.querySelector('#sample').addEventListener('click', () => {
  records = seed;
  save();
  render();
});
priceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(priceForm).entries());
  settings = { price: Number(data.price), month: data.month };
  saveSettings();
  render();
});

function save() {
  localStorage.setItem(key, JSON.stringify(records));
}
function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function kwh(record) {
  return record.hours * record.watts / 1000;
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
  document.querySelector('#rows').innerHTML = filtered.sort((a, b) => b.date.localeCompare(a.date)).map((record) => `<tr><td>${record.date}</td><td>${record.appliance}</td><td>${record.slot}</td><td>${kwh(record).toFixed(2)}kWh</td><td>${record.note || ''}</td><td><button data-edit="${record.id}">编辑</button><button data-del="${record.id}">删除</button></td></tr>`).join('');
  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => {
    records = records.filter((record) => record.id !== button.dataset.del);
    save();
    render();
  }));
  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
    const record = records.find((item) => item.id === button.dataset.edit);
    editingId = record.id;
    Object.entries(record).forEach(([name, value]) => {
      if (form.elements[name]) form.elements[name].value = value;
    });
  }));

  priceForm.elements.price.value = settings.price;
  priceForm.elements.month.value = settings.month;
  const monthRecords = records.filter((record) => record.date.startsWith(settings.month));
  const monthKwh = monthRecords.reduce((sum, record) => sum + kwh(record), 0);
  const monthCost = monthKwh * settings.price;
  const [year, month] = settings.month.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyCost = monthCost / daysInMonth;
  document.querySelector('#priceSummary').innerHTML = [
    ['当月总耗电', `${monthKwh.toFixed(2)}kWh`],
    ['预计电费', `¥${monthCost.toFixed(2)}`],
    ['日均费用', `¥${dailyCost.toFixed(2)}`]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');
  const dailyPriceData = groupSum(monthRecords, 'date').map((item) => ({ label: item.label.slice(8), value: item.value * settings.price }));
  drawBars('#dailyPriceChart', dailyPriceData, '元');
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
