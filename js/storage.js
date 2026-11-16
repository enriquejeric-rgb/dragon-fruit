/**
 * storage.js
 * Manages dragon fruit ripeness scan history & CSV export
 * Starts completely empty with no mock/sample data
 */

const InspectionHistory = {
  storageKey: 'df_ripeness_history_v2', // Clean key with zero sample records

  init() {
    // Clear legacy sample keys if any exist
    localStorage.removeItem('df_ripeness_history');
    localStorage.removeItem('df_scan_history');

    const existing = localStorage.getItem(this.storageKey);
    if (!existing) {
      this.saveAll([]); // Start with zero samples
    }
  },

  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  },

  saveAll(list) {
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  },

  addRecord(record) {
    const all = this.getAll();
    const nextNum = all.length + 1;
    const formattedId = `#${String(nextNum).padStart(4, '0')}`;
    const now = new Date();
    const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newEntry = {
      id: formattedId,
      timestamp: timeStr,
      ...record
    };

    all.unshift(newEntry);
    this.saveAll(all);
    return newEntry;
  },

  clearAll() {
    this.saveAll([]);
  },

  exportToCSV() {
    const records = this.getAll();
    if (records.length === 0) return;

    const headers = ['ID', 'Date & Time', 'Ripeness Status', 'Confidence %', 'Notes'];
    const rows = records.map(r => [
      `"${r.id}"`,
      `"${r.timestamp}"`,
      `"${r.title || r.label}"`,
      `"${r.confidence > 0 ? r.confidence + '%' : '--'}"`,
      `"${(r.statusNote || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DragonFruit_Ripeness_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }
};

InspectionHistory.init();
