import { combineEpics, Epic } from 'redux-observable';
import { filter, map, withLatestFrom } from 'rxjs';
import { RootState } from '../../app/store';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { CombatAction, createCombatAction } from './combat-action';
import { CombatStatus, createCombatStatus } from './combat-status';
import { addMana, buff, buffStacks, debuff, event, hasBuff, inCombat, ogcdLock, removeBuff, setCombat } from './combatSlice';

const pelotonCombatEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    withLatestFrom(state$),
    filter(([a, s]) => a.type === setCombat.type && a.payload === true && hasBuff(s, StatusId.Peloton)),
    map(() => removeBuff(StatusId.Peloton))
  );

const heavyStatus: CombatStatus = createCombatStatus({
  id: StatusId.Heavy,
  duration: 10,
  isHarmful: true,
});

const bindStatus: CombatStatus = createCombatStatus({
  id: StatusId.Bind,
  duration: 10,
  isHarmful: true,
});

const pelotonStatus: CombatStatus = createCombatStatus({
  id: StatusId.Peloton,
  duration: 30,
  isHarmful: false,
});

const lucidDreamingStatus: CombatStatus = createCombatStatus({
  id: StatusId.LucidDreaming,
  duration: 21,
  isHarmful: false,
  tick: (dispatch, getState) => {
    if (!buffStacks(getState(), StatusId.AstralFireActive)) {
      dispatch(addMana(550));
    }
  },
  initialDelay: 1000,
});

const armsLengthStatus: CombatStatus = createCombatStatus({
  id: StatusId.ArmsLength,
  duration: 6,
  isHarmful: false,
});

const stunStatus: CombatStatus = createCombatStatus({
  id: StatusId.Stun,
  duration: 0,
  isHarmful: true,
});

const bloodbathStatus: CombatStatus = createCombatStatus({
  id: StatusId.Bloodbath,
  duration: 20,
  isHarmful: false,
});

const feintStatus: CombatStatus = createCombatStatus({
  id: StatusId.Feint,
  duration: 15,
  isHarmful: true,
});

const addleStatus: CombatStatus = createCombatStatus({
  id: StatusId.Addle,
  duration: 15,
  isHarmful: true,
});

const sleepStatus: CombatStatus = createCombatStatus({
  id: StatusId.Sleep,
  duration: 10,
  isHarmful: true,
});

const trueNorthStatus: CombatStatus = createCombatStatus({
  id: StatusId.TrueNorth,
  duration: 10,
  isHarmful: false,
});

const surecastStatus: CombatStatus = createCombatStatus({
  id: StatusId.Surecast,
  duration: 6,
  isHarmful: false,
});

const reprisalStatus: CombatStatus = createCombatStatus({
  id: StatusId.Reprisal,
  duration: 15,
  isHarmful: true,
});

const rampartStatus: CombatStatus = createCombatStatus({
  id: StatusId.Rampart,
  duration: 20,
  isHarmful: false,
});

const swiftcastStatus: CombatStatus = createCombatStatus({
  id: StatusId.Swiftcast,
  duration: 10,
  isHarmful: false,
});

const legGraze: CombatAction = createCombatAction({
  id: ActionId.LegGraze,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Heavy));
  },
});

const secondWind: CombatAction = createCombatAction({
  id: ActionId.SecondWind,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.SecondWind, { healthPotency: 800 }));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const footGraze: CombatAction = createCombatAction({
  id: ActionId.FootGraze,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Bind));
  },
});

const peloton: CombatAction = createCombatAction({
  id: ActionId.Peloton,
  execute: (dispatch, getState) => {
    if (!inCombat(getState())) {
      dispatch(ogcdLock());
      dispatch(buff(StatusId.Peloton));
    }
  },
  entersCombat: false,
});

const headGraze: CombatAction = createCombatAction({
  id: ActionId.HeadGraze,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

const armsLength: CombatAction = createCombatAction({
  id: ActionId.ArmsLength,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ArmsLength));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const legSweep: CombatAction = createCombatAction({
  id: ActionId.LegSweep,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Stun, { duration: 3 }));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
});

const bloodbath: CombatAction = createCombatAction({
  id: ActionId.Bloodbath,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Bloodbath));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const feint: CombatAction = createCombatAction({
  id: ActionId.Feint,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Feint));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
});

const trueNorth: CombatAction = createCombatAction({
  id: ActionId.TrueNorth,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.TrueNorth));
  },
  maxCharges: () => 2,
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const addle: CombatAction = createCombatAction({
  id: ActionId.Addle,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Addle));
  },
});

const sleep: CombatAction = createCombatAction({
  id: ActionId.Sleep,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Sleep));
  },
});

const surecast: CombatAction = createCombatAction({
  id: ActionId.Surecast,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Surecast));
  },
  entersCombat: false,
});

const lucidDreaming: CombatAction = createCombatAction({
  id: ActionId.LucidDreaming,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.LucidDreaming));
  },
  entersCombat: false,
});

const swiftcast: CombatAction = createCombatAction({
  id: ActionId.Swiftcast,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Swiftcast));
  },
  entersCombat: false,
  cooldown: () => 40,
});

const rampart: CombatAction = createCombatAction({
  id: ActionId.Rampart,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Rampart));
  },
  entersCombat: false,
});

const lowBlow: CombatAction = createCombatAction({
  id: ActionId.LowBlow,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Stun, { duration: 5 }));
  },
});

const interject: CombatAction = createCombatAction({
  id: ActionId.Interject,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

const reprisal: CombatAction = createCombatAction({
  id: ActionId.Reprisal,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Reprisal));
  },
});

const shirk: CombatAction = createCombatAction({
  id: ActionId.Shirk,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  entersCombat: false,
});

const provoke: CombatAction = createCombatAction({
  id: ActionId.Provoke,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

export const roleStatuses: CombatStatus[] = [
  heavyStatus,
  bindStatus,
  pelotonStatus,
  lucidDreamingStatus,
  armsLengthStatus,
  stunStatus,
  bloodbathStatus,
  feintStatus,
  addleStatus,
  sleepStatus,
  trueNorthStatus,
  surecastStatus,
  reprisalStatus,
  rampartStatus,
  swiftcastStatus,
];

export const role: CombatAction[] = [
  legGraze,
  secondWind,
  footGraze,
  peloton,
  headGraze,
  armsLength,
  legSweep,
  bloodbath,
  feint,
  trueNorth,
  addle,
  sleep,
  surecast,
  lucidDreaming,
  swiftcast,
  rampart,
  lowBlow,
  interject,
  reprisal,
  shirk,
  provoke,
];

export const roleEpics = combineEpics(pelotonCombatEpic);
