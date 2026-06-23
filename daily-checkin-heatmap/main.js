var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => CheckinPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  ribbonIcon: true
};
var DEFAULT_DATA = {
  records: {},
  lastWordCount: 0,
  lastWordCountDate: null,
  statsResetAt: null
};
var VIEW_TYPE = "daily-checkin-view";
var EARLIEST_YEAR = 2026;
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function today() {
  return toDateStr(new Date());
}
async function vaultWordCount(app) {
  let total = 0;
  for (const file of app.vault.getMarkdownFiles()) {
    const content = await app.vault.cachedRead(file);
    total += content.trim().split(/\s+/).filter(Boolean).length;
  }
  return total;
}
function heatLevel(delta) {
  if (delta <= 0)
    return 0;
  if (delta < 50)
    return 1;
  if (delta < 200)
    return 2;
  if (delta < 500)
    return 3;
  return 4;
}
var CheckinView = class extends import_obsidian.ItemView {
  // 热力图单独的年份导航
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.heatmapYear = now.getFullYear();
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "\u6BCF\u65E5\u6253\u5361";
  }
  getIcon() {
    return "calendar-check-2";
  }
  async onOpen() {
    await this.render();
  }
  async onClose() {
  }
  async render() {
    var _a;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("checkin-root");
    const data = this.plugin.data;
    const todayStr = today();
    const todayRecord = data.records[todayStr];
    const isCheckedIn = (_a = todayRecord == null ? void 0 : todayRecord.checked) != null ? _a : false;
    const header = container.createDiv("checkin-header");
    header.createEl("h2", { text: "\u{1F4C5} \u6BCF\u65E5\u6253\u5361" });
    const btnWrap = container.createDiv("checkin-btn-wrap");
    const btn = btnWrap.createEl("button", {
      cls: isCheckedIn ? "checkin-btn checked" : "checkin-btn",
      text: isCheckedIn ? "\u2705 \u4ECA\u65E5\u5DF2\u6253\u5361\uFF01" : "\u{1F3AF} \u70B9\u51FB\u6253\u5361"
    });
    btn.onclick = async () => {
      await this.plugin.doCheckin();
      await this.render();
    };
    const dateLabel = btnWrap.createDiv("checkin-today-label");
    dateLabel.setText(`\u4ECA\u5929\uFF1A${todayStr}`);
    container.createEl("hr");
    const calSection = container.createDiv("checkin-section");
    calSection.createEl("h3", { text: "\u{1F4C6} \u6253\u5361\u65E5\u5386" });
    const nav = calSection.createDiv("checkin-cal-nav");
    const prevBtn = nav.createEl("button", { text: "\u2039", cls: "checkin-nav-btn" });
    const monthLabel = nav.createEl("span", {
      cls: "checkin-month-label",
      text: `${this.currentYear} \u5E74 ${this.currentMonth + 1} \u6708`
    });
    const nextBtn = nav.createEl("button", { text: "\u203A", cls: "checkin-nav-btn" });
    prevBtn.onclick = () => {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.render();
    };
    nextBtn.onclick = () => {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.render();
    };
    this.buildCalendar(calSection, this.currentYear, this.currentMonth, data);
    calSection.createDiv({ cls: "checkin-hint", text: "\u{1F4A1} \u70B9\u51FB\u67D0\u4E00\u5929\u53EF\u5355\u72EC\u6E05\u9664\u8BE5\u65E5\u7684\u6253\u5361\u8BB0\u5F55" });
    container.createEl("hr");
    const heatSection = container.createDiv("checkin-section");
    heatSection.createEl("h3", { text: "\u{1F525} \u5185\u5BB9\u53D8\u66F4\u70ED\u529B\u56FE" });
    const heatNav = heatSection.createDiv("checkin-cal-nav");
    const heatPrevBtn = heatNav.createEl("button", { text: "\u2039", cls: "checkin-nav-btn" });
    const heatYearLabel = heatNav.createEl("span", {
      cls: "checkin-month-label",
      text: `${this.heatmapYear} \u5E74`
    });
    const heatNextBtn = heatNav.createEl("button", { text: "\u203A", cls: "checkin-nav-btn" });
    const nowYear = new Date().getFullYear();
    heatPrevBtn.disabled = this.heatmapYear <= EARLIEST_YEAR;
    heatNextBtn.disabled = this.heatmapYear >= nowYear;
    if (heatPrevBtn.disabled)
      heatPrevBtn.addClass("disabled");
    if (heatNextBtn.disabled)
      heatNextBtn.addClass("disabled");
    heatPrevBtn.onclick = () => {
      if (this.heatmapYear > EARLIEST_YEAR) {
        this.heatmapYear--;
        this.render();
      }
    };
    heatNextBtn.onclick = () => {
      if (this.heatmapYear < nowYear) {
        this.heatmapYear++;
        this.render();
      }
    };
    this.buildHeatmap(heatSection, data, this.heatmapYear);
    const legend = heatSection.createDiv("checkin-heatmap-legend");
    legend.createSpan({ text: "\u5C11", cls: "legend-label" });
    for (let i = 0; i <= 4; i++) {
      legend.createDiv(`checkin-heat-cell level-${i}`);
    }
    legend.createSpan({ text: "\u591A", cls: "legend-label" });
    container.createEl("hr");
    const statsSection = container.createDiv("checkin-section");
    const statsHeaderRow = statsSection.createDiv("checkin-stats-header-row");
    statsHeaderRow.createEl("h3", { text: "\u{1F4CA} \u7EDF\u8BA1\u6570\u636E" });
    const resetStatsBtn = statsHeaderRow.createEl("button", { text: "\u{1F5D1}\uFE0F \u6E05\u7A7A\u7EDF\u8BA1", cls: "checkin-reset-btn" });
    resetStatsBtn.onclick = () => new ConfirmResetStatsModal(this.app, async () => {
      await this.plugin.resetStatsOnly();
      await this.render();
    }).open();
    this.buildStats(statsSection, data);
    this.injectStyles();
  }
  // ── Calendar builder ───────────────────────────────────────────────────────
  buildCalendar(parent, year, month, data) {
    const grid = parent.createDiv("checkin-cal-grid");
    const dayNames = ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"];
    dayNames.forEach((d) => grid.createDiv({ cls: "checkin-cal-header", text: d }));
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = today();
    for (let i = 0; i < firstDay; i++)
      grid.createDiv("checkin-cal-cell empty");
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const rec = data.records[ds];
      const cell = grid.createDiv("checkin-cal-cell");
      if (ds === todayStr)
        cell.addClass("today");
      if (rec == null ? void 0 : rec.checked)
        cell.addClass("checked");
      if (rec == null ? void 0 : rec.checked)
        cell.addClass("clickable");
      cell.createSpan({ text: String(d), cls: "cal-day-num" });
      if (rec == null ? void 0 : rec.checked)
        cell.createSpan({ text: "\u2714", cls: "cal-check-mark" });
      if (rec == null ? void 0 : rec.checked) {
        cell.onclick = () => {
          new ConfirmDeleteDayModal(this.app, ds, async () => {
            await this.plugin.removeCheckin(ds);
            await this.render();
          }).open();
        };
      }
    }
  }
  // ── Heatmap builder（按年展示）──────────────────────────────────────────────
  buildHeatmap(parent, data, year) {
    const heatWrap = parent.createDiv("checkin-heatmap-wrap");
    const now = new Date();
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    const start = new Date(jan1);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(dec31);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const totalDays = Math.round((end.getTime() - start.getTime()) / 864e5) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);
    const monthRow = heatWrap.createDiv("checkin-heatmap-months");
    const grid = heatWrap.createDiv("checkin-heatmap-grid");
    let monthTracked = -1;
    for (let week = 0; week < totalWeeks; week++) {
      const col = grid.createDiv("checkin-heatmap-col");
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(start);
        d.setDate(start.getDate() + week * 7 + dow);
        if (d.getFullYear() !== year || d > now) {
          col.createDiv("checkin-heat-cell future");
          continue;
        }
        const ds = toDateStr(d);
        const rec = data.records[ds];
        const level = rec ? heatLevel(rec.wordDelta) : 0;
        const cell = col.createDiv(`checkin-heat-cell level-${level}`);
        const deltaText = rec ? rec.wordDelta > 0 ? `+${rec.wordDelta}` : `${rec.wordDelta}` : "0";
        cell.setAttribute(
          "title",
          `${ds}${(rec == null ? void 0 : rec.checked) ? " \u2714 \u5DF2\u6253\u5361" : ""}  \u5F53\u65E5\u5B57\u6570\u53D8\u5316: ${deltaText}`
        );
        if (d.getMonth() !== monthTracked && d.getDate() <= 7) {
          monthTracked = d.getMonth();
          const ml = monthRow.createSpan({ cls: "checkin-month-tick" });
          ml.setText(`${d.getMonth() + 1}\u6708`);
          ml.style.gridColumn = String(week + 1);
        }
      }
    }
  }
  // ── Stats builder ──────────────────────────────────────────────────────────
  buildStats(parent, data) {
    var _a;
    const resetAt = data.statsResetAt;
    const countedRecords = Object.values(data.records).filter((r) => {
      if (!r.checked)
        return false;
      if (resetAt && r.date <= resetAt)
        return false;
      return true;
    });
    const totalDays = countedRecords.length;
    const totalWeeks = Math.floor(totalDays / 7);
    let streak = 0;
    const cur = new Date();
    while (true) {
      const ds = toDateStr(cur);
      if (resetAt && ds <= resetAt)
        break;
      if ((_a = data.records[ds]) == null ? void 0 : _a.checked) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }
    const grid = parent.createDiv("checkin-stats-grid");
    const stats = [
      { icon: "\u{1F5D3}\uFE0F", label: "\u7D2F\u8BA1\u6253\u5361", value: `${totalDays} \u5929` },
      { icon: "\u{1F4C5}", label: "\u5408\u8BA1\u6EE1\u5468", value: `${totalWeeks} \u5468` },
      { icon: "\u{1F525}", label: "\u5F53\u524D\u8FDE\u7EED", value: `${streak} \u5929` }
    ];
    stats.forEach((s) => {
      const card = grid.createDiv("checkin-stat-card");
      card.createDiv({ cls: "stat-icon", text: s.icon });
      card.createDiv({ cls: "stat-value", text: s.value });
      card.createDiv({ cls: "stat-label", text: s.label });
    });
    if (resetAt) {
      parent.createDiv({
        cls: "checkin-stats-note",
        text: `\uFF08\u7EDF\u8BA1\u5DF2\u4E8E ${resetAt} \u540E\u6E05\u7A7A\u91CD\u65B0\u8BA1\u7B97\uFF0C\u65E5\u5386\u4E0E\u70ED\u529B\u56FE\u4E2D\u7684\u5386\u53F2\u8BB0\u5F55\u672A\u53D7\u5F71\u54CD\uFF09`
      });
    }
  }
  // ── Styles ─────────────────────────────────────────────────────────────────
  injectStyles() {
    const id = "checkin-plugin-styles";
    if (document.getElementById(id))
      return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .checkin-root {
        padding: 16px 20px;
        font-family: var(--font-interface);
        max-width: 720px;
        margin: 0 auto;
      }
      .checkin-root h2 { margin: 0 0 12px; font-size: 1.4em; }
      .checkin-root h3 { margin: 12px 0 8px; font-size: 1.1em; color: var(--text-muted); }
      .checkin-root hr { border: none; border-top: 1px solid var(--background-modifier-border); margin: 16px 0; }

      /* Check-in button */
      .checkin-btn-wrap { display: flex; align-items: center; gap: 14px; }
      .checkin-btn {
        padding: 10px 28px;
        font-size: 1.05em;
        border-radius: 10px;
        border: 2px solid var(--interactive-accent);
        background: var(--background-primary);
        color: var(--text-normal);
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 600;
      }
      .checkin-btn:hover { background: var(--interactive-accent); color: #fff; }
      .checkin-btn.checked {
        background: var(--interactive-accent);
        color: #fff;
        border-color: var(--interactive-accent);
        cursor: default;
      }
      .checkin-today-label { font-size: 0.9em; color: var(--text-muted); }

      /* Calendar */
      .checkin-cal-nav {
        display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
      }
      .checkin-nav-btn {
        background: none; border: 1px solid var(--background-modifier-border);
        border-radius: 6px; padding: 2px 10px; cursor: pointer; font-size: 1.2em;
        color: var(--text-normal);
      }
      .checkin-nav-btn:hover { background: var(--background-modifier-hover); }
      .checkin-month-label { font-weight: 600; min-width: 120px; text-align: center; }

      .checkin-cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
      }
      .checkin-cal-header {
        text-align: center;
        font-size: 0.78em;
        color: var(--text-muted);
        padding: 2px 0;
      }
      .checkin-cal-cell {
        aspect-ratio: 1;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 0.88em;
        position: relative;
        border: 1px solid transparent;
        background: var(--background-secondary);
        transition: background 0.15s;
      }
      .checkin-cal-cell.empty { background: transparent; border-color: transparent; }
      .checkin-cal-cell.today {
        border-color: var(--interactive-accent);
        font-weight: 700;
        color: var(--interactive-accent);
      }
      .checkin-cal-cell.checked {
        background: color-mix(in srgb, var(--interactive-accent) 20%, transparent);
      }
      .checkin-cal-cell.clickable { cursor: pointer; }
      .checkin-cal-cell.clickable:hover {
        background: color-mix(in srgb, var(--text-error) 25%, transparent);
        outline: 1px dashed var(--text-error);
      }
      .checkin-hint {
        font-size: 0.78em;
        color: var(--text-muted);
        margin-top: 6px;
      }
      .checkin-nav-btn.disabled { opacity: 0.35; cursor: not-allowed; }
      .checkin-nav-btn.disabled:hover { background: none; }
      .cal-day-num { font-size: 0.95em; line-height: 1; }
      .cal-check-mark {
        font-size: 0.7em;
        color: var(--interactive-accent);
        line-height: 1;
      }

      /* Heatmap */
      .checkin-heatmap-wrap { overflow-x: auto; padding-bottom: 4px; }
      .checkin-heatmap-months {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 14px;
        gap: 3px;
        margin-bottom: 2px;
        padding-left: 2px;
        min-height: 16px;
      }
      .checkin-month-tick { font-size: 0.7em; color: var(--text-muted); white-space: nowrap; }
      .checkin-heatmap-grid {
        display: flex;
        gap: 3px;
      }
      .checkin-heatmap-col { display: flex; flex-direction: column; gap: 3px; }
      .checkin-heat-cell {
        width: 13px; height: 13px;
        border-radius: 3px;
        background: var(--background-modifier-border);
        cursor: default;
        transition: opacity 0.1s;
      }
      .checkin-heat-cell:hover { opacity: 0.75; }
      .checkin-heat-cell.future { background: transparent; }
      .checkin-heat-cell.level-0 { background: var(--background-secondary); }
      .checkin-heat-cell.level-1 { background: color-mix(in srgb, var(--interactive-accent) 30%, var(--background-secondary)); }
      .checkin-heat-cell.level-2 { background: color-mix(in srgb, var(--interactive-accent) 50%, var(--background-secondary)); }
      .checkin-heat-cell.level-3 { background: color-mix(in srgb, var(--interactive-accent) 75%, var(--background-secondary)); }
      .checkin-heat-cell.level-4 { background: var(--interactive-accent); }

      .checkin-heatmap-legend {
        display: flex; align-items: center; gap: 4px;
        margin-top: 8px; font-size: 0.78em; color: var(--text-muted);
      }
      .legend-label { margin: 0 2px; }

      /* Stats */
      .checkin-stats-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .checkin-stats-header-row h3 { margin: 0; }
      .checkin-stats-note {
        font-size: 0.78em;
        color: var(--text-muted);
        margin-top: 8px;
      }
      .checkin-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .checkin-stat-card {
        background: var(--background-secondary);
        border-radius: 10px;
        padding: 14px 10px;
        text-align: center;
        border: 1px solid var(--background-modifier-border);
      }
      .stat-icon { font-size: 1.6em; margin-bottom: 4px; }
      .stat-value { font-size: 1.4em; font-weight: 700; color: var(--interactive-accent); }
      .stat-label { font-size: 0.8em; color: var(--text-muted); margin-top: 2px; }

      /* Reset stats button (used inside stats header row) */
      .checkin-reset-btn {
        background: none;
        border: 1px solid var(--text-error);
        color: var(--text-error);
        border-radius: 8px;
        padding: 4px 12px;
        cursor: pointer;
        font-size: 0.82em;
        transition: all 0.2s;
        white-space: nowrap;
      }
      .checkin-reset-btn:hover { background: var(--text-error); color: #fff; }

      /* Scrollbar */
      .checkin-heatmap-wrap::-webkit-scrollbar { height: 4px; }
      .checkin-heatmap-wrap::-webkit-scrollbar-thumb { background: var(--background-modifier-border); border-radius: 2px; }
    `;
    document.head.appendChild(style);
  }
};
var ConfirmResetStatsModal = class extends import_obsidian.Modal {
  constructor(app, onConfirm) {
    super(app);
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "\u26A0\uFE0F \u786E\u8BA4\u6E05\u7A7A\u7EDF\u8BA1\uFF1F" });
    contentEl.createEl("p", {
      text: "\u300C\u7D2F\u8BA1\u6253\u5361 / \u5408\u8BA1\u6EE1\u5468 / \u5F53\u524D\u8FDE\u7EED\u300D\u5C06\u91CD\u65B0\u4ECE 0 \u5F00\u59CB\u8BA1\u7B97\u3002\u65E5\u5386\u548C\u70ED\u529B\u56FE\u4E2D\u7684\u5386\u53F2\u6253\u5361\u8BB0\u5F55\u4E0D\u4F1A\u88AB\u5220\u9664\uFF0C\u4ECD\u53EF\u67E5\u770B\u3002"
    });
    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });
    btnRow.style.display = "flex";
    btnRow.style.gap = "10px";
    btnRow.style.justifyContent = "flex-end";
    btnRow.style.marginTop = "16px";
    const cancelBtn = btnRow.createEl("button", { text: "\u53D6\u6D88" });
    cancelBtn.onclick = () => this.close();
    const confirmBtn = btnRow.createEl("button", { text: "\u786E\u8BA4\u6E05\u7A7A\u7EDF\u8BA1", cls: "mod-warning" });
    confirmBtn.style.background = "var(--text-error)";
    confirmBtn.style.color = "#fff";
    confirmBtn.style.border = "none";
    confirmBtn.style.borderRadius = "6px";
    confirmBtn.style.padding = "6px 16px";
    confirmBtn.style.cursor = "pointer";
    confirmBtn.onclick = async () => {
      await this.onConfirm();
      this.close();
      new import_obsidian.Notice("\u2705 \u7EDF\u8BA1\u6570\u636E\u5DF2\u6E05\u7A7A\uFF08\u5386\u53F2\u65E5\u5386/\u70ED\u529B\u56FE\u8BB0\u5F55\u4FDD\u7559\uFF09");
    };
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ConfirmDeleteDayModal = class extends import_obsidian.Modal {
  constructor(app, dateStr, onConfirm) {
    super(app);
    this.dateStr = dateStr;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "\u26A0\uFE0F \u5220\u9664\u8BE5\u65E5\u6253\u5361\u8BB0\u5F55\uFF1F" });
    contentEl.createEl("p", {
      text: `\u5C06\u6E05\u9664 ${this.dateStr} \u7684\u6253\u5361\u8BB0\u5F55\uFF0C\u8BE5\u65E5\u671F\u5728\u65E5\u5386\u4E0E\u70ED\u529B\u56FE\u4E2D\u4F1A\u6062\u590D\u4E3A\u300C\u672A\u6253\u5361\u300D\u72B6\u6001\uFF0C\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002`
    });
    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });
    btnRow.style.display = "flex";
    btnRow.style.gap = "10px";
    btnRow.style.justifyContent = "flex-end";
    btnRow.style.marginTop = "16px";
    const cancelBtn = btnRow.createEl("button", { text: "\u53D6\u6D88" });
    cancelBtn.onclick = () => this.close();
    const confirmBtn = btnRow.createEl("button", { text: "\u786E\u8BA4\u5220\u9664", cls: "mod-warning" });
    confirmBtn.style.background = "var(--text-error)";
    confirmBtn.style.color = "#fff";
    confirmBtn.style.border = "none";
    confirmBtn.style.borderRadius = "6px";
    confirmBtn.style.padding = "6px 16px";
    confirmBtn.style.cursor = "pointer";
    confirmBtn.onclick = async () => {
      await this.onConfirm();
      this.close();
      new import_obsidian.Notice(`\u{1F5D1}\uFE0F \u5DF2\u5220\u9664 ${this.dateStr} \u7684\u6253\u5361\u8BB0\u5F55`);
    };
  }
  onClose() {
    this.contentEl.empty();
  }
};
var CheckinSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "\u6BCF\u65E5\u6253\u5361\u63D2\u4EF6\u8BBE\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u4FA7\u8FB9\u680F\u5FEB\u6377\u56FE\u6807").setDesc("\u5728\u5DE6\u4FA7\u529F\u80FD\u533A\u663E\u793A\u6253\u5361\u5165\u53E3\u56FE\u6807").addToggle(
      (t) => t.setValue(this.plugin.settings.ribbonIcon).onChange(async (v) => {
        this.plugin.settings.ribbonIcon = v;
        await this.plugin.saveSettings();
      })
    );
  }
};
var CheckinPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.data = DEFAULT_DATA;
    this.ribbonEl = null;
  }
  async onload() {
    await this.loadSettings();
    await this.loadData_();
    if (this.data.lastWordCountDate === null) {
      const wc = await vaultWordCount(this.app);
      this.data.lastWordCount = wc;
      this.data.lastWordCountDate = today();
      await this.saveData_();
    }
    this.registerView(VIEW_TYPE, (leaf) => new CheckinView(leaf, this));
    if (this.settings.ribbonIcon)
      this.addRibbonIcon_();
    this.addCommand({
      id: "open-checkin-view",
      name: "\u6253\u5F00\u6253\u5361\u9762\u677F",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "quick-checkin",
      name: "\u5FEB\u901F\u6253\u5361\uFF08\u4ECA\u65E5\uFF09",
      callback: async () => {
        await this.doCheckin();
        this.refreshView();
      }
    });
    this.addSettingTab(new CheckinSettingTab(this.app, this));
    this.registerEvent(
      this.app.vault.on("modify", async () => {
        await this.updateTodayWordDelta();
      })
    );
  }
  onunload() {
    const el = document.getElementById("checkin-plugin-styles");
    if (el)
      el.remove();
  }
  /**
   * 计算并写入"今天"的字数增量（wordDelta）。
   * 逻辑：取当前仓库总字数 wc；
   *   - 如果 lastWordCountDate 不是今天（说明这是今天第一次修改，或插件刚启动遇到的第一次修改），
   *     则把"今天开始前"的基准线设为 lastWordCount（也就是上一次记录到的总字数，通常是昨天结束时的值）。
   *   - delta = wc - 今天的基准线，且不允许为负（删除内容不会让热力图变浅于0）。
   *   - 同时把 lastWordCount / lastWordCountDate 滚动更新为"今天，wc"，
   *     这样跨天后下一次 modify 会以今天的 wc 作为新的基准线。
   */
  async updateTodayWordDelta() {
    const wc = await vaultWordCount(this.app);
    const todayStr = today();
    let rec = this.data.records[todayStr];
    if (!rec) {
      rec = { date: todayStr, checked: false, wordDelta: 0, baselineWordCount: this.data.lastWordCount };
      this.data.records[todayStr] = rec;
    }
    if (this.data.lastWordCountDate !== todayStr) {
      rec.baselineWordCount = this.data.lastWordCount;
    }
    const delta = wc - rec.baselineWordCount;
    rec.wordDelta = Math.max(0, delta);
    this.data.lastWordCount = wc;
    this.data.lastWordCountDate = todayStr;
    await this.saveData_();
  }
  // ── Check-in logic ──────────────────────────────────────────────────────────
  async doCheckin() {
    var _a;
    const todayStr = today();
    if ((_a = this.data.records[todayStr]) == null ? void 0 : _a.checked) {
      new import_obsidian.Notice("\u4ECA\u5929\u5DF2\u7ECF\u6253\u5361\u8FC7\u4E86\uFF01");
      return;
    }
    await this.updateTodayWordDelta();
    const rec = this.data.records[todayStr];
    rec.checked = true;
    await this.saveData_();
    new import_obsidian.Notice("\u{1F389} \u6253\u5361\u6210\u529F\uFF01\u7EE7\u7EED\u52A0\u6CB9\uFF5E");
  }
  // ── Reset stats only（不影响日历/热力图历史记录）─────────────────────────────
  async resetStatsOnly() {
    this.data.statsResetAt = today();
    await this.saveData_();
  }
  // ── Remove a single day's check-in（日历点击单日清除）─────────────────────────
  async removeCheckin(dateStr) {
    if (this.data.records[dateStr]) {
      delete this.data.records[dateStr];
      await this.saveData_();
    }
  }
  // ── View ─────────────────────────────────────────────────────────────────────
  async activateView() {
    var _a;
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = (_a = workspace.getRightLeaf(false)) != null ? _a : workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
  refreshView() {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if ((leaf == null ? void 0 : leaf.view) instanceof CheckinView)
      leaf.view.render();
  }
  // ── Ribbon ────────────────────────────────────────────────────────────────────
  addRibbonIcon_() {
    this.ribbonEl = this.addRibbonIcon("calendar-check-2", "\u6BCF\u65E5\u6253\u5361", () => this.activateView());
  }
  // ── Persistence ───────────────────────────────────────────────────────────────
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async loadData_() {
    const raw = await this.loadData();
    if (raw == null ? void 0 : raw.records) {
      this.data = raw;
    }
  }
  async saveData_() {
    await this.saveData({ ...this.settings, ...this.data });
  }
};
