import { combineEpics, Epic } from 'redux-observable';
import { filter, interval, map, switchMap, takeWhile, withLatestFrom } from 'rxjs';
import { RootState } from '../../app/store';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { CombatAction, createCombatAction } from './combat-action';
import { addBuff, addMana, buff, debuff, hasBuff, inCombat, ogcdLock, removeBuff, setCombat } from './combatSlice';

const pelotonCombatEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    withLatestFrom(state$),
    filter(([a, s]) => a.type === setCombat.type && a.payload === true && hasBuff(s, StatusId.Peloton)),
    map(() => removeBuff(StatusId.Peloton))
  );

const lucidDreamingEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.LucidDreaming),
    switchMap((a) =>
      interval(3000).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id)),
        map(() => addMana(550))
      )
    )
  );

const legGraze: CombatAction = createCombatAction({
  id: ActionId.LegGraze,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Heavy, 10));
  },
});

const secondWind: CombatAction = createCombatAction({
  id: ActionId.SecondWind,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const footGraze: CombatAction = createCombatAction({
  id: ActionId.FootGraze,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Bind, 10));
  },
});

const peloton: CombatAction = createCombatAction({
  id: ActionId.Peloton,
  execute: (dispatch, getState) => {
    if (!inCombat(getState())) {
      dispatch(ogcdLock());
      dispatch(buff(StatusId.Peloton, 30));
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
    dispatch(buff(StatusId.ArmsLength, 6));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const legSweep: CombatAction = createCombatAction({
  id: ActionId.LegSweep,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Stun, 3));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
});

const bloodbath: CombatAction = createCombatAction({
  id: ActionId.Bloodbath,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Bloodbath, 20));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const feint: CombatAction = createCombatAction({
  id: ActionId.Feint,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Feint, 10));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
});

const trueNorth: CombatAction = createCombatAction({
  id: ActionId.TrueNorth,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.TrueNorth, 10));
  },
  maxCharges: () => 2,
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const addle: CombatAction = createCombatAction({
  id: ActionId.Addle,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Addle, 10));
  },
});

const sleep: CombatAction = createCombatAction({
  id: ActionId.Sleep,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Sleep, 30));
  },
});

const surecast: CombatAction = createCombatAction({
  id: ActionId.Surecast,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Surecast, 6));
  },
  entersCombat: false,
});

const lucidDreaming: CombatAction = createCombatAction({
  id: ActionId.LucidDreaming,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(addMana(550));
    dispatch(buff(StatusId.LucidDreaming, 21));
  },
  entersCombat: false,
});

const swiftcast: CombatAction = createCombatAction({
  id: ActionId.Swiftcast,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Swiftcast, 10));
  },
  entersCombat: false,
});

const rampart: CombatAction = createCombatAction({
  id: ActionId.Rampart,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Rampart, 20));
  },
  entersCombat: false,
});

const lowBlow: CombatAction = createCombatAction({
  id: ActionId.LowBlow,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Stun, 5));
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
    dispatch(debuff(StatusId.Reprisal, 10));
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

export const roleEpics = combineEpics(pelotonCombatEpic, lucidDreamingEpic);
