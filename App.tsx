import { useEffect, useState, useRef } from 'react';
import { useStore } from './store';
import { Auth } from './components/Auth';
import { Home } from './components/Home';
import { Tasks } from './components/Tasks';
import { Upgrade } from './components/Upgrade';
import { Profile } from './components/Profile';
import { Company } from './components/Company';
import { Invest } from './components/Invest';
import { Wheel } from './components/Wheel';
import { Nav, Toast, Sheet, SaveBadge } from './components/ui';
import { Bot, X, Send } from 'lucide-react';
import { T, fDZD, lvN, lvD } from './utils';
import { saveUser, updateUserByCode } from './backend';
import { applyInvestmentAccrual, applyReferralMilestones, ensureUserShape } from './appBrain';
import { WILAYAS, isValidWilaya, normalizeAlgerianPhone } from './utils/algeria';

function aiResp(txt: string, u: any, lang: string) {
  const lo = txt.toLowerCase(); const ar = lang === 'ar';
  const lv = lvD(u.level || 'trial'); const pr = Math.max(43, Math.round(lv.dy / 5));
  if (/hello|hi\b|hey|مرحبا|هلا|اهلا|السلام/.test(lo))
    return ar?`أهلاً ${u.un}! 👋\n\nأنا مساعد BlackRock.\n\n📊 رصيدك: ${fDZD(u.balance||0)}\n🏆 مستواك: ${lvN(u.level)}\n👥 فريقك: ${u.teamCount||0}\n\nكيف أساعدك؟`:`Hello ${u.un}! 👋\n\nI'm BlackRock AI.\n\n📊 Balance: ${fDZD(u.balance||0)}\n🏆 Level: ${lvN(u.level)}\n👥 Team: ${u.teamCount||0}\n\nHow can I help?`;
  if (/earn|money|ربح|اكسب|كيف|طريقة/.test(lo))
    return ar?`💡 استراتيجية الربح:\n\n1️⃣ المهام: 5 × ${pr} = ${pr*5} د.ج/يوم\n2️⃣ الإحالات: 5% مدى الحياة\n3️⃣ الترقية: M1→G7\n\n🏆 10 أصدقاء = ترقية مجانية!`:`💡 Earning:\n\n1️⃣ Tasks: 5 × ${pr} = ${pr*5} د.ج/day\n2️⃣ Referrals: 5% forever\n3️⃣ Upgrade: M1→G7\n\n🏆 10 friends = Free upgrade!`;
  if (/task|daily|مهمة|مهام/.test(lo))
    return ar?`⏱️ المهام اليومية:\n\n• 5 مهام كل يوم\n• كل مهمة = ${pr} د.ج\n• الإجمالي: ${pr*5} د.ج/يوم\n\nمستواك: ${lvN(u.level)}`:`⏱️ Daily Tasks:\n\n• 5 tasks daily\n• Each = ${pr} د.ج\n• Total: ${pr*5} د.ج/day\n\nLevel: ${lvN(u.level)}`;
  if (/withdraw|سحب|اخراج/.test(lo))
    return ar?`💳 السحب:\n\n• السحب عبر CCP بريد الجزائر فقط\n• الحد الأدنى: 10,000 د.ج\n• الشرط: مستوى M1 فأعلى\n• مدة المعالجة: 48 إلى 72 ساعة\n\n⚠️ يجب أن يكون الاسم مطابقاً لحساب CCP\n\n📲 افتح: الرئيسية ← سحب`:`💳 Withdrawal:\n\n• CCP Algeria Post only\n• Minimum: 10,000 د.ج\n• Requires: M1 level+\n• Processing: 48 to 72 hours\n\n⚠️ Name must match CCP account\n\n📲 Go to: Home ← Withdraw`;
  if (/شحن|deposit|إيداع|charge/.test(lo))
    return ar?`💰 شحن الرصيد:\n\n• تواصل مع وكلاء الشركة عبر Signal فقط\n• هذا رابطنا، تجدون الوكلاء للشحن أو الاستثمار:\nhttps://signal.me/#eu/L83qJeaPf2bTPDCX-Sq0r1Mf_PBRuGWiKOri-C0YmNn8Gaw41X1FXJHAsGcexJmI\n\n• أرسل المبلغ مع كود حسابك\n• يتم تفعيل الرصيد خلال 15 دقيقة\n• لا يوجد حد أدنى أو حد أقصى للشحن\n\n⚠️ لا يوجد شحن عبر Baridimob أو CCP مباشرة\n\n📲 افتح: الرئيسية ← شحن`:`💰 Deposit:\n\n• Contact company agents through Signal only\n• Agents link:\nhttps://signal.me/#eu/L83qJeaPf2bTPDCX-Sq0r1Mf_PBRuGWiKOri-C0YmNn8Gaw41X1FXJHAsGcexJmI\n\n• Send amount with your account code\n• Balance activated within 15 minutes\n• No minimum or maximum deposit limit\n\n⚠️ No direct Baridimob or CCP deposits\n\n📲 Go to: Home ← Deposit`;
  if (/referral|friend|احال|صديق|5%/.test(lo))
    return ar?`🎯 الإحالات:\n\n✅ 🎡 عجلة حظ لك وله\n✅ 5% من أرباحه!\n\n👥 فريقك: ${u.teamCount||0}\n💰 أرباح: ${fDZD(u.refEarn||0)}`:`🎯 Referrals:\n\n✅ 🎡 Spin for both\n✅ 5% of earnings!\n\n👥 Team: ${u.teamCount||0}\n💰 Earnings: ${fDZD(u.refEarn||0)}`;
  if (/شركة|company|blackrock/.test(lo))
    return ar?`🏢 BlackRock, Inc\n\n• 1988 — نيويورك\n• 10.2 تريليون $\n• NYSE: BLK\n\n🇩🇿 العقد: يناير 2025 → ديسمبر 2027`:`🏢 BlackRock, Inc\n\n• 1988 — New York\n• $10.2T AUM\n• NYSE: BLK\n\n🇩🇿 Contract: Jan 2025 → Dec 2027`;
  if (/رصيد|balance|كم/.test(lo))
    return ar?`💰 رصيدك:\n\n💳 ${fDZD(u.balance||0)}\n📋 مهام: ${fDZD(u.taskBal||0)}\n🤝 إحالات: ${fDZD(u.refEarn||0)}\n📈 إجمالي: ${fDZD(u.totalEarned||0)}`:`💰 Balance:\n\n💳 ${fDZD(u.balance||0)}\n📋 Tasks: ${fDZD(u.taskBal||0)}\n🤝 Ref: ${fDZD(u.refEarn||0)}\n📈 Total: ${fDZD(u.totalEarned||0)}`;
  if (/wheel|عجلة|spin/.test(lo))
    return ar?`🎡 عجلة الحظ:\n\nدوراتك: ${u.wheelSpins||0}\n\nكل صديق = دورة لك + دورة له!\n\n🥇 430  🥈 215  🥉 86  🎁 43`:`🎡 Wheel:\n\nSpins: ${u.wheelSpins||0}\n\nEach friend = spin for both!\n\n🥇 430  🥈 215  🥉 86  🎁 43`;
  return ar?`🤔 جرّب:\n• "كيف أربح؟"\n• "المهام"\n• "الإحالات"\n• "رصيدي"\n• "السحب"\n• "الشركة"`:`🤔 Try:\n• "How to earn?"\n• "Tasks"\n• "Referrals"\n• "Balance"\n• "Withdraw"\n• "Company"`;
}

function AI() {
  const { user, lang, aiMsgs, addAi } = useStore();
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [aiMsgs, typing]);

  const send = (ov?: string) => {
    const val = ov || input.trim(); if (!val || typing) return;
    addAi({ id: Date.now(), r: 'user', text: val }); setInput(''); setTyping(true);
    setTimeout(() => { addAi({ id: Date.now() + 1, r: 'ai', text: aiResp(val, user, lang) }); setTyping(false); }, 500 + Math.random() * 700);
  };

  const qs = lang === 'ar' ? ['كيف أربح؟','المهام','الشحن','السحب','رصيدي','الشركة'] : ['Earn?','Tasks','Deposit','Withdraw','Balance','Company'];

  return (
    <>
      {/* FAB Button */}
      <button onClick={() => {
        setOpen(true);
        if (aiMsgs.length === 0) addAi({ id: 1, r: 'ai', text: lang === 'ar'
          ? 'أهلاً بك! 👋\n\nأنا المساعد الذكي لمنصة BlackRock.\nيمكنني مساعدتك في:\n\n💰 طرق الربح والمهام\n📊 معلومات رصيدك\n🏢 معلومات الشركة\n💳 السحب والإيداع\n👥 نظام الإحالات\n🎡 عجلة الحظ\n\nاكتب سؤالك أو اختر من الأزرار أدناه 👇'
          : "Welcome! 👋\n\nI'm BlackRock's AI Assistant.\nI can help you with:\n\n💰 Earning & Tasks\n📊 Your Balance\n🏢 Company Info\n💳 Withdrawals\n👥 Referral System\n🎡 Lucky Wheel\n\nType your question or tap a button below 👇"
        });
      }} style={{
        position: 'fixed', bottom: 78, left: 12, zIndex: 49,
        width: 52, height: 52,
        background: 'linear-gradient(135deg, #D4AF37, #C9992C)',
        borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(212,175,55,.4)',
      }} className="an-float">
        <div className="an-pulse" style={{
          position: 'absolute', top: -2, right: -2,
          width: 12, height: 12, background: '#22C55E', borderRadius: 6,
          border: '2px solid #020509',
        }} />
        <Bot size={24} color="#020509" />
      </button>

      {/* AI Chat Screen */}
      {open && (
        <div className="an-fadeIn" style={{
          position: 'fixed', inset: 0, background: '#020509',
          zIndex: 300, display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(212,175,55,.08)',
            background: 'rgba(2,5,9,.97)', flexShrink: 0,
          }}>
            <button onClick={() => setOpen(false)} style={{
              width: 40, height: 40,
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,.5)',
            }}><X size={18} /></button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 900, color: '#D4AF37', letterSpacing: 2 }}>AI ASSISTANT</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 2 }}>
                <span className="an-pulse" style={{ width: 7, height: 7, background: '#22C55E', borderRadius: 4, display: 'inline-block' }} />
                <span style={{ color: '#22C55E', fontSize: 11, fontWeight: 800 }}>Online</span>
              </div>
            </div>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #D4AF37, #C9992C)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Bot size={20} color="#020509" /></div>
          </div>

          {/* Messages */}
          <div ref={msgsRef} className="no-sb touch-scroll" style={{
            flex: 1, overflowY: 'auto',
            padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {aiMsgs.map(m => (
              <div key={m.id} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                justifyContent: m.r === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {m.r === 'ai' && (
                  <div style={{
                    width: 32, height: 32,
                    background: 'linear-gradient(135deg, #D4AF37, #C9992C)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}><Bot size={16} color="#020509" /></div>
                )}
                <div style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: 15, lineHeight: 1.8, maxWidth: '82%',
                  padding: '12px 16px',
                  borderRadius: 18,
                  ...(m.r === 'ai' ? {
                    background: 'rgba(10,16,32,.95)',
                    border: '1px solid rgba(255,255,255,.06)',
                    borderTopLeftRadius: 4,
                    color: 'rgba(255,255,255,.85)',
                  } : {
                    background: 'linear-gradient(135deg, #D4AF37, #C9992C)',
                    borderTopRightRadius: 4,
                    color: '#020509', fontWeight: 700,
                  }),
                }}>{m.text}</div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  width: 32, height: 32,
                  background: 'linear-gradient(135deg, #D4AF37, #C9992C)',
                  borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}><Bot size={16} color="#020509" /></div>
                <div style={{
                  background: 'rgba(10,16,32,.95)',
                  border: '1px solid rgba(255,255,255,.06)',
                  borderRadius: 18, borderTopLeftRadius: 4,
                  padding: '14px 20px',
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  <span className="td1" style={{ width: 7, height: 7, background: 'rgba(255,255,255,.3)', borderRadius: 4, display: 'inline-block' }} />
                  <span className="td2" style={{ width: 7, height: 7, background: 'rgba(255,255,255,.3)', borderRadius: 4, display: 'inline-block' }} />
                  <span className="td3" style={{ width: 7, height: 7, background: 'rgba(255,255,255,.3)', borderRadius: 4, display: 'inline-block' }} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Input Area */}
          <div style={{
            flexShrink: 0,
            padding: '8px 16px 16px',
            borderTop: '1px solid rgba(212,175,55,.06)',
          }}>
            {/* Quick buttons */}
            <div className="no-sb" style={{
              display: 'flex', gap: 6, overflowX: 'auto',
              paddingBottom: 8, WebkitOverflowScrolling: 'touch',
            }}>
              {qs.map(q => (
                <button key={q} onClick={() => send(q)} style={{
                  padding: '7px 14px',
                  background: 'rgba(212,175,55,.06)',
                  border: '1px solid rgba(212,175,55,.15)',
                  borderRadius: 99, color: '#D4AF37',
                  fontSize: 13, fontWeight: 800,
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif',
                }}>{q}</button>
              ))}
            </div>
            {/* Input */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: 14, color: '#fff',
                  padding: '12px 16px', fontSize: 15, fontWeight: 700,
                  outline: 'none', fontFamily: 'Tajawal, sans-serif',
                }}
                placeholder={t.aiP}
              />
              <button onClick={() => send()} style={{
                width: 46, height: 46, borderRadius: 14,
                background: 'linear-gradient(135deg, #D4AF37, #C9992C)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}><Send size={20} color="#020509" /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const { user, tab, lang, showWheel, showCompany, showInvest, updUser, toast2, setSheet, closeSheet } = useStore();
  const inviteLink = (code: string) => {
    const basePath = window.location.pathname.replace(/\/?index\.html$/i, '').replace(/\/$/, '');
    return `${window.location.origin}${basePath || ''}?code=${code}`;
  };

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => saveUser(user).catch(console.error), 450);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toDateString();
    const shaped = ensureUserShape(user);
    const migrated = {
      investments: user.investments || [],
      withdrawals: user.withdrawals || [],
      upgradeRequests: user.upgradeRequests || [],
      notifs: user.notifs || [],
      investEarned: user.investEarned || 0,
      loginStreak: user.loginStreak || 0,
      badges: user.badges || [],
      team: user.team || [],
      avatar: typeof user.avatar === 'string' && user.avatar.includes('dicebear') ? user.avatar : null,
      phone: user.phone || '',
      wilaya: user.wilaya || '',
      profileCompleted: Boolean(user.profileCompleted && normalizeAlgerianPhone(user.phone || '') && isValidWilaya(user.wilaya || '')),
      activityLog: user.activityLog || [],
      showLiveActivity: user.showLiveActivity !== false,
      ref: (!user.ref || user.ref.includes('?ref=') || user.ref.includes('/ref/') || user.ref.includes('/invite') || !user.ref.includes('?code=')) ? inviteLink(user.code) : user.ref,
    };
    const accrual = applyInvestmentAccrual(shaped, lang);
    if (accrual.changed) {
      updUser(accrual.user);
      if (accrual.message) toast2(accrual.message, 'success');
      return;
    }
    const referralMilestone = applyReferralMilestones(shaped, lang);
    if (referralMilestone.changed) {
      updUser(referralMilestone.user);
      toast2(lang === 'ar' ? '🏆 تم فتح ترقية مجانية' : '🏆 Free upgrade unlocked', 'success');
      return;
    }
    if (user.lastLogin !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const streak = user.lastLogin === yesterday ? (user.loginStreak || 0) + 1 : 1;
      const reward = Math.min(100, 10 + streak * 2);
      updUser({
        ...migrated,
        lastLogin: today,
        loginStreak: streak,
        balance: (user.balance || 0) + reward,
        totalEarned: (user.totalEarned || 0) + reward,
        notifs: [
          ...migrated.notifs,
          { id: Date.now(), title: lang === 'ar' ? '🎁 مكافأة الحضور اليومي' : '🎁 Daily check-in reward', desc: `+${reward} د.ج • ${streak} ${lang === 'ar' ? 'أيام متتالية' : 'day streak'}`, t: new Date().toLocaleTimeString(), r: false }
        ],
        activityLog: [...migrated.activityLog.slice(-30), new Date().toLocaleString() + ` - daily login +${reward} د.ج`],
      });
      toast2(lang === 'ar' ? `🎁 مكافأة حضور +${reward} د.ج` : `🎁 Check-in +${reward} د.ج`, 'success');
    } else if (!user.investments || !user.withdrawals || !user.upgradeRequests || !user.ref || (typeof user.avatar === 'string' && !user.avatar.includes('dicebear'))) {
      updUser(migrated);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const validPhone = normalizeAlgerianPhone(user.phone || '');
    const validWilaya = isValidWilaya(user.wilaya || '');
    if (user.profileCompleted && validPhone && validWilaya) return;
    let phoneVal = validPhone;
    let wilayaVal = validWilaya ? (user.wilaya || '') : '';
    let showWilayas = false;
    const render = () => setSheet(
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div style={{textAlign:'center'}}>
          <p style={{color:'#fff',fontWeight:900,fontSize:18,marginBottom:4}}>{lang==='ar'?'إكمال معلومات الحساب':'Complete account information'}</p>
          <p style={{color:'rgba(255,255,255,.42)',fontSize:12,lineHeight:1.7}}>{lang==='ar'?'رقم الهاتف والولاية مطلوبان مرة واحدة ولا يمكن تغييرهما لاحقاً.':'Phone and wilaya are required once and cannot be changed later.'}</p>
        </div>
        <div>
          <label style={{display:'block',color:'rgba(255,255,255,.45)',fontWeight:800,fontSize:12,marginBottom:6}}>{lang==='ar'?'رقم الهاتف الجزائري':'Algerian phone number'}</label>
          <input defaultValue={phoneVal} onChange={e=>phoneVal=normalizeAlgerianPhone(e.target.value)} style={{width:'100%',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,color:'#fff',padding:'13px 14px',fontSize:15,fontWeight:800,outline:'none',direction:'ltr',textAlign:'left',fontFamily:'Montserrat,sans-serif'}} />
        </div>
        <div>
          <label style={{display:'block',color:'rgba(255,255,255,.45)',fontWeight:800,fontSize:12,marginBottom:6}}>{lang==='ar'?'الولاية':'Wilaya'}</label>
          <button onClick={()=>{showWilayas=!showWilayas; render();}} style={{width:'100%',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,color:wilayaVal?'#fff':'rgba(255,255,255,.55)',padding:'13px 14px',fontSize:15,fontWeight:800,cursor:'pointer',fontFamily:'Tajawal,sans-serif',display:'flex',justifyContent:'space-between'}}><span>{wilayaVal || (lang==='ar'?'اختر ولايتك':'Choose wilaya')}</span><span style={{color:'#D4AF37'}}>⌄</span></button>
          {showWilayas && <div className="no-sb" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,maxHeight:260,overflowY:'auto',marginTop:8}}>{WILAYAS.map(w=><button key={w} onClick={()=>{wilayaVal=w;showWilayas=false;render();}} style={{background:wilayaVal===w?'linear-gradient(135deg,#D4AF37,#C9992C)':'rgba(255,255,255,.04)',border:wilayaVal===w?'none':'1px solid rgba(255,255,255,.07)',borderRadius:10,padding:'9px 6px',color:wilayaVal===w?'#020509':'#fff',fontWeight:800,cursor:'pointer',fontFamily:'Tajawal,sans-serif'}}>{w}</button>)}</div>}
        </div>
        <button onClick={()=>{
          if(!phoneVal){toast2(lang==='ar'?'أدخل رقم جزائري صحيح':'Enter a valid Algerian phone','error');return;}
          if(!wilayaVal){toast2(lang==='ar'?'اختر الولاية':'Choose wilaya','error');return;}
          updUser({phone:phoneVal,wilaya:wilayaVal,profileCompleted:true});
          closeSheet();
          toast2(lang==='ar'?'تم حفظ معلوماتك':'Information saved','success');
        }} className="bg-gold" style={{border:'none',borderRadius:14,padding:'14px 0',color:'#020509',fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'Tajawal,sans-serif'}}>✓ {lang==='ar'?'حفظ نهائي':'Save permanently'}</button>
      </div>,
      lang==='ar'?'معلومات الحساب':'Account Info'
    );
    render();
  }, [user?.id, user?.profileCompleted]);

  useEffect(() => {
    if (!user?.joinedVia || user.m1ReferralCredited || !user.level || user.level === 'trial') return;
    updateUserByCode(user.joinedVia, referrer => {
      const updatedTeam = (referrer.team || []).map(m => m.code === user.code ? { ...m, level: user.level, active: true } : m);
      const credited = (referrer.m1Refs || 0) + 1;
      const withCredit = {
        ...referrer,
        team: updatedTeam,
        m1Refs: credited,
        refEarn: (referrer.refEarn || 0) + 350,
        balance: (referrer.balance || 0) + 350,
        totalEarned: (referrer.totalEarned || 0) + 350,
        notifs: [...(referrer.notifs || []), { id: Date.now(), title: '💎 صديق وصل M1', desc: `${user.un} وصل إلى ${user.level}. +350 د.ج`, t: new Date().toLocaleTimeString(), r: false }],
        activityLog: [...(referrer.activityLog || []).slice(-30), `${new Date().toLocaleString()} - friend M1 ${user.un} +350 د.ج`],
      };
      return applyReferralMilestones(withCredit, lang).user;
    }).then(() => updUser({ m1ReferralCredited: true })).catch(console.error);
  }, [user?.id, user?.level, user?.joinedVia, user?.m1ReferralCredited]);

  if (!user) return (<><Auth /><Toast /></>);

  return (
    <div className="w-full max-w-[430px] h-full relative overflow-hidden bg-[#020509] mx-auto">
      <div className="absolute top-0 left-0 right-0 bottom-[68px] overflow-y-auto overflow-x-hidden no-sb touch-scroll bg-[#020509]">
        {tab === 'home' && <Home />}
        {tab === 'tasks' && <Tasks />}
        {tab === 'up' && <Upgrade />}
        {tab === 'profile' && <Profile />}
      </div>
      <Nav />
      {(tab === 'home' || tab === 'tasks') && <AI />}
      {showWheel && <Wheel />}
      {showCompany && <Company />}
      {showInvest && <Invest />}
      <Toast />
      <SaveBadge />
      <Sheet />
    </div>
  );
}
