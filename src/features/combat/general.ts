import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { CombatAction, createCombatAction } from './combat-action';
import { buff, inCombat, ogcdLock } from './combatSlice';
import { OGCDLockDuration } from './enums';

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
