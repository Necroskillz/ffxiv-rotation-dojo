import { combineEpics, Epic } from 'redux-observable';
import { concatMap, EMPTY, filter, first, interval, map, Subject, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';
import { ReducerAction, RootState } from '../../app/store';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { selectJob } from '../player/playerSlice';
import { CombatAction, createCombatAction } from './combat-action';
import { CombatStatus, createCombatStatus } from './combat-status';
import {
  addBuff,
  addDebuff,
  addEvent,
  addMana,
  buff,
  buffStacks,
  DamageType,
  event,
  hasBuff,
  inCombat,
  ogcdLock,
  removeBuffAction,
  removeCooldown,
  removeDebuff,
  removeDebuffAction,
  selectCast,
  setCast,
} from './combatSlice';
import { OGCDLockDuration } from './enums';

const combatManaTickEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    first(),
    switchMap(() => interval(3000)),
    withLatestFrom(state$),
    map(([, state]) => state),
    map((state) => {
      if (!inCombat(state)) {
        return addMana(600);
      }

      if (selectJob(state) === 'BLM') {
        if (hasBuff(state, StatusId.AstralFireActive)) {
          return addMana(0);
        }

        switch (buffStacks(state, StatusId.UmbralIceActive)) {
          case 0:
            return addMana(200);
          case 1:
            return addMana(3200);
          case 2:
            return addMana(4700);
          case 3:
            return addMana(6200);
        }
      } else {
        return addMana(200);
      }
    })
  );

const bloodbathEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Bloodbath),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === addEvent.type && aa.payload.type === DamageType.Physical && aa.payload.id !== 0),
        takeUntil(action$.pipe(first((a) => a.type === removeBuffAction.type && a.payload === StatusId.Bloodbath)))
      )
    ),
    map((a) => event(a.payload.actionId, { healthPotency: Math.floor(a.payload.potency * 0.2) }))
  );

const removeSleepEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addDebuff.type && a.payload.id === StatusId.Sleep),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === addEvent.type && aa.payload.potency > 0),
        takeUntil(action$.pipe(first((a) => a.type === removeDebuffAction.type && a.payload === StatusId.Sleep)))
      )
    ),
    map(() => removeDebuff(StatusId.Sleep))
  );

const actions$ = new Subject<ReducerAction<any>>();

const captureActionsEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    tap(actions$),
    concatMap(() => EMPTY)
  );

export const actionStream$ = actions$.asObservable();

const sprintStatus: CombatStatus = createCombatStatus({
  id: StatusId.Sprint,
  duration: 10,
  isHarmful: false,
});

const medicatedStatus: CombatStatus = createCombatStatus({
  id: StatusId.Medicated,
  duration: 30,
  isHarmful: false,
});

const sprint: CombatAction = createCombatAction({
  id: ActionId.Sprint,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Sprint, { duration: inCombat(getState()) ? 10 : 20 }));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const moveForward: CombatAction = createCombatAction({
  id: ActionId.MoveForward,
  execute: (dispatch, getState) => {
    const cast = selectCast(getState());

    if (cast && cast.timestamp + cast.castTime - Date.now() > 500) {
      dispatch(setCast(null));
      dispatch(removeCooldown(58));
    }
  },
  entersCombat: false,
});

const moveBack: CombatAction = createCombatAction({
  id: ActionId.MoveBack,
  execute: (dispatch, getState) => {
    const cast = selectCast(getState());

    if (cast && cast.timestamp + cast.castTime - Date.now() > 500) {
      dispatch(setCast(null));
      dispatch(removeCooldown(58));
    }
  },
  entersCombat: false,
});

const moveLeft: CombatAction = createCombatAction({
  id: ActionId.MoveLeft,
  execute: (dispatch, getState) => {
    const cast = selectCast(getState());

    if (cast && cast.timestamp + cast.castTime - Date.now() > 500) {
      dispatch(setCast(null));
      dispatch(removeCooldown(58));
    }
  },
  entersCombat: false,
});

const moveRight: CombatAction = createCombatAction({
  id: ActionId.MoveRight,
  execute: (dispatch, getState) => {
    const cast = selectCast(getState());

    if (cast && cast.timestamp + cast.castTime - Date.now() > 500) {
      dispatch(setCast(null));
      dispatch(removeCooldown(58));
    }
  },
  entersCombat: false,
});

const tinctureOfDexterity: CombatAction = createCombatAction({
  id: ActionId.Grade8TinctureofDexterity,
  execute: (dispatch) => {
    dispatch(ogcdLock(OGCDLockDuration.Potion));
    dispatch(buff(StatusId.Medicated));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const tinctureOfMind: CombatAction = createCombatAction({
  id: ActionId.Grade8TinctureofMind,
  execute: (dispatch) => {
    dispatch(ogcdLock(OGCDLockDuration.Potion));
    dispatch(buff(StatusId.Medicated));
  },
  entersCombat: false,
});

const tinctureOfStrength: CombatAction = createCombatAction({
  id: ActionId.Grade8TinctureofStrength,
  execute: (dispatch) => {
    dispatch(ogcdLock(OGCDLockDuration.Potion));
    dispatch(buff(StatusId.Medicated));
  },
  entersCombat: false,
});

const tinctureOfIntelligence: CombatAction = createCombatAction({
  id: ActionId.Grade8TinctureofIntelligence,
  execute: (dispatch) => {
    dispatch(ogcdLock(OGCDLockDuration.Potion));
    dispatch(buff(StatusId.Medicated));
  },
  entersCombat: false,
});

export const generalStatuses: CombatStatus[] = [sprintStatus, medicatedStatus];

export const general: CombatAction[] = [
  sprint,
  tinctureOfDexterity,
  tinctureOfMind,
  tinctureOfStrength,
  tinctureOfIntelligence,
  moveForward,
  moveBack,
  moveLeft,
  moveRight,
];

export const generalEpics = combineEpics(combatManaTickEpic, captureActionsEpic, bloodbathEpic, removeSleepEpic);
