// ============================================
// 🔄 Main Utils - Re-exports from organized modules
// ============================================

// Re-export everything
export { formatNumber as fmt, formatCurrency as fDZD, formatCompact as fmtInt, CURRENCY_SYMBOL } from './utils/money';
export { LEVELS as LVS, getLevelName as lvN, getLevelData as lvD, getLevelIndex as lvI } from './utils/levels';
export { MARKET_DATA as MKT } from './utils/market';
export { WHEEL_PRIZES as WP } from './utils/wheel';
export { TASK_TEMPLATES, getToday as today, generateDailyTasks, TASK_TEMPLATES as TASKS_RAW } from './utils/tasks';
export { TRANSLATIONS as T } from './utils/i18n';
export { FUNDS } from './utils/funds';

// Re-export task name arrays for backward compatibility
import { TASK_TEMPLATES } from './utils/tasks';
export const TASKS_AR = TASK_TEMPLATES.map(t => t.ar);
export const TASKS_EN = TASK_TEMPLATES.map(t => t.en);
