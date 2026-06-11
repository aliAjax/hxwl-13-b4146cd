import './styles.css';
import {
  BACKUP_SCHEMA_VERSION,
  exportBackup,
  parseBackupFile,
  migrateBackup,
  analyzeDifferences,
  applyRestore,
  validateBackup
} from './dataBackupService.js';

const key = 'hxwl-13-home-energy';
const priceKey = 'hxwl-13-home-energy-price';
const applianceKey = 'hxwl-13-home-energy-appliances';
const goalKey = 'hxwl-13-home-energy-goal';
const goalHistoryKey = 'hxwl-13-home-energy-goal-history';
const memberKey = 'hxwl-13-home-energy-members';
const tariffKey = 'hxwl-13-home-energy-tariffs';
const slotMappingKey = 'hxwl-13-home-energy-slot-mapping';
const anomalyIgnoreKey = 'hxwl-13-home-energy-anomaly-ignore';
const anomalyRulesKey = 'hxwl-13-home-energy-anomaly-rules';
const scheduleTaskKey = 'hxwl-13-home-energy-schedule-tasks';
const scheduleResultKey = 'hxwl-13-home-energy-schedule-result';
const scheduleConfigKey = 'hxwl-13-home-energy-schedule-config';

const ANOMALY_SENSITIVITY_MAP = {
  low:    { stdDevMultiplier: 2.5, minRatioMultiplier: 1.6, label: '低敏感' },
  medium: { stdDevMultiplier: 1.5, minRatioMultiplier: 1.3, label: '中敏感' },
  high:   { stdDevMultiplier: 0.8, minRatioMultiplier: 1.1, label: '高敏感' }
};

const DEFAULT_ANOMALY_RULES = {
  version: 1,
  highSingleUsage: {
    enabled: true,
    sensitivity: 'medium'
  },
  dailySpike: {
    enabled: true,
    sensitivity: 'medium'
  },
  abnormalDuration: {
    enabled: true,
    sensitivity: 'medium'
  }
};
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
    isDefault: true,
    startMonth: '2026-06',
    endMonth: ''
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
    isDefault: false,
    startMonth: '2026-06',
    endMonth: ''
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

const scheduleTaskSeed = [
  { id: crypto.randomUUID(), appliance: '洗衣机', watts: 420, duration: 1, deadline: '18:00', earliestStart: '00:00', forbiddenRanges: [], tariffId: '' },
  { id: crypto.randomUUID(), appliance: '电热水器', watts: 1800, duration: 1.5, deadline: '22:00', earliestStart: '00:00', forbiddenRanges: [], tariffId: '' },
  { id: crypto.randomUUID(), appliance: '空调预冷', watts: 900, duration: 2, deadline: '19:00', earliestStart: '14:00', forbiddenRanges: [], tariffId: '' },
  { id: crypto.randomUUID(), appliance: '电动汽车充电', watts: 3500, duration: 6, deadline: '+06:00', earliestStart: '22:00', forbiddenRanges: ['19:00-21:00'], tariffId: '' }
];
const scheduleConfigSeed = {
  maxConcurrentPower: 8800
};
const slotOrder = ['清晨', '上午', '午间', '下午', '午后', '傍晚', '晚间', '深夜', '全天'];

const UNASSIGNED_LABEL = '未分配';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
let goalHistory = JSON.parse(localStorage.getItem(goalHistoryKey) || 'null') || null;
if (!goalHistory) {
  goalHistory = goalSettings ? [goalSettings] : [];
} else if (goalSettings) {
  const exists = goalHistory.some(g => g.month === goalSettings.month);
  if (!exists) goalHistory.unshift(goalSettings);
}
let selectedGoalMonth = goalHistory.length > 0 ? goalHistory[0].month : new Date().toISOString().slice(0, 7);
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
let anomalyRules = JSON.parse(localStorage.getItem(anomalyRulesKey) || 'null') || { ...DEFAULT_ANOMALY_RULES };
let showAnomalyRulesConfig = false;

function migrateIgnoredAnomalies() {
  if (ignoredAnomalies.length === 0) return;

  const isStringItem = ignoredAnomalies.some(item => typeof item === 'string');
  const missingStatus = ignoredAnomalies.some(item => typeof item === 'object' && item.status === undefined);

  if (!isStringItem && !missingStatus) return;

  const migrated = ignoredAnomalies.map(item => {
    if (typeof item === 'string') {
      return {
        id: item,
        status: 'active',
        ignoredAt: Date.now(),
        ruleSnapshot: JSON.parse(JSON.stringify(anomalyRules))
      };
    } else if (item.status === undefined) {
      return {
        ...item,
        status: 'active'
      };
    }
    return item;
  });

  ignoredAnomalies = migrated;
  localStorage.setItem(anomalyIgnoreKey, JSON.stringify(ignoredAnomalies));
}
migrateIgnoredAnomalies();

function migrateTariffEffectivePeriod() {
  let changed = false;
  const currentMonth = new Date().toISOString().slice(0, 7);

  const hasAnyValidPeriod = tariffs.some(t =>
    (t.startMonth !== undefined && t.startMonth !== null && t.startMonth !== '') ||
    (t.endMonth !== undefined && t.endMonth !== null && t.endMonth !== '')
  );

  tariffs.forEach(tariff => {
    const startMissing = tariff.startMonth === undefined || tariff.startMonth === null;
    const endMissing = tariff.endMonth === undefined || tariff.endMonth === null;

    if (startMissing) {
      if (hasAnyValidPeriod) {
        const earliestStart = tariffs
          .filter(t => t.startMonth)
          .map(t => t.startMonth)
          .sort()[0];
        tariff.startMonth = earliestStart || currentMonth;
      } else {
        tariff.startMonth = currentMonth;
      }
      changed = true;
    }
    if (endMissing) {
      tariff.endMonth = '';
      changed = true;
    }
  });

  if (tariffs.length > 0 && !tariffs.some(t => t.isDefault)) {
    tariffs[0].isDefault = true;
    changed = true;
  }

  if (changed) {
    localStorage.setItem(tariffKey, JSON.stringify(tariffs));
  }
}
migrateTariffEffectivePeriod();

function getEffectiveTariff(dateOrMonth) {
  const month = dateOrMonth.length === 10 ? dateOrMonth.slice(0, 7) : dateOrMonth;

  const withPeriod = tariffs.filter(t => t.startMonth || t.endMonth);
  const withoutPeriod = tariffs.filter(t => !t.startMonth && !t.endMonth);

  const sortedByStart = [...withPeriod].sort((a, b) => {
    const aStart = a.startMonth || '';
    const bStart = b.startMonth || '';
    return bStart.localeCompare(aStart);
  });

  for (const tariff of sortedByStart) {
    const start = tariff.startMonth || '';
    const end = tariff.endMonth || '';
    if (start && month < start) continue;
    if (end && month > end) continue;
    return tariff;
  }

  if (withoutPeriod.length > 0) {
    return withoutPeriod.find(t => t.isDefault) || withoutPeriod[0];
  }

  return tariffs.find(t => t.isDefault) || tariffs[0] || null;
}

function getEffectiveTariffPrice(dateOrMonth) {
  const tariff = getEffectiveTariff(dateOrMonth);
  if (tariff) return tariff.flatPrice;
  return priceSettings.price;
}

function calculateRecordCostWithEffectiveTariff(record) {
  const tariff = getEffectiveTariff(record.date);
  if (!tariff) return { kwh: kwh(record), tier: 'flat', price: priceSettings.price, cost: kwh(record) * priceSettings.price, tariff };
  return { ...calculateRecordCost(record, tariff), tariff };
}

let scheduleTasks = JSON.parse(localStorage.getItem(scheduleTaskKey) || 'null') || scheduleTaskSeed;
let scheduleResult = JSON.parse(localStorage.getItem(scheduleResultKey) || 'null');
let scheduleConfig = JSON.parse(localStorage.getItem(scheduleConfigKey) || 'null') || scheduleConfigSeed;
let editingScheduleTaskId = null;

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
  includeIgnoredAnomalies: true,
  includeAnomalyRules: true,
  includeScheduleTasks: true,
  includeScheduleConfig: true
};

let generatedSuggestions = [];
let suggestionFilterType = 'all';

function getBackupSourceData() {
  return {
    records,
    appliances,
    members,
    priceSettings,
    goalSettings,
    tariffs,
    slotMapping,
    ignoredAnomalies,
    anomalyRules,
    scheduleTasks,
    scheduleConfig
  };
}

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
        <h2>🎯 节能目标</h2>
        <div class="goalActions">
          <div class="goalMonthNav">
            <button id="goalPrevMonth" class="goalNavBtn" title="上一月">‹</button>
            <span id="goalMonthLabel" class="goalMonthLabel"></span>
            <button id="goalNextMonth" class="goalNavBtn" title="下一月">›</button>
          </div>
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
          <button id="anomalyRulesBtn" class="primary">规则设置</button>
          <button id="toggleIgnoredBtn">显示已忽略</button>
          <button id="clearIgnoredBtn" style="background:#fee2e2; color:#dc2626;">清除忽略记录</button>
        </div>
      </div>
      <div id="anomalyRulesContainer" style="display:none; margin-top:16px;"></div>
      <div id="anomalyStats" class="anomalyStats"></div>
      <div id="anomalyListContainer" style="margin-top:16px;"></div>
    </section>

    <section class="panel" id="suggestionCenterSection">
      <div class="panelHead">
        <h2>💡 节能建议中心</h2>
        <div class="suggestionActions">
          <button id="refreshSuggestionsBtn" class="primary">🔄 刷新建议</button>
        </div>
      </div>
      <p class="suggestionHint">系统基于最近30天用电记录、成员归因、异常检测和分时电价方案，自动生成个性化节能建议</p>
      <div id="suggestionStatsContainer" class="suggestionStats"></div>
      <div id="suggestionFilters" class="suggestionFilters" style="display:none;">
        <label class="suggestionFilterLabel">筛选类型：</label>
        <button class="suggestionFilterBtn active" data-filter-type="all">全部</button>
        <button class="suggestionFilterBtn" data-filter-type="appliance">🔌 电器优化</button>
        <button class="suggestionFilterBtn" data-filter-type="schedule">🕐 时段转移</button>
        <button class="suggestionFilterBtn" data-filter-type="member">👨‍👩‍👧 成员行为</button>
        <button class="suggestionFilterBtn" data-filter-type="anomaly">⚠️ 异常修正</button>
      </div>
      <div id="suggestionListContainer" style="margin-top:16px;"></div>
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
        <div style="margin-top:16px; display:flex; gap:12px; justify-content:flex-end; flex-wrap:wrap;">
          <div id="duplicateOptions" class="duplicateOptions" style="display:none; width:100%; margin-bottom:12px; padding:14px 16px; background:#fff7ed; border:1px solid #fdba74; border-radius:8px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
              <span style="font-size:18px;">⚠️</span>
              <span style="font-weight:600; color:#9a3412;">检测到 <span id="duplicateCountLabel">0</span> 条疑似重复记录，请选择处理方式：</span>
            </div>
            <div style="display:flex; gap:24px; flex-wrap:wrap;">
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer; color:#7c2d12;">
                <input type="radio" name="duplicateAction" value="skip" checked />
                <span>跳过重复记录（推荐）</span>
              </label>
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer; color:#7c2d12;">
                <input type="radio" name="duplicateAction" value="import" />
                <span>仍然导入所有记录</span>
              </label>
            </div>
          </div>
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
          <option>清晨</option><option>上午</option><option>午间</option><option>下午</option><option>午后</option><option>傍晚</option><option>晚间</option><option>深夜</option><option>全天</option>
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
            <option>清晨</option><option>上午</option><option>午间</option><option>下午</option><option>午后</option><option>傍晚</option><option>晚间</option><option>深夜</option><option>全天</option>
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
          <div class="tariffFormRow">
            <label>
              <span>生效起始月份</span>
              <input name="startMonth" type="month" />
              <small style="font-size:11px;color:#6b7280;">留空表示不限制起始月份</small>
            </label>
            <label>
              <span>生效结束月份</span>
              <input name="endMonth" type="month" />
              <small style="font-size:11px;color:#6b7280;">留空表示持续生效至今</small>
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

    <section class="panel" id="scheduleOptimizerSection">
      <div class="panelHead">
        <h2>🕐 用电排程优化</h2>
        <div class="scheduleActions">
          <button id="scheduleConfigBtn" class="primary" style="background:#64748b;">⚙️ 排程配置</button>
          <button id="addScheduleTaskBtn" class="primary">新增排程任务</button>
          <button id="generateScheduleBtn" class="primary">生成建议排程</button>
        </div>
      </div>
      <p class="scheduleHint">配置可调整的电器任务，系统将根据分时电价自动生成跨天最低费用排程（支持跨午夜任务与不可运行时段）</p>
      <div id="scheduleConfigContainer" style="display:none; margin-top:16px;">
        <div class="scheduleConfigForm">
          <h3>排程全局配置</h3>
          <div class="scheduleTaskFormRow">
            <label>
              <span>最大同时运行功率 (W)</span>
              <input type="number" id="maxConcurrentPowerInput" min="1000" step="100" placeholder="例如：8800" required />
            </label>
          </div>
          <div class="scheduleTaskFormRow" style="justify-content:flex-end;">
            <button type="button" id="cancelScheduleConfigBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:11px 24px;">取消</button>
            <button type="button" id="saveScheduleConfigBtn" class="primary">保存配置</button>
          </div>
        </div>
      </div>
      <div id="scheduleTaskFormContainer" style="display:none; margin-top:16px;">
        <form id="scheduleTaskForm" class="scheduleTaskForm">
          <h3 id="scheduleTaskFormTitle">新增排程任务</h3>
          <div class="scheduleTaskFormRow">
            <label>
              <span>电器名称</span>
              <input name="appliance" type="text" placeholder="例如：洗衣机" required />
            </label>
            <label>
              <span>功率 (W)</span>
              <input name="watts" type="number" min="1" step="1" placeholder="420" required />
            </label>
          </div>
          <div class="scheduleTaskFormRow">
            <label>
              <span>预计时长 (h)</span>
              <input name="duration" type="number" min="0.5" step="0.5" placeholder="1" required />
            </label>
            <label>
              <span>适用电价方案</span>
              <select name="tariffId" id="scheduleTariffSelect"></select>
            </label>
          </div>
          <div class="scheduleTaskFormRow">
            <label>
              <span>最早开始时间</span>
              <input name="earliestStart" type="time" />
              <small style="font-size:11px;color:#6b7280;">留空则默认为 00:00</small>
            </label>
            <label>
              <span>最晚完成时间</span>
              <input name="deadline" type="text" placeholder="例如：18:00 或 +06:00（次日）" required />
              <small style="font-size:11px;color:#6b7280;">格式：HH:MM 当天；+HH:MM 次日（跨午夜）</small>
            </label>
          </div>
          <div class="scheduleTaskFormRow">
            <label style="grid-column: 1 / -1;">
              <span>禁止运行时间段（多个用逗号分隔）</span>
              <input name="forbiddenRanges" type="text" placeholder="例如：12:00-14:00,19:00-21:00" />
              <small style="font-size:11px;color:#6b7280;">格式：HH:MM-HH:MM，任务将避开这些时段运行</small>
            </label>
          </div>
          <div class="scheduleTaskFormRow" style="justify-content:flex-end;">
            <button type="button" id="cancelScheduleTaskBtn" style="background:#e4ecff; border:0; border-radius:6px; padding:11px 24px;">取消</button>
            <button type="submit" class="primary">保存任务</button>
          </div>
        </form>
      </div>
      <div id="scheduleTaskListContainer" style="margin-top:16px;">
        <div class="tableWrap"><table class="scheduleTaskTable">
          <thead>
            <tr>
              <th>电器</th>
              <th>功率</th>
              <th>时长</th>
              <th>最早开始</th>
              <th>最晚完成</th>
              <th>禁止运行时段</th>
              <th>电价方案</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="scheduleTaskRows"></tbody>
        </table></div>
      </div>
      <div id="scheduleResultSection" style="display:none; margin-top:24px;">
        <div class="panelHead" style="margin-bottom:12px;">
          <h3 style="margin:0;">📋 建议排程方案</h3>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <span style="font-size:12px; color:#64748b;">当前最大功率限制：<strong id="currentMaxPowerHint">8800W</strong></span>
            <span id="scheduleSavingsHint" style="font-size:13px; color:#16a34a; font-weight:600;"></span>
            <button id="applyScheduleBtn" class="primary" style="background:#16a34a;">转为用电记录</button>
          </div>
        </div>
        <div id="scheduleTimelineContainer" class="scheduleTimelineContainer"></div>
        <div class="tableWrap" style="margin-top:16px;"><table class="scheduleResultTable">
          <thead>
            <tr>
              <th>电器</th>
              <th>建议开始</th>
              <th>建议结束</th>
              <th>跨天</th>
              <th>时段类型</th>
              <th>耗电</th>
              <th>预估费用</th>
            </tr>
          </thead>
          <tbody id="scheduleResultRows"></tbody>
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
      <div class="filterBar" id="filterBar">
        <div class="filterItem">
          <label>月份</label>
          <select id="filterMonth">
            <option value="">全部月份</option>
          </select>
        </div>
        <div class="filterItem">
          <label>成员</label>
          <select id="filterMember">
            <option value="">全部成员</option>
          </select>
        </div>
        <div class="filterItem">
          <label>时段</label>
          <select id="filterSlot">
            <option value="">全部时段</option>
            <option>清晨</option><option>上午</option><option>午间</option><option>下午</option><option>午后</option><option>傍晚</option><option>晚间</option><option>深夜</option><option>全天</option>
          </select>
        </div>
        <div class="filterItem">
          <label>电器</label>
          <select id="filterAppliance">
            <option value="">全部电器</option>
          </select>
        </div>
        <button id="resetFilters" class="filterResetBtn">重置筛选</button>
      </div>
      <div class="filterResultBar" id="filterResultBar">
        <span class="filterResultText">
          共找到 <strong id="filterResultCount">0</strong> 条记录，
          总耗电 <strong id="filterResultTotal">0</strong> kWh
        </span>
        <span class="filterActiveTags" id="filterActiveTags"></span>
      </div>
      <div class="tableWrap"><table><thead><tr><th id="selectAllHeader" style="display:none;"><input type="checkbox" id="selectAllCheckbox" /></th><th>日期</th><th>电器</th><th>成员</th><th>时段</th><th>耗电</th><th>备注</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
      <div id="emptyState" class="emptyState" style="display:none;">
        <span class="emptyStateIcon">🔍</span>
        <p class="emptyStateTitle">没有找到匹配的记录</p>
        <p class="emptyStateHint">试试调整筛选条件，或清除筛选查看全部记录</p>
        <div class="emptyStateFilters" id="emptyStateFilters"></div>
        <button id="emptyResetBtn" class="filterResetBtn">清除所有筛选</button>
      </div>
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
const confirmModalOverlay = document.querySelector('#confirmModalOverlay');
const confirmModal = document.querySelector('#confirmModal');

const filterMonth = document.querySelector('#filterMonth');
const filterMember = document.querySelector('#filterMember');
const filterSlot = document.querySelector('#filterSlot');
const filterAppliance = document.querySelector('#filterAppliance');
const resetFiltersBtn = document.querySelector('#resetFilters');
const emptyState = document.querySelector('#emptyState');
const filterResultBar = document.querySelector('#filterResultBar');
const filterResultCount = document.querySelector('#filterResultCount');
const filterResultTotal = document.querySelector('#filterResultTotal');
const filterActiveTags = document.querySelector('#filterActiveTags');
const emptyStateFilters = document.querySelector('#emptyStateFilters');
const emptyResetBtn = document.querySelector('#emptyResetBtn');

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
const anomalyRulesContainer = document.querySelector('#anomalyRulesContainer');
const anomalyRulesBtn = document.querySelector('#anomalyRulesBtn');
const toggleIgnoredBtn = document.querySelector('#toggleIgnoredBtn');
const clearIgnoredBtn = document.querySelector('#clearIgnoredBtn');

priceForm.elements.price.value = priceSettings.price;
priceForm.elements.month.value = priceSettings.month;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const item = { ...data, hours: Number(data.hours), watts: Number(data.watts), id: editingId || crypto.randomUUID() };
  delete item.applianceSelect;

  const isNewRecord = !editingId;
  const applianceName = item.appliance.trim();
  const applianceWatts = item.watts;
  const applianceSlot = item.slot;

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

  if (isNewRecord && applianceName) {
    const existingAppliance = appliances.find(a => a.name.trim() === applianceName);
    if (!existingAppliance) {
      setTimeout(() => {
        showConfirmDialog({
          title: '加入电器档案',
          message: `电器「${applianceName}」不在档案中。是否将其加入电器档案？`,
          icon: '📦',
          details: [
            { label: '功率', value: `${applianceWatts}W` },
            { label: '默认时段', value: applianceSlot || '未设置' }
          ],
          confirmText: '加入档案',
          cancelText: '暂不加入',
          onConfirm: () => {
            const newAppliance = {
              id: crypto.randomUUID(),
              name: applianceName,
              watts: applianceWatts,
              slot: applianceSlot || '',
              note: ''
            };
            appliances = [newAppliance, ...appliances];
            save();
            render();
            showToast('success', '已加入档案', `电器「${applianceName}」已成功加入电器档案`);
          }
        });
      }, 100);
    }
  }
});

function getLastMemberForAppliance(applianceName) {
  const applianceRecords = records.filter(r => r.appliance === applianceName && r.member);
  if (applianceRecords.length === 0) return '';
  applianceRecords.sort((a, b) => b.date.localeCompare(a.date));
  return applianceRecords[0].member;
}

applianceSelect.addEventListener('change', (event) => {
  const selectedId = event.target.value;
  if (!selectedId) return;
  const appliance = appliances.find((a) => a.id === selectedId);
  if (appliance) {
    form.elements.appliance.value = appliance.name;
    form.elements.watts.value = appliance.watts;
    form.elements.slot.value = appliance.slot;
    const lastMember = getLastMemberForAppliance(appliance.name);
    if (lastMember) {
      form.elements.member.value = lastMember;
    }
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
  const filtered = getFilteredRecords();
  if (e.target.checked) {
    selectedRecordIds = filtered.map(r => r.id);
  } else {
    selectedRecordIds = [];
  }
  render();
});

search.addEventListener('input', render);
filterMonth.addEventListener('change', render);
filterMember.addEventListener('change', render);
filterSlot.addEventListener('change', render);
filterAppliance.addEventListener('change', render);
function resetAllFilters() {
  search.value = '';
  filterMonth.value = '';
  filterMember.value = '';
  filterSlot.value = '';
  filterAppliance.value = '';
  render();
}

resetFiltersBtn.addEventListener('click', resetAllFilters);
emptyResetBtn.addEventListener('click', resetAllFilters);
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
  goalForm.reset();
  const existingGoal = goalHistory.find(g => g.month === selectedGoalMonth);
  if (existingGoal) {
    goalForm.elements.month.value = existingGoal.month;
    goalForm.elements.target.value = existingGoal.target;
  } else {
    goalForm.elements.month.value = selectedGoalMonth;
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
  const newGoal = { month: data.month, target: targetValue };
  const existingIdx = goalHistory.findIndex(g => g.month === data.month);
  if (existingIdx !== -1) {
    goalHistory[existingIdx] = newGoal;
  } else {
    goalHistory.unshift(newGoal);
    goalHistory.sort((a, b) => b.month.localeCompare(a.month));
  }
  goalSettings = newGoal;
  selectedGoalMonth = data.month;
  localStorage.setItem(goalKey, JSON.stringify(goalSettings));
  localStorage.setItem(goalHistoryKey, JSON.stringify(goalHistory));
  lastNotifiedOverTarget = false;
  goalFormContainer.style.display = 'none';
  showToast('success', '目标已设置', `${data.month} 节能目标：${targetValue} kWh`);
  render();
});

document.querySelector('#goalPrevMonth').addEventListener('click', () => {
  const [year, month] = selectedGoalMonth.split('-').map(Number);
  const prev = new Date(year, month - 2, 1);
  selectedGoalMonth = prev.toISOString().slice(0, 7);
  render();
});

document.querySelector('#goalNextMonth').addEventListener('click', () => {
  const [year, month] = selectedGoalMonth.split('-').map(Number);
  const next = new Date(year, month, 1);
  selectedGoalMonth = next.toISOString().slice(0, 7);
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
    isValid: errors.length === 0,
    isDuplicate: false,
    duplicateWithExisting: false,
    duplicateWithCsv: false
  };
}

function generateRecordFingerprint(data) {
  if (!data.date || !data.appliance || !data.slot) return null;
  const hours = data.hours !== undefined && data.hours !== null ? Number(data.hours) : null;
  const watts = data.watts !== undefined && data.watts !== null ? Number(data.watts) : null;
  if (hours === null || isNaN(hours) || watts === null || isNaN(watts)) return null;
  return `${data.date}|${data.appliance.trim()}|${data.slot.trim()}|${hours}|${watts}`;
}

function detectDuplicates(validatedRows) {
  const csvFingerprints = new Map();
  const existingFingerprints = new Set();

  records.forEach(record => {
    const fp = generateRecordFingerprint(record);
    if (fp) existingFingerprints.add(fp);
  });

  validatedRows.forEach(row => {
    if (!row.isValid) return;
    const fp = generateRecordFingerprint(row.data);
    if (!fp) return;

    if (existingFingerprints.has(fp)) {
      row.isDuplicate = true;
      row.duplicateWithExisting = true;
      if (!row.warnings.includes('与现有用电记录重复')) {
        row.warnings.push('与现有用电记录重复');
      }
    }

    if (csvFingerprints.has(fp)) {
      const firstRow = csvFingerprints.get(fp);
      row.isDuplicate = true;
      row.duplicateWithCsv = true;
      firstRow.isDuplicate = true;
      firstRow.duplicateWithCsv = true;
      if (!row.warnings.includes('CSV文件内存在重复记录')) {
        row.warnings.push('CSV文件内存在重复记录');
      }
      if (!firstRow.warnings.includes('CSV文件内存在重复记录')) {
        firstRow.warnings.push('CSV文件内存在重复记录');
      }
    } else {
      csvFingerprints.set(fp, row);
    }
  });

  return validatedRows;
}

function renderCsvPreview(validatedRows) {
  const validCount = validatedRows.filter(r => r.isValid).length;
  const invalidCount = validatedRows.length - validCount;
  const duplicateCount = validatedRows.filter(r => r.isValid && r.isDuplicate).length;
  const validNonDuplicateCount = validCount - duplicateCount;

  csvStats.innerHTML = `
    <span class="stat total">共 ${validatedRows.length} 条记录</span>
    <span class="stat valid">有效 ${validNonDuplicateCount} 条</span>
    <span class="stat duplicate">疑似重复 ${duplicateCount} 条</span>
    <span class="stat invalid">无效 ${invalidCount} 条</span>
  `;

  csvPreviewRows.innerHTML = validatedRows.map(row => {
    const allErrors = [...row.errors, ...row.warnings].join('；');
    let statusClass;
    let statusText;
    let rowClass = '';
    if (!row.isValid) {
      statusClass = 'invalid';
      statusText = '无效';
    } else if (row.isDuplicate) {
      statusClass = 'duplicate';
      statusText = '疑似重复';
      rowClass = 'row-duplicate';
    } else {
      statusClass = 'valid';
      statusText = '有效';
    }

    return `
      <tr class="${rowClass}">
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

  const duplicateOptions = document.querySelector('#duplicateOptions');
  const duplicateCountLabel = document.querySelector('#duplicateCountLabel');
  if (duplicateCount > 0) {
    duplicateOptions.style.display = 'block';
    duplicateCountLabel.textContent = duplicateCount;
  } else {
    duplicateOptions.style.display = 'none';
  }
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
      const withDuplicates = detectDuplicates(validated);
      parsedCsvData = withDuplicates;
      renderCsvPreview(withDuplicates);
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

  const duplicateRows = validRows.filter(r => r.isDuplicate);
  const duplicateAction = document.querySelector('input[name="duplicateAction"]:checked')?.value || 'skip';

  let rowsToImport;
  let skippedDuplicateCount = 0;

  if (duplicateRows.length > 0 && duplicateAction === 'skip') {
    rowsToImport = validRows.filter(r => !r.isDuplicate);
    skippedDuplicateCount = duplicateRows.length;
  } else {
    rowsToImport = validRows;
  }

  if (rowsToImport.length === 0) {
    alert('没有可导入的记录（所有有效记录均为重复记录，已全部跳过）');
    return;
  }

  const newRecords = rowsToImport.map(r => ({
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
  let message = `成功导入 ${rowsToImport.length} 条记录`;
  const details = [];
  if (invalidCount > 0) details.push(`${invalidCount} 条无效记录已跳过`);
  if (skippedDuplicateCount > 0) details.push(`${skippedDuplicateCount} 条重复记录已跳过`);
  if (duplicateRows.length > 0 && duplicateAction === 'import') details.push(`${duplicateRows.length} 条重复记录已导入`);
  if (details.length > 0) message += `\n${details.join('\n')}`;
  alert(message);

  parsedCsvData = [];
  csvPreviewContainer.style.display = 'none';
  csvDropZone.style.display = 'block';
  csvFileInput.value = '';
  document.querySelector('#duplicateOptions').style.display = 'none';
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

  if (data.startMonth && data.endMonth && data.startMonth > data.endMonth) {
    showToast('error', '生效期无效', '开始月份不能晚于结束月份');
    return;
  }

  if (data.startMonth || data.endMonth) {
    const hasOverlap = tariffs.some(t => {
      if (editingTariffId && t.id === editingTariffId) return false;
      const tStart = t.startMonth || '';
      const tEnd = t.endMonth || '';
      const newStart = data.startMonth || '';
      const newEnd = data.endMonth || '';

      function overlaps(aStart, aEnd, bStart, bEnd) {
        const effAStart = aStart || '0000-00';
        const effAEnd = aEnd || '9999-99';
        const effBStart = bStart || '0000-00';
        const effBEnd = bEnd || '9999-99';
        return effAStart <= effBEnd && effBStart <= effAEnd;
      }
      return overlaps(newStart, newEnd, tStart, tEnd);
    });

    if (hasOverlap) {
      if (!confirm('检测到与其他电价方案的生效期存在重叠，重叠期间将优先使用起始月份较晚的方案。是否继续保存？')) {
        return;
      }
    }
  }

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
    isDefault: data.isDefault === 'on',
    startMonth: data.startMonth || '',
    endMonth: data.endMonth || ''
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

document.querySelector('#addScheduleTaskBtn').addEventListener('click', function() {
  editingScheduleTaskId = null;
  document.querySelector('#scheduleTaskForm').reset();
  document.querySelector('#scheduleTaskFormTitle').textContent = '新增排程任务';
  document.querySelector('#scheduleTaskFormContainer').style.display = 'block';
  renderScheduleTariffSelect();
});

document.querySelector('#cancelScheduleTaskBtn').addEventListener('click', function() {
  editingScheduleTaskId = null;
  document.querySelector('#scheduleTaskForm').reset();
  document.querySelector('#scheduleTaskFormContainer').style.display = 'none';
});

document.querySelector('#scheduleTaskForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(this).entries());

  const forbiddenRanges = data.forbiddenRanges
    ? data.forbiddenRanges.split(/[,，]/).map(s => s.trim()).filter(Boolean)
    : [];

  const item = {
    id: editingScheduleTaskId || crypto.randomUUID(),
    appliance: data.appliance,
    watts: Number(data.watts),
    duration: Number(data.duration),
    deadline: data.deadline,
    earliestStart: data.earliestStart || '00:00',
    forbiddenRanges: forbiddenRanges,
    tariffId: data.tariffId || ''
  };
  scheduleTasks = editingScheduleTaskId
    ? scheduleTasks.map(function(t) { return t.id === editingScheduleTaskId ? item : t; })
    : [item, ...scheduleTasks];
  editingScheduleTaskId = null;
  this.reset();
  document.querySelector('#scheduleTaskFormContainer').style.display = 'none';
  scheduleResult = null;
  localStorage.setItem(scheduleResultKey, JSON.stringify(null));
  localStorage.setItem(scheduleTaskKey, JSON.stringify(scheduleTasks));
  renderScheduleTaskList();
  renderScheduleResult();
});

document.querySelector('#scheduleConfigBtn').addEventListener('click', function() {
  document.querySelector('#maxConcurrentPowerInput').value = scheduleConfig.maxConcurrentPower;
  document.querySelector('#scheduleConfigContainer').style.display = 'block';
});

document.querySelector('#cancelScheduleConfigBtn').addEventListener('click', function() {
  document.querySelector('#scheduleConfigContainer').style.display = 'none';
});

document.querySelector('#saveScheduleConfigBtn').addEventListener('click', function() {
  const maxPower = Number(document.querySelector('#maxConcurrentPowerInput').value);
  if (!maxPower || maxPower < 1000) {
    showToast('error', '配置无效', '最大同时运行功率不能小于1000W');
    return;
  }
  scheduleConfig.maxConcurrentPower = maxPower;
  localStorage.setItem(scheduleConfigKey, JSON.stringify(scheduleConfig));
  document.querySelector('#scheduleConfigContainer').style.display = 'none';
  scheduleResult = null;
  localStorage.setItem(scheduleResultKey, JSON.stringify(null));
  renderScheduleResult();
  showToast('success', '配置已保存', `最大同时运行功率已设为 ${maxPower}W`);
});

document.querySelector('#generateScheduleBtn').addEventListener('click', generateSchedule);
document.querySelector('#applyScheduleBtn').addEventListener('click', applyScheduleToRecords);

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

anomalyRulesBtn.addEventListener('click', () => {
  showAnomalyRulesConfig = !showAnomalyRulesConfig;
  anomalyRulesBtn.textContent = showAnomalyRulesConfig ? '收起设置' : '规则设置';
  anomalyRulesBtn.style.background = showAnomalyRulesConfig ? '#64748b' : '';
  anomalyRulesContainer.style.display = showAnomalyRulesConfig ? 'block' : 'none';
  if (showAnomalyRulesConfig) {
    renderAnomalyRulesConfig();
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
  return ignoredAnomalies.some(item => item.id === anomalyId && item.status === 'active');
}

function getIgnoredAnomalyRecord(anomalyId) {
  return ignoredAnomalies.find(item => item.id === anomalyId);
}

function ignoreAnomaly(anomalyId) {
  const existing = getIgnoredAnomalyRecord(anomalyId);
  if (existing) {
    existing.status = 'active';
    existing.ignoredAt = Date.now();
    existing.ruleSnapshot = JSON.parse(JSON.stringify(anomalyRules));
    delete existing.reevaluatedAt;
    delete existing.newRuleSnapshot;
  } else {
    ignoredAnomalies.push({
      id: anomalyId,
      status: 'active',
      ignoredAt: Date.now(),
      ruleSnapshot: JSON.parse(JSON.stringify(anomalyRules))
    });
  }
  localStorage.setItem(anomalyIgnoreKey, JSON.stringify(ignoredAnomalies));
}

function unignoreAnomaly(anomalyId) {
  ignoredAnomalies = ignoredAnomalies.filter(item => item.id !== anomalyId);
  localStorage.setItem(anomalyIgnoreKey, JSON.stringify(ignoredAnomalies));
}

function haveRulesChanged(oldRules, newRules) {
  const types = ['highSingleUsage', 'dailySpike', 'abnormalDuration'];
  for (const type of types) {
    if (!oldRules[type] || !newRules[type]) return true;
    if (oldRules[type].enabled !== newRules[type].enabled) return true;
    if (oldRules[type].sensitivity !== newRules[type].sensitivity) return true;
  }
  return false;
}

function reevaluateIgnoredAnomalies(oldRules) {
  if (!oldRules || !haveRulesChanged(oldRules, anomalyRules)) return 0;
  let reevaluatedCount = 0;
  ignoredAnomalies.forEach(item => {
    if (item.status !== 'active') return;
    const itemRules = item.ruleSnapshot || oldRules;
    if (haveRulesChanged(itemRules, anomalyRules)) {
      item.status = 'reevaluated';
      item.reevaluatedAt = Date.now();
      item.newRuleSnapshot = JSON.parse(JSON.stringify(anomalyRules));
      reevaluatedCount++;
    }
  });
  if (reevaluatedCount > 0) {
    localStorage.setItem(anomalyIgnoreKey, JSON.stringify(ignoredAnomalies));
  }
  return reevaluatedCount;
}

function saveAnomalyRules() {
  localStorage.setItem(anomalyRulesKey, JSON.stringify(anomalyRules));
}

function renderAnomalyRulesConfig() {
  const ruleTypes = [
    { key: 'highSingleUsage', label: '单次耗电偏高', icon: '⚡', desc: '检测某电器单次耗电量明显高于历史均值' },
    { key: 'dailySpike', label: '日耗电突增', icon: '📈', desc: '检测某一天的总耗电量明显高于历史日均' },
    { key: 'abnormalDuration', label: '使用时长异常', icon: '⏰', desc: '检测某电器使用时长明显高于历史均值' }
  ];
  const sensitivityOptions = [
    { value: 'low', label: '低敏感', hint: '需要偏离更多才会触发' },
    { value: 'medium', label: '中敏感', hint: '平衡检测精度与误报率' },
    { value: 'high', label: '高敏感', hint: '小幅偏离即可触发，误报可能增多' }
  ];

  const rulesHtml = ruleTypes.map(rule => {
    const config = anomalyRules[rule.key];
    const sensHtml = sensitivityOptions.map(opt => `
      <label class="sensOption ${config.sensitivity === opt.value ? 'selected' : ''}">
        <input type="radio" name="sens_${rule.key}" value="${opt.value}" ${config.sensitivity === opt.value ? 'checked' : ''} />
        <span>
          <strong>${opt.label}</strong>
          <em>${opt.hint}</em>
        </span>
      </label>
    `).join('');
    return `
      <div class="anomalyRuleCard">
        <div class="anomalyRuleHead">
          <label class="anomalyRuleToggle">
            <input type="checkbox" data-rule-enable="${rule.key}" ${config.enabled ? 'checked' : ''} />
            <span class="toggleTrack"><span class="toggleThumb"></span></span>
            <span class="ruleIcon">${rule.icon}</span>
            <span class="ruleLabel">${rule.label}</span>
          </label>
        </div>
        <p class="anomalyRuleDesc">${rule.desc}</p>
        <div class="anomalySensGroup" ${config.enabled ? '' : 'style="opacity:0.5; pointer-events:none;"'}>
          <span class="sensGroupLabel">敏感度：</span>
          ${sensHtml}
        </div>
      </div>
    `;
  }).join('');

  anomalyRulesContainer.innerHTML = `
    <div class="anomalyRulesWrap">
      <div class="anomalyRulesHint">
        <span class="hintIcon">💡</span>
        <span>调整敏感度后，之前已忽略的异常会根据新规则重新评估，不再符合条件的将自动恢复显示。</span>
      </div>
      ${rulesHtml}
      <div class="anomalyRulesActions">
        <button id="resetAnomalyRulesBtn" class="anomalyRuleReset">恢复默认</button>
        <button id="saveAnomalyRulesBtn" class="primary">保存规则</button>
      </div>
    </div>
  `;

  anomalyRulesContainer.querySelectorAll('[data-rule-enable]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const key = e.target.dataset.ruleEnable;
      const card = e.target.closest('.anomalyRuleCard');
      const sensGroup = card.querySelector('.anomalySensGroup');
      if (e.target.checked) {
        sensGroup.style.opacity = '1';
        sensGroup.style.pointerEvents = 'auto';
      } else {
        sensGroup.style.opacity = '0.5';
        sensGroup.style.pointerEvents = 'none';
      }
    });
  });

  anomalyRulesContainer.querySelectorAll('.sensOption input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const parent = e.target.closest('.sensOption').parentNode;
      parent.querySelectorAll('.sensOption').forEach(opt => opt.classList.remove('selected'));
      e.target.closest('.sensOption').classList.add('selected');
    });
  });

  document.querySelector('#resetAnomalyRulesBtn').addEventListener('click', () => {
    if (confirm('确定要将异常检测规则恢复为默认设置吗？')) {
      anomalyRules = JSON.parse(JSON.stringify(DEFAULT_ANOMALY_RULES));
      renderAnomalyRulesConfig();
      showToast('info', '已重置', '规则已恢复为默认设置，请点击保存生效');
    }
  });

  document.querySelector('#saveAnomalyRulesBtn').addEventListener('click', () => {
    const oldRules = JSON.parse(JSON.stringify(anomalyRules));
    ruleTypes.forEach(rule => {
      const enableCheckbox = anomalyRulesContainer.querySelector(`[data-rule-enable="${rule.key}"]`);
      const sensRadio = anomalyRulesContainer.querySelector(`input[name="sens_${rule.key}"]:checked`);
      anomalyRules[rule.key] = {
        enabled: enableCheckbox.checked,
        sensitivity: sensRadio.value
      };
    });
    saveAnomalyRules();
    const reevaluated = reevaluateIgnoredAnomalies(oldRules);
    showToast('success', '保存成功', reevaluated > 0
      ? `规则已保存，${reevaluated} 条已忽略异常已重新评估`
      : '规则已保存');
    render();
  });
}

function detectHighSingleUsage(sourceRecords = records) {
  const anomalies = [];
  const rule = anomalyRules.highSingleUsage;
  if (!rule || !rule.enabled) return anomalies;

  const sens = ANOMALY_SENSITIVITY_MAP[rule.sensitivity] || ANOMALY_SENSITIVITY_MAP.medium;
  const applianceRecords = new Map();

  sourceRecords.forEach(record => {
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
    const threshold = mean + sens.stdDevMultiplier * stdDev;
    const minRatio = sens.minRatioMultiplier;

    applianceRecs.forEach(record => {
      const recordKwh = kwh(record);
      if (recordKwh > threshold && recordKwh > mean * minRatio) {
        const anomalyId = getAnomalyId('high-single', record.id);
        if (!showIgnoredAnomalies && isAnomalyIgnored(anomalyId)) return;

        const deviation = ((recordKwh / mean - 1) * 100).toFixed(0);
        const deviationAmount = (recordKwh - mean).toFixed(2);

        anomalies.push({
          id: anomalyId,
          type: 'high-single',
          typeLabel: '单次耗电偏高',
          severity: recordKwh > mean * 2 ? 'high' : 'medium',
          record,
          recordId: record.id,
          date: record.date,
          appliance: record.appliance,
          message: `${record.appliance} 单次耗电 ${recordKwh.toFixed(2)}kWh，超出平均值 ${deviation}%`,
          details: `该电器历史平均耗电：${mean.toFixed(2)}kWh，异常阈值：${threshold.toFixed(2)}kWh`,
          stats: {
            unit: 'kWh',
            currentValue: recordKwh,
            meanValue: mean,
            thresholdValue: threshold,
            deviationPercent: Number(deviation),
            deviationAmount: Number(deviationAmount),
            sensitivity: rule.sensitivity,
            sensitivityLabel: sens.label
          },
          ignored: isAnomalyIgnored(anomalyId)
        });
      }
    });
  });

  return anomalies;
}

function detectDailySpike(sourceRecords = records) {
  const anomalies = [];
  const rule = anomalyRules.dailySpike;
  if (!rule || !rule.enabled) return anomalies;

  const sens = ANOMALY_SENSITIVITY_MAP[rule.sensitivity] || ANOMALY_SENSITIVITY_MAP.medium;
  const dailyTotals = new Map();

  sourceRecords.forEach(record => {
    const current = dailyTotals.get(record.date) || 0;
    dailyTotals.set(record.date, current + kwh(record));
  });

  const totals = Array.from(dailyTotals.values()).sort((a, b) => a - b);
  if (totals.length < 2) return anomalies;

  const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
  const variance = totals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totals.length;
  const stdDev = Math.sqrt(variance);
  const threshold = mean + sens.stdDevMultiplier * stdDev;
  const minRatio = sens.minRatioMultiplier;

  dailyTotals.forEach((total, date) => {
    if (total > threshold && total > mean * minRatio) {
      const dayRecords = sourceRecords.filter(r => r.date === date);
      const anomalyId = getAnomalyId('daily-spike', null, date);
      if (!showIgnoredAnomalies && isAnomalyIgnored(anomalyId)) return;

      const deviation = ((total / mean - 1) * 100).toFixed(0);
      const deviationAmount = (total - mean).toFixed(2);

      anomalies.push({
        id: anomalyId,
        type: 'daily-spike',
        typeLabel: '日耗电突增',
        severity: total > mean * 2 ? 'high' : 'medium',
        date,
        recordIds: dayRecords.map(r => r.id),
        message: `${date} 总耗电 ${total.toFixed(2)}kWh，超出日均 ${deviation}%`,
        details: `历史日均耗电：${mean.toFixed(2)}kWh，异常阈值：${threshold.toFixed(2)}kWh，当日记录：${dayRecords.length}条`,
        stats: {
          unit: 'kWh',
          currentValue: total,
          meanValue: mean,
          thresholdValue: threshold,
          deviationPercent: Number(deviation),
          deviationAmount: Number(deviationAmount),
          sensitivity: rule.sensitivity,
          sensitivityLabel: sens.label
        },
        ignored: isAnomalyIgnored(anomalyId)
      });
    }
  });

  return anomalies;
}

function detectAbnormalDuration(sourceRecords = records) {
  const anomalies = [];
  const rule = anomalyRules.abnormalDuration;
  if (!rule || !rule.enabled) return anomalies;

  const sens = ANOMALY_SENSITIVITY_MAP[rule.sensitivity] || ANOMALY_SENSITIVITY_MAP.medium;
  const applianceRecords = new Map();

  sourceRecords.forEach(record => {
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
    const threshold = mean + sens.stdDevMultiplier * stdDev;
    const minRatio = sens.minRatioMultiplier;

    applianceRecs.forEach(record => {
      if (record.hours > threshold && record.hours > mean * minRatio) {
        const anomalyId = getAnomalyId('duration', record.id);
        if (!showIgnoredAnomalies && isAnomalyIgnored(anomalyId)) return;

        const deviation = ((record.hours / mean - 1) * 100).toFixed(0);
        const deviationAmount = (record.hours - mean).toFixed(1);

        anomalies.push({
          id: anomalyId,
          type: 'duration',
          typeLabel: '使用时长异常',
          severity: record.hours > mean * 2 ? 'high' : 'medium',
          record,
          recordId: record.id,
          date: record.date,
          appliance: record.appliance,
          message: `${record.appliance} 使用时长 ${record.hours.toFixed(1)}小时，超出平均值 ${deviation}%`,
          details: `该电器历史平均时长：${mean.toFixed(1)}小时，异常阈值：${threshold.toFixed(1)}小时`,
          stats: {
            unit: '小时',
            currentValue: record.hours,
            meanValue: mean,
            thresholdValue: threshold,
            deviationPercent: Number(deviation),
            deviationAmount: Number(deviationAmount),
            sensitivity: rule.sensitivity,
            sensitivityLabel: sens.label
          },
          ignored: isAnomalyIgnored(anomalyId)
        });
      }
    });
  });

  return anomalies;
}

function getAllAnomalies(sourceRecords = records) {
  return [
    ...detectHighSingleUsage(sourceRecords),
    ...detectDailySpike(sourceRecords),
    ...detectAbnormalDuration(sourceRecords)
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
    const hasStats = anomaly.stats && Object.keys(anomaly.stats).length > 0;

    let statsHtml = '';
    if (hasStats) {
      const s = anomaly.stats;
      const displayDeviation = s.deviationAmount > 0 ? `+${s.deviationAmount}${s.unit}` : `${s.deviationAmount}${s.unit}`;
      statsHtml = `
        <div class="anomalyStatsGrid">
          <div class="anomalyStatItem">
            <span class="anomalyStatLabel">本次数值</span>
            <span class="anomalyStatValue current">${s.currentValue.toFixed(s.unit === '小时' ? 1 : 2)}${s.unit}</span>
          </div>
          <div class="anomalyStatItem">
            <span class="anomalyStatLabel">历史均值</span>
            <span class="anomalyStatValue">${s.meanValue.toFixed(s.unit === '小时' ? 1 : 2)}${s.unit}</span>
          </div>
          <div class="anomalyStatItem">
            <span class="anomalyStatLabel">触发阈值</span>
            <span class="anomalyStatValue threshold">${s.thresholdValue.toFixed(s.unit === '小时' ? 1 : 2)}${s.unit}</span>
          </div>
          <div class="anomalyStatItem">
            <span class="anomalyStatLabel">本次偏差</span>
            <span class="anomalyStatValue deviation">${displayDeviation} (${s.deviationPercent > 0 ? '+' : ''}${s.deviationPercent}%)</span>
          </div>
        </div>
        <div class="anomalySensTag">
          敏感度: ${s.sensitivityLabel}
        </div>
      `;
    }

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
          <p class="anomalyMessage">${escapeHtml(anomaly.message)}</p>
          ${statsHtml}
          <p class="anomalyDetails">${escapeHtml(anomaly.details)}</p>
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
      '<span class="mappingSlot">' + escapeHtml(slot) + '</span>' +
      '<select data-slot="' + escapeHtml(slot) + '">' +
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

  const currentMonth = new Date().toISOString().slice(0, 7);
  const effectiveNow = getEffectiveTariff(currentMonth);

  function getTariffCoverageInfo(tariff) {
    const start = tariff.startMonth || '';
    const end = tariff.endMonth || '';
    const allMonths = [...new Set(records.map(r => r.date.slice(0, 7)))].sort();
    let coveredCount = 0;
    allMonths.forEach(m => {
      if (start && m < start) return;
      if (end && m > end) return;
      coveredCount++;
    });
    return {
      total: allMonths.length,
      covered: coveredCount,
      percent: allMonths.length > 0 ? (coveredCount / allMonths.length * 100) : 0
    };
  }

  tariffList.innerHTML = tariffs.map(function(tariff) {
    const start = tariff.startMonth || '';
    const end = tariff.endMonth || '';
    let periodText = '';
    let periodClass = '';
    if (start && end) {
      periodText = start + ' ~ ' + end;
      periodClass = (currentMonth >= start && currentMonth <= end) ? 'active' : 'expired';
    } else if (start && !end) {
      periodText = start + ' 起';
      periodClass = currentMonth >= start ? 'active' : 'expired';
    } else if (!start && end) {
      periodText = '至 ' + end;
      periodClass = currentMonth <= end ? 'active' : 'expired';
    } else {
      periodText = '未设置生效期';
      periodClass = 'unspecified';
    }
    const periodLabel = periodClass === 'active' ? '生效中' : periodClass === 'expired' ? '已过期' : '未限定';
    const isCurrentEffective = effectiveNow && effectiveNow.id === tariff.id;
    const coverage = getTariffCoverageInfo(tariff);

    return '<div class="tariffCard ' + (tariff.isDefault ? 'default' : '') + ' ' + (isCurrentEffective ? 'currentlyEffective' : '') + '">' +
      '<div class="tariffCardHeader">' +
        '<div class="tariffCardTitle">' +
          '<h4>' + escapeHtml(tariff.name) + '</h4>' +
          (tariff.isDefault ? '<span class="defaultBadge">默认</span>' : '') +
          (isCurrentEffective ? '<span class="effectiveBadge">本月生效</span>' : '') +
        '</div>' +
        '<div class="tariffCardActions">' +
          '<button data-edit-tariff="' + tariff.id + '">编辑</button>' +
          '<button data-del-tariff="' + tariff.id + '" style="background:#fee2e2; color:#dc2626;">删除</button>' +
        '</div>' +
      '</div>' +
      '<div class="tariffPeriodRow">' +
        '<span class="tariffPeriodBadge ' + periodClass + '">' + periodLabel + '</span>' +
        '<span class="tariffPeriodText">' + periodText + '</span>' +
        '<span class="tariffPeriodInfo" title="覆盖已有记录的月份比例">📊 覆盖 ' + coverage.covered + '/' + coverage.total + ' 个月 (' + coverage.percent.toFixed(0) + '%)</span>' +
      '</div>' +
      '<div class="tariffCardPrices">' +
        '<div class="tariffPrice peak">' +
          '<span class="tierLabel">峰</span>' +
          '<span class="tierPrice">¥' + tariff.peakPrice.toFixed(2) + '/kWh</span>' +
          '<span class="tierHours">' + escapeHtml(tariff.peakHours.join('、')) + '</span>' +
        '</div>' +
        '<div class="tariffPrice flat">' +
          '<span class="tierLabel">平</span>' +
          '<span class="tierPrice">¥' + tariff.flatPrice.toFixed(2) + '/kWh</span>' +
          '<span class="tierHours">' + escapeHtml(tariff.flatHours.join('、')) + '</span>' +
        '</div>' +
        '<div class="tariffPrice valley">' +
          '<span class="tierLabel">谷</span>' +
          '<span class="tierPrice">¥' + tariff.valleyPrice.toFixed(2) + '/kWh</span>' +
          '<span class="tierHours">' + escapeHtml(tariff.valleyHours.join('、')) + '</span>' +
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
    tariffForm.elements.startMonth.value = tariff.startMonth || '';
    tariffForm.elements.endMonth.value = tariff.endMonth || '';
    tariffFormContainer.style.display = 'block';
  });});
}

function renderTariffSelects() {
  const options = '<option value="">按记录日期自动匹配</option>' +
    tariffs.map(function(t) {
      return '<option value="' + t.id + '">' + escapeHtml(t.name) + (t.isDefault ? ' (默认)' : '') + '</option>';
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

  const effectiveTariffs = tariffs.filter(t => {
    const start = t.startMonth || '';
    const end = t.endMonth || '';
    if (start && month < start) return false;
    if (end && month > end) return false;
    return true;
  });

  const tariffsToCompare = effectiveTariffs.length > 0 ? effectiveTariffs : tariffs;

  const results = tariffsToCompare.map(tariff => ({
    tariff,
    ...calculateMonthCost(monthRecords, tariff)
  }));

  const minCost = Math.min(...results.map(r => r.totalCost));
  const maxCost = Math.max(...results.map(r => r.totalCost));
  const savings = maxCost - minCost;

  let defaultResult = results.find(r => r.tariff.isDefault);
  if (!defaultResult && results.length > 0) {
    defaultResult = results[0];
  }
  if (!defaultResult) {
    tariffComparisonContainer.innerHTML = '<p class="empty">该月份暂无匹配的电价方案</p>';
    return;
  }

  const barsHtml = results.map(function(result) {
    const isCheapest = result.totalCost === minCost;
    const isDefault = result.tariff.isDefault;
    const savingVsDefault = defaultResult.totalCost - result.totalCost;
    
    let barHtml = '<div class="comparisonBar ' + (isCheapest ? 'cheapest' : '') + ' ' + (isDefault ? 'isDefault' : '') + '">' +
      '<div class="comparisonBarHeader">' +
        '<span class="comparisonBarName">' +
          escapeHtml(result.tariff.name) +
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
  const month = comparisonMonthSelect.value;
  const autoMatch = tariffId === '';

  const monthRecords = records.filter(function(r) { return r.date.startsWith(month); });

  if (monthRecords.length === 0) {
    tariffDetailRows.innerHTML = '<tr><td colspan="8" class="empty">该月份暂无用电记录</td></tr>';
    return;
  }

  let headerRow = document.querySelector('.tariffDetailTable thead tr');
  if (autoMatch) {
    if (headerRow.cells.length === 7) {
      const tariffTh = document.createElement('th');
      tariffTh.textContent = '适用电价';
      headerRow.insertBefore(tariffTh, headerRow.cells[5]);
    }
  } else {
    if (headerRow.cells.length === 8) {
      headerRow.removeChild(headerRow.cells[5]);
    }
  }

  tariffDetailRows.innerHTML = monthRecords
    .sort(function(a, b) { return b.date.localeCompare(a.date); })
    .map(function(record) {
      let tariff;
      if (autoMatch) {
        tariff = getEffectiveTariff(record.date);
      } else {
        tariff = tariffs.find(t => t.id === tariffId);
      }
      if (!tariff) {
        return '<tr><td colspan="' + (autoMatch ? 8 : 7) + '" class="empty">暂无电价方案</td></tr>';
      }
      const result = calculateRecordCost(record, tariff);
      const tierName = getTierName(result.tier);
      const tierColor = getTierColor(result.tier);
      let rowHtml = '<tr>' +
        '<td>' + record.date + '</td>' +
        '<td>' + escapeHtml(record.appliance) + '</td>' +
        '<td>' + escapeHtml(record.slot) + '</td>' +
        '<td><span class="tierBadge" style="background: ' + tierColor + '20; color: ' + tierColor + ';">' + tierName + '</span></td>' +
        '<td>' + result.kwh.toFixed(2) + 'kWh</td>';
      if (autoMatch) {
        rowHtml += '<td><span class="tariffNameBadge" title="' + escapeHtml(tariff.name) + '">' + escapeHtml(tariff.name) + '</span></td>';
      }
      rowHtml +=
        '<td>¥' + result.price.toFixed(2) + '/kWh</td>' +
        '<td><strong>¥' + result.cost.toFixed(2) + '</strong></td>' +
      '</tr>';
      return rowHtml;
    }).join('');
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const isNextDay = timeStr.startsWith('+');
  const cleanStr = isNextDay ? timeStr.slice(1) : timeStr;
  const parts = cleanStr.split(':');
  const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return minutes + (isNextDay ? 1440 : 0);
}

function minutesToTime(minutes, showDayOffset = true) {
  const dayOffset = Math.floor(minutes / 1440);
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  const timeStr = String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
  if (showDayOffset && dayOffset > 0) {
    return '(+' + dayOffset + '日)' + timeStr;
  }
  return timeStr;
}

function parseForbiddenRanges(ranges, totalSlots = 96) {
  if (!ranges || ranges.length === 0) return [];
  const slots = [];
  const DAY_SLOTS = 48;

  function addRange(startSlot, endSlot) {
    const start = Math.max(0, startSlot);
    const end = Math.min(totalSlots, endSlot);
    if (start < end) {
      slots.push([start, end]);
    }
  }

  for (const range of ranges) {
    const parts = range.split('-');
    if (parts.length !== 2) continue;
    const startText = parts[0].trim();
    const endText = parts[1].trim();
    const startMin = timeToMinutes(startText);
    const endMin = timeToMinutes(endText);
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) continue;
    const startSlot = Math.floor(startMin / 30);
    const endSlot = Math.ceil(endMin / 30);

    if (startText.startsWith('+') || endText.startsWith('+')) {
      addRange(startSlot, endSlot > startSlot ? endSlot : endSlot + DAY_SLOTS);
      continue;
    }

    for (let dayStart = 0; dayStart < totalSlots; dayStart += DAY_SLOTS) {
      if (endSlot > startSlot) {
        addRange(dayStart + startSlot, dayStart + endSlot);
      } else {
        addRange(dayStart + startSlot, dayStart + DAY_SLOTS);
        addRange(dayStart, dayStart + endSlot);
      }
    }
  }
  return slots;
}

function isSlotForbidden(slot, forbiddenSlotRanges) {
  for (const [start, end] of forbiddenSlotRanges) {
    if (slot >= start && slot < end) {
      return true;
    }
  }
  return false;
}

function getHourTier(halfHourIndex, tariff) {
  const idx = halfHourIndex % 48;
  const hourStart = idx / 2;
  const hh = Math.floor(hourStart);
  const mm = (hourStart % 1) * 60;
  const timeStr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');

  function timeInRange(ranges) {
    for (const range of ranges) {
      const parts = range.split('-');
      if (parts.length !== 2) continue;
      if (timeStr >= parts[0] && timeStr < parts[1]) return true;
    }
    return false;
  }

  if (timeInRange(tariff.valleyHours)) return 'valley';
  if (timeInRange(tariff.peakHours)) return 'peak';
  return 'flat';
}

function generateSchedule() {
  if (scheduleTasks.length === 0) {
    showToast('warning', '无排程任务', '请先添加排程任务');
    return;
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const defaultTariff = getEffectiveTariff(currentMonth) || tariffs.find(t => t.isDefault) || tariffs[0];
  if (!defaultTariff) {
    showToast('error', '无电价方案', '请先在分时电价模拟器中添加电价方案');
    return;
  }

  const HALF_HOUR_SLOTS = 96;
  const MAX_HOUSEHOLD_POWER = scheduleConfig.maxConcurrentPower || 8800;
  const powerUsage = new Array(HALF_HOUR_SLOTS).fill(0);

  const sortedTasks = [...scheduleTasks].sort((a, b) => {
    const aDeadline = timeToMinutes(a.deadline);
    const bDeadline = timeToMinutes(b.deadline);
    return aDeadline - bDeadline;
  });

  const placements = [];
  let feasible = true;

  for (const task of sortedTasks) {
    const tariff = task.tariffId ? tariffs.find(t => t.id === task.tariffId) : defaultTariff;
    const effectiveTariff = tariff || defaultTariff;
    const durationSlots = Math.ceil(task.duration * 2);
    const deadlineMinutes = timeToMinutes(task.deadline);
    const deadlineSlot = Math.ceil(deadlineMinutes / 30);
    const earliestMinutes = timeToMinutes(task.earliestStart || '00:00');
    const earliestSlot = Math.floor(earliestMinutes / 30);
    const forbiddenSlotRanges = parseForbiddenRanges(task.forbiddenRanges, HALF_HOUR_SLOTS);

    let bestStart = -1;
    let bestCost = Infinity;

    const searchEnd = Math.min(deadlineSlot, HALF_HOUR_SLOTS);
    for (let start = earliestSlot; start + durationSlots <= searchEnd; start++) {
      let canPlace = true;
      for (let s = start; s < start + durationSlots; s++) {
        if (isSlotForbidden(s, forbiddenSlotRanges) || powerUsage[s] + task.watts > MAX_HOUSEHOLD_POWER) {
          canPlace = false;
          break;
        }
      }
      if (!canPlace) continue;

      let cost = 0;
      for (let s = start; s < start + durationSlots; s++) {
        const tier = getHourTier(s, effectiveTariff);
        const price = getTierPrice(effectiveTariff, tier);
        cost += (task.watts / 1000) * 0.5 * price;
      }

      if (cost < bestCost) {
        bestCost = cost;
        bestStart = start;
      }
    }

    if (bestStart === -1) {
      feasible = false;
      placements.push({
        task,
        tariff: effectiveTariff,
        startSlot: -1,
        endSlot: -1,
        startDay: 0,
        endDay: 0,
        crossesMidnight: false,
        cost: 0,
        kwh: (task.watts / 1000) * task.duration,
        error: '无法在约束范围内排程（请检查：功率限制、时间窗口、禁止时段）'
      });
    } else {
      for (let s = bestStart; s < bestStart + durationSlots; s++) {
        powerUsage[s] += task.watts;
      }
      const endSlot = bestStart + durationSlots;
      const startDay = bestStart >= 48 ? 1 : 0;
      const endDay = endSlot > 48 ? 1 : 0;
      const crossesMidnight = bestStart < 48 && endSlot > 48;
      placements.push({
        task,
        tariff: effectiveTariff,
        startSlot: bestStart,
        endSlot: endSlot,
        startDay: startDay,
        endDay: endDay,
        crossesMidnight: crossesMidnight,
        cost: bestCost,
        kwh: (task.watts / 1000) * task.duration
      });
    }
  }

  let naiveCost = 0;
  for (const task of sortedTasks) {
    const tariff = task.tariffId ? tariffs.find(t => t.id === task.tariffId) : defaultTariff;
    const effectiveTariff = tariff || defaultTariff;
    const durationSlots = Math.ceil(task.duration * 2);
    const earliestMinutes = timeToMinutes(task.earliestStart || '00:00');
    const earliestSlot = Math.floor(earliestMinutes / 30);
    let cost = 0;
    for (let s = earliestSlot; s < earliestSlot + durationSlots && s < HALF_HOUR_SLOTS; s++) {
      const tier = getHourTier(s, effectiveTariff);
      const price = getTierPrice(effectiveTariff, tier);
      cost += (task.watts / 1000) * 0.5 * price;
    }
    naiveCost += cost;
  }

  const optimizedCost = placements.reduce((sum, p) => sum + p.cost, 0);
  const savings = naiveCost - optimizedCost;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  scheduleResult = {
    startDate: today.toISOString().slice(0, 10),
    endDate: tomorrow.toISOString().slice(0, 10),
    placements,
    totalCost: optimizedCost,
    totalKwh: placements.reduce((sum, p) => sum + p.kwh, 0),
    savings: Math.max(0, savings),
    feasible
  };

  localStorage.setItem(scheduleResultKey, JSON.stringify(scheduleResult));
  renderScheduleResult();

  if (!feasible) {
    showToast('warning', '排程不完全可行', '部分任务无法在约束范围内排程，请检查：功率限制、时间窗口、禁止时段');
  } else if (savings > 0.01) {
    showToast('success', '排程已生成', `优化后预计节省 ¥${savings.toFixed(2)}`);
  } else {
    showToast('success', '排程已生成', '已生成跨天建议排程');
  }
}

function getSlotNameForTime(timeStr) {
  const minutes = timeToMinutes(timeStr);
  const hour = minutes / 60;
  if (hour < 6) return '深夜';
  if (hour < 9) return '清晨';
  if (hour < 11) return '上午';
  if (hour < 13) return '午间';
  if (hour < 15) return '下午';
  if (hour < 17) return '午后';
  if (hour < 19) return '傍晚';
  if (hour < 22) return '晚间';
  return '深夜';
}

function renderScheduleTaskList() {
  const tbody = document.querySelector('#scheduleTaskRows');
  if (scheduleTasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">暂无排程任务，请点击「新增排程任务」添加</td></tr>';
    return;
  }

  tbody.innerHTML = scheduleTasks.map(function(task) {
    const tariff = task.tariffId ? tariffs.find(t => t.id === task.tariffId) : null;
    const tariffName = tariff ? tariff.name : '默认方案';
    const forbiddenText = (task.forbiddenRanges && task.forbiddenRanges.length > 0)
      ? escapeHtml(task.forbiddenRanges.join(', '))
      : '<span style="color:#94a3b8;">—</span>';
    return '<tr>' +
      '<td>' + escapeHtml(task.appliance) + '</td>' +
      '<td>' + task.watts + 'W</td>' +
      '<td>' + task.duration + 'h</td>' +
      '<td>' + escapeHtml(task.earliestStart || '00:00') + '</td>' +
      '<td>' + escapeHtml(task.deadline) + '</td>' +
      '<td>' + forbiddenText + '</td>' +
      '<td>' + escapeHtml(tariffName) + '</td>' +
      '<td>' +
        '<button data-edit-schedule-task="' + task.id + '">编辑</button>' +
        '<button data-del-schedule-task="' + task.id + '" style="background:#fee2e2; color:#dc2626;">删除</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  document.querySelectorAll('[data-del-schedule-task]').forEach(function(button) {
    button.addEventListener('click', function() {
      scheduleTasks = scheduleTasks.filter(function(t) { return t.id !== button.dataset.delScheduleTask; });
      scheduleResult = null;
      localStorage.setItem(scheduleResultKey, JSON.stringify(null));
      localStorage.setItem(scheduleTaskKey, JSON.stringify(scheduleTasks));
      renderScheduleTaskList();
      renderScheduleResult();
    });
  });

  document.querySelectorAll('[data-edit-schedule-task]').forEach(function(button) {
    button.addEventListener('click', function() {
      const task = scheduleTasks.find(function(t) { return t.id === button.dataset.editScheduleTask; });
      if (!task) return;
      editingScheduleTaskId = task.id;
      document.querySelector('#scheduleTaskFormTitle').textContent = '编辑排程任务';
      const form = document.querySelector('#scheduleTaskForm');
      form.elements.appliance.value = task.appliance;
      form.elements.watts.value = task.watts;
      form.elements.duration.value = task.duration;
      form.elements.deadline.value = task.deadline;
      form.elements.earliestStart.value = task.earliestStart || '';
      form.elements.forbiddenRanges.value = (task.forbiddenRanges && task.forbiddenRanges.length > 0)
        ? task.forbiddenRanges.join(', ')
        : '';
      form.elements.tariffId.value = task.tariffId || '';
      document.querySelector('#scheduleTaskFormContainer').style.display = 'block';
    });
  });
}

function renderScheduleResult() {
  const section = document.querySelector('#scheduleResultSection');
  if (!scheduleResult || !scheduleResult.placements || scheduleResult.placements.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  const savingsHint = document.querySelector('#scheduleSavingsHint');
  if (scheduleResult.savings > 0.01) {
    savingsHint.textContent = '相比最早开始排程节省 ¥' + scheduleResult.savings.toFixed(2);
  } else {
    savingsHint.textContent = '';
  }

  const maxPowerHint = document.querySelector('#currentMaxPowerHint');
  if (maxPowerHint) {
    maxPowerHint.textContent = (scheduleConfig.maxConcurrentPower || 8800) + 'W';
  }

  renderScheduleTimeline();
  renderScheduleResultTable();
}

function renderScheduleTimeline() {
  const container = document.querySelector('#scheduleTimelineContainer');
  if (!scheduleResult || !scheduleResult.placements) return;

  const HALF_HOUR_SLOTS = 96;
  const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#be185d'];
  const BAR_HEIGHT = 28;
  const TRACK_GAP = 4;

  const validPlacements = scheduleResult.placements
    .map((p, i) => ({ ...p, color: colors[i % colors.length], originalIdx: i }))
    .filter(p => p.startSlot >= 0);

  const tracks = [];
  validPlacements.forEach(placement => {
    let assignedTrack = -1;
    for (let t = 0; t < tracks.length; t++) {
      const lastInTrack = tracks[t][tracks[t].length - 1];
      if (placement.startSlot >= lastInTrack.endSlot) {
        tracks[t].push(placement);
        assignedTrack = t;
        break;
      }
    }
    if (assignedTrack === -1) {
      tracks.push([placement]);
    }
  });

  const totalHeight = tracks.length * (BAR_HEIGHT + TRACK_GAP);
  const startDate = scheduleResult.startDate || '';
  const endDate = scheduleResult.endDate || '';

  let html = '<div class="scheduleTimeline scheduleTimelineTwoDay">';

  html += '<div class="scheduleDayLabels">';
  html += '<span class="dayLabel day1">今日 ' + startDate + '</span>';
  html += '<span class="dayLabel day2">明日 ' + endDate + '</span>';
  html += '</div>';

  html += '<div class="scheduleTimeAxis">';
  for (let h = 0; h < 48; h += 6) {
    const displayH = h % 24;
    html += '<span class="timeTick" style="left:' + (h / 48 * 100) + '%;">' + String(displayH).padStart(2, '0') + ':00</span>';
  }
  html += '</div>';

  html += '<div class="midnightDivider" style="left: 50%;"></div>';

  html += '<div class="scheduleBarTrack" style="height:' + totalHeight + 'px;">';

  tracks.forEach((track, trackIdx) => {
    const topOffset = trackIdx * (BAR_HEIGHT + TRACK_GAP);
    track.forEach(placement => {
      const leftPct = (placement.startSlot / HALF_HOUR_SLOTS * 100).toFixed(2);
      const widthPct = ((placement.endSlot - placement.startSlot) / HALF_HOUR_SLOTS * 100).toFixed(2);
      const crossClass = placement.crossesMidnight ? ' scheduleBarCross' : '';
      html += '<div class="scheduleBar' + crossClass + '" style="left:' + leftPct + '%; width:' + widthPct + '%; top:' + topOffset + 'px; height:' + BAR_HEIGHT + 'px; background:' + placement.color + ';">' +
        '<span class="scheduleBarLabel">' + escapeHtml(placement.task.appliance) + '</span>' +
      '</div>';
    });
  });

  html += '</div></div>';
  container.innerHTML = html;
}

function renderScheduleResultTable() {
  const tbody = document.querySelector('#scheduleResultRows');
  if (!scheduleResult || !scheduleResult.placements) return;

  tbody.innerHTML = scheduleResult.placements.map(function(placement) {
    if (placement.startSlot < 0) {
      return '<tr style="background:#fef2f2;">' +
        '<td>' + escapeHtml(placement.task.appliance) + '</td>' +
        '<td colspan="4" style="color:#dc2626;">' + escapeHtml(placement.error) + '</td>' +
        '<td>' + placement.kwh.toFixed(2) + 'kWh</td>' +
        '<td>--</td>' +
      '</tr>';
    }

    const startTime = minutesToTime(placement.startSlot * 30, true);
    const endTime = minutesToTime(placement.endSlot * 30, true);
    const tier = getHourTier(placement.startSlot, placement.tariff);
    const tierName = getTierName(tier);
    const tierColor = getTierColor(tier);
    const crossBadge = placement.crossesMidnight
      ? '<span class="crossBadge" title="跨越午夜">跨午夜</span>'
      : (placement.startDay > 0 ? '<span class="crossBadge" style="background:#64748b;">次日</span>' : '<span style="color:#94a3b8;">—</span>');

    return '<tr>' +
      '<td>' + escapeHtml(placement.task.appliance) + '</td>' +
      '<td>' + startTime + '</td>' +
      '<td>' + endTime + '</td>' +
      '<td>' + crossBadge + '</td>' +
      '<td><span class="tierBadge" style="background: ' + tierColor + '20; color: ' + tierColor + ';">' + tierName + '</span></td>' +
      '<td>' + placement.kwh.toFixed(2) + 'kWh</td>' +
      '<td><strong>¥' + placement.cost.toFixed(2) + '</strong></td>' +
    '</tr>';
  }).join('');
}

function renderScheduleTariffSelect() {
  const select = document.querySelector('#scheduleTariffSelect');
  const options = tariffs.map(function(t) {
    return '<option value="' + t.id + '">' + t.name + (t.isDefault ? ' (默认)' : '') + '</option>';
  }).join('');
  select.innerHTML = '<option value="">默认方案</option>' + options;
}

function applyScheduleToRecords() {
  if (!scheduleResult || !scheduleResult.placements) return;

  const today = scheduleResult.startDate || new Date().toISOString().slice(0, 10);
  let tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  let addedCount = 0;

  scheduleResult.placements.forEach(function(placement) {
    if (placement.startSlot < 0) return;

    const MIDNIGHT_SLOT = 48;
    const startSlot = placement.startSlot;
    const endSlot = placement.endSlot;

    const recordsToAdd = [];

    if (startSlot < MIDNIGHT_SLOT && endSlot > MIDNIGHT_SLOT) {
      const day1Slots = MIDNIGHT_SLOT - startSlot;
      const day2Slots = endSlot - MIDNIGHT_SLOT;
      const day1Hours = day1Slots * 0.5;
      const day2Hours = day2Slots * 0.5;
      const totalHours = placement.task.duration;

      const day1Ratio = day1Hours / (day1Hours + day2Hours);
      const day2Ratio = 1 - day1Ratio;
      const day1Kwh = (placement.task.watts / 1000) * day1Hours;
      const day2Kwh = (placement.task.watts / 1000) * day2Hours;
      const ratioSum = day1Ratio + day2Ratio;

      const day1StartTime = minutesToTime(startSlot * 30, false);
      const day1SlotName = getSlotNameForTime(day1StartTime);

      const day2StartTime = '00:00';
      const day2SlotName = '深夜';

      recordsToAdd.push({
        id: crypto.randomUUID(),
        appliance: placement.task.appliance,
        date: today,
        slot: day1SlotName,
        hours: Number(day1Hours.toFixed(2)),
        watts: placement.task.watts,
        note: '排程优化自动生成（跨午夜，第1/2部分，共' + totalHours + 'h）',
        member: '',
        _scheduleKwh: Number(day1Kwh.toFixed(4))
      });

      recordsToAdd.push({
        id: crypto.randomUUID(),
        appliance: placement.task.appliance,
        date: tomorrow,
        slot: day2SlotName,
        hours: Number(day2Hours.toFixed(2)),
        watts: placement.task.watts,
        note: '排程优化自动生成（跨午夜，第2/2部分，共' + totalHours + 'h）',
        member: '',
        _scheduleKwh: Number(day2Kwh.toFixed(4))
      });
    } else {
      const isDay2 = startSlot >= MIDNIGHT_SLOT;
      const dateStr = isDay2 ? tomorrow : today;
      const displayStartSlot = isDay2 ? startSlot - MIDNIGHT_SLOT : startSlot;
      const startTime = minutesToTime(displayStartSlot * 30, false);
      const slotName = getSlotNameForTime(startTime);

      recordsToAdd.push({
        id: crypto.randomUUID(),
        appliance: placement.task.appliance,
        date: dateStr,
        slot: slotName,
        hours: placement.task.duration,
        watts: placement.task.watts,
        note: '排程优化自动生成' + (isDay2 ? '（次日运行）' : ''),
        member: '',
        _scheduleKwh: placement.kwh
      });
    }

    recordsToAdd.forEach(r => {
      delete r._scheduleKwh;
      records.unshift(r);
      addedCount++;
    });
  });

  save();
  render();
  showToast('success', '已转为用电记录', addedCount + ' 条排程任务已转为用电记录' + (addedCount > scheduleResult.placements.filter(p => p.startSlot >= 0).length ? '（跨午夜任务已拆分）' : ''));

  scheduleResult = null;
  localStorage.setItem(scheduleResultKey, JSON.stringify(null));
  renderScheduleResult();
}

function getRecent30DayRecords() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const threshold = thirtyDaysAgo.toISOString().slice(0, 10);
  return records.filter(r => r.date >= threshold);
}

function generateSuggestions() {
  const recentRecords = getRecent30DayRecords();
  const suggestions = [];
  const defaultTariff = tariffs.find(t => t.isDefault) || tariffs[0];

  if (recentRecords.length === 0) {
    return [{
      id: 'no-data',
      type: 'info',
      category: 'info',
      priority: 'low',
      icon: '📋',
      title: '暂无足够数据',
      description: '最近30天内没有用电记录，请先添加用电记录后再查看节能建议。',
      evidence: [],
      action: null
    }];
  }

  suggestions.push(...generateApplianceSuggestions(recentRecords, defaultTariff));
  suggestions.push(...generateScheduleSuggestions(recentRecords, defaultTariff));
  suggestions.push(...generateMemberSuggestions(recentRecords, defaultTariff));
  suggestions.push(...generateAnomalySuggestions(recentRecords));

  suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const pa = priorityOrder[a.priority] ?? 99;
    const pb = priorityOrder[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return (b.savings?.kwh || 0) - (a.savings?.kwh || 0);
  });

  return suggestions;
}

function generateApplianceSuggestions(recentRecords, defaultTariff) {
  const suggestions = [];
  const applianceStats = new Map();

  recentRecords.forEach(record => {
    const stats = applianceStats.get(record.appliance) || {
      name: record.appliance,
      totalKwh: 0,
      totalCost: 0,
      recordCount: 0,
      records: [],
      peakKwh: 0,
      valleyKwh: 0,
      flatKwh: 0
    };
    const kwhValue = kwh(record);
    const tariff = getEffectiveTariff(record.date) || defaultTariff;
    const tier = getSlotTier(record.slot);
    const price = tariff ? getTierPrice(tariff, tier) : priceSettings.price;
    stats.totalKwh += kwhValue;
    stats.totalCost += kwhValue * price;
    stats.recordCount++;
    stats.records.push(record);
    if (tier === 'peak') stats.peakKwh += kwhValue;
    else if (tier === 'valley') stats.valleyKwh += kwhValue;
    else stats.flatKwh += kwhValue;
    applianceStats.set(record.appliance, stats);
  });

  const totalKwh = recentRecords.reduce((s, r) => s + kwh(r), 0);
  const sortedAppliances = [...applianceStats.values()].sort((a, b) => b.totalKwh - a.totalKwh);

  sortedAppliances.forEach((stats, index) => {
    const share = totalKwh > 0 ? (stats.totalKwh / totalKwh * 100) : 0;
    const avgHours = stats.records.length > 0
      ? stats.records.reduce((s, r) => s + r.hours, 0) / stats.records.length
      : 1;

    if (index === 0 && share > 30 && stats.totalKwh > 10) {
      const potentialKwh = stats.totalKwh * 0.15;
      const potentialCost = potentialKwh * (defaultTariff ? defaultTariff.flatPrice : priceSettings.price);

      suggestions.push({
        id: `appliance-top-${stats.name}`,
        type: 'appliance',
        category: 'appliance',
        priority: share > 50 ? 'high' : 'medium',
        icon: '🔌',
        title: `优化「${stats.name}」使用`,
        description: `「${stats.name}」是最大耗电来源，占总耗电 ${share.toFixed(1)}%（${stats.totalKwh.toFixed(2)}kWh，约 ¥${stats.totalCost.toFixed(2)}）。建议减少使用或调低功率。`,
        savings: {
          kwh: potentialKwh,
          cost: potentialCost
        },
        evidence: [
          { type: 'stat', label: '总耗电', value: `${stats.totalKwh.toFixed(2)}kWh` },
          { type: 'stat', label: '占比', value: `${share.toFixed(1)}%` },
          { type: 'stat', label: '使用次数', value: `${stats.recordCount}次` },
          { type: 'stat', label: '平均时长', value: `${avgHours.toFixed(1)}h/次` },
          { type: 'records', label: '相关记录', recordIds: stats.records.slice(0, 5).map(r => r.id) }
        ],
        action: {
          type: 'info',
          text: '在记录中查看详情'
        }
      });
    }

    if (stats.peakKwh > stats.valleyKwh * 2 && stats.peakKwh > 5) {
      const peakRatio = stats.peakKwh / stats.totalKwh;
      const shiftPotential = stats.peakKwh * 0.5;
      const valleyPrice = defaultTariff ? defaultTariff.valleyPrice : priceSettings.price * 0.5;
      const peakPrice = defaultTariff ? defaultTariff.peakPrice : priceSettings.price;
      const shiftSavings = shiftPotential * (peakPrice - valleyPrice);

      suggestions.push({
        id: `appliance-shift-${stats.name}`,
        type: 'appliance',
        category: 'schedule',
        priority: peakRatio > 0.6 ? 'high' : 'medium',
        icon: '🕐',
        title: `将「${stats.name}」转移到谷电时段`,
        description: `「${stats.name}」${(peakRatio * 100).toFixed(0)}% 的耗电发生在峰时段。若将一半转移到谷电时段，可节省约 ¥${shiftSavings.toFixed(2)}/月。`,
        savings: {
          kwh: 0,
          cost: shiftSavings
        },
        evidence: [
          { type: 'stat', label: '峰时段耗电', value: `${stats.peakKwh.toFixed(2)}kWh` },
          { type: 'stat', label: '谷时段耗电', value: `${stats.valleyKwh.toFixed(2)}kWh` },
          { type: 'stat', label: '峰电占比', value: `${(peakRatio * 100).toFixed(0)}%` },
          { type: 'stat', label: '峰谷电价差', value: defaultTariff ? `¥${(defaultTariff.peakPrice - defaultTariff.valleyPrice).toFixed(2)}/kWh` : '未设置' },
          { type: 'records', label: '峰时段记录', recordIds: stats.records.filter(r => getSlotTier(r.slot) === 'peak').slice(0, 5).map(r => r.id) }
        ],
        action: {
          type: 'addSchedule',
          text: '一键加入排程优化',
          taskData: {
            appliance: stats.name,
            watts: stats.records[0]?.watts || 500,
            duration: Math.ceil(avgHours * 2) / 2 || 1,
            earliestStart: '00:00',
            deadline: '+06:00',
            forbiddenRanges: [],
            tariffId: defaultTariff?.id || ''
          }
        }
      });
    }
  });

  return suggestions;
}

function generateScheduleSuggestions(recentRecords, defaultTariff) {
  const suggestions = [];
  if (!defaultTariff) return suggestions;

  const slotStats = new Map();
  recentRecords.forEach(record => {
    const tier = getSlotTier(record.slot);
    const slotName = record.slot;
    const stats = slotStats.get(slotName) || {
      slot: slotName,
      tier,
      totalKwh: 0,
      totalCost: 0,
      recordCount: 0,
      records: []
    };
    const kwhValue = kwh(record);
    const tariff = getEffectiveTariff(record.date) || defaultTariff;
    const price = getTierPrice(tariff, tier);
    stats.totalKwh += kwhValue;
    stats.totalCost += kwhValue * price;
    stats.recordCount++;
    stats.records.push(record);
    slotStats.set(slotName, stats);
  });

  const peakSlots = [...slotStats.values()].filter(s => s.tier === 'peak' && s.totalKwh > 3);
  const valleySlots = [...slotStats.values()].filter(s => s.tier === 'valley');

  if (peakSlots.length > 0 && valleySlots.length === 0) {
    const totalPeakKwh = peakSlots.reduce((s, x) => s + x.totalKwh, 0);
    const totalPeakCost = peakSlots.reduce((s, x) => s + x.totalCost, 0);
    const shiftRatio = 0.3;
    const potentialSavings = totalPeakKwh * shiftRatio * (defaultTariff.peakPrice - defaultTariff.valleyPrice);

    suggestions.push({
      id: 'schedule-general-valley',
      type: 'schedule',
      category: 'schedule',
      priority: 'medium',
      icon: '🌙',
      title: '充分利用谷电时段',
      description: `目前所有可调整任务都在峰/平时段运行（共 ${totalPeakKwh.toFixed(1)}kWh，花费 ¥${totalPeakCost.toFixed(2)}）。建议将洗衣机、热水器、充电等任务安排在深夜谷电时段（${defaultTariff.valleyHours.join('、')}）。`,
      savings: {
        kwh: 0,
        cost: potentialSavings
      },
      evidence: [
        { type: 'stat', label: '峰平时段耗电', value: `${totalPeakKwh.toFixed(2)}kWh` },
        { type: 'stat', label: '谷电价格', value: `¥${defaultTariff.valleyPrice.toFixed(2)}/kWh` },
        { type: 'stat', label: '峰电价格', value: `¥${defaultTariff.peakPrice.toFixed(2)}/kWh` },
        { type: 'stat', label: '预计节省', value: `¥${potentialSavings.toFixed(2)}（转移30%）` },
        { type: 'records', label: '峰时段记录', recordIds: peakSlots.flatMap(s => s.records.slice(0, 2).map(r => r.id)) }
      ],
      action: {
        type: 'navigate',
        text: '前往排程优化',
        target: 'scheduleOptimizerSection'
      }
    });
  }

  if (defaultTariff) {
    const totalKwh = recentRecords.reduce((s, r) => s + kwh(r), 0);
    const peakKwh = recentRecords.filter(r => getSlotTier(r.slot) === 'peak').reduce((s, r) => s + kwh(r), 0);
    const peakRatio = totalKwh > 0 ? peakKwh / totalKwh : 0;
    if (peakRatio > 0.4) {
      suggestions.push({
        id: 'schedule-peak-ratio',
        type: 'schedule',
        category: 'schedule',
        priority: peakRatio > 0.6 ? 'high' : 'medium',
        icon: '📊',
        title: '峰时段用电占比偏高',
        description: `峰时段耗电占比达 ${(peakRatio * 100).toFixed(0)}%（¥${defaultTariff.peakPrice.toFixed(2)}/kWh vs 谷电 ¥${defaultTariff.valleyPrice.toFixed(2)}/kWh）。建议优先把可延后的任务移出峰时段。`,
        savings: {
          kwh: 0,
          cost: peakKwh * 0.2 * (defaultTariff.peakPrice - defaultTariff.valleyPrice)
        },
        evidence: [
          { type: 'stat', label: '峰电占比', value: `${(peakRatio * 100).toFixed(0)}%` },
          { type: 'stat', label: '峰时段耗电', value: `${peakKwh.toFixed(2)}kWh` },
          { type: 'stat', label: '峰谷价差', value: `¥${(defaultTariff.peakPrice - defaultTariff.valleyPrice).toFixed(2)}/kWh` }
        ],
        action: null
      });
    }
  }

  return suggestions;
}

function generateMemberSuggestions(recentRecords, defaultTariff) {
  const suggestions = [];
  const memberStats = getMemberStatsForSuggestions(recentRecords, defaultTariff);

  if (memberStats.length < 2) return suggestions;

  const topMember = memberStats[0];
  const avgKwh = memberStats.reduce((s, m) => s + m.totalKwh, 0) / memberStats.length;

  if (topMember && topMember.name !== UNASSIGNED_LABEL && topMember.totalKwh > avgKwh * 1.5 && topMember.totalKwh > 5) {
    const excessKwh = topMember.totalKwh - avgKwh;
    const excessCost = excessKwh * (defaultTariff ? defaultTariff.flatPrice : priceSettings.price);

    suggestions.push({
      id: `member-top-${topMember.name}`,
      type: 'member',
      category: 'member',
      priority: 'medium',
      icon: '👤',
      title: `关注「${topMember.name}」的用电习惯`,
      description: `「${topMember.name}」用电量（${topMember.totalKwh.toFixed(2)}kWh）是家庭均值的 ${(topMember.totalKwh / avgKwh).toFixed(1)} 倍。主要耗电设备：${topMember.topAppliances.map(a => a.name).join('、')}。`,
      savings: {
        kwh: excessKwh * 0.3,
        cost: excessCost * 0.3
      },
      evidence: [
        { type: 'stat', label: '个人耗电', value: `${topMember.totalKwh.toFixed(2)}kWh` },
        { type: 'stat', label: '家庭均值', value: `${avgKwh.toFixed(2)}kWh` },
        { type: 'stat', label: '使用次数', value: `${topMember.recordCount}次` },
        { type: 'stat', label: '主要设备', value: topMember.topAppliances.map(a => `${a.name}(${a.kwh.toFixed(1)}kWh)`).join('、') },
        { type: 'records', label: `${topMember.name}的记录`, recordIds: topMember.recordIds.slice(0, 5) }
      ],
      action: null
    });
  }

  const unassigned = memberStats.find(m => m.name === UNASSIGNED_LABEL);
  if (unassigned && unassigned.totalKwh > 5) {
    suggestions.push({
      id: 'member-unassigned',
      type: 'member',
      category: 'member',
      priority: 'low',
      icon: '🏷️',
      title: '完善成员归因',
      description: `有 ${unassigned.recordCount} 条记录（${unassigned.totalKwh.toFixed(2)}kWh）未分配使用成员。完善归因可获得更精准的节能建议。`,
      savings: null,
      evidence: [
        { type: 'stat', label: '未分配记录', value: `${unassigned.recordCount}条` },
        { type: 'stat', label: '涉及耗电', value: `${unassigned.totalKwh.toFixed(2)}kWh` }
      ],
      action: {
        type: 'navigate',
        text: '去批量分配',
        target: 'memberStatsSection'
      }
    });
  }

  return suggestions;
}

function getMemberStatsForSuggestions(recentRecords, defaultTariff) {
  const stats = new Map();
  const allMemberNames = [...members.map(m => m.name), UNASSIGNED_LABEL];

  allMemberNames.forEach(name => {
    stats.set(name, {
      name,
      totalKwh: 0,
      totalCost: 0,
      recordCount: 0,
      recordIds: [],
      appliances: new Map()
    });
  });

  recentRecords.forEach(record => {
    const memberName = getMemberName(record);
    const memberStat = stats.get(memberName) || stats.get(UNASSIGNED_LABEL);
    const kwhValue = kwh(record);
    const tariff = getEffectiveTariff(record.date) || defaultTariff;
    const tier = getSlotTier(record.slot);
    const price = tariff ? getTierPrice(tariff, tier) : priceSettings.price;

    memberStat.totalKwh += kwhValue;
    memberStat.totalCost += kwhValue * price;
    memberStat.recordCount++;
    memberStat.recordIds.push(record.id);

    const applianceCount = memberStat.appliances.get(record.appliance) || { count: 0, kwh: 0 };
    applianceCount.count += 1;
    applianceCount.kwh += kwhValue;
    memberStat.appliances.set(record.appliance, applianceCount);
  });

  return [...stats.values()]
    .filter(s => s.recordCount > 0)
    .map(s => ({
      ...s,
      topAppliances: [...s.appliances.entries()]
        .sort((a, b) => b[1].kwh - a[1].kwh)
        .slice(0, 3)
        .map(([name, data]) => ({ name, count: data.count, kwh: data.kwh }))
    }))
    .sort((a, b) => b.totalKwh - a.totalKwh);
}

function generateAnomalySuggestions(recentRecords) {
  const suggestions = [];
  const anomalies = getAllAnomalies(recentRecords);
  const activeAnomalies = anomalies.filter(a => !a.ignored);

  if (activeAnomalies.length > 0) {
    const highSeverity = activeAnomalies.filter(a => a.severity === 'high');
    const totalWasteKwh = activeAnomalies.reduce((s, a) => s + (a.stats?.deviationAmount || 0), 0);
    const todayPrice = getEffectiveTariffPrice(new Date().toISOString().slice(0, 7));
    const totalWasteCost = totalWasteKwh * todayPrice;

    suggestions.push({
      id: 'anomaly-fix',
      type: 'anomaly',
      category: 'anomaly',
      priority: highSeverity.length > 0 ? 'high' : 'medium',
      icon: '⚠️',
      title: `处理 ${activeAnomalies.length} 条异常用电`,
      description: `检测到 ${activeAnomalies.length} 条异常用电记录${highSeverity.length > 0 ? `（含 ${highSeverity.length} 条高危）` : ''}，涉及额外耗电约 ${totalWasteKwh.toFixed(2)}kWh（¥${totalWasteCost.toFixed(2)}）。`,
      savings: {
        kwh: totalWasteKwh * 0.8,
        cost: totalWasteCost * 0.8
      },
      evidence: [
        { type: 'stat', label: '异常记录数', value: `${activeAnomalies.length}条` },
        { type: 'stat', label: '高危异常', value: `${highSeverity.length}条` },
        { type: 'stat', label: '额外耗电', value: `${totalWasteKwh.toFixed(2)}kWh` },
        { type: 'anomalies', label: '异常列表', anomalyIds: activeAnomalies.slice(0, 5).map(a => a.id) }
      ],
      action: {
        type: 'navigate',
        text: '查看异常详情',
        target: 'anomalyAlertSection'
      }
    });
  }

  const longRunningAppliances = new Map();
  recentRecords.forEach(record => {
    if (record.hours >= 8) {
      const list = longRunningAppliances.get(record.appliance) || [];
      list.push(record);
      longRunningAppliances.set(record.appliance, list);
    }
  });

  longRunningAppliances.forEach((recs, name) => {
    if (recs.length >= 2 && name !== '冰箱') {
      const totalHours = recs.reduce((s, r) => s + r.hours, 0);
      const avgPrice = recs.reduce((s, r) => s + getEffectiveTariffPrice(r.date), 0) / recs.length;
      suggestions.push({
        id: `long-running-${name}`,
        type: 'anomaly',
        category: 'appliance',
        priority: 'medium',
        icon: '⏰',
        title: `「${name}」存在长时间运行`,
        description: `「${name}」有 ${recs.length} 次运行超过 8 小时（累计 ${totalHours.toFixed(1)}h），请检查是否忘记关闭或存在异常。`,
        savings: {
          kwh: recs.reduce((s, r) => s + kwh(r), 0) * 0.3,
          cost: recs.reduce((s, r) => s + kwh(r), 0) * 0.3 * avgPrice
        },
        evidence: [
          { type: 'stat', label: '超长次数', value: `${recs.length}次` },
          { type: 'stat', label: '累计时长', value: `${totalHours.toFixed(1)}小时` },
          { type: 'records', label: '相关记录', recordIds: recs.map(r => r.id) }
        ],
        action: null
      });
    }
  });

  return suggestions;
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
      '<p class="toastTitle">' + escapeHtml(title) + '</p>' +
      '<p class="toastMessage">' + escapeHtml(message) + '</p>' +
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

function showConfirmDialog(options) {
  const { title, message, icon = '📦', details = [], confirmText = '确认', cancelText = '取消', onConfirm, onCancel } = options;

  confirmModal.replaceChildren();

  const header = document.createElement('div');
  header.className = 'confirmModalHeader';

  const iconEl = document.createElement('span');
  iconEl.className = 'confirmModalIcon';
  iconEl.textContent = icon;

  const content = document.createElement('div');
  content.style.flex = '1';

  const titleEl = document.createElement('h3');
  titleEl.className = 'confirmModalTitle';
  titleEl.textContent = title;

  const messageEl = document.createElement('p');
  messageEl.className = 'confirmModalMessage';
  messageEl.textContent = message;

  content.append(titleEl, messageEl);
  header.append(iconEl, content);
  confirmModal.appendChild(header);

  if (details.length > 0) {
    const detailsEl = document.createElement('div');
    detailsEl.className = 'confirmModalDetails';

    details.forEach((detail) => {
      const detailRow = document.createElement('div');
      const label = document.createElement('strong');
      label.textContent = `${detail.label}：`;
      detailRow.append(label, document.createTextNode(detail.value));
      detailsEl.appendChild(detailRow);
    });

    confirmModal.appendChild(detailsEl);
  }

  const actions = document.createElement('div');
  actions.className = 'confirmModalActions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'confirmModalBtnSecondary';
  cancelBtn.id = 'confirmModalCancelBtn';
  cancelBtn.type = 'button';
  cancelBtn.textContent = cancelText;

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'confirmModalBtnPrimary';
  confirmBtn.id = 'confirmModalConfirmBtn';
  confirmBtn.type = 'button';
  confirmBtn.textContent = confirmText;

  actions.append(cancelBtn, confirmBtn);
  confirmModal.appendChild(actions);

  confirmModalOverlay.style.display = 'block';
  confirmModal.style.display = 'block';

  const closeDialog = () => {
    confirmModalOverlay.style.display = 'none';
    confirmModal.style.display = 'none';
  };

  cancelBtn.addEventListener('click', () => {
    closeDialog();
    if (onCancel) onCancel();
  });

  confirmBtn.addEventListener('click', () => {
    closeDialog();
    if (onConfirm) onConfirm();
  });

  confirmModalOverlay.addEventListener('click', () => {
    closeDialog();
    if (onCancel) onCancel();
  }, { once: true });
}

function getCurrentMonthTotal(monthStr) {
  const currentMonth = monthStr || (goalSettings ? goalSettings.month : new Date().toISOString().slice(0, 7));
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
  const goalMonthLabel = document.querySelector('#goalMonthLabel');
  const goalPrevBtn = document.querySelector('#goalPrevMonth');
  const goalNextBtn = document.querySelector('#goalNextMonth');

  const displayMonth = selectedGoalMonth;
  const [y, m] = displayMonth.split('-');
  goalMonthLabel.textContent = `${y}年${parseInt(m)}月`;

  const currentGoal = goalHistory.find(g => g.month === displayMonth) || null;
  const currentTotal = getCurrentMonthTotal(displayMonth);

  const goalCurrentEl = document.querySelector('#goalCurrent');
  const goalTargetEl = document.querySelector('#goalTarget');
  const goalRemainingEl = document.querySelector('#goalRemaining');
  const goalProgressFill = document.querySelector('#goalProgressFill');
  const goalPercentEl = document.querySelector('#goalPercent');
  const goalHintEl = document.querySelector('#goalHint');
  const progressLabels = document.querySelector('.progressLabels');
  const goalStats = document.querySelectorAll('.goalStat');

  goalCurrentEl.textContent = `${currentTotal.toFixed(2)} kWh`;

  if (!currentGoal) {
    goalTargetEl.textContent = '-- kWh';
    goalRemainingEl.textContent = '-- kWh';
    goalProgressFill.style.width = '0%';
    goalProgressFill.className = 'progressFill';
    goalPercentEl.textContent = '0%';
    goalHintEl.textContent = `${y}年${parseInt(m)}月尚未设置节能目标`;
    progressLabels.className = 'progressLabels';
    goalStats.forEach(stat => stat.className = 'goalStat');
    return;
  }

  const target = currentGoal.target;
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
    goalHintEl.textContent = `目标月份：${currentGoal.month}`;
  }
}

function save() {
  localStorage.setItem(key, JSON.stringify(records));
  localStorage.setItem(applianceKey, JSON.stringify(appliances));
  localStorage.setItem(memberKey, JSON.stringify(members));
  localStorage.setItem(scheduleTaskKey, JSON.stringify(scheduleTasks));
  generatedSuggestions = [];
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

  const effectiveTariff = getEffectiveTariff(month);
  let estimatedCost = 0;
  if (effectiveTariff) {
    const costResult = calculateMonthCost(monthlyRecords, effectiveTariff);
    estimatedCost = costResult.totalCost;
  } else {
    estimatedCost = monthlyTotal * price;
  }

  const daysInMonth = getDaysInMonth(month);
  const dailyAverage = estimatedCost / daysInMonth;
  const daysWithData = [...new Set(monthlyRecords.map((r) => r.date))].length;

  const tariffHint = effectiveTariff ? '（按「' + escapeHtml(effectiveTariff.name) + '」分时电价）' : '（按统一单价）';

  document.querySelector('#monthlySummary').innerHTML = [
    ['当月总耗电', monthlyTotal.toFixed(2) + 'kWh'],
    ['预计电费' + tariffHint, '¥' + estimatedCost.toFixed(2)],
    ['日均费用', '¥' + dailyAverage.toFixed(2)],
    ['活跃天数', daysWithData + '/' + daysInMonth + '天']
  ].map(function(item) { 
    return '<article><span>' + item[0] + '</span><strong>' + item[1] + '</strong></article>'; 
  }).join('');

  drawBars('#monthlyChart', groupSum(monthlyRecords, 'date').sort(function(a, b) { return a.label.localeCompare(b.label); }), 'kWh');
}

function renderApplianceSelect() {
  applianceSelect.innerHTML = '<option value="">选择已有电器（可选）</option>' +
    appliances.map(function(a) { return '<option value="' + a.id + '">' + escapeHtml(a.name) + ' (' + a.watts + 'W)</option>'; }).join('');
}

function renderAppliances() {
  document.querySelector('#applianceRows').innerHTML = appliances.map(function(a) {
    return '<tr>' +
      '<td>' + escapeHtml(a.name) + '</td>' +
      '<td>' + a.watts + 'W</td>' +
      '<td>' + escapeHtml(a.slot) + '</td>' +
      '<td>' + escapeHtml(a.note || '') + '</td>' +
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
  const memberOptions = members.map(function(m) { return '<option value="' + escapeHtml(m.name) + '">' + escapeHtml(m.name) + '</option>'; }).join('');
  memberSelect.innerHTML = '<option value="">使用成员（可选）</option>' + memberOptions;
  batchMemberSelect.innerHTML = '<option value="">选择分配成员</option>' + memberOptions;
}

function renderMembers() {
  document.querySelector('#memberRows').innerHTML = members.map(function(m) {
    return '<tr>' +
      '<td>' + escapeHtml(m.name) + '</td>' +
      '<td>' + escapeHtml(m.note || '') + '</td>' +
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
    const effectiveTariff = getEffectiveTariff(record.date);
    const tier = getSlotTier(record.slot);
    const price = effectiveTariff ? getTierPrice(effectiveTariff, tier) : priceSettings.price;
    const cost = kwhValue * price;

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
          return '<span class="topAppliance">' + escapeHtml(app.name) + ' (' + app.count + '次)</span>';
        }).join('')
      : '<span class="empty">暂无</span>';

    return '<div class="memberStatCard">' +
        '<div class="memberStatHeader" style="border-left-color: ' + color + ';">' +
          '<div class="memberAvatar" style="background: ' + color + ';">' +
            escapeHtml(stat.name.charAt(0)) +
          '</div>' +
          '<div class="memberInfo">' +
            '<h3>' + escapeHtml(stat.name) + '</h3>' +
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

function getFilteredRecords() {
  const searchValue = search.value.trim();
  const monthValue = filterMonth.value;
  const memberValue = filterMember.value;
  const slotValue = filterSlot.value;
  const applianceValue = filterAppliance.value;

  return records.filter(function(record) {
    if (searchValue && ![record.date, record.appliance, record.note, record.slot, getMemberName(record)].join(' ').includes(searchValue)) {
      return false;
    }
    if (monthValue && !record.date.startsWith(monthValue)) {
      return false;
    }
    if (memberValue) {
      const recordMember = getMemberName(record);
      if (memberValue === UNASSIGNED_LABEL) {
        if (recordMember !== UNASSIGNED_LABEL) return false;
      } else {
        if (recordMember !== memberValue) return false;
      }
    }
    if (slotValue && record.slot !== slotValue) {
      return false;
    }
    if (applianceValue && record.appliance !== applianceValue) {
      return false;
    }
    return true;
  });
}

function updateFilterOptions() {
  const months = [...new Set(records.map(r => r.date.slice(0, 7)))].sort().reverse();
  const currentMonthValue = filterMonth.value;
  filterMonth.innerHTML = '<option value="">全部月份</option>' +
    months.map(m => `<option value="${m}" ${m === currentMonthValue ? 'selected' : ''}>${m}</option>`).join('');

  const memberNames = [...members.map(m => m.name), UNASSIGNED_LABEL];
  const currentMemberValue = filterMember.value;
  filterMember.innerHTML = '<option value="">全部成员</option>' +
    memberNames.map(m => `<option value="${escapeHtml(m)}" ${m === currentMemberValue ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('');

  const applianceNames = [...new Set(records.map(r => r.appliance))].sort();
  const currentApplianceValue = filterAppliance.value;
  filterAppliance.innerHTML = '<option value="">全部电器</option>' +
    applianceNames.map(a => `<option value="${escapeHtml(a)}" ${a === currentApplianceValue ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('');

  const currentSlotValue = filterSlot.value;
  const slotOptions = ['清晨', '上午', '午间', '下午', '午后', '傍晚', '晚间', '深夜', '全天'];
  filterSlot.innerHTML = '<option value="">全部时段</option>' +
    slotOptions.map(s => `<option value="${s}" ${s === currentSlotValue ? 'selected' : ''}>${s}</option>`).join('');
}

function renderSuggestionCenter() {
  if (generatedSuggestions.length === 0) {
    generatedSuggestions = generateSuggestions();
  }

  const filteredSuggestions = suggestionFilterType === 'all'
    ? generatedSuggestions
    : generatedSuggestions.filter(s => s.category === suggestionFilterType);

  const statsContainer = document.querySelector('#suggestionStatsContainer');
  const filtersContainer = document.querySelector('#suggestionFilters');
  const listContainer = document.querySelector('#suggestionListContainer');

  const recentRecords = getRecent30DayRecords();
  const totalKwh = recentRecords.reduce((s, r) => s + kwh(r), 0);
  const totalSavingsKwh = generatedSuggestions.reduce((s, x) => s + (x.savings?.kwh || 0), 0);
  const totalSavingsCost = generatedSuggestions.reduce((s, x) => s + (x.savings?.cost || 0), 0);
  const highPriorityCount = generatedSuggestions.filter(s => s.priority === 'high').length;
  const mediumPriorityCount = generatedSuggestions.filter(s => s.priority === 'medium').length;

  statsContainer.innerHTML = `
    <div class="suggestionStat">
      <span class="suggestionStatLabel">分析周期</span>
      <strong class="suggestionStatValue">最近30天</strong>
      <span class="suggestionStatSub">${recentRecords.length} 条记录 · ${totalKwh.toFixed(1)} kWh</span>
    </div>
    <div class="suggestionStat highlight">
      <span class="suggestionStatLabel">优化建议</span>
      <strong class="suggestionStatValue">${generatedSuggestions.length} 条</strong>
      <span class="suggestionStatSub">${highPriorityCount} 高优 · ${mediumPriorityCount} 中优</span>
    </div>
    <div class="suggestionStat savings">
      <span class="suggestionStatLabel">预计节电</span>
      <strong class="suggestionStatValue">${totalSavingsKwh.toFixed(1)} kWh</strong>
      <span class="suggestionStatSub">约 ¥${totalSavingsCost.toFixed(2)}</span>
    </div>
  `;

  if (generatedSuggestions.length > 1) {
    filtersContainer.style.display = 'flex';
    filtersContainer.querySelectorAll('.suggestionFilterBtn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filterType === suggestionFilterType);
    });
  } else {
    filtersContainer.style.display = 'none';
  }

  if (filteredSuggestions.length === 0) {
    listContainer.innerHTML = `
      <div class="suggestionEmpty">
        <span class="suggestionEmptyIcon">✨</span>
        <p class="suggestionEmptyTitle">暂无该类型的节能建议</p>
        <p class="suggestionEmptyHint">继续保持良好的用电习惯！</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filteredSuggestions.map(function(suggestion) {
    const priorityClass = 'priority-' + suggestion.priority;
    const priorityLabel = suggestion.priority === 'high' ? '高优' : suggestion.priority === 'medium' ? '中优' : '低优';

    let savingsHtml = '';
    if (suggestion.savings) {
      const parts = [];
      if (suggestion.savings.kwh > 0) parts.push(`${suggestion.savings.kwh.toFixed(1)} kWh`);
      if (suggestion.savings.cost > 0) parts.push(`¥${suggestion.savings.cost.toFixed(2)}`);
      if (parts.length > 0) {
        savingsHtml = `<span class="suggestionSavings">💡 可节省 ${parts.join(' / ')}</span>`;
      }
    }

    const evidenceHtml = suggestion.evidence && suggestion.evidence.length > 0
      ? `<div class="suggestionEvidence">
          ${suggestion.evidence.map(function(ev) {
            if (ev.type === 'stat') {
              return `<span class="evidenceTag"><strong>${escapeHtml(ev.label)}:</strong> ${escapeHtml(ev.value)}</span>`;
            }
            if (ev.type === 'records' && ev.recordIds && ev.recordIds.length > 0) {
              return `<div class="evidenceRecords">
                <span class="evidenceRecordsLabel">${escapeHtml(ev.label)}:</span>
                ${ev.recordIds.map(function(rid) {
                  return `<button class="evidenceRecordLink" data-locate-record="${rid}">查看记录</button>`;
                }).join('')}
              </div>`;
            }
            if (ev.type === 'anomalies' && ev.anomalyIds && ev.anomalyIds.length > 0) {
              return `<div class="evidenceRecords">
                <span class="evidenceRecordsLabel">${escapeHtml(ev.label)}:</span>
                ${ev.anomalyIds.map(function(aid) {
                  return `<button class="evidenceRecordLink" data-locate-anomaly="${aid}">查看异常</button>`;
                }).join('')}
              </div>`;
            }
            return '';
          }).join('')}
        </div>`
      : '';

    let actionHtml = '';
    if (suggestion.action) {
      const actionData = JSON.stringify(suggestion.action).replace(/"/g, '&quot;');
      const taskData = suggestion.action.taskData ? JSON.stringify(suggestion.action.taskData).replace(/"/g, '&quot;') : '';
      actionHtml = `<div class="suggestionActions">
        <button class="suggestionActionBtn primary" 
          data-action-type="${suggestion.action.type}"
          data-action-target="${suggestion.action.target || ''}"
          data-action-task="${taskData}"
          data-action="${actionData}">
          ${escapeHtml(suggestion.action.text)}
        </button>
      </div>`;
    }

    return `
      <div class="suggestionCard ${priorityClass}" data-suggestion-id="${suggestion.id}">
        <div class="suggestionCardHeader">
          <div class="suggestionType">
            <span class="suggestionIcon">${suggestion.icon}</span>
            <span class="suggestionTitle">${escapeHtml(suggestion.title)}</span>
            <span class="suggestionPriority ${priorityClass}">${priorityLabel}</span>
          </div>
        </div>
        <div class="suggestionCardBody">
          <p class="suggestionDescription">${escapeHtml(suggestion.description)}</p>
          ${savingsHtml}
          ${evidenceHtml}
        </div>
        ${actionHtml}
      </div>
    `;
  }).join('');

  bindSuggestionEvents();
}

function bindSuggestionEvents() {
  const container = document.querySelector('#suggestionListContainer');
  if (!container) return;

  container.querySelectorAll('[data-locate-record]').forEach(btn => {
    btn.addEventListener('click', function() {
      const recordId = this.dataset.locateRecord;
      locateToRecord(recordId);
    });
  });

  container.querySelectorAll('[data-locate-anomaly]').forEach(btn => {
    btn.addEventListener('click', function() {
      const anomalyId = this.dataset.locateAnomaly;
      const anomalySection = document.querySelector('#anomalyAlertSection');
      if (anomalySection) {
        anomalySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  container.querySelectorAll('.suggestionActionBtn').forEach(btn => {
    btn.addEventListener('click', function() {
      const actionType = this.dataset.actionType;
      const actionTarget = this.dataset.actionTarget;

      if (actionType === 'addSchedule') {
        try {
          const taskData = JSON.parse(this.dataset.actionTask);
          addSuggestionToSchedule(taskData);
        } catch (e) {
          showToast('error', '操作失败', '任务数据解析失败');
        }
      } else if (actionType === 'navigate' && actionTarget) {
        const target = document.querySelector('#' + actionTarget);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (actionType === 'info') {
        const searchInput = document.querySelector('#search');
        if (searchInput) {
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  });
}

function addSuggestionToSchedule(taskData) {
  if (!taskData || !taskData.appliance) {
    showToast('error', '操作失败', '任务数据不完整');
    return;
  }

  const exists = scheduleTasks.some(t => t.appliance === taskData.appliance);
  if (exists) {
    showToast('warning', '已存在', `排程任务「${taskData.appliance}」已在列表中`);
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    appliance: taskData.appliance,
    watts: Number(taskData.watts) || 500,
    duration: Number(taskData.duration) || 1,
    deadline: taskData.deadline || '22:00',
    earliestStart: taskData.earliestStart || '00:00',
    forbiddenRanges: taskData.forbiddenRanges || [],
    tariffId: taskData.tariffId || ''
  };

  scheduleTasks = [newTask, ...scheduleTasks];
  scheduleResult = null;
  localStorage.setItem(scheduleTaskKey, JSON.stringify(scheduleTasks));
  localStorage.setItem(scheduleResultKey, JSON.stringify(null));

  showToast('success', '已加入排程', `「${taskData.appliance}」已加入用电排程优化列表`);
  renderScheduleTaskList();
  renderScheduleResult();
}

function bindSuggestionHeaderEvents() {
  const refreshBtn = document.querySelector('#refreshSuggestionsBtn');
  if (refreshBtn && !refreshBtn.dataset.bound) {
    refreshBtn.dataset.bound = 'true';
    refreshBtn.addEventListener('click', function() {
      generatedSuggestions = generateSuggestions();
      renderSuggestionCenter();
      showToast('success', '已刷新', '节能建议已根据最新数据重新生成');
    });
  }

  document.querySelectorAll('.suggestionFilterBtn').forEach(btn => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', function() {
        suggestionFilterType = this.dataset.filterType;
        renderSuggestionCenter();
      });
    }
  });
}

function render() {
  bindSuggestionHeaderEvents();
  updateFilterOptions();
  const filtered = getFilteredRecords();
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
  renderSuggestionCenter();
  renderScheduleTaskList();
  renderScheduleResult();
  renderScheduleTariffSelect();
  if (showMappingConfig) {
    renderMappingConfig();
  }
  checkAndNotifyGoal();

  selectedCountSpan.textContent = '已选 ' + selectedRecordIds.length + ' 条';
  const allSelected = filtered.length > 0 && filtered.every(function(r) { return selectedRecordIds.includes(r.id); });
  selectAllCheckbox.checked = allSelected;

  const filteredTotal = filtered.reduce(function(sum, record) { return sum + kwh(record); }, 0);
  filterResultCount.textContent = filtered.length;
  filterResultTotal.textContent = filteredTotal.toFixed(2);

  const activeFilters = [];
  if (search.value.trim()) activeFilters.push({ label: '关键词', value: search.value.trim(), type: 'search' });
  if (filterMonth.value) activeFilters.push({ label: '月份', value: filterMonth.value, type: 'month' });
  if (filterMember.value) activeFilters.push({ label: '成员', value: filterMember.value, type: 'member' });
  if (filterSlot.value) activeFilters.push({ label: '时段', value: filterSlot.value, type: 'slot' });
  if (filterAppliance.value) activeFilters.push({ label: '电器', value: filterAppliance.value, type: 'appliance' });

  if (activeFilters.length > 0) {
    filterActiveTags.innerHTML = activeFilters.map(function(f) {
      return '<span class="filterTag" data-type="' + f.type + '">' +
        '<span class="filterTagLabel">' + escapeHtml(f.label) + ':</span>' +
        '<span class="filterTagValue">' + escapeHtml(f.value) + '</span>' +
        '<button class="filterTagClose" data-type="' + f.type + '" aria-label="清除筛选">×</button>' +
      '</span>';
    }).join('');
    filterActiveTags.style.display = 'flex';
  } else {
    filterActiveTags.innerHTML = '';
    filterActiveTags.style.display = 'none';
  }

  emptyStateFilters.innerHTML = activeFilters.map(function(f) {
    return '<span class="emptyFilterTag">' + escapeHtml(f.label) + ': ' + escapeHtml(f.value) + '</span>';
  }).join('');

  const tableWrap = document.querySelector('#rows').closest('.tableWrap');
  if (filtered.length === 0) {
    tableWrap.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    tableWrap.style.display = 'block';
    emptyState.style.display = 'none';

    document.querySelector('#rows').innerHTML = filtered.sort(function(a, b) { return b.date.localeCompare(a.date); }).map(function(record) {
      const isChecked = selectedRecordIds.includes(record.id);
      const memberName = getMemberName(record);
      const memberLabel = memberName === UNASSIGNED_LABEL
        ? '<span class="unassignedMember">' + UNASSIGNED_LABEL + '</span>'
        : escapeHtml(memberName);

      let rowHtml = '<tr data-record-id="' + record.id + '">';
      if (batchAssignMode) {
        rowHtml += '<td><input type="checkbox" class="recordCheckbox" data-id="' + record.id + '" ' + (isChecked ? 'checked' : '') + ' /></td>';
      }
      rowHtml += 
        '<td>' + record.date + '</td>' +
        '<td>' + escapeHtml(record.appliance) + '</td>' +
        '<td>' + memberLabel + '</td>' +
        '<td>' + escapeHtml(record.slot) + '</td>' +
        '<td>' + kwh(record).toFixed(2) + 'kWh</td>' +
        '<td>' + escapeHtml(record.note || '') + '</td>' +
        '<td><button data-edit="' + record.id + '">编辑</button><button data-del="' + record.id + '">删除</button></td>' +
      '</tr>';
      return rowHtml;
    }).join('');
  }

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

  document.querySelectorAll('.filterTagClose').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const type = e.currentTarget.dataset.type;
      if (type === 'search') {
        search.value = '';
      } else if (type === 'month') {
        filterMonth.value = '';
      } else if (type === 'member') {
        filterMember.value = '';
      } else if (type === 'slot') {
        filterSlot.value = '';
      } else if (type === 'appliance') {
        filterAppliance.value = '';
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
    return '<text x="22" y="' + (43 + index * 36) + '">' + escapeHtml(item.label) + '</text>' +
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
           '<text x="285" y="' + (64 + index * 30) + '">' + escapeHtml(item.label) + ' ' + Math.round(item.value / total * 100) + '%</text>';
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
    currentData: getBackupSourceData(),
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
  const currentData = backupRestoreState.currentData || getBackupSourceData();
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

  if (analysis.goalHistory && analysis.goalHistory.action !== 'none') {
    html += `
      <div class="brDiffCategory">
        <div class="brDiffCategoryHeader">
          <span class="brDiffCategoryTitle">🎯 目标历史</span>
          <span class="brDiffBadge update">将合并</span>
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
      ${analysis.goalHistory && analysis.goalHistory.action !== 'none' ? '<p style="font-size:14px; margin:6px 0;">目标历史：将合并</p>' : ''}
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
      exportBackup(null, opts, getBackupSourceData());
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
      backupRestoreState.analysis = analyzeDifferences(getBackupSourceData(), migratedData);
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
    backupRestoreState.analysis = analyzeDifferences(getBackupSourceData(), migratedData);
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
    goalHistory = JSON.parse(localStorage.getItem(goalHistoryKey) || 'null') || [];
    if (goalSettings) {
      const exists = goalHistory.some(g => g.month === goalSettings.month);
      if (!exists) goalHistory.unshift(goalSettings);
    }
    selectedGoalMonth = goalHistory.length > 0 ? goalHistory[0].month : new Date().toISOString().slice(0, 7);
    tariffs = JSON.parse(localStorage.getItem(tariffKey) || 'null') || tariffSeed;
    migrateTariffEffectivePeriod();
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
