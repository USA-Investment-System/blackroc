import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReactNode } from 'react';

export interface Notif { id:number; title:string; desc:string; t:string; r:boolean; }
export interface Investment { id:number; fundId:number; amount:number; date:string; days:number; daily:number; status:'active'|'completed'; earned:number; principalReturned?:boolean; }
export interface WithdrawReq { id:number; amount:number; ccp:string; name:string; date:string; status:'pending'|'approved'|'rejected'; }
export interface UpgradeReq { id:number; levelId:string; levelName:string; amount:number; date:string; status:'pending'|'approved'|'rejected'; ref:string; }
export interface TeamMember { id:number; username:string; code:string; joined:string; avatar?:string|null; level?:string|null; active:boolean; }
export interface User {
  id:number; un:string; pw:string; code:string; ref:string;
  phone?:string; wilaya?:string;
  balance:number; taskBal:number; refEarn:number; teamCount:number;
  wheelSpins:number; m1Refs:number; level:string|null; totalEarned:number;
  avatar:string|null; joined:string; joinedVia:string|null; notifs:Notif[];
  investments:Investment[]; investEarned:number;
  withdrawals:WithdrawReq[]; upgradeRequests?:UpgradeReq[];
  team?:TeamMember[]; lastLogin?:string; loginStreak?:number; badges?:string[]; activityLog?:string[];
  referralUpgradeCount?:number; m1ReferralCredited?:boolean;
  showLiveActivity?:boolean; profileCompleted?:boolean;
}
export interface Task {
  id:number; ar:string; en:string; sec:number; reward:number;
  status:'available'|'active'|'done'|'failed';
}

type Tab = 'home'|'tasks'|'up'|'profile';
type Lang = 'ar'|'en';
type ToastT = {msg:string; type:'success'|'error'|'warning'|'info'; id:number}|null;
type SheetT = {content:ReactNode; title:string}|null;
type AiMsg = {id:number; r:'ai'|'user'; text:string};

export interface S {
  lang:Lang; user:User|null; tab:Tab; tasks:Task[]|null;
  activeTask:number|null; cdVal:number; aiMsgs:AiMsg[];
  wheelRot:number; showWheel:boolean; showAI:boolean; showCompany:boolean; showInvest:boolean;
  toast:ToastT; sheet:SheetT; savePulse:number;
  toggleLang:()=>void; setUser:(u:User|null)=>void; updUser:(u:Partial<User>)=>void;
  setTab:(t:Tab)=>void; setTasks:(t:Task[])=>void;
  updTask:(id:number,s:Task['status'])=>void;
  setActive:(id:number|null,cd?:number)=>void; decCd:()=>void;
  addAi:(m:AiMsg)=>void; setWheelRot:(r:number)=>void;
  setShowWheel:(b:boolean)=>void; setShowAI:(b:boolean)=>void;
  setShowCompany:(b:boolean)=>void; setShowInvest:(b:boolean)=>void;
  toast2:(msg:string,type:'success'|'error'|'warning'|'info')=>void;
  setSheet:(c:ReactNode,t:string)=>void; closeSheet:()=>void;
  logout:()=>void;
}

export const useStore = create<S>()(
  persist(
    (set) => ({
      lang:'ar', user:null, tab:'home', tasks:null, activeTask:null, cdVal:40,
      aiMsgs:[], wheelRot:0, showWheel:false, showAI:false, showCompany:false, showInvest:false,
      toast:null, sheet:null, savePulse:0,
      toggleLang:()=>set(s=>{const n=s.lang==='ar'?'en':'ar';document.documentElement.lang=n;document.documentElement.dir=n==='ar'?'rtl':'ltr';return{lang:n}}),
      setUser:user=>set(s=>({user,savePulse:s.savePulse+1})),
      updUser:u=>set(s=>({user:s.user?{...s.user,...u}:null,savePulse:s.savePulse+1})),
      setTab:tab=>set(s=>({tab,savePulse:s.savePulse+1})),
      setTasks:tasks=>set(s=>({tasks,savePulse:s.savePulse+1})),
      updTask:(id,status)=>set(s=>({tasks:s.tasks?s.tasks.map(t=>t.id===id?{...t,status}:t):null,savePulse:s.savePulse+1})),
      setActive:(id,cd=40)=>set(s=>({activeTask:id,cdVal:cd,savePulse:s.savePulse+1})),
      decCd:()=>set(s=>({cdVal:Math.max(0,s.cdVal-1)})),
      addAi:m=>set(s=>({aiMsgs:[...s.aiMsgs,m],savePulse:s.savePulse+1})),
      setWheelRot:wheelRot=>set(s=>({wheelRot,savePulse:s.savePulse+1})),
      setShowWheel:showWheel=>set({showWheel}),
      setShowAI:showAI=>set({showAI}),
      setShowCompany:showCompany=>set({showCompany}),
      setShowInvest:showInvest=>set({showInvest}),
      toast2:(msg,type)=>set({toast:{msg,type,id:Date.now()}}),
      setSheet:(content,title)=>set({sheet:{content,title}}),
      closeSheet:()=>set({sheet:null}),
      logout:()=>set({user:null,tab:'home',tasks:null,activeTask:null,aiMsgs:[],wheelRot:0,showWheel:false,showAI:false,showCompany:false,showInvest:false}),
    }),
    {
      name:'br10-store',
      partialize:(s)=>({lang:s.lang,user:s.user,tasks:s.tasks,wheelRot:s.wheelRot,aiMsgs:s.aiMsgs,activeTask:s.activeTask,cdVal:s.cdVal,tab:s.tab})
    }
  )
);
