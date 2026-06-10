const BACKUP_SCHEMA_VERSION = 1;
const APP_VERSION = '1.0.0';

const STORAGE_KEYS = {
  records: 'hxwl-13-home-energy',
  appliances: 'hxwl-13-home-energy-appliances',
  members: 'hxwl-13-home-energy-members',
  priceSettings: 'hxwl-13-home-energy-price',
  goalSettings: 'hxwl-13-home-energy-goal',
  tariffs: 'hxwl-13-home-energy-tariffs',
  slotMapping: 'hxwl-13-home-energy-slot-mapping',
  ignoredAnomalies: 'hxwl-13-home-energy-anomaly-ignore'
};

const RECORD_UNIQUE_FIELDS = ['date', 'appliance', 'slot', 'hours', 'watts'];

const DEFAULT_SLOT_MAPPING = {
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

const VERSION_MIGRATIONS = {
  1: (data) => {
    const result = { ...data };
    if (!result.slotMapping) {
      result.slotMapping = { ...DEFAULT_SLOT_MAPPING };
    }
    if (!result.ignoredAnomalies) {
      result.ignoredAnomalies = [];
    }
    if (!result.tariffs) {
      result.tariffs = [];
    }
    if (result.records) {
      result.records = result.records.map(record => ({
        id: record.id || crypto.randomUUID(),
        date: record.date || '',
        appliance: record.appliance || '',
        member: record.member !== undefined ? record.member : '',
        slot: record.slot || '',
        hours: Number(record.hours) || 0,
        watts: Number(record.watts) || 0,
        note: record.note || ''
      }));
    }
    return result;
  }
};

function getCurrentData() {
  const data = {};
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch (e) {
        data[key] = null;
      }
    }
  });
  return data;
}

function createBackup(options = {}) {
  const {
    includeRecords = true,
    includeAppliances = true,
    includeMembers = true,
    includePriceSettings = true,
    includeGoalSettings = true,
    includeTariffs = true,
    includeSlotMapping = true,
    includeIgnoredAnomalies = true
  } = options;

  const allData = getCurrentData();
  const filteredData = {};

  if (includeRecords && allData.records) filteredData.records = allData.records;
  if (includeAppliances && allData.appliances) filteredData.appliances = allData.appliances;
  if (includeMembers && allData.members) filteredData.members = allData.members;
  if (includePriceSettings && allData.priceSettings) filteredData.priceSettings = allData.priceSettings;
  if (includeGoalSettings && allData.goalSettings) filteredData.goalSettings = allData.goalSettings;
  if (includeTariffs && allData.tariffs) filteredData.tariffs = allData.tariffs;
  if (includeSlotMapping && allData.slotMapping) filteredData.slotMapping = allData.slotMapping;
  if (includeIgnoredAnomalies && allData.ignoredAnomalies) filteredData.ignoredAnomalies = allData.ignoredAnomalies;

  const backup = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: filteredData
  };
  return backup;
}

function exportBackup(filename = null, options = {}) {
  const backup = createBackup(options);
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const backupName = filename || `hxwl-13-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = backupName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return backup;
}

function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      reject(new Error('请选择 JSON 格式的备份文件'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup.schemaVersion || !backup.data) {
          reject(new Error('备份文件格式无效'));
          return;
        }
        resolve(backup);
      } catch (err) {
        reject(new Error('解析备份文件失败：' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file, 'UTF-8');
  });
}

function migrateBackup(backup) {
  const backupVersion = backup.schemaVersion || 0;

  if (backupVersion > BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `备份文件版本 (v${backupVersion}) 高于当前应用支持的版本 (v${BACKUP_SCHEMA_VERSION})，请更新应用后再尝试`
    );
  }

  let migratedData = { ...backup.data };

  for (let v = backupVersion + 1; v <= BACKUP_SCHEMA_VERSION; v++) {
    if (VERSION_MIGRATIONS[v]) {
      migratedData = VERSION_MIGRATIONS[v](migratedData);
    }
  }

  return {
    ...backup,
    data: migratedData,
    schemaVersion: BACKUP_SCHEMA_VERSION
  };
}

function getRecordSignature(record) {
  return RECORD_UNIQUE_FIELDS
    .map(field => String(record[field] || ''))
    .join('||');
}

function compareRecords(current, imported) {
  const differences = [];
  const fields = ['date', 'appliance', 'member', 'slot', 'hours', 'watts', 'note'];

  fields.forEach(field => {
    const currentVal = current[field];
    const importedVal = imported[field];
    const currentNormalized = currentVal === undefined || currentVal === null ? '' : String(currentVal);
    const importedNormalized = importedVal === undefined || importedVal === null ? '' : String(importedVal);

    if (currentNormalized !== importedNormalized) {
      differences.push({
        field,
        current: currentVal,
        imported: importedVal
      });
    }
  });

  return differences;
}

function buildSignatureMap(records) {
  const map = new Map();
  records.forEach(record => {
    if (record && record.id) {
      map.set(record.id, record);
      const sig = getRecordSignature(record);
      if (!map.has(sig)) {
        map.set(sig, record);
      }
    }
  });
  return map;
}

function analyzeDifferences(currentData, importedData) {
  const analysis = {
    records: { added: 0, updated: 0, skipped: 0, items: [] },
    appliances: { added: 0, updated: 0, skipped: 0, items: [] },
    members: { added: 0, updated: 0, skipped: 0, items: [] },
    priceSettings: { action: 'none', current: null, imported: null },
    goalSettings: { action: 'none', current: null, imported: null },
    tariffs: { added: 0, updated: 0, skipped: 0, items: [] },
    slotMapping: { action: 'none', different: false },
    ignoredAnomalies: { action: 'none', count: 0 }
  };

  if (importedData.records && currentData.records) {
    const currentMap = buildSignatureMap(currentData.records);

    importedData.records.forEach(imported => {
      let match = currentMap.get(imported.id);
      let matchType = 'id';

      if (!match) {
        const sig = getRecordSignature(imported);
        match = currentMap.get(sig);
        matchType = 'signature';
      }

      if (!match) {
        analysis.records.added++;
        analysis.records.items.push({
          type: 'add',
          imported,
          matchType: null
        });
      } else {
        const differences = compareRecords(match, imported);
        if (differences.length > 0) {
          analysis.records.updated++;
          analysis.records.items.push({
            type: 'update',
            current: match,
            imported,
            differences,
            matchType
          });
        } else {
          analysis.records.skipped++;
          analysis.records.items.push({
            type: 'skip',
            current: match,
            imported,
            matchType
          });
        }
      }
    });
  }

  if (importedData.appliances && currentData.appliances) {
    const currentMap = new Map(currentData.appliances.map(a => [a.id, a]));
    const nameMap = new Map(currentData.appliances.map(a => [a.name, a]));

    importedData.appliances.forEach(imported => {
      let match = currentMap.get(imported.id);
      let matchType = 'id';

      if (!match) {
        match = nameMap.get(imported.name);
        matchType = 'name';
      }

      if (!match) {
        analysis.appliances.added++;
        analysis.appliances.items.push({ type: 'add', imported, matchType: null });
      } else {
        const differences = [];
        ['name', 'watts', 'slot', 'note'].forEach(field => {
          const cVal = match[field] || '';
          const iVal = imported[field] || '';
          if (String(cVal) !== String(iVal)) {
            differences.push({ field, current: cVal, imported: iVal });
          }
        });

        if (differences.length > 0) {
          analysis.appliances.updated++;
          analysis.appliances.items.push({
            type: 'update',
            current: match,
            imported,
            differences,
            matchType
          });
        } else {
          analysis.appliances.skipped++;
          analysis.appliances.items.push({
            type: 'skip',
            current: match,
            imported,
            matchType
          });
        }
      }
    });
  }

  if (importedData.members && currentData.members) {
    const currentMap = new Map(currentData.members.map(m => [m.id, m]));
    const nameMap = new Map(currentData.members.map(m => [m.name, m]));

    importedData.members.forEach(imported => {
      let match = currentMap.get(imported.id);
      let matchType = 'id';

      if (!match) {
        match = nameMap.get(imported.name);
        matchType = 'name';
      }

      if (!match) {
        analysis.members.added++;
        analysis.members.items.push({ type: 'add', imported, matchType: null });
      } else {
        const differences = [];
        ['name', 'note'].forEach(field => {
          const cVal = match[field] || '';
          const iVal = imported[field] || '';
          if (String(cVal) !== String(iVal)) {
            differences.push({ field, current: cVal, imported: iVal });
          }
        });

        if (differences.length > 0) {
          analysis.members.updated++;
          analysis.members.items.push({
            type: 'update',
            current: match,
            imported,
            differences,
            matchType
          });
        } else {
          analysis.members.skipped++;
          analysis.members.items.push({
            type: 'skip',
            current: match,
            imported,
            matchType
          });
        }
      }
    });
  }

  if (importedData.priceSettings) {
    const current = currentData.priceSettings;
    const imported = importedData.priceSettings;
    const different = !current ||
      current.price !== imported.price ||
      current.month !== imported.month;

    if (different) {
      analysis.priceSettings = {
        action: 'update',
        current,
        imported
      };
    }
  }

  if (importedData.goalSettings) {
    const current = currentData.goalSettings;
    const imported = importedData.goalSettings;
    const different = !current ||
      current.target !== imported.target ||
      current.month !== imported.month;

    if (different) {
      analysis.goalSettings = {
        action: 'update',
        current,
        imported
      };
    }
  }

  if (importedData.tariffs && currentData.tariffs) {
    const currentMap = new Map(currentData.tariffs.map(t => [t.id, t]));
    const nameMap = new Map(currentData.tariffs.map(t => [t.name, t]));

    importedData.tariffs.forEach(imported => {
      let match = currentMap.get(imported.id);
      let matchType = 'id';

      if (!match) {
        match = nameMap.get(imported.name);
        matchType = 'name';
      }

      if (!match) {
        analysis.tariffs.added++;
        analysis.tariffs.items.push({ type: 'add', imported, matchType: null });
      } else {
        const differences = [];
        ['name', 'peakPrice', 'flatPrice', 'valleyPrice', 'isDefault'].forEach(field => {
          const cVal = match[field];
          const iVal = imported[field];
          if (String(cVal) !== String(iVal)) {
            differences.push({ field, current: cVal, imported: iVal });
          }
        });
        const hoursFields = ['peakHours', 'flatHours', 'valleyHours'];
        hoursFields.forEach(field => {
          const cVal = (match[field] || []).join(',');
          const iVal = (imported[field] || []).join(',');
          if (cVal !== iVal) {
            differences.push({ field, current: match[field], imported: imported[field] });
          }
        });

        if (differences.length > 0) {
          analysis.tariffs.updated++;
          analysis.tariffs.items.push({
            type: 'update',
            current: match,
            imported,
            differences,
            matchType
          });
        } else {
          analysis.tariffs.skipped++;
          analysis.tariffs.items.push({
            type: 'skip',
            current: match,
            imported,
            matchType
          });
        }
      }
    });
  }

  if (importedData.slotMapping) {
    const current = currentData.slotMapping || {};
    const imported = importedData.slotMapping;
    const currentKeys = Object.keys(current).sort();
    const importedKeys = Object.keys(imported).sort();
    let different = currentKeys.join(',') !== importedKeys.join(',');

    if (!different) {
      for (const key of currentKeys) {
        if (current[key] !== imported[key]) {
          different = true;
          break;
        }
      }
    }

    analysis.slotMapping = {
      action: different ? 'update' : 'none',
      different
    };
  }

  if (importedData.ignoredAnomalies && importedData.ignoredAnomalies.length > 0) {
    analysis.ignoredAnomalies = {
      action: 'merge',
      count: importedData.ignoredAnomalies.length
    };
  }

  return analysis;
}

function applyRestore(analysis, importedData, options = {}) {
  const {
    includeRecords = true,
    includeAppliances = true,
    includeMembers = true,
    includePriceSettings = true,
    includeGoalSettings = true,
    includeTariffs = true,
    includeSlotMapping = true,
    includeIgnoredAnomalies = true,
    updateMode = 'skip'
  } = options;

  const currentData = getCurrentData();
  const stats = {
    records: { added: 0, updated: 0, skipped: 0 },
    appliances: { added: 0, updated: 0, skipped: 0 },
    members: { added: 0, updated: 0, skipped: 0 },
    tariffs: { added: 0, updated: 0, skipped: 0 }
  };

  if (includeRecords && analysis.records.items.length > 0) {
    const records = [...(currentData.records || [])];
    const existingIds = new Set(records.map(r => r.id));

    analysis.records.items.forEach(item => {
      if (item.type === 'add') {
        let newId = item.imported.id;
        while (existingIds.has(newId)) {
          newId = crypto.randomUUID();
        }
        records.push({ ...item.imported, id: newId });
        existingIds.add(newId);
        stats.records.added++;
      } else if (item.type === 'update') {
        if (updateMode === 'overwrite' || updateMode === 'update') {
          const idx = records.findIndex(r => r.id === item.current.id);
          if (idx !== -1) {
            records[idx] = { ...item.imported, id: item.current.id };
            stats.records.updated++;
          }
        } else {
          stats.records.skipped++;
        }
      } else {
        stats.records.skipped++;
      }
    });

    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
  }

  if (includeAppliances && analysis.appliances.items.length > 0) {
    const appliances = [...(currentData.appliances || [])];
    const existingIds = new Set(appliances.map(a => a.id));

    analysis.appliances.items.forEach(item => {
      if (item.type === 'add') {
        let newId = item.imported.id;
        while (existingIds.has(newId)) {
          newId = crypto.randomUUID();
        }
        appliances.push({ ...item.imported, id: newId });
        existingIds.add(newId);
        stats.appliances.added++;
      } else if (item.type === 'update') {
        if (updateMode === 'overwrite' || updateMode === 'update') {
          const idx = appliances.findIndex(a => a.id === item.current.id);
          if (idx !== -1) {
            appliances[idx] = { ...item.imported, id: item.current.id };
            stats.appliances.updated++;
          }
        } else {
          stats.appliances.skipped++;
        }
      } else {
        stats.appliances.skipped++;
      }
    });

    localStorage.setItem(STORAGE_KEYS.appliances, JSON.stringify(appliances));
  }

  if (includeMembers && analysis.members.items.length > 0) {
    const members = [...(currentData.members || [])];
    const existingIds = new Set(members.map(m => m.id));
    const existingNames = new Set(members.map(m => m.name));

    analysis.members.items.forEach(item => {
      if (item.type === 'add') {
        let newId = item.imported.id;
        let finalName = item.imported.name;
        while (existingIds.has(newId)) {
          newId = crypto.randomUUID();
        }
        while (existingNames.has(finalName)) {
          finalName = item.imported.name + '_导入';
        }
        members.push({ ...item.imported, id: newId, name: finalName });
        existingIds.add(newId);
        existingNames.add(finalName);
        stats.members.added++;
      } else if (item.type === 'update') {
        if (updateMode === 'overwrite' || updateMode === 'update') {
          const idx = members.findIndex(m => m.id === item.current.id);
          if (idx !== -1) {
            const oldName = item.current.name;
            const newName = item.imported.name;
            members[idx] = { ...item.imported, id: item.current.id };
            stats.members.updated++;

            if (oldName !== newName && currentData.records) {
              const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.records) || '[]');
              const updatedRecords = records.map(r =>
                r.member === oldName ? { ...r, member: newName } : r
              );
              localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(updatedRecords));
            }
          }
        } else {
          stats.members.skipped++;
        }
      } else {
        stats.members.skipped++;
      }
    });

    localStorage.setItem(STORAGE_KEYS.members, JSON.stringify(members));
  }

  if (includePriceSettings && analysis.priceSettings.action === 'update') {
    if (updateMode === 'overwrite' || updateMode === 'update') {
      localStorage.setItem(STORAGE_KEYS.priceSettings, JSON.stringify(analysis.priceSettings.imported));
    }
  }

  if (includeGoalSettings && analysis.goalSettings.action === 'update') {
    if (updateMode === 'overwrite' || updateMode === 'update') {
      localStorage.setItem(STORAGE_KEYS.goalSettings, JSON.stringify(analysis.goalSettings.imported));
    }
  }

  if (includeTariffs && analysis.tariffs.items.length > 0) {
    const tariffs = [...(currentData.tariffs || [])];
    const existingIds = new Set(tariffs.map(t => t.id));
    const existingNames = new Set(tariffs.map(t => t.name));

    let hasDefaultImported = analysis.tariffs.items.some(
      item => item.imported && item.imported.isDefault
    );

    if (hasDefaultImported && (updateMode === 'overwrite' || updateMode === 'update')) {
      tariffs.forEach(t => { t.isDefault = false; });
    }

    analysis.tariffs.items.forEach(item => {
      if (item.type === 'add') {
        let newId = item.imported.id;
        let finalName = item.imported.name;
        while (existingIds.has(newId)) {
          newId = crypto.randomUUID();
        }
        while (existingNames.has(finalName)) {
          finalName = item.imported.name + '_导入';
        }
        tariffs.push({ ...item.imported, id: newId, name: finalName });
        existingIds.add(newId);
        existingNames.add(finalName);
        stats.tariffs.added++;
      } else if (item.type === 'update') {
        if (updateMode === 'overwrite' || updateMode === 'update') {
          const idx = tariffs.findIndex(t => t.id === item.current.id);
          if (idx !== -1) {
            tariffs[idx] = { ...item.imported, id: item.current.id };
            stats.tariffs.updated++;
          }
        } else {
          stats.tariffs.skipped++;
        }
      } else {
        stats.tariffs.skipped++;
      }
    });

    if (tariffs.length > 0 && !tariffs.some(t => t.isDefault)) {
      tariffs[0].isDefault = true;
    }

    localStorage.setItem(STORAGE_KEYS.tariffs, JSON.stringify(tariffs));
  }

  if (includeSlotMapping && analysis.slotMapping.different) {
    if (updateMode === 'overwrite' || updateMode === 'update') {
      if (importedData && importedData.slotMapping) {
        localStorage.setItem(STORAGE_KEYS.slotMapping, JSON.stringify(importedData.slotMapping));
      }
    }
  }

  if (includeIgnoredAnomalies && analysis.ignoredAnomalies.action === 'merge') {
    const current = currentData.ignoredAnomalies || [];
    const imported = importedData && importedData.ignoredAnomalies ? importedData.ignoredAnomalies : [];
    const merged = [...new Set([...current, ...imported])];
    localStorage.setItem(STORAGE_KEYS.ignoredAnomalies, JSON.stringify(merged));
  }

  return stats;
}

function validateBackup(backup) {
  const errors = [];
  const warnings = [];

  if (!backup) {
    errors.push('备份文件为空');
    return { valid: false, errors, warnings };
  }

  if (!backup.schemaVersion) {
    warnings.push('备份文件未指定版本号，可能是旧版本备份');
  }

  if (!backup.data) {
    errors.push('备份文件缺少数据部分');
    return { valid: false, errors, warnings };
  }

  if (backup.data.records && !Array.isArray(backup.data.records)) {
    errors.push('records 数据格式无效');
  }

  if (backup.data.appliances && !Array.isArray(backup.data.appliances)) {
    errors.push('appliances 数据格式无效');
  }

  if (backup.data.members && !Array.isArray(backup.data.members)) {
    errors.push('members 数据格式无效');
  }

  if (backup.data.records) {
    backup.data.records.forEach((record, idx) => {
      const required = ['id', 'date', 'appliance', 'slot', 'hours', 'watts'];
      required.forEach(field => {
        if (record[field] === undefined || record[field] === null || record[field] === '') {
          if (field !== 'id') {
            warnings.push(`记录 #${idx + 1} 缺少字段：${field}`);
          }
        }
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recordCount: backup.data.records ? backup.data.records.length : 0,
    applianceCount: backup.data.appliances ? backup.data.appliances.length : 0,
    memberCount: backup.data.members ? backup.data.members.length : 0
  };
}

export {
  BACKUP_SCHEMA_VERSION,
  STORAGE_KEYS,
  createBackup,
  exportBackup,
  parseBackupFile,
  migrateBackup,
  analyzeDifferences,
  applyRestore,
  validateBackup,
  getCurrentData,
  compareRecords,
  getRecordSignature
};
