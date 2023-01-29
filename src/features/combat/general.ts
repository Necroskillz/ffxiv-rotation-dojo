import { combineEpics, Epic } from 'redux-observable';
import { first, interval, map, switchMap, withLatestFrom } from 'rxjs';
import { RootState } from '../../app/store';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { CombatAction, createCombatAction } from './combat-action';
import { addMana, buff, inCombat, ogcdLock } from './combatSlice';
import { OGCDLockDuration } from './enums';

const combatManaTickEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    first(),
    switchMap(() => interval(3000)),
    withLatestFrom(state$),
    map(([, state]) => state),
    map((state) => (inCombat(state) ? addMana(200) : addMana(600)))
  );

const sprint: CombatAction = createCombatAction({
  id: ActionId.Sprint,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Sprint, inCombat(getState()) ? 10 : 20));
  },
  entersCombat: false,
});

const tinctureOfDexterity: CombatAction = createCombatAction({
  id: ActionId.Grade7TinctureofDexterity,
  execute: (dispatch) => {
    dispatch(ogcdLock(OGCDLockDuration.Potion));
    dispatch(buff(StatusId.Medicated, 30));
  },
  entersCombat: false,
});

const tinctureOfMind: CombatAction = createCombatAction({
  id: ActionId.Grade7TinctureofMind,
  execute: (dispatch) => {
    dispatch(ogcdLock(OGCDLockDuration.Potion));
    dispatch(buff(StatusId.Medicated, 30));
  },
  entersCombat: false,
});

const tinctureOfStrength: CombatAction = createCombatAction({
  id: ActionId.Grade7TinctureofStrength,
  execute: (dispatch) => {
    dispatch(ogcdLock(OGCDLockDuration.Potion));
    dispatch(buff(StatusId.Medicated, 30));
  },
  entersCombat: false,
});

const tinctureOfIntelligence: CombatAction = createCombatAction({
  id: ActionId.Grade7TinctureofIntelligence,
  execute: (dispatch) => {
    dispatch(ogcdLock(OGCDLockDuration.Potion));
    dispatch(buff(StatusId.Medicated, 30));
  },
  entersCombat: false,
});

export const general: CombatAction[] = [sprint, tinctureOfDexterity, tinctureOfMind, tinctureOfStrength, tinctureOfIntelligence];

export const generalEpics = combineEpics(combatManaTickEpic);
