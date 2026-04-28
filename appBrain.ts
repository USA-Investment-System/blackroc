import type { User } from './store';
import { LEVELS } from './utils/levels';

const dayMs = 86400000;

function levelIndex(id: string | null | undefined) {
  const i = LEVELS.findIndex(l => l.id === id);
  return i >= 0 ? i : 0;
}

function nextLevelId(current: string | null | undefined) {
  const i = levelIndex(current);
  return LEVELS[Math.min(i + 1, LEVELS.length - 1)]?.id || current || 'trial';
}

export function ensureUserShape(user: User): User {
  return {
    ...user,
    balance: user.balance || 0,
    taskBal: user.taskBal || 0,
    refEarn: user.refEarn || 0,
    teamCount: user.teamCount || 0,
    wheelSpins: user.wheelSpins || 0,
    m1Refs: user.m1Refs || 0,
    totalEarned: user.totalEarned || 0,
    investments: user.investments || [],
    withdrawals: user.withdrawals || [],
    upgradeRequests: user.upgradeRequests || [],
    team: user.team || [],
    notifs: user.notifs || [],
    badges: user.badges || [],
    activityLog: user.activityLog || [],
    investEarned: user.investEarned || 0,
    loginStreak: user.loginStreak || 0,
    referralUpgradeCount: user.referralUpgradeCount || 0,
  };
}

export function applyInvestmentAccrual(user: User, lang: string): { user: User; changed: boolean; message?: string } {
  let u = ensureUserShape(user);
  let changed = false;
  let totalDelta = 0;

  const investments = u.investments.map(inv => {
    if (inv.status === 'completed' && inv.principalReturned) return inv;
    const passedDays = Math.min(Math.floor((Date.now() - new Date(inv.date).getTime()) / dayMs), inv.days);
    const expectedEarned = Math.max(0, inv.amount * inv.daily / 100 * passedDays);
    const delta = Math.max(0, expectedEarned - (inv.earned || 0));
    let next = { ...inv, earned: expectedEarned };
    if (delta > 0) {
      totalDelta += delta;
      changed = true;
    }
    if (passedDays >= inv.days && !inv.principalReturned) {
      totalDelta += inv.amount;
      next = { ...next, status: 'completed', principalReturned: true };
      changed = true;
    }
    return next;
  });

  if (!changed) return { user: u, changed: false };

  const rounded = Math.round(totalDelta * 100) / 100;
  const title = lang === 'ar' ? '📈 أرباح الاستثمار' : '📈 Investment earnings';
  const desc = `+${rounded.toLocaleString('fr-DZ')} د.ج`;
  u = {
    ...u,
    investments,
    balance: (u.balance || 0) + rounded,
    totalEarned: (u.totalEarned || 0) + rounded,
    investEarned: (u.investEarned || 0) + rounded,
    notifs: [...u.notifs, { id: Date.now(), title, desc, t: new Date().toLocaleTimeString(), r: false }],
    activityLog: [...(u.activityLog || []).slice(-30), `${new Date().toLocaleString()} - investment accrual ${desc}`],
  };
  return { user: u, changed: true, message: desc };
}

export function applyReferralMilestones(user: User, lang: string): { user: User; changed: boolean } {
  let u = ensureUserShape(user);
  const earnedBlocks = Math.floor((u.m1Refs || 0) / 10);
  const claimedBlocks = u.referralUpgradeCount || 0;
  if (earnedBlocks <= claimedBlocks) return { user: u, changed: false };

  let level = u.level;
  for (let i = claimedBlocks; i < earnedBlocks; i++) {
    level = levelIndex(level) < levelIndex('m2') ? 'm2' : nextLevelId(level);
  }
  const lvlName = LEVELS.find(l => l.id === level)?.n || 'M2';
  u = {
    ...u,
    level,
    referralUpgradeCount: earnedBlocks,
    notifs: [...u.notifs, {
      id: Date.now() + 2,
      title: lang === 'ar' ? '🏆 ترقية مجانية من الإحالات' : '🏆 Free referral upgrade',
      desc: lang === 'ar' ? `تهانينا! حصلت على ${lvlName} مجاناً لأن 10 أصدقاء وصلوا M1.` : `Congrats! You unlocked ${lvlName} for free because 10 friends reached M1.`,
      t: new Date().toLocaleTimeString(),
      r: false,
    }],
    activityLog: [...(u.activityLog || []).slice(-30), `${new Date().toLocaleString()} - referral free upgrade ${lvlName}`],
  };
  return { user: u, changed: true };
}
