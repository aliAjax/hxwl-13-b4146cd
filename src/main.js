import './styles.css';
import {
  BACKUP_SCHEMA_VERSION,
  exportBackup,
  parseBackupFile,
  migrateBackup,
  analyzeDifferences,
  applyRestore,
  validateBackup,
  getCurrentData
} from './dataBackupService.js';

const key = 'hxwl-13-home-energy';
const priceKey = 'hxwl-13-home-energy-price';
const applianceKey = 'hxwl-13-home-energy-appliances';
const goalKey = 'hxwl-13-home-energy-goal';
const memberKey = 'hxwl-13-home-energy-members';
const tariffKey = 'hxwl-13-home-energy-tariffs';
const slotMappingKey = 'hxwl-13-home-energy-slot-mapping';
const anomalyIgnoreKey = 'hxwl-13-home-energy-anomaly-ignore';
const seed = [
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-01', slot: '晚间', hours: 4, watts: 900, note: '睡前开启', member: '爸爸' },
  { id: crypto.randomUUID(), appliance: '电热水器', date: '2026-06-01', slot: '傍晚', hours: 1.2, watts: 1800, note: '洗澡前加热', member: '妈妈' },
  { id: crypto.randomUUID(), appliance: '洗衣机', date: '2026-06-02', slot: '上午', hours: 1, watts: 420, note: '快洗模式', member: '妈妈' },
  { id: crypto.randomUUID(), appliance: '台式电脑', date: '2026-06-02', slot: '下午', hours: 3, watts: 260, note: '学习', member: '小明' },
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-03', slot: '晚间', hours: 4.5, watts: 900, note: '睡前开启', member: '爸爸' },
  { id: crypto.randomUUID(), appliance: '电热水器', date: '2026-06-03', slot: '傍晚', hours: 1, watts: 1800, note: '洗澡', member: '妈妈' },
  { id: crypto.randomUUID(), appliance: '冰箱', date: '2026-06-03', slot: '全天', hours: 24, watts: 120, note: '', member: '' },
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-04', slot: '晚间', hours: 12, watts: 900, note: '忘记关了', member: '爸爸' },
  { id: crypto.randomUUID(), appliance: '电热水器', date: '2026-06-04', slot: '傍晚', hours: 5, watts: 1800, note: '长时间加热', member: '妈妈' },
  { id: crypto.randomUUID(), appliance: '洗衣机', date: '2026-06-05', slot: '上午', hours: 1, watts: 420, note: '快洗模式', member: '妈妈' },
  { id: crypto.randomUUID(), appliance: '台式电脑', date: '2026-06-05', slot: '下午', hours: 8, watts: 260, note: '玩游戏', member: '小明' },
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-06', slot: '全天', hours: 20, watts: 900, note: '天气太热', member: '' },
  { id: crypto.randomUUID(), appliance: '微波炉', date: '2026-06-06', slot: '午间', hours: 0.5, watts: 800, note: '加热饭菜', member: '妈妈' },
  { id: crypto.randomUUID(), appliance: '冰箱', date: '2026-06-06', slot: '全天', hours: 24, watts: 120, note: '', member: '' },
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-07', slot: '全天', hours: 18, watts: 900, note: '天气太热', member: '' },
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-08', slot: '全天', hours: 22, watts: 900, note: '持续高温', member: '' },
  { id: crypto.randomUUID(), appliance: '空调', date: '2026-06-09', slot: '全天', hours: 24, watts: 900, note: '极端高温', member: '' },
  { id: crypto.randomUUID(), appliance: '电热水器', date: '2026-06-09', slot: '全天', hours: 10, watts: 1800, note: '忘记关闭', member: '妈妈' }
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

const tariffSeed = [
  {
    id: crypto.randomUUID(),
    name: '居民阶梯电价',
    peakPrice: 0.82,
    flatPrice: 0.56,
    valleyPrice: 0.28,
    peakHours: ['10:00-12:00', '19:00-21:00'],
    flatHours: ['08:00-10:00', '12:00-19:00', '21:00-23:00'],
    valleyHours: ['00:00-08:00', '23:00-24:00'],
    isDefault: true
  },
  {
    id: crypto.randomUUID(),
    name: '工商业分时电价',
    peakPrice: 1.25,
    flatPrice: 0.78,
    valleyPrice: 0.35,
    peakHours: ['09:00-12:00', '18:00-21:00'],
    flatHours: ['08:00-09:00', '12:00-18:00', '21:00-22:00'],
    valleyHours: ['00:00-08:00', '22:00-24:00'],
    isDefault: false
  }
];

const slotMappingSeed = {
  '清晨': 'valley',
  '上午': 'flat',
  '午间': 'peak',
  '下午': 'flat',
  '午后': 'flat',
  '傍晚': 'peak',
  '晚间': 'peak',
  '深夜': 'valley',
  '全天': 'flat'
};
const slotOrder = ['清晨', '上午', '午间', '下午', '午后', '傍晚', '晚间', '深夜', '全天'];

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
let tariffs = JSON.parse(localStorage.getItem(tariffKey) || 'null') || tariffSeed;
let slotMapping = JSON.parse(localStorage.getItem(slotMappingKey) || 'null') || slotMappingSeed;
let editingTariffId = null;
let selectedTariffIds = [];
let showTariffForm = false;
let showMappingConfig = false;
let ignoredAnomalies = JSON.parse(localStorage.getItem(anomalyIgnoreKey) || '[]');
let showIgnoredAnomalies = false;

let backupRestoreState = {
  step: 'welcome',
  parsedBackup: null,
  validatedBackup: null,
  migratedBackup: null,
  analysis: null,
  currentData: null,
  updateMode: 'update',
  selectedTab: 'backup'
};
let backupRestoreOptions = {
  includeRecords: true,
  includeAppliances: true,
  includeMembers: true,
  includePriceSettings: true,
  includeGoalSettings: true,
  includeTariffs: true,
  includeSlotMapping: true,
  includeIgnoredAnomalies: true
};

document.querySelector('#app').innerHTML = `
  <div id="toastContainer" class="toastContainer"></div>
  <main class="shell">
    <header class="hero">
      <div>
        <p>hxwl-13 · port 5113</p>
        <h1>家庭用电习惯观察</h1>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
        <button id="backupRestoreBtn">💾 数据备份与恢复</button>
        <button id="sample">载入示例</button>
      </div>
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

    <section class="panel" id="anomalyAlertSection">
      <div class="panelHead">
        <h2>⚠️ 异常用电提醒</h2>
        <div class="anomalyActions">
          <button id="toggleIgnoredBtn" class="primary">显示已忽略</button>
          <button id="clearIgnoredBtn" style="background:#fee2e2; color:#dc2626;">清除忽略记录</button>
        </div>
      </div>
      <div id="anomalyStats" class="anomalyStats"></div>
      <div id="anomalyListContainer" style="margin-top:16px;"></div>
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

    <section class="panel" id="tariffSimulatorSection">
      <div class="panelHead">
        <h2>⚡ 分时电价模拟器</h2>
        <div class="tariffActions">
          <button id="toggleMappingConfigBtn" class="primary">时段映射配置</button>
          <button id="addTariffBtn" class="primary">新增电价方案</button>
        </div>
      </div>

      <div id="mappingConfigContainer" style="display:none; margin-top:16px;">
        <div class="panelHead" style="margin-bottom:12px;">
          <h3 style="margin:0;">时段映射规则</h3>
          <button id="closeMappingConfigBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:8px 16px;">关闭</button>
        </div>
        <p class="tariffHint">将现有记录时段映射到电价时段（峰/平/谷），用于费用计算</p>
        <div class="mappingGrid" id="mappingGrid"></div>
        <div style="margin-top:12px; display:flex; gap:12px; justify-content:flex-end;">
          <button id="resetMappingBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:10px 20px;">重置默认</button>
          <button id="saveMappingBtn" class="primary">保存映射</button>
        </div>
      </div>

      <div id="tariffFormContainer" style="display:none; margin-top:16px;">
        <form id="tariffForm" class="tariffForm">
          <h3 id="tariffFormTitle">新增电价方案</h3>
          <div class="tariffFormRow">
            <label>
              <span>方案名称</span>
              <input name="name" type="text" placeholder="例如：居民分时电价" required />
            </label>
            <label style="display:flex; align-items:center; gap:8px;">
              <input name="isDefault" type="checkbox" />
              <span style="margin:0;">设为默认方案</span>
            </label>
          </div>
          <div class="tariffPriceRow">
            <label class="tariffPriceInput peak">
              <span>峰时段电价 (元/kWh)</span>
              <input name="peakPrice" type="number" min="0" step="0.01" placeholder="0.82" required />
            </label>
            <label class="tariffPriceInput flat">
              <span>平时段电价 (元/kWh)</span>
              <input name="flatPrice" type="number" min="0" step="0.01" placeholder="0.56" required />
            </label>
            <label class="tariffPriceInput valley">
              <span>谷时段电价 (元/kWh)</span>
              <input name="valleyPrice" type="number" min="0" step="0.01" placeholder="0.28" required />
            </label>
          </div>
          <div class="tariffHoursRow">
            <label class="tariffHoursInput peak">
              <span>峰时段 (HH:MM-HH:MM，多个用逗号分隔)</span>
              <input name="peakHours" type="text" placeholder="10:00-12:00,19:00-21:00" required />
            </label>
            <label class="tariffHoursInput flat">
              <span>平时段 (HH:MM-HH:MM，多个用逗号分隔)</span>
              <input name="flatHours" type="text" placeholder="08:00-10:00,12:00-19:00" required />
            </label>
            <label class="tariffHoursInput valley">
              <span>谷时段 (HH:MM-HH:MM，多个用逗号分隔)</span>
              <input name="valleyHours" type="text" placeholder="00:00-08:00,23:00-24:00" required />
            </label>
          </div>
          <div class="tariffFormRow" style="justify-content:flex-end;">
            <button type="button" id="cancelTariffBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:11px 24px;">取消</button>
            <button type="submit" class="primary">保存方案</button>
          </div>
        </form>
      </div>

      <div id="tariffListContainer" style="margin-top:16px;">
        <div class="tariffList" id="tariffList"></div>
      </div>

      <div id="tariffComparisonSection" style="margin-top:24px;">
        <div class="panelHead" style="margin-bottom:12px;">
          <h3 style="margin:0;">📊 多方案费用对比</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <label style="font-size:13px; color:#5c6982;">对比月份：</label>
            <select id="comparisonMonth" style="width:auto; padding:8px 12px;">
            </select>
          </div>
        </div>
        <div id="tariffComparisonContainer"></div>
      </div>

      <div id="tariffDetailSection" style="margin-top:24px;">
        <div class="panelHead" style="margin-bottom:12px;">
          <h3 style="margin:0;">📋 记录明细费用</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <label style="font-size:13px; color:#5c6982;">电价方案：</label>
            <select id="detailTariffSelect" style="width:auto; padding:8px 12px;">
            </select>
          </div>
        </div>
        <div class="tableWrap"><table class="tariffDetailTable">
          <thead>
            <tr>
              <th>日期</th>
              <th>电器</th>
              <th>时段</th>
              <th>映射时段</th>
              <th>耗电</th>
              <th>电价</th>
              <th>费用</th>
            </tr>
          </thead>
          <tbody id="tariffDetailRows"></tbody>
        </table></div>
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

const tariffForm = document.querySelector('#tariffForm');
const tariffFormContainer = document.querySelector('#tariffFormContainer');
const tariffFormTitle = document.querySelector('#tariffFormTitle');
const addTariffBtn = document.querySelector('#addTariffBtn');
const cancelTariffBtn = document.querySelector('#cancelTariffBtn');
const toggleMappingConfigBtn = document.querySelector('#toggleMappingConfigBtn');
const closeMappingConfigBtn = document.querySelector('#closeMappingConfigBtn');
const mappingConfigContainer = document.querySelector('#mappingConfigContainer');
const saveMappingBtn = document.querySelector('#saveMappingBtn');
const resetMappingBtn = document.querySelector('#resetMappingBtn');
const comparisonMonthSelect = document.querySelector('#comparisonMonth');
const detailTariffSelect = document.querySelector('#detailTariffSelect');
const mappingGrid = document.querySelector('#mappingGrid');
const tariffList = document.querySelector('#tariffList');
const tariffComparisonContainer = document.querySelector('#tariffComparisonContainer');
const tariffDetailRows = document.querySelector('#tariffDetailRows');
const anomalyStats = document.querySelector('#anomalyStats');
const anomalyListContainer = document.querySelector('#anomalyListContainer');
const toggleIgnoredBtn = document.querySelector('#toggleIgnoredBtn');
const clearIgnoredBtn = document.querySelector('#clearIgnoredBtn');

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
  const filtered = records.filter((record) => [record.date, record.appliance, record.note, record.slot].join(' ').includes(search.value.trim()));
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

addTariffBtn.addEventListener('click', () => {
  editingTariffId = null;
  tariffForm.reset();
  tariffFormTitle.textContent = '新增电价方案';
  tariffFormContainer.style.display = 'block';
});

cancelTariffBtn.addEventListener('click', () => {
  editingTariffId = null;
  tariffForm.reset();
  tariffFormContainer.style.display = 'none';
});

tariffForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(tariffForm).entries());

  const peakHours = data.peakHours.split(',').map(h => h.trim()).filter(h => h);
  const flatHours = data.flatHours.split(',').map(h => h.trim()).filter(h => h);
  const valleyHours = data.valleyHours.split(',').map(h => h.trim()).filter(h => h);

  if (!validateTimeRanges(peakHours) || !validateTimeRanges(flatHours) || !validateTimeRanges(valleyHours)) {
    showToast('error', '时间格式错误', '请使用正确的时间格式，例如：10:00-12:00');
    return;
  }

  const item = {
    id: editingTariffId || crypto.randomUUID(),
    name: data.name,
    peakPrice: Number(data.peakPrice),
    flatPrice: Number(data.flatPrice),
    valleyPrice: Number(data.valleyPrice),
    peakHours,
    flatHours,
    valleyHours,
    isDefault: data.isDefault === 'on'
  };

  if (item.isDefault) {
    tariffs = tariffs.map(t => ({ ...t, isDefault: false }));
  }

  tariffs = editingTariffId
    ? tariffs.map((t) => (t.id === editingTariffId ? item : t))
    : [item, ...tariffs];

  editingTariffId = null;
  tariffForm.reset();
  tariffFormContainer.style.display = 'none';
  saveTariffData();
  render();
  showToast('success', '保存成功', `电价方案「${item.name}」已保存`);
});

toggleMappingConfigBtn.addEventListener('click', () => {
  showMappingConfig = !showMappingConfig;
  mappingConfigContainer.style.display = showMappingConfig ? 'block' : 'none';
  if (showMappingConfig) {
    renderMappingConfig();
  }
});

closeMappingConfigBtn.addEventListener('click', () => {
  showMappingConfig = false;
  mappingConfigContainer.style.display = 'none';
});

saveMappingBtn.addEventListener('click', () => {
  const selects = mappingGrid.querySelectorAll('select');
  const newMapping = {};
  selects.forEach(select => {
    newMapping[select.dataset.slot] = select.value;
  });
  slotMapping = newMapping;
  localStorage.setItem(slotMappingKey, JSON.stringify(slotMapping));
  saveMapping();
  render();
  showToast('success', '保存成功', '时段映射规则已保存');
});

resetMappingBtn.addEventListener('click', () => {
  if (confirm('确定要重置为默认映射规则吗？')) {
    slotMapping = { ...slotMappingSeed };
    localStorage.setItem(slotMappingKey, JSON.stringify(slotMapping));
    renderMappingConfig();
    render();
    showToast('success', '重置成功', '已恢复默认时段映射规则');
  }
});

comparisonMonthSelect.addEventListener('change', renderTariffComparison);
detailTariffSelect.addEventListener('change', renderTariffDetail);

toggleIgnoredBtn.addEventListener('click', () => {
  showIgnoredAnomalies = !showIgnoredAnomalies;
  toggleIgnoredBtn.textContent = showIgnoredAnomalies ? '隐藏已忽略' : '显示已忽略';
  toggleIgnoredBtn.style.background = showIgnoredAnomalies ? '#64748b' : '';
  renderAnomalyAlerts();
});

clearIgnoredBtn.addEventListener('click', () => {
  if (ignoredAnomalies.length === 0) {
    showToast('info', '提示', '没有已忽略的异常记录');
    return;
  }
  if (confirm('确定要清除所有已忽略的异常记录吗？')) {
    ignoredAnomalies = [];
    localStorage.setItem(anomalyIgnoreKey, JSON.stringify(ignoredAnomalies));
    showToast('success', '已清除', '所有忽略记录已清除');
    render();
  }
});

function validateTimeRanges(ranges) {
  const timeRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
  return ranges.every(range => timeRegex.test(range));
}

function getAnomalyId(type, recordId, date) {
  return `${type}-${recordId || date}`;
}

function isAnomalyIgnored(anomalyId) {
  return ignoredAnomalies.includes(anomalyId);
}

function ignoreAnomaly(anomalyId) {
  if (!ignoredAnomalies.includes(anomalyId)) {
    ignoredAnomalies.push(anomalyId);
    localStorage.setItem(anomalyIgnoreKey, JSON.stringify(ignoredAnomalies));
  }
}

function unignoreAnomaly(anomalyId) {
  ignoredAnomalies = ignoredAnomalies.filter(id => id !== anomalyId);
  localStorage.setItem(anomalyIgnoreKey, JSON.stringify(ignoredAnomalies));
}

function detectHighSingleUsage() {
  const anomalies = [];
  const applianceRecords = new Map();

  records.forEach(record => {
    if (!applianceRecords.has(record.appliance)) {
      applianceRecords.set(record.appliance, []);
    }
    applianceRecords.get(record.appliance).push(record);
  });

  applianceRecords.forEach((applianceRecs, appliance) => {
    if (applianceRecs.length < 2) return;

    const kwhValues = applianceRecs.map(r => kwh(r)).sort((a, b) => a - b);
    const mean = kwhValues.reduce((a, b) => a + b, 0) / kwhValues.length;
    const variance = kwhValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / kwhValues.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 1.5 * stdDev;

    applianceRecs.forEach(record => {
      const recordKwh = kwh(record);
      if (recordKwh > threshold && recordKwh > mean * 1.3) {
        const anomalyId = getAnomalyId('high-single', record.id);
        if (!showIgnoredAnomalies && isAnomalyIgnored(anomalyId)) return;

        anomalies.push({
          id: anomalyId,
          type: 'high-single',
          typeLabel: '单次耗电偏高',
          severity: recordKwh > mean * 2 ? 'high' : 'medium',
          record,
          recordId: record.id,
          date: record.date,
          appliance: record.appliance,
          message: `${record.appliance} 单次耗电 ${recordKwh.toFixed(2)}kWh，超出平均值 ${((recordKwh / mean - 1) * 100).toFixed(0)}%`,
          details: `该电器历史平均耗电：${mean.toFixed(2)}kWh，异常阈值：${threshold.toFixed(2)}kWh`,
          ignored: isAnomalyIgnored(anomalyId)
        });
      }
    });
  });

  return anomalies;
}

function detectDailySpike() {
  const anomalies = [];
  const dailyTotals = new Map();

  records.forEach(record => {
    const current = dailyTotals.get(record.date) || 0;
    dailyTotals.set(record.date, current + kwh(record));
  });

  const totals = Array.from(dailyTotals.values()).sort((a, b) => a - b);
  if (totals.length < 2) return anomalies;

  const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
  const variance = totals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totals.length;
  const stdDev = Math.sqrt(variance);
  const threshold = mean + 1.5 * stdDev;

  dailyTotals.forEach((total, date) => {
    if (total > threshold && total > mean * 1.3) {
      const dayRecords = records.filter(r => r.date === date);
      const anomalyId = getAnomalyId('daily-spike', null, date);
      if (!showIgnoredAnomalies && isAnomalyIgnored(anomalyId)) return;

      anomalies.push({
        id: anomalyId,
        type: 'daily-spike',
        typeLabel: '日耗电突增',
        severity: total > mean * 2 ? 'high' : 'medium',
        date,
        recordIds: dayRecords.map(r => r.id),
        message: `${date} 总耗电 ${total.toFixed(2)}kWh，超出日均 ${((total / mean - 1) * 100).toFixed(0)}%`,
        details: `历史日均耗电：${mean.toFixed(2)}kWh，异常阈值：${threshold.toFixed(2)}kWh，当日记录：${dayRecords.length}条`,
        ignored: isAnomalyIgnored(anomalyId)
      });
    }
  });

  return anomalies;
}

function detectAbnormalDuration() {
  const anomalies = [];
  const applianceRecords = new Map();

  records.forEach(record => {
    if (!applianceRecords.has(record.appliance)) {
      applianceRecords.set(record.appliance, []);
    }
    applianceRecords.get(record.appliance).push(record);
  });

  applianceRecords.forEach((applianceRecs, appliance) => {
    if (applianceRecs.length < 2) return;

    const hoursValues = applianceRecs.map(r => r.hours).sort((a, b) => a - b);
    const mean = hoursValues.reduce((a, b) => a + b, 0) / hoursValues.length;
    const variance = hoursValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / hoursValues.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 1.5 * stdDev;

    applianceRecs.forEach(record => {
      if (record.hours > threshold && record.hours > mean * 1.3) {
        const anomalyId = getAnomalyId('duration', record.id);
        if (!showIgnoredAnomalies && isAnomalyIgnored(anomalyId)) return;

        anomalies.push({
          id: anomalyId,
          type: 'duration',
          typeLabel: '使用时长异常',
          severity: record.hours > mean * 2 ? 'high' : 'medium',
          record,
          recordId: record.id,
          date: record.date,
          appliance: record.appliance,
          message: `${record.appliance} 使用时长 ${record.hours.toFixed(1)}小时，超出平均值 ${((record.hours / mean - 1) * 100).toFixed(0)}%`,
          details: `该电器历史平均时长：${mean.toFixed(1)}小时，异常阈值：${threshold.toFixed(1)}小时`,
          ignored: isAnomalyIgnored(anomalyId)
        });
      }
    });
  });

  return anomalies;
}

function getAllAnomalies() {
  return [
    ...detectHighSingleUsage(),
    ...detectDailySpike(),
    ...detectAbnormalDuration()
  ].sort((a, b) => {
    if (a.severity === 'high' && b.severity !== 'high') return -1;
    if (b.severity === 'high' && a.severity !== 'high') return 1;
    return b.date.localeCompare(a.date);
  });
}

function locateToRecord(recordId) {
  const row = document.querySelector(`#rows tr[data-record-id="${recordId}"]`);
  if (row) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('highlight-row');
    setTimeout(() => row.classList.remove('highlight-row'), 3000);
  } else {
    const searchInput = document.querySelector('#search');
    const record = records.find(r => r.id === recordId);
    if (record) {
      searchInput.value = record.appliance;
      render();
      setTimeout(() => {
        const newRow = document.querySelector(`#rows tr[data-record-id="${recordId}"]`);
        if (newRow) {
          newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          newRow.classList.add('highlight-row');
          setTimeout(() => newRow.classList.remove('highlight-row'), 3000);
        }
      }, 100);
    }
  }
}

function renderAnomalyAlerts() {
  const anomalies = getAllAnomalies();
  const highCount = anomalies.filter(a => a.severity === 'high' && !a.ignored).length;
  const mediumCount = anomalies.filter(a => a.severity === 'medium' && !a.ignored).length;
  const ignoredCount = anomalies.filter(a => a.ignored).length;
  const activeCount = anomalies.filter(a => !a.ignored).length;

  anomalyStats.innerHTML = `
    <span class="anomalyStat high">
      <span class="anomalyDot"></span>
      <strong>${highCount}</strong>
      <span>高危异常</span>
    </span>
    <span class="anomalyStat medium">
      <span class="anomalyDot"></span>
      <strong>${mediumCount}</strong>
      <span>中等异常</span>
    </span>
    <span class="anomalyStat active">
      <strong>${activeCount}</strong>
      <span>待处理</span>
    </span>
    <span class="anomalyStat ignored">
      <strong>${ignoredCount}</strong>
      <span>已忽略</span>
    </span>
  `;

  if (anomalies.length === 0) {
    anomalyListContainer.innerHTML = `
      <div class="anomalyEmpty">
        <span class="anomalyEmptyIcon">✅</span>
        <p>暂无异常用电记录</p>
        <span class="anomalyEmptyHint">系统会持续监控用电数据，发现异常将在此处提醒</span>
      </div>
    `;
    return;
  }

  if (!showIgnoredAnomalies && activeCount === 0) {
    anomalyListContainer.innerHTML = `
      <div class="anomalyEmpty">
        <span class="anomalyEmptyIcon">📋</span>
        <p>所有异常已处理</p>
        <span class="anomalyEmptyHint">点击「显示已忽略」查看已忽略的异常记录</span>
      </div>
    `;
    return;
  }

  anomalyListContainer.innerHTML = anomalies.map(anomaly => {
    const severityClass = anomaly.severity === 'high' ? 'high' : 'medium';
    const typeIcon = anomaly.type === 'high-single' ? '⚡' : anomaly.type === 'daily-spike' ? '📈' : '⏰';
    const ignoreText = anomaly.ignored ? '取消忽略' : '忽略';
    const locateText = anomaly.type === 'daily-spike' ? '查看当日记录' : '定位记录';

    return `
      <div class="anomalyCard ${severityClass} ${anomaly.ignored ? 'ignored' : ''}" data-anomaly-id="${anomaly.id}">
        <div class="anomalyCardHeader">
          <div class="anomalyType">
            <span class="anomalyIcon">${typeIcon}</span>
            <span class="anomalyTypeLabel">${anomaly.typeLabel}</span>
            <span class="anomalySeverity ${severityClass}">${anomaly.severity === 'high' ? '高危' : '中等'}</span>
          </div>
          <span class="anomalyDate">${anomaly.date}</span>
        </div>
        <div class="anomalyCardBody">
          <p class="anomalyMessage">${anomaly.message}</p>
          <p class="anomalyDetails">${anomaly.details}</p>
        </div>
        <div class="anomalyCardActions">
          <button class="anomalyBtn locate" data-locate="${anomaly.recordId || ''}" data-date="${anomaly.date || ''}" data-type="${anomaly.type}">
            ${locateText}
          </button>
          <button class="anomalyBtn ignore" data-ignore="${anomaly.id}" data-ignored="${anomaly.ignored}">
            ${ignoreText}
          </button>
        </div>
      </div>
    `;
  }).join('');

  anomalyListContainer.querySelectorAll('[data-locate]').forEach(btn => {
    btn.addEventListener('click', () => {
      const recordId = btn.dataset.locate;
      const date = btn.dataset.date;
      const type = btn.dataset.type;

      if (type === 'daily-spike') {
        const searchInput = document.querySelector('#search');
        searchInput.value = date;
        render();
        setTimeout(() => {
          const firstRow = document.querySelector('#rows tr[data-record-id]');
          if (firstRow) {
            firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstRow.classList.add('highlight-row');
            setTimeout(() => firstRow.classList.remove('highlight-row'), 3000);
          }
        }, 100);
        showToast('info', '已筛选', `已筛选 ${date} 的所有用电记录`);
      } else if (recordId) {
        locateToRecord(recordId);
      }
    });
  });

  anomalyListContainer.querySelectorAll('[data-ignore]').forEach(btn => {
    btn.addEventListener('click', () => {
      const anomalyId = btn.dataset.ignore;
      const isIgnored = btn.dataset.ignored === 'true';

      if (isIgnored) {
        unignoreAnomaly(anomalyId);
        showToast('success', '已取消忽略', '该异常提醒已恢复显示');
      } else {
        ignoreAnomaly(anomalyId);
        showToast('success', '已忽略', '刷新页面后该异常将不再显示');
      }
      renderAnomalyAlerts();
    });
  });
}

function getSlotTier(slot) {
  return slotMapping[slot] || slotMappingSeed[slot] || 'flat';
}

function getTierPrice(tariff, tier) {
  switch (tier) {
    case 'peak': return tariff.peakPrice;
    case 'valley': return tariff.valleyPrice;
    default: return tariff.flatPrice;
  }
}

function getTierName(tier) {
  switch (tier) {
    case 'peak': return '峰';
    case 'valley': return '谷';
    default: return '平';
  }
}

function getTierColor(tier) {
  switch (tier) {
    case 'peak': return '#dc2626';
    case 'valley': return '#16a34a';
    default: return '#2563eb';
  }
}

function calculateRecordCost(record, tariff) {
  const kwhValue = kwh(record);
  const tier = getSlotTier(record.slot);
  const price = getTierPrice(tariff, tier);
  return {
    kwh: kwhValue,
    tier,
    price,
    cost: kwhValue * price
  };
}

function calculateMonthCost(monthRecords, tariff) {
  let peakKwh = 0, flatKwh = 0, valleyKwh = 0;
  let peakCost = 0, flatCost = 0, valleyCost = 0;

  monthRecords.forEach(record => {
    const result = calculateRecordCost(record, tariff);
    switch (result.tier) {
      case 'peak':
        peakKwh += result.kwh;
        peakCost += result.cost;
        break;
      case 'valley':
        valleyKwh += result.kwh;
        valleyCost += result.cost;
        break;
      default:
        flatKwh += result.kwh;
        flatCost += result.cost;
        break;
    }
  });

  return {
    peakKwh, peakCost,
    flatKwh, flatCost,
    valleyKwh, valleyCost,
    totalKwh: peakKwh + flatKwh + valleyKwh,
    totalCost: peakCost + flatCost + valleyCost
  };
}

function saveTariffData() {
  localStorage.setItem(tariffKey, JSON.stringify(tariffs));
}

function getMappingSlots() {
  return [...new Set([
    ...slotOrder,
    ...Object.keys(slotMapping),
    ...records.map(function(record) { return record.slot; }),
    ...appliances.map(function(appliance) { return appliance.slot; })
  ].filter(Boolean))];
}

function renderMappingConfig() {
  const slots = getMappingSlots();
  mappingGrid.innerHTML = slots.map(function(slot) {
    const mappedTier = getSlotTier(slot);
    return '<div class="mappingItem">' +
      '<span class="mappingSlot">' + slot + '</span>' +
      '<select data-slot="' + slot + '">' +
        '<option value="peak" ' + (mappedTier === 'peak' ? 'selected' : '') + '>峰时段</option>' +
        '<option value="flat" ' + (mappedTier === 'flat' ? 'selected' : '') + '>平时段</option>' +
        '<option value="valley" ' + (mappedTier === 'valley' ? 'selected' : '') + '>谷时段</option>' +
      '</select>' +
    '</div>';
  }).join('');
}

function renderTariffList() {
  if (tariffs.length === 0) {
    tariffList.innerHTML = '<p class="empty">暂无电价方案，请先添加</p>';
    return;
  }

  tariffList.innerHTML = tariffs.map(function(tariff) {
    return '<div class="tariffCard ' + (tariff.isDefault ? 'default' : '') + '">' +
      '<div class="tariffCardHeader">' +
        '<div class="tariffCardTitle">' +
          '<h4>' + tariff.name + '</h4>' +
          (tariff.isDefault ? '<span class="defaultBadge">默认</span>' : '') +
        '</div>' +
        '<div class="tariffCardActions">' +
          '<button data-edit-tariff="' + tariff.id + '">编辑</button>' +
          '<button data-del-tariff="' + tariff.id + '" style="background:#fee2e2; color:#dc2626;">删除</button>' +
        '</div>' +
      '</div>' +
      '<div class="tariffCardPrices">' +
        '<div class="tariffPrice peak">' +
          '<span class="tierLabel">峰</span>' +
          '<span class="tierPrice">¥' + tariff.peakPrice.toFixed(2) + '/kWh</span>' +
          '<span class="tierHours">' + tariff.peakHours.join('、') + '</span>' +
        '</div>' +
        '<div class="tariffPrice flat">' +
          '<span class="tierLabel">平</span>' +
          '<span class="tierPrice">¥' + tariff.flatPrice.toFixed(2) + '/kWh</span>' +
          '<span class="tierHours">' + tariff.flatHours.join('、') + '</span>' +
        '</div>' +
        '<div class="tariffPrice valley">' +
          '<span class="tierLabel">谷</span>' +
          '<span class="tierPrice">¥' + tariff.valleyPrice.toFixed(2) + '/kWh</span>' +
          '<span class="tierHours">' + tariff.valleyHours.join('、') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  document.querySelectorAll('[data-del-tariff]').forEach(function(button) { button.addEventListener('click', function() {
    const tariffToDelete = tariffs.find(function(t) { return t.id === button.dataset.delTariff; });
    if (confirm('确定要删除电价方案「' + tariffToDelete.name + '」吗？')) {
      tariffs = tariffs.filter(function(t) { return t.id !== button.dataset.delTariff; });
      if (tariffToDelete.isDefault && tariffs.length > 0) {
        tariffs[0].isDefault = true;
      }
      saveTariffData();
      render();
      showToast('success', '删除成功', '已删除电价方案「' + tariffToDelete.name + '」');
    }
  });});

  document.querySelectorAll('[data-edit-tariff]').forEach(function(button) { button.addEventListener('click', function() {
    const tariff = tariffs.find(function(t) { return t.id === button.dataset.editTariff; });
    editingTariffId = tariff.id;
    tariffFormTitle.textContent = '编辑电价方案';
    tariffForm.elements.name.value = tariff.name;
    tariffForm.elements.peakPrice.value = tariff.peakPrice;
    tariffForm.elements.flatPrice.value = tariff.flatPrice;
    tariffForm.elements.valleyPrice.value = tariff.valleyPrice;
    tariffForm.elements.peakHours.value = tariff.peakHours.join(',');
    tariffForm.elements.flatHours.value = tariff.flatHours.join(',');
    tariffForm.elements.valleyHours.value = tariff.valleyHours.join(',');
    tariffForm.elements.isDefault.checked = tariff.isDefault;
    tariffFormContainer.style.display = 'block';
  });});
}

function renderTariffSelects() {
  const options = tariffs.map(function(t) {
    return '<option value="' + t.id + '">' + t.name + (t.isDefault ? ' (默认)' : '') + '</option>';
  }).join('');
  detailTariffSelect.innerHTML = options;

  const months = [...new Set(records.map(function(r) { return r.date.slice(0, 7); }))].sort().reverse();
  comparisonMonthSelect.innerHTML = months.map(function(m) { return '<option value="' + m + '">' + m + '</option>'; }).join('');
  if (months.length > 0 && !comparisonMonthSelect.value) {
    comparisonMonthSelect.value = months[0];
  }
}

function renderTariffComparison() {
  const month = comparisonMonthSelect.value;
  if (!month) {
    tariffComparisonContainer.innerHTML = '<p class="empty">暂无数据</p>';
    return;
  }

  const monthRecords = records.filter(r => r.date.startsWith(month));
  if (monthRecords.length === 0) {
    tariffComparisonContainer.innerHTML = '<p class="empty">该月份暂无用电记录</p>';
    return;
  }

  const results = tariffs.map(tariff => ({
    tariff,
    ...calculateMonthCost(monthRecords, tariff)
  }));

  const minCost = Math.min(...results.map(r => r.totalCost));
  const maxCost = Math.max(...results.map(r => r.totalCost));
  const savings = maxCost - minCost;

  const defaultTariff = tariffs.find(t => t.isDefault) || tariffs[0];
  const defaultResult = results.find(r => r.tariff.id === defaultTariff.id);

  const barsHtml = results.map(function(result) {
    const isCheapest = result.totalCost === minCost;
    const isDefault = result.tariff.isDefault;
    const savingVsDefault = defaultResult.totalCost - result.totalCost;
    
    let barHtml = '<div class="comparisonBar ' + (isCheapest ? 'cheapest' : '') + ' ' + (isDefault ? 'isDefault' : '') + '">' +
      '<div class="comparisonBarHeader">' +
        '<span class="comparisonBarName">' +
          result.tariff.name +
          (isDefault ? '<span class="defaultBadge">默认</span>' : '') +
          (isCheapest ? '<span class="cheapestBadge">最省</span>' : '') +
        '</span>' +
        '<span class="comparisonBarTotal">¥' + result.totalCost.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="comparisonBarStack">' +
        '<div class="comparisonBarSegment peak" style="width: ' + (result.peakCost / result.totalCost * 100).toFixed(1) + '%">' +
          '<span>¥' + result.peakCost.toFixed(2) + '</span>' +
        '</div>' +
        '<div class="comparisonBarSegment flat" style="width: ' + (result.flatCost / result.totalCost * 100).toFixed(1) + '%">' +
          '<span>¥' + result.flatCost.toFixed(2) + '</span>' +
        '</div>' +
        '<div class="comparisonBarSegment valley" style="width: ' + (result.valleyCost / result.totalCost * 100).toFixed(1) + '%">' +
          '<span>¥' + result.valleyCost.toFixed(2) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="comparisonBarFooter">' +
        '<span>峰: ' + result.peakKwh.toFixed(1) + 'kWh · 平: ' + result.flatKwh.toFixed(1) + 'kWh · 谷: ' + result.valleyKwh.toFixed(1) + 'kWh</span>';
    
    if (savingVsDefault !== 0) {
      barHtml += '<span class="' + (savingVsDefault > 0 ? 'saving' : 'extra') + '">' +
        (savingVsDefault > 0 ? '比默认省' : '比默认多') + ' ¥' + Math.abs(savingVsDefault).toFixed(2) +
      '</span>';
    }
    
    barHtml += '</div></div>';
    return barHtml;
  }).join('');

  tariffComparisonContainer.innerHTML = 
    '<div class="comparisonSummary">' +
      '<div class="comparisonStat">' +
        '<span>对比月份</span>' +
        '<strong>' + month + '</strong>' +
      '</div>' +
      '<div class="comparisonStat">' +
        '<span>用电记录</span>' +
        '<strong>' + monthRecords.length + ' 条</strong>' +
      '</div>' +
      '<div class="comparisonStat">' +
        '<span>总耗电量</span>' +
        '<strong>' + defaultResult.totalKwh.toFixed(2) + ' kWh</strong>' +
      '</div>' +
      '<div class="comparisonStat highlight">' +
        '<span>最大差价</span>' +
        '<strong>¥' + savings.toFixed(2) + '</strong>' +
      '</div>' +
    '</div>' +
    '<div class="comparisonChart">' +
      barsHtml +
    '</div>' +
    '<div class="comparisonLegend">' +
      '<span class="legendItem"><span class="legendColor peak"></span>峰时段</span>' +
      '<span class="legendItem"><span class="legendColor flat"></span>平时段</span>' +
      '<span class="legendItem"><span class="legendColor valley"></span>谷时段</span>' +
    '</div>';
}

function renderTariffDetail() {
  const tariffId = detailTariffSelect.value;
  const tariff = tariffs.find(function(t) { return t.id === tariffId; });
  if (!tariff) {
    tariffDetailRows.innerHTML = '<tr><td colspan="7" class="empty">暂无数据</td></tr>';
    return;
  }

  const month = comparisonMonthSelect.value;
  const monthRecords = records.filter(function(r) { return r.date.startsWith(month); });

  if (monthRecords.length === 0) {
    tariffDetailRows.innerHTML = '<tr><td colspan="7" class="empty">该月份暂无用电记录</td></tr>';
    return;
  }

  tariffDetailRows.innerHTML = monthRecords
    .sort(function(a, b) { return b.date.localeCompare(a.date); })
    .map(function(record) {
      const result = calculateRecordCost(record, tariff);
      const tierName = getTierName(result.tier);
      const tierColor = getTierColor(result.tier);
      return '<tr>' +
        '<td>' + record.date + '</td>' +
        '<td>' + record.appliance + '</td>' +
        '<td>' + record.slot + '</td>' +
        '<td><span class="tierBadge" style="background: ' + tierColor + '20; color: ' + tierColor + ';">' + tierName + '</span></td>' +
        '<td>' + result.kwh.toFixed(2) + 'kWh</td>' +
        '<td>¥' + result.price.toFixed(2) + '/kWh</td>' +
        '<td><strong>¥' + result.cost.toFixed(2) + '</strong></td>' +
      '</tr>';
    }).join('');
}

function showToast(type, title, message, duration = 4000) {
  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '🚨',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = 
    '<span class="toastIcon">' + (icons[type] || icons.info) + '</span>' +
    '<div class="toastContent">' +
      '<p class="toastTitle">' + title + '</p>' +
      '<p class="toastMessage">' + message + '</p>' +
    '</div>' +
    '<button class="toastClose" aria-label="关闭">×</button>';

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

function saveMapping() {
  localStorage.setItem(slotMappingKey, JSON.stringify(slotMapping));
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
    ['当月总耗电', monthlyTotal.toFixed(2) + 'kWh'],
    ['预计电费', '¥' + estimatedCost.toFixed(2)],
    ['日均费用', '¥' + dailyAverage.toFixed(2)],
    ['活跃天数', daysWithData + '/' + daysInMonth + '天']
  ].map(function(item) { 
    return '<article><span>' + item[0] + '</span><strong>' + item[1] + '</strong></article>'; 
  }).join('');

  drawBars('#monthlyChart', groupSum(monthlyRecords, 'date').sort(function(a, b) { return a.label.localeCompare(b.label); }), 'kWh');
}

function renderApplianceSelect() {
  applianceSelect.innerHTML = '<option value="">选择已有电器（可选）</option>' +
    appliances.map(function(a) { return '<option value="' + a.id + '">' + a.name + ' (' + a.watts + 'W)</option>'; }).join('');
}

function renderAppliances() {
  document.querySelector('#applianceRows').innerHTML = appliances.map(function(a) {
    return '<tr>' +
      '<td>' + a.name + '</td>' +
      '<td>' + a.watts + 'W</td>' +
      '<td>' + a.slot + '</td>' +
      '<td>' + (a.note || '') + '</td>' +
      '<td>' +
        '<button data-edit-appliance="' + a.id + '">编辑</button>' +
        '<button data-del-appliance="' + a.id + '">删除</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  document.querySelectorAll('[data-del-appliance]').forEach(function(button) { button.addEventListener('click', function() {
    appliances = appliances.filter(function(a) { return a.id !== button.dataset.delAppliance; });
    save();
    render();
  });});

  document.querySelectorAll('[data-edit-appliance]').forEach(function(button) { button.addEventListener('click', function() {
    const appliance = appliances.find(function(a) { return a.id === button.dataset.editAppliance; });
    editingApplianceId = appliance.id;
    Object.entries(appliance).forEach(function(entry) {
      const name = entry[0], value = entry[1];
      if (applianceForm.elements[name]) applianceForm.elements[name].value = value;
    });
    applianceFormContainer.style.display = 'block';
  });});
}

function renderMemberSelect() {
  const memberOptions = members.map(function(m) { return '<option value="' + m.name + '">' + m.name + '</option>'; }).join('');
  memberSelect.innerHTML = '<option value="">使用成员（可选）</option>' + memberOptions;
  batchMemberSelect.innerHTML = '<option value="">选择分配成员</option>' + memberOptions;
}

function renderMembers() {
  document.querySelector('#memberRows').innerHTML = members.map(function(m) {
    return '<tr>' +
      '<td>' + m.name + '</td>' +
      '<td>' + (m.note || '') + '</td>' +
      '<td>' +
        '<button data-edit-member="' + m.id + '">编辑</button>' +
        '<button data-del-member="' + m.id + '">删除</button>' +
      '</td>' +
    '</tr>';
  }).join('');

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

  container.innerHTML = stats.map(function(stat, index) {
    const color = colors[index % colors.length];
    const topAppliancesHtml = stat.topAppliances.length > 0
      ? stat.topAppliances.map(function(app) {
          return '<span class="topAppliance">' + app.name + ' (' + app.count + '次)</span>';
        }).join('')
      : '<span class="empty">暂无</span>';

    return '<div class="memberStatCard">' +
        '<div class="memberStatHeader" style="border-left-color: ' + color + ';">' +
          '<div class="memberAvatar" style="background: ' + color + ';">' +
            stat.name.charAt(0) +
          '</div>' +
          '<div class="memberInfo">' +
            '<h3>' + stat.name + '</h3>' +
            '<span class="memberRecordCount">' + stat.recordCount + ' 条记录</span>' +
          '</div>' +
        '</div>' +
        '<div class="memberStatBody">' +
          '<div class="memberStatItem">' +
            '<span class="statLabel">估算耗电</span>' +
            '<span class="statValue">' + stat.totalKwh.toFixed(2) + ' kWh</span>' +
          '</div>' +
          '<div class="memberStatItem">' +
            '<span class="statLabel">电费占比</span>' +
            '<span class="statValue">' + stat.costPercent.toFixed(1) + '%</span>' +
          '</div>' +
          '<div class="memberStatItem">' +
            '<span class="statLabel">估算费用</span>' +
            '<span class="statValue">¥' + stat.totalCost.toFixed(2) + '</span>' +
          '</div>' +
          '<div class="memberStatItem fullWidth">' +
            '<span class="statLabel">高频使用电器</span>' +
            '<div class="topAppliances">' +
              topAppliancesHtml +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="memberStatProgress">' +
          '<div class="progressBarBg">' +
            '<div class="progressBarFill" style="width: ' + Math.min(stat.costPercent, 100) + '%; background: ' + color + ';"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }).join('');
}

function render() {
  const filtered = records.filter(function(record) { return [record.date, record.appliance, record.note, record.slot, getMemberName(record)].join(' ').includes(search.value.trim()); });
  const total = records.reduce(function(sum, record) { return sum + kwh(record); }, 0);
  document.querySelector('#summary').innerHTML = [
    ['总估算耗电', total.toFixed(2) + 'kWh'],
    ['记录数', records.length],
    ['最高单次', Math.max.apply(Math, records.map(kwh).concat([0])).toFixed(2) + 'kWh']
  ].map(function(item) { 
    return '<article><span>' + item[0] + '</span><strong>' + item[1] + '</strong></article>'; 
  }).join('');
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
  renderTariffList();
  renderTariffSelects();
  renderTariffComparison();
  renderTariffDetail();
  renderAnomalyAlerts();
  if (showMappingConfig) {
    renderMappingConfig();
  }
  checkAndNotifyGoal();

  selectedCountSpan.textContent = '已选 ' + selectedRecordIds.length + ' 条';
  const allSelected = filtered.length > 0 && filtered.every(function(r) { return selectedRecordIds.includes(r.id); });
  selectAllCheckbox.checked = allSelected;

  document.querySelector('#rows').innerHTML = filtered.sort(function(a, b) { return b.date.localeCompare(a.date); }).map(function(record) {
    const isChecked = selectedRecordIds.includes(record.id);
    const memberName = getMemberName(record);
    const memberLabel = memberName === UNASSIGNED_LABEL
      ? '<span class="unassignedMember">' + UNASSIGNED_LABEL + '</span>'
      : memberName;

    let rowHtml = '<tr data-record-id="' + record.id + '">';
    if (batchAssignMode) {
      rowHtml += '<td><input type="checkbox" class="recordCheckbox" data-id="' + record.id + '" ' + (isChecked ? 'checked' : '') + ' /></td>';
    }
    rowHtml += 
      '<td>' + record.date + '</td>' +
      '<td>' + record.appliance + '</td>' +
      '<td>' + memberLabel + '</td>' +
      '<td>' + record.slot + '</td>' +
      '<td>' + kwh(record).toFixed(2) + 'kWh</td>' +
      '<td>' + (record.note || '') + '</td>' +
      '<td><button data-edit="' + record.id + '">编辑</button><button data-del="' + record.id + '">删除</button></td>' +
    '</tr>';
    return rowHtml;
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
  const max = Math.max.apply(Math, data.map(function(item) { return item.value; }).concat([1]));
  const bars = data.slice(0, 6).map(function(item, index) {
    return '<text x="22" y="' + (43 + index * 36) + '">' + item.label + '</text>' +
           '<rect x="150" y="' + (23 + index * 36) + '" width="' + ((item.value / max) * 300) + '" height="20" rx="4"/>' +
           '<text x="' + (160 + (item.value / max) * 300) + '" y="' + (39 + index * 36) + '">' + item.value.toFixed(2) + unit + '</text>';
  }).join('');
  el.innerHTML = '<svg viewBox="0 0 500 240">' + bars + '</svg>';
}

function drawDonut(selector, data) {
  const el = document.querySelector(selector);
  if (!data.length) return (el.innerHTML = '<p class="empty">暂无数据</p>');
  const total = data.reduce(function(sum, item) { return sum + item.value; }, 0);
  let offset = 25;
  const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'];
  const rings = data.slice(0, 5).map(function(item, index) {
    const len = (item.value / total) * 100;
    const node = '<circle cx="135" cy="105" r="68" fill="none" stroke="' + colors[index] + '" stroke-width="28" stroke-dasharray="' + len + ' ' + (100 - len) + '" stroke-dashoffset="' + offset + '" pathLength="100"/>';
    offset -= len;
    return node;
  }).join('');
  const legend = data.slice(0, 5).map(function(item, index) {
    return '<rect x="260" y="' + (52 + index * 30) + '" width="14" height="14" fill="' + colors[index] + '"/>' +
           '<text x="285" y="' + (64 + index * 30) + '">' + item.label + ' ' + Math.round(item.value / total * 100) + '%</text>';
  }).join('');
  el.innerHTML = '<svg viewBox="0 0 500 220">' + rings + '<circle cx="135" cy="105" r="44" fill="white"/><text x="135" y="112">' + total.toFixed(1) + 'kWh</text>' + legend + '</svg>';
}

const backupRestoreBtn = document.querySelector('#backupRestoreBtn');
const backupModalOverlay = document.querySelector('#backupModalOverlay');
const backupRestoreModalEl = document.querySelector('#backupRestoreModal');

const RESTORE_STEPS = ['selectFile', 'validate', 'migrate', 'diffPreview', 'confirm', 'complete'];

function openBackupRestoreModal() {
  backupRestoreState = {
    step: 'welcome',
    parsedBackup: null,
    validatedBackup: null,
    migratedBackup: null,
    analysis: null,
    currentData: getCurrentData(),
    updateMode: 'skip',
    selectedTab: 'backup',
    restoreError: null
  };
  backupRestoreOptions = {
    includeRecords: true,
    includeAppliances: true,
    includeMembers: true,
    includePriceSettings: true,
    includeGoalSettings: true,
    includeTariffs: true,
    includeSlotMapping: true,
    includeIgnoredAnomalies: true
  };
  backupModalOverlay.style.display = 'block';
  backupRestoreModalEl.style.display = 'block';
  renderBackupRestoreModal();
}

function closeBackupRestoreModal() {
  backupModalOverlay.style.display = 'none';
  backupRestoreModalEl.style.display = 'none';
  backupRestoreState.step = 'welcome';
  backupRestoreState.parsedBackup = null;
  backupRestoreState.validatedBackup = null;
  backupRestoreState.migratedBackup = null;
  backupRestoreState.analysis = null;
  backupRestoreState.restoreError = null;
}

backupRestoreBtn.addEventListener('click', openBackupRestoreModal);
backupModalOverlay.addEventListener('click', closeBackupRestoreModal);

function renderBackupRestoreModal() {
  const { selectedTab, step } = backupRestoreState;
  const modal = backupRestoreModalEl;

  const tabHtml = `
    <div class="brTabs">
      <button class="brTab ${selectedTab === 'backup' ? 'active' : ''}" data-br-tab="backup">📦 数据备份</button>
      <button class="brTab ${selectedTab === 'restore' ? 'active' : ''}" data-br-tab="restore">📥 数据恢复</button>
    </div>
  `;

  let bodyHtml = '';
  let footerHtml = '';

  if (selectedTab === 'backup') {
    bodyHtml = renderBackupTab();
    footerHtml = `
      <button class="brBtn secondary" id="brCloseBtn">关闭</button>
      <button class="brBtn primary" id="brExportBtn">💾 导出备份</button>
    `;
  } else {
    const stepIdx = RESTORE_STEPS.indexOf(step);
    bodyHtml = renderRestoreStepIndicator(stepIdx) + renderRestoreStep();

    if (step === 'selectFile') {
      footerHtml = `
        <button class="brBtn secondary" id="brCloseBtn">关闭</button>
      `;
    } else if (step === 'validate') {
      const vb = backupRestoreState.validatedBackup;
      const canProceed = vb && vb.valid;
      footerHtml = `
        <button class="brBtn secondary" id="brRestoreBackBtn">上一步</button>
        <button class="brBtn primary" id="brRestoreNextBtn" ${canProceed ? '' : 'disabled'}>下一步</button>
      `;
    } else if (step === 'migrate') {
      footerHtml = `
        <button class="brBtn secondary" id="brRestoreBackBtn">上一步</button>
        <button class="brBtn primary" id="brRestoreNextBtn">下一步</button>
      `;
    } else if (step === 'diffPreview') {
      footerHtml = `
        <button class="brBtn secondary" id="brRestoreBackBtn">上一步</button>
        <button class="brBtn primary" id="brRestoreNextBtn">下一步</button>
      `;
    } else if (step === 'confirm') {
      footerHtml = `
        <button class="brBtn secondary" id="brRestoreBackBtn">上一步</button>
        <button class="brBtn danger" id="brApplyRestoreBtn">确认恢复</button>
      `;
    } else if (step === 'complete') {
      footerHtml = `
        <button class="brBtn primary" id="brCloseBtn">完成</button>
      `;
    }
  }

  modal.innerHTML = `
    <div class="brHeader">
      <h2>💾 数据备份与恢复中心</h2>
      <button class="brCloseBtn" id="brHeaderCloseBtn">×</button>
    </div>
    ${tabHtml}
    <div class="brBody">${bodyHtml}</div>
    <div class="brFooter">${footerHtml}</div>
  `;

  bindBackupRestoreEvents();
}

function renderBackupTab() {
  const currentData = backupRestoreState.currentData || getCurrentData();
  const recordCount = (currentData.records || []).length;
  const applianceCount = (currentData.appliances || []).length;
  const memberCount = (currentData.members || []).length;
  const tariffCount = (currentData.tariffs || []).length;

  return `
    <div class="brSection">
      <h3 class="brSectionTitle">📋 选择备份内容</h3>
      <div class="brCheckboxGroup">
        ${renderCheckbox('includeRecords', '用电记录', `${recordCount} 条`)}
        ${renderCheckbox('includeAppliances', '电器档案', `${applianceCount} 条`)}
        ${renderCheckbox('includeMembers', '家庭成员', `${memberCount} 条`)}
        ${renderCheckbox('includePriceSettings', '电价设置', '')}
        ${renderCheckbox('includeGoalSettings', '节能目标', '')}
        ${renderCheckbox('includeTariffs', '分时电价方案', `${tariffCount} 条`)}
        ${renderCheckbox('includeSlotMapping', '时段映射规则', '')}
        ${renderCheckbox('includeIgnoredAnomalies', '已忽略异常', '')}
      </div>
    </div>
    <div class="brSection">
      <h3 class="brSectionTitle">📊 当前数据概览</h3>
      <div class="brDataSummary">
        <div class="brDataStat"><span>用电记录</span><strong>${recordCount}</strong></div>
        <div class="brDataStat"><span>电器档案</span><strong>${applianceCount}</strong></div>
        <div class="brDataStat"><span>家庭成员</span><strong>${memberCount}</strong></div>
        <div class="brDataStat"><span>电价方案</span><strong>${tariffCount}</strong></div>
      </div>
    </div>
    <div class="brWarning">
      <span class="brWarningIcon">⚠️</span>
      <div>
        <strong>备份说明</strong><br/>
        导出的备份文件为 JSON 格式，包含所有选中的数据。请妥善保存备份文件，恢复时需要使用同一文件。
        备份文件包含数据版本号，未来应用更新后会自动进行数据迁移。
      </div>
    </div>
  `;
}

function renderCheckbox(key, label, countText) {
  const checked = backupRestoreOptions[key] ? 'checked' : '';
  return `
    <div class="brCheckboxItem">
      <input type="checkbox" id="brOpt_${key}" data-br-option="${key}" ${checked} />
      <label for="brOpt_${key}">${label}${countText ? ` (${countText})` : ''}</label>
    </div>
  `;
}

function renderRestoreStepIndicator(currentStepIdx) {
  const labels = ['选择文件', '验证', '迁移', '差异预览', '确认', '完成'];
  let html = '<div class="brStepIndicator">';

  for (let i = 0; i < labels.length; i++) {
    const state = i < currentStepIdx ? 'done' : i === currentStepIdx ? 'active' : '';
    const dotContent = i < currentStepIdx ? '✓' : String(i + 1);

    html += `<div class="brStep ${state}">
      <span class="brStepDot">${dotContent}</span>
      <span>${labels[i]}</span>
    </div>`;

    if (i < labels.length - 1) {
      html += `<span class="brStepLine ${i < currentStepIdx ? 'done' : ''}"></span>`;
    }
  }

  html += '</div>';
  return html;
}

function renderRestoreStep() {
  const { step, restoreError } = backupRestoreState;

  if (restoreError) {
    return `
      <div class="brValidationItem error">
        <span>🚨</span>
        <span>${restoreError}</span>
      </div>
      <div style="margin-top: 16px; text-align: center;">
        <button class="brBtn secondary" id="brRetryBtn">重新选择文件</button>
      </div>
    `;
  }

  switch (step) {
    case 'selectFile':
      return renderSelectFileStep();
    case 'validate':
      return renderValidateStep();
    case 'migrate':
      return renderMigrateStep();
    case 'diffPreview':
      return renderDiffPreviewStep();
    case 'confirm':
      return renderConfirmStep();
    case 'complete':
      return renderCompleteStep();
    default:
      return '';
  }
}

function renderSelectFileStep() {
  return `
    <div class="brSection">
      <div class="brDropZone" id="brDropZone">
        <span class="brDropZoneIcon">📁</span>
        <p>拖拽备份文件到此处</p>
        <p>或点击选择文件</p>
        <p class="hint">仅支持 .json 格式的备份文件</p>
        <input type="file" id="brFileInput" accept=".json" style="display:none;" />
      </div>
    </div>
    <div class="brWarning">
      <span class="brWarningIcon">⚠️</span>
      <div>
        <strong>恢复说明</strong><br/>
        恢复操作不会直接覆盖当前数据。系统会先分析备份与当前数据的差异，
        您可以预览新增、更新和跳过的记录数量，确认后才执行恢复。
        旧版本备份会自动迁移至当前版本。
      </div>
    </div>
  `;
}

function renderValidateStep() {
  const backup = backupRestoreState.parsedBackup;
  const validation = backupRestoreState.validatedBackup;
  if (!backup || !validation) return '';

  const recordCount = (backup.data.records || []).length;
  const applianceCount = (backup.data.appliances || []).length;
  const memberCount = (backup.data.members || []).length;
  const tariffCount = (backup.data.tariffs || []).length;

  const versionBadge = backup.schemaVersion === BACKUP_SCHEMA_VERSION
    ? `<span class="brVersionBadge current">v${backup.schemaVersion} (当前版本)</span>`
    : `<span class="brVersionBadge outdated">v${backup.schemaVersion} (旧版本)</span>`;

  let validationHtml = '';
  if (validation.valid) {
    validationHtml += `<div class="brValidationItem success"><span>✅</span><span>备份文件格式验证通过</span></div>`;
  }
  validation.errors.forEach(err => {
    validationHtml += `<div class="brValidationItem error"><span>🚨</span><span>${err}</span></div>`;
  });
  validation.warnings.forEach(w => {
    validationHtml += `<div class="brValidationItem warning"><span>⚠️</span><span>${w}</span></div>`;
  });

  return `
    <div class="brSection">
      <div class="brFileInfo">
        <span class="brFileInfoIcon">📄</span>
        <div class="brFileInfoDetails">
          <h4>备份文件信息 ${versionBadge}</h4>
          <p>导出时间：${backup.exportedAt ? new Date(backup.exportedAt).toLocaleString('zh-CN') : '未知'}</p>
          <p>应用版本：${backup.appVersion || '未知'}</p>
          <p>数据版本：v${backup.schemaVersion}</p>
        </div>
      </div>
    </div>
    <div class="brSection">
      <h3 class="brSectionTitle">📊 备份数据概览</h3>
      <div class="brDataSummary">
        <div class="brDataStat"><span>用电记录</span><strong>${recordCount}</strong></div>
        <div class="brDataStat"><span>电器档案</span><strong>${applianceCount}</strong></div>
        <div class="brDataStat"><span>家庭成员</span><strong>${memberCount}</strong></div>
        <div class="brDataStat"><span>电价方案</span><strong>${tariffCount}</strong></div>
      </div>
    </div>
    <div class="brValidationResult">
      <h3 class="brSectionTitle">🔍 验证结果</h3>
      ${validationHtml}
    </div>
  `;
}

function renderMigrateStep() {
  const backup = backupRestoreState.parsedBackup;
  const migrated = backupRestoreState.migratedBackup;
  if (!backup) return '';

  const needsMigration = backup.schemaVersion < BACKUP_SCHEMA_VERSION;

  if (!needsMigration) {
    return `
      <div class="brMigrationInfo">
        <h4>✅ 无需迁移</h4>
        <p>备份数据版本 (v${backup.schemaVersion}) 与当前应用版本一致，无需进行数据迁移。</p>
      </div>
    `;
  }

  return `
    <div class="brMigrationInfo">
      <h4>🔄 数据迁移</h4>
      <p>备份数据版本从 <span class="brVersionBadge outdated">v${backup.schemaVersion}</span> 迁移至 <span class="brVersionBadge current">v${BACKUP_SCHEMA_VERSION}</span></p>
      <p>迁移步骤：${backup.schemaVersion + 1} → ${BACKUP_SCHEMA_VERSION}</p>
      ${migrated ? '<p style="color: #16a34a; font-weight: 600; margin-top: 8px;">✅ 迁移已完成</p>' : ''}
    </div>
    <div class="brWarning" style="margin-top: 16px;">
      <span class="brWarningIcon">ℹ️</span>
      <div>
        数据迁移会自动调整旧版本数据结构以适配当前应用版本。
        迁移过程中不会丢失原有数据，仅补充新版本所需的字段或格式。
      </div>
    </div>
  `;
}

function renderDiffPreviewStep() {
  const analysis = backupRestoreState.analysis;
  if (!analysis) return '';

  let html = '';

  html += renderDiffCategory('用电记录', 'records', analysis.records, ['date', 'appliance', 'slot']);
  html += renderDiffCategory('电器档案', 'appliances', analysis.appliances, ['name', 'watts', 'slot']);
  html += renderDiffCategory('家庭成员', 'members', analysis.members, ['name']);

  if (analysis.tariffs.items && analysis.tariffs.items.length > 0) {
    html += renderDiffCategory('电价方案', 'tariffs', analysis.tariffs, ['name']);
  }

  if (analysis.priceSettings.action !== 'none') {
    html += `
      <div class="brDiffCategory">
        <div class="brDiffCategoryHeader">
          <span class="brDiffCategoryTitle">💰 电价设置</span>
          <span class="brDiffBadge update">将更新</span>
        </div>
      </div>
    `;
  }

  if (analysis.goalSettings.action !== 'none') {
    html += `
      <div class="brDiffCategory">
        <div class="brDiffCategoryHeader">
          <span class="brDiffCategoryTitle">🎯 节能目标</span>
          <span class="brDiffBadge update">将更新</span>
        </div>
      </div>
    `;
  }

  if (analysis.slotMapping.different) {
    html += `
      <div class="brDiffCategory">
        <div class="brDiffCategoryHeader">
          <span class="brDiffCategoryTitle">🔗 时段映射</span>
          <span class="brDiffBadge update">将更新</span>
        </div>
      </div>
    `;
  }

  if (analysis.ignoredAnomalies.action === 'merge') {
    html += `
      <div class="brDiffCategory">
        <div class="brDiffCategoryHeader">
          <span class="brDiffCategoryTitle">🔕 已忽略异常</span>
          <span class="brDiffBadge add">合并 ${analysis.ignoredAnomalies.count} 条</span>
        </div>
      </div>
    `;
  }

  html += `
    <div class="brUpdateMode">
      <h3 class="brSectionTitle">⚙️ 冲突处理策略</h3>
      <div class="brUpdateModeOptions">
        <div class="brUpdateModeOption ${backupRestoreState.updateMode === 'skip' ? 'selected' : ''}" data-br-mode="skip">
          <h4>跳过重复</h4>
          <p>保留当前数据，跳过备份中已有的记录</p>
        </div>
        <div class="brUpdateModeOption ${backupRestoreState.updateMode === 'update' ? 'selected' : ''}" data-br-mode="update">
          <h4>更新现有</h4>
          <p>新增不存在的记录，更新已有记录为新值</p>
        </div>
      </div>
    </div>
  `;

  return html;
}

function renderDiffCategory(title, key, diffData, summaryFields) {
  if (!diffData || diffData.items.length === 0) {
    if (!diffData) return '';
    return `
      <div class="brDiffCategory">
        <div class="brDiffCategoryHeader">
          <span class="brDiffCategoryTitle">${title}</span>
          <span class="brDiffBadge skip">无变化</span>
        </div>
      </div>
    `;
  }

  let badgesHtml = '';
  if (diffData.added > 0) badgesHtml += `<span class="brDiffBadge add">+${diffData.added} 新增</span>`;
  if (diffData.updated > 0) badgesHtml += `<span class="brDiffBadge update">~${diffData.updated} 更新</span>`;
  if (diffData.skipped > 0) badgesHtml += `<span class="brDiffBadge skip">${diffData.skipped} 跳过</span>`;

  let itemsHtml = '';
  diffData.items.forEach(item => {
    const typeClass = item.type === 'add' ? 'add' : item.type === 'update' ? 'update' : 'skip';
    const typeLabel = item.type === 'add' ? '新增' : item.type === 'update' ? '更新' : '跳过';

    let contentHtml = '';
    if (item.type === 'add') {
      const summary = summaryFields.map(f => item.imported[f]).filter(Boolean).join(' · ');
      contentHtml = `<div class="brDiffItemContent">${summary}</div>`;
    } else if (item.type === 'update' && item.differences) {
      contentHtml = '<div class="brDiffItemContent">';
      const summary = summaryFields.map(f => item.current[f]).filter(Boolean).join(' · ');
      contentHtml += `<div style="margin-bottom:4px;">${summary}</div>`;
      item.differences.forEach(diff => {
        contentHtml += `<div class="brDiffFieldChange">
          <span class="brDiffFieldLabel">${diff.field}</span>
          <span class="brDiffOldVal">${diff.current !== null && diff.current !== undefined ? diff.current : '(空)'}</span>
          <span class="brDiffArrow">→</span>
          <span class="brDiffNewVal">${diff.imported !== null && diff.imported !== undefined ? diff.imported : '(空)'}</span>
        </div>`;
      });
      contentHtml += '</div>';
    } else if (item.type === 'skip') {
      const summary = summaryFields.map(f => item.current[f]).filter(Boolean).join(' · ');
      contentHtml = `<div class="brDiffItemContent" style="color:#6b7280;">${summary}</div>`;
    }

    itemsHtml += `
      <div class="brDiffItem">
        <span class="brDiffItemType ${typeClass}">${typeLabel}</span>
        ${contentHtml}
      </div>
    `;
  });

  return `
    <div class="brDiffCategory">
      <div class="brDiffCategoryHeader" data-br-toggle="${key}">
        <span class="brDiffCategoryTitle">${title}</span>
        <div class="brDiffBadges">${badgesHtml}</div>
      </div>
      <div class="brDiffItems" id="brDiffItems_${key}">
        ${itemsHtml}
      </div>
    </div>
  `;
}

function renderConfirmStep() {
  const analysis = backupRestoreState.analysis;
  if (!analysis) return '';

  const mode = backupRestoreState.updateMode;
  const modeLabel = mode === 'skip' ? '跳过重复' : '更新现有';

  let totalAdded = 0, totalUpdated = 0, totalSkipped = 0;
  ['records', 'appliances', 'members', 'tariffs'].forEach(key => {
    if (analysis[key]) {
      totalAdded += analysis[key].added;
      if (mode !== 'skip') {
        totalUpdated += analysis[key].updated;
      } else {
        totalSkipped += analysis[key].updated;
      }
      totalSkipped += analysis[key].skipped;
    }
  });

  return `
    <div class="brWarning">
      <span class="brWarningIcon">⚠️</span>
      <div>
        <strong>即将执行数据恢复</strong><br/>
        当前冲突策略：${modeLabel}。恢复操作将修改本地存储数据，请确认以下操作明细。
      </div>
    </div>
    <div class="brConfirmSummary">
      <div class="brConfirmStat addStat"><span>新增记录</span><strong>${totalAdded}</strong></div>
      <div class="brConfirmStat updateStat"><span>${mode !== 'skip' ? '更新记录' : '跳过(冲突)'}</span><strong>${totalUpdated}</strong></div>
      <div class="brConfirmStat skipStat"><span>跳过记录</span><strong>${totalSkipped}</strong></div>
    </div>
    <div class="brSection" style="margin-top: 16px;">
      <h3 class="brSectionTitle">📋 操作明细</h3>
      ${analysis.records ? `<p style="font-size:14px; margin:6px 0;">用电记录：新增 ${analysis.records.added} 条 / 更新 ${analysis.records.updated} 条 / 跳过 ${analysis.records.skipped} 条</p>` : ''}
      ${analysis.appliances ? `<p style="font-size:14px; margin:6px 0;">电器档案：新增 ${analysis.appliances.added} 条 / 更新 ${analysis.appliances.updated} 条 / 跳过 ${analysis.appliances.skipped} 条</p>` : ''}
      ${analysis.members ? `<p style="font-size:14px; margin:6px 0;">家庭成员：新增 ${analysis.members.added} 条 / 更新 ${analysis.members.updated} 条 / 跳过 ${analysis.members.skipped} 条</p>` : ''}
      ${analysis.tariffs ? `<p style="font-size:14px; margin:6px 0;">电价方案：新增 ${analysis.tariffs.added} 条 / 更新 ${analysis.tariffs.updated} 条 / 跳过 ${analysis.tariffs.skipped} 条</p>` : ''}
      ${analysis.priceSettings.action !== 'none' ? '<p style="font-size:14px; margin:6px 0;">电价设置：将更新</p>' : ''}
      ${analysis.goalSettings.action !== 'none' ? '<p style="font-size:14px; margin:6px 0;">节能目标：将更新</p>' : ''}
      ${analysis.slotMapping.different ? '<p style="font-size:14px; margin:6px 0;">时段映射：将更新</p>' : ''}
      ${analysis.ignoredAnomalies.action === 'merge' ? `<p style="font-size:14px; margin:6px 0;">已忽略异常：合并 ${analysis.ignoredAnomalies.count} 条</p>` : ''}
    </div>
  `;
}

function renderCompleteStep() {
  const analysis = backupRestoreState.analysis;
  const mode = backupRestoreState.updateMode;

  let totalAdded = 0, totalUpdated = 0, totalSkipped = 0;
  if (analysis) {
    ['records', 'appliances', 'members', 'tariffs'].forEach(key => {
      if (analysis[key]) {
        totalAdded += analysis[key].added;
        if (mode !== 'skip') {
          totalUpdated += analysis[key].updated;
        }
        totalSkipped += analysis[key].skipped;
      }
    });
  }

  return `
    <div class="brSuccessResult">
      <span class="brSuccessIcon">✅</span>
      <h3>数据恢复完成</h3>
      <p>新增 ${totalAdded} 条记录</p>
      <p>${mode !== 'skip' ? '更新' + totalUpdated + ' 条记录' : '跳过 ' + totalUpdated + ' 条冲突记录'}</p>
      <p>跳过 ${totalSkipped} 条相同记录</p>
    </div>
  `;
}

function bindBackupRestoreEvents() {
  const closeBtn = document.querySelector('#brCloseBtn');
  const headerCloseBtn = document.querySelector('#brHeaderCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeBackupRestoreModal);
  if (headerCloseBtn) headerCloseBtn.addEventListener('click', closeBackupRestoreModal);

  document.querySelectorAll('[data-br-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      backupRestoreState.selectedTab = tab.dataset.brTab;
      if (tab.dataset.brTab === 'restore') {
        backupRestoreState.step = 'selectFile';
        backupRestoreState.restoreError = null;
      }
      renderBackupRestoreModal();
    });
  });

  document.querySelectorAll('[data-br-option]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      backupRestoreOptions[e.target.dataset.brOption] = e.target.checked;
    });
  });

  const exportBtn = document.querySelector('#brExportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const opts = { ...backupRestoreOptions };
      exportBackup(null, opts);
      showToast('success', '备份已导出', '数据备份文件已开始下载');
      closeBackupRestoreModal();
    });
  }

  const dropZone = document.querySelector('#brDropZone');
  const fileInput = document.querySelector('#brFileInput');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragOver');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragOver');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleRestoreFile(file);
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleRestoreFile(file);
    });
  }

  const retryBtn = document.querySelector('#brRetryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      backupRestoreState.step = 'selectFile';
      backupRestoreState.restoreError = null;
      renderBackupRestoreModal();
    });
  }

  const backBtn = document.querySelector('#brRestoreBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const currentIdx = RESTORE_STEPS.indexOf(backupRestoreState.step);
      if (currentIdx > 0) {
        backupRestoreState.step = RESTORE_STEPS[currentIdx - 1];
        renderBackupRestoreModal();
      }
    });
  }

  const nextBtn = document.querySelector('#brRestoreNextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      handleRestoreNextStep();
    });
  }

  const applyBtn = document.querySelector('#brApplyRestoreBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      handleApplyRestore();
    });
  }

  document.querySelectorAll('[data-br-mode]').forEach(option => {
    option.addEventListener('click', () => {
      backupRestoreState.updateMode = option.dataset.brMode;
      const migratedData = backupRestoreState.migratedBackup
        ? backupRestoreState.migratedBackup.data
        : backupRestoreState.parsedBackup.data;
      backupRestoreState.analysis = analyzeDifferences(getCurrentData(), migratedData);
      renderBackupRestoreModal();
    });
  });

  document.querySelectorAll('[data-br-toggle]').forEach(header => {
    header.addEventListener('click', () => {
      const key = header.dataset.brToggle;
      const items = document.querySelector(`#brDiffItems_${key}`);
      if (items) {
        items.classList.toggle('expanded');
      }
    });
  });
}

async function handleRestoreFile(file) {
  try {
    const backup = await parseBackupFile(file);
    backupRestoreState.parsedBackup = backup;
    backupRestoreState.restoreError = null;

    const validation = validateBackup(backup);
    backupRestoreState.validatedBackup = validation;

    if (!validation.valid) {
      backupRestoreState.restoreError = validation.errors.join('；');
      renderBackupRestoreModal();
      return;
    }

    backupRestoreState.step = 'validate';
    renderBackupRestoreModal();
  } catch (err) {
    backupRestoreState.restoreError = err.message;
    renderBackupRestoreModal();
  }
}

function handleRestoreNextStep() {
  const { step, parsedBackup } = backupRestoreState;

  if (step === 'validate') {
    try {
      const migrated = migrateBackup(parsedBackup);
      backupRestoreState.migratedBackup = migrated;
      backupRestoreState.step = 'migrate';
      renderBackupRestoreModal();
    } catch (err) {
      backupRestoreState.restoreError = err.message;
      renderBackupRestoreModal();
    }
  } else if (step === 'migrate') {
    const migratedData = backupRestoreState.migratedBackup
      ? backupRestoreState.migratedBackup.data
      : backupRestoreState.parsedBackup.data;
    backupRestoreState.analysis = analyzeDifferences(getCurrentData(), migratedData);
    backupRestoreState.step = 'diffPreview';
    renderBackupRestoreModal();
  } else if (step === 'diffPreview') {
    backupRestoreState.step = 'confirm';
    renderBackupRestoreModal();
  }
}

function handleApplyRestore() {
  const { analysis, updateMode, migratedBackup, parsedBackup } = backupRestoreState;

  const importedData = (migratedBackup ? migratedBackup.data : parsedBackup.data) || {};

  const opts = {
    ...backupRestoreOptions,
    updateMode
  };

  try {
    applyRestore(analysis, importedData, opts);

    records = normalizeRecords(JSON.parse(localStorage.getItem(key) || 'null') || seed);
    appliances = JSON.parse(localStorage.getItem(applianceKey) || 'null') || applianceSeed;
    members = JSON.parse(localStorage.getItem(memberKey) || 'null') || memberSeed;
    priceSettings = JSON.parse(localStorage.getItem(priceKey) || 'null') || { price: 0.56, month: new Date().toISOString().slice(0, 7) };
    goalSettings = JSON.parse(localStorage.getItem(goalKey) || 'null') || null;
    tariffs = JSON.parse(localStorage.getItem(tariffKey) || 'null') || tariffSeed;
    slotMapping = JSON.parse(localStorage.getItem(slotMappingKey) || 'null') || slotMappingSeed;
    ignoredAnomalies = JSON.parse(localStorage.getItem(anomalyIgnoreKey) || '[]');

    backupRestoreState.step = 'complete';
    renderBackupRestoreModal();
    render();
    showToast('success', '恢复完成', '数据已成功从备份恢复');
  } catch (err) {
    backupRestoreState.restoreError = '恢复失败：' + err.message;
    renderBackupRestoreModal();
  }
}

render();
