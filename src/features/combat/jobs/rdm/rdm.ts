import { combineEpics, Epic } from 'redux-observable';
import { filter, switchMap, takeUntil, first, map } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import {
  buff,
  combo,
  hasBuff,
  hasCombo,
  removeBuff,
  resource,
  setResource,
  addManaStack,
  selectResources,
  inCombat,
  ogcdLock,
  addBuff,
  executeAction,
  setManaStack,
  removeBuffStack,
} from '../../combatSlice';
import { rng } from '../../utils';

function blackMana(state: RootState) {
  return resource(state, 'blackMana');
}

function whiteMana(state: RootState) {
  return resource(state, 'whiteMana');
}

function manaStack(state: RootState) {
  return resource(state, 'manaStack');
}

export const addWhiteMana =
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const resources = selectResources(getState());
    if (resources.blackMana - resources.whiteMana >= 30) {
      amount = Math.floor(amount / 2);
    }
    const value = Math.min(resources.whiteMana + amount, 100);

    dispatch(setResource({ resourceType: 'whiteMana', amount: value }));
  };

export const addBlackMana =
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const resources = selectResources(getState());
    if (resources.whiteMana - resources.blackMana >= 30) {
      amount = Math.floor(amount / 2);
    }
    const value = Math.min(resources.blackMana + amount, 100);

    dispatch(setResource({ resourceType: 'blackMana', amount: value }));
  };

export const addBlackAndWhiteMana =
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const resources = selectResources(getState());
    const whiteAmount = resources.blackMana - resources.whiteMana >= 30 ? Math.floor(amount / 2) : amount;
    const blackAmount = resources.whiteMana - resources.blackMana >= 30 ? Math.floor(amount / 2) : amount;

    const whiteValue = Math.min(resources.whiteMana + whiteAmount, 100);
    const blackValue = Math.min(resources.blackMana + blackAmount, 100);

    dispatch(setResource({ resourceType: 'blackMana', amount: blackValue }));
    dispatch(setResource({ resourceType: 'whiteMana', amount: whiteValue }));
  };

const consumeManaficationEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Manafication),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            (getActionById(aa.payload.id).type === 'Spell' ||
              [
                ActionId.EnchantedRiposte,
                ActionId.EnchantedZwerchhau,
                ActionId.EnchantedRedoublement,
                ActionId.EnchantedMoulinet,
                ActionId.EnchantedReprise,
              ].includes(aa.payload.id))
        ),
        takeUntil(action$.pipe(first((a) => a.type === removeBuff.type && a.payload === a.payload.id)))
      )
    ),
    map(() => removeBuffStack(StatusId.Manafication))
  );

const removeManaStackEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Spell'),
    map(() => setManaStack(0))
  );

const removeDualcastWithPotionEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Medicine'),
    map(() => removeBuff(StatusId.Dualcast))
  );

function joltRedirect(state: RootState) {
  return hasCombo(state, ActionId.Resolution) ? ActionId.Resolution : hasCombo(state, ActionId.Scorch) ? ActionId.Scorch : ActionId.JoltII;
}

const jolt: CombatAction = createCombatAction({
  id: ActionId.Jolt,
  execute: () => {},
  redirect: joltRedirect,
  reducedBySpellSpeed: true,
});

const jolt2: CombatAction = createCombatAction({
  id: ActionId.JoltII,
  execute: (dispatch) => {
    dispatch(addBlackAndWhiteMana(2));
  },
  redirect: joltRedirect,
  reducedBySpellSpeed: true,
});

function verthuderRedirect(state: RootState) {
  return manaStack(state) === 3 ? ActionId.Verflare : ActionId.VerthunderIII;
}

const verthuder: CombatAction = createCombatAction({
  id: ActionId.Verthunder,
  execute: () => {},
  redirect: verthuderRedirect,
  reducedBySpellSpeed: true,
});

const verthuder3: CombatAction = createCombatAction({
  id: ActionId.VerthunderIII,
  execute: (dispatch, getState) => {
    dispatch(addBlackMana(6));

    if (hasBuff(getState(), StatusId.Acceleration) || rng(50)) {
      dispatch(buff(StatusId.VerfireReady, 30));
    }
  },
  castTime: (state) => (hasBuff(state, StatusId.Acceleration) ? 0 : 5),
  redirect: verthuderRedirect,
  reducedBySpellSpeed: true,
});

function veraeroRedirect(state: RootState) {
  return manaStack(state) === 3 ? ActionId.Verholy : ActionId.VeraeroIII;
}

const veraero: CombatAction = createCombatAction({
  id: ActionId.Veraero,
  execute: () => {},
  redirect: veraeroRedirect,
  reducedBySpellSpeed: true,
});

const veraero3: CombatAction = createCombatAction({
  id: ActionId.VeraeroIII,
  execute: (dispatch, getState) => {
    dispatch(addWhiteMana(6));

    if (hasBuff(getState(), StatusId.Acceleration) || rng(50)) {
      dispatch(buff(StatusId.VerstoneReady, 30));
    }
  },
  castTime: (state) => (hasBuff(state, StatusId.Acceleration) ? 0 : 5),
  redirect: veraeroRedirect,
  reducedBySpellSpeed: true,
});

const verfire: CombatAction = createCombatAction({
  id: ActionId.Verfire,
  execute: (dispatch) => {
    dispatch(addBlackMana(5));
    dispatch(removeBuff(StatusId.VerfireReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.VerfireReady),
  isGlowing: (state) => hasBuff(state, StatusId.VerfireReady),
  reducedBySpellSpeed: true,
});

const verstone: CombatAction = createCombatAction({
  id: ActionId.Verstone,
  execute: (dispatch) => {
    dispatch(addWhiteMana(5));
    dispatch(removeBuff(StatusId.VerstoneReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.VerstoneReady),
  isGlowing: (state) => hasBuff(state, StatusId.VerstoneReady),
  reducedBySpellSpeed: true,
});

const riposte: CombatAction = createCombatAction({
  id: ActionId.Riposte,
  execute: (dispatch) => {
    dispatch(combo(ActionId.Riposte));
  },
  redirect: (state) => (whiteMana(state) >= 20 && blackMana(state) >= 20 ? ActionId.EnchantedRiposte : ActionId.Riposte),
  reducedBySkillSpeed: true,
});

const enchantedRiposte: CombatAction = createCombatAction({
  id: ActionId.EnchantedRiposte,
  execute: (dispatch) => {
    dispatch(combo(ActionId.Riposte));
    dispatch(addManaStack(1));
  },
});

const zwerchhau: CombatAction = createCombatAction({
  id: ActionId.Zwerchhau,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(combo(ActionId.Zwerchhau));
    }
  },
  redirect: (state) => (whiteMana(state) >= 15 && blackMana(state) >= 15 ? ActionId.EnchantedZwerchhau : ActionId.Zwerchhau),
  isGlowing: (state) => hasCombo(state, ActionId.Zwerchhau),
  reducedBySkillSpeed: true,
});

const enchantedZwerchhau: CombatAction = createCombatAction({
  id: ActionId.EnchantedZwerchhau,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(combo(ActionId.Zwerchhau));
      dispatch(addManaStack(1));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Zwerchhau),
});

const redoublement: CombatAction = createCombatAction({
  id: ActionId.Redoublement,
  execute: () => {},
  redirect: (state) => (whiteMana(state) >= 15 && blackMana(state) >= 15 ? ActionId.EnchantedRedoublement : ActionId.Redoublement),
  isGlowing: (state) => hasCombo(state, ActionId.Redoublement),
  reducedBySkillSpeed: true,
});

const enchantedRedoublement: CombatAction = createCombatAction({
  id: ActionId.EnchantedRedoublement,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(addManaStack(1));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Redoublement),
  reducedBySkillSpeed: true,
});

const manafication: CombatAction = createCombatAction({
  id: ActionId.Manafication,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Manafication, 15, { stacks: 6 }));
    dispatch(addBlackAndWhiteMana(50));
  },
  isUsable: (state) => inCombat(state),
});

const verflare: CombatAction = createCombatAction({
  id: ActionId.Verflare,
  execute: (dispatch, getState) => {
    dispatch(combo(ActionId.Verflare));

    if (whiteMana(getState()) > blackMana(getState()) || rng(20)) {
      dispatch(buff(StatusId.VerfireReady, 30));
    }

    dispatch(addBlackMana(11));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const verholy: CombatAction = createCombatAction({
  id: ActionId.Verholy,
  execute: (dispatch, getState) => {
    dispatch(combo(ActionId.Verflare));

    if (blackMana(getState()) > whiteMana(getState()) || rng(20)) {
      dispatch(buff(StatusId.VerstoneReady, 30));
    }

    dispatch(addWhiteMana(11));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const scorch: CombatAction = createCombatAction({
  id: ActionId.Scorch,
  execute: (dispatch) => {
    dispatch(combo(ActionId.Scorch));
    dispatch(addBlackAndWhiteMana(4));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const resolution: CombatAction = createCombatAction({
  id: ActionId.Resolution,
  execute: (dispatch) => {
    dispatch(addBlackAndWhiteMana(4));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const acceleration: CombatAction = createCombatAction({
  id: ActionId.Acceleration,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Acceleration, 20));
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const embolden: CombatAction = createCombatAction({
  id: ActionId.Embolden,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Embolden, 20));
  },
});

const fleche: CombatAction = createCombatAction({
  id: ActionId.Fleche,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

const contreSixte: CombatAction = createCombatAction({
  id: ActionId.ContreSixte,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

const corpsaCorps: CombatAction = createCombatAction({
  id: ActionId.Corpsacorps,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
});

const engagement: CombatAction = createCombatAction({
  id: ActionId.Engagement,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 102,
    duration: 1,
  }),
});

const displacement: CombatAction = createCombatAction({
  id: ActionId.Displacement,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1002,
    duration: 1,
  }),
});

const vercure: CombatAction = createCombatAction({
  id: ActionId.Vercure,
  execute: () => {},
  reducedBySpellSpeed: true,
});

const verraise: CombatAction = createCombatAction({
  id: ActionId.Verraise,
  execute: () => {},
  reducedBySpellSpeed: true,
});

const magickBarrier: CombatAction = createCombatAction({
  id: ActionId.MagickBarrier,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.MagickBarrier, 10));
  },
});

const reprise: CombatAction = createCombatAction({
  id: ActionId.Reprise,
  execute: () => {},
  redirect: (state) => (whiteMana(state) >= 5 && blackMana(state) >= 5 ? ActionId.EnchantedReprise : ActionId.Reprise),
  reducedBySkillSpeed: true,
});

const enchantedReprise: CombatAction = createCombatAction({
  id: ActionId.EnchantedReprise,
  execute: () => {},
  reducedBySkillSpeed: true,
});

const veraero2: CombatAction = createCombatAction({
  id: ActionId.VeraeroII,
  execute: (dispatch) => {
    dispatch(addWhiteMana(7));
  },
  redirect: (state) => (manaStack(state) === 3 ? ActionId.Verholy : ActionId.VeraeroII),
  reducedBySpellSpeed: true,
});

const verthunder2: CombatAction = createCombatAction({
  id: ActionId.VerthunderII,
  execute: (dispatch) => {
    dispatch(addBlackMana(7));
  },
  redirect: (state) => (manaStack(state) === 3 ? ActionId.Verflare : ActionId.VerthunderII),
  reducedBySpellSpeed: true,
});

function impactRedirect(state: RootState) {
  return hasCombo(state, ActionId.Resolution) ? ActionId.Resolution : hasCombo(state, ActionId.Scorch) ? ActionId.Scorch : ActionId.Impact;
}

const scatter: CombatAction = createCombatAction({
  id: ActionId.Scatter,
  execute: () => {},
  redirect: impactRedirect,
  reducedBySpellSpeed: true,
});

const impact: CombatAction = createCombatAction({
  id: ActionId.Impact,
  execute: (dispatch) => {
    dispatch(addBlackAndWhiteMana(3));
  },
  redirect: impactRedirect,
  castTime: (state) => (hasBuff(state, StatusId.Acceleration) ? 0 : 5),
  reducedBySpellSpeed: true,
});

const moulinet: CombatAction = createCombatAction({
  id: ActionId.Moulinet,
  execute: () => {},
  redirect: (state) => (whiteMana(state) >= 20 && blackMana(state) >= 20 ? ActionId.EnchantedMoulinet : ActionId.Moulinet),
  reducedBySkillSpeed: true,
});

const enchantedMoulinet: CombatAction = createCombatAction({
  id: ActionId.EnchantedMoulinet,
  execute: (dispatch) => {
    dispatch(addManaStack(1));
  },
});

export const rdm: CombatAction[] = [
  jolt,
  jolt2,
  verthuder,
  verthuder3,
  veraero,
  veraero3,
  verfire,
  verstone,
  riposte,
  enchantedRiposte,
  zwerchhau,
  enchantedZwerchhau,
  redoublement,
  enchantedRedoublement,
  manafication,
  verflare,
  verholy,
  scorch,
  resolution,
  acceleration,
  embolden,
  fleche,
  contreSixte,
  corpsaCorps,
  engagement,
  displacement,
  vercure,
  verraise,
  magickBarrier,
  reprise,
  enchantedReprise,
  veraero2,
  verthunder2,
  scatter,
  impact,
  moulinet,
  enchantedMoulinet,
];

export const rdmEpics = combineEpics(consumeManaficationEpic, removeManaStackEpic, removeDualcastWithPotionEpic);
