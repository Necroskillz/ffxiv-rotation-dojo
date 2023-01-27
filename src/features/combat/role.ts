import { combineEpics, Epic } from 'redux-observable';
import { filter, map, withLatestFrom } from 'rxjs';
import { RootState } from '../../app/store';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { CombatAction, createCombatAction } from './combat-action';
import { buff, debuff, hasBuff, inCombat, ogcdLock, removeBuff, setCombat } from './combatSlice';

const pelotonCombatEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    withLatestFrom(state$),
    filter(([a, s]) => a.type === setCombat.type && a.payload === true && hasBuff(s, StatusId.Peloton)),
    map(() => removeBuff(StatusId.Peloton))
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
  entersCombat: false,
});

const legSweep: CombatAction = createCombatAction({
  id: ActionId.LegSweep,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Stun, 3));
  },
});

const bloodbath: CombatAction = createCombatAction({
  id: ActionId.Bloodbath,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Bloodbath, 20));
  },
});

const feint: CombatAction = createCombatAction({
  id: ActionId.Feint,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Feint, 10));
  },
});

const trueNorth: CombatAction = createCombatAction({
  id: ActionId.TrueNorth,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.TrueNorth, 10));
  },
  maxCharges: () => 2,
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
];

export const roleEpics = combineEpics(pelotonCombatEpic);
