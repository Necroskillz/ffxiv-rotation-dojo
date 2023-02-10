import { combineEpics, Epic } from 'redux-observable';
import { first, interval, map, switchMap, withLatestFrom } from 'rxjs';
import { RootState } from '../../app/store';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { selectJob } from '../player/playerSlice';
import { CombatAction, createCombatAction } from './combat-action';
import { addMana, buff, buffStacks, hasBuff, inCombat, ogcdLock } from './combatSlice';
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

const sprint: CombatAction = createCombatAction({
  id: ActionId.Sprint,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Sprint, inCombat(getState()) ? 10 : 20));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const tinctureOfDexterity: CombatAction = createCombatAction({
  id: ActionId.Grade7TinctureofDexterity,
  execute: (dispatch) => {
    dispatch(ogcdLock(OGCDLockDuration.Potion));
    dispatch(buff(StatusId.Medicated, 30));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
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
