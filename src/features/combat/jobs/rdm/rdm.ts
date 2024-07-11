import { combineEpics, Epic } from 'redux-observable';
import { filter, switchMap, takeUntil, first, map, of, withLatestFrom } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
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
  event,
  removeBuffAction,
  dmgEvent,
  DamageType,
  buffStacks,
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

const consumeManaficationEpic: Epic<any, any, RootState> = (action$, state$) =>
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
                ActionId.EnchantedMoulinetDeux,
                ActionId.EnchantedMoulinetTrois,
                ActionId.EnchantedReprise,
              ].includes(aa.payload.id))
        ),
        takeUntil(action$.pipe(first((a) => a.type === removeBuffAction.type && a.payload === a.payload.id)))
      )
    ),
    withLatestFrom(state$),
    switchMap(([, state]) => {
      const actions = [removeBuffStack(StatusId.Manafication)];

      if (buffStacks(state, StatusId.Manafication) === 1) {
        actions.push(buff(StatusId.PrefulgenceReady));
      }

      return of(...actions);
    })
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
  return hasBuff(state, StatusId.GrandImpactReady)
    ? ActionId.GrandImpact
    : hasCombo(state, ActionId.Resolution)
    ? ActionId.Resolution
    : hasCombo(state, ActionId.Scorch)
    ? ActionId.Scorch
    : ActionId.JoltIII;
}

const dualcastStatus: CombatStatus = createCombatStatus({
  id: StatusId.Dualcast,
  duration: 15,
  isHarmful: false,
});

const verfireReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.VerfireReady,
  duration: 30,
  isHarmful: false,
});

const verstoneReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.VerstoneReady,
  duration: 30,
  isHarmful: false,
});

const manaficationStatus: CombatStatus = createCombatStatus({
  id: StatusId.Manafication,
  duration: 15,
  isHarmful: false,
  initialStacks: 6,
});

const accelerationStatus: CombatStatus = createCombatStatus({
  id: StatusId.Acceleration,
  duration: 20,
  isHarmful: false,
});

const emboldenStatus: CombatStatus = createCombatStatus({
  id: StatusId.Embolden,
  duration: 20,
  isHarmful: false,
});

const magickBarrierStatus: CombatStatus = createCombatStatus({
  id: StatusId.MagickBarrier,
  duration: 10,
  isHarmful: false,
});

const magickedSwordplayStatus: CombatStatus = createCombatStatus({
  id: StatusId.MagickedSwordplay,
  duration: 15,
  isHarmful: false,
  initialStacks: 3,
});

const prefulgeceReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.PrefulgenceReady,
  duration: 30,
  isHarmful: false,
});

const thornedFlourishStatus: CombatStatus = createCombatStatus({
  id: StatusId.ThornedFlourish,
  duration: 30,
  isHarmful: false,
});

const grandImpactReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.GrandImpactReady,
  duration: 30,
  isHarmful: false,
});

const jolt: CombatAction = createCombatAction({
  id: ActionId.Jolt,
  execute: () => {},
  redirect: joltRedirect,
  reducedBySpellSpeed: true,
});

const jolt2: CombatAction = createCombatAction({
  id: ActionId.JoltII,
  execute: () => {},
  redirect: joltRedirect,
  reducedBySpellSpeed: true,
});

const jolt3: CombatAction = createCombatAction({
  id: ActionId.JoltIII,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.JoltIII, context, { potency: 360 }));
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
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.VerthunderIII, context, { potency: 380 }));

    dispatch(addBlackMana(6));

    if (hasBuff(getState(), StatusId.Acceleration) || rng(50)) {
      dispatch(buff(StatusId.VerfireReady));
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
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.VeraeroIII, context, { potency: 380 }));

    dispatch(addWhiteMana(6));

    if (hasBuff(getState(), StatusId.Acceleration) || rng(50)) {
      dispatch(buff(StatusId.VerstoneReady));
    }
  },
  castTime: (state) => (hasBuff(state, StatusId.Acceleration) ? 0 : 5),
  redirect: veraeroRedirect,
  reducedBySpellSpeed: true,
});

const verfire: CombatAction = createCombatAction({
  id: ActionId.Verfire,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Verfire, context, { potency: 340 }));
    dispatch(addBlackMana(5));
    dispatch(removeBuff(StatusId.VerfireReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.VerfireReady),
  isGlowing: (state) => hasBuff(state, StatusId.VerfireReady),
  reducedBySpellSpeed: true,
});

const verstone: CombatAction = createCombatAction({
  id: ActionId.Verstone,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Verstone, context, { potency: 340 }));
    dispatch(addWhiteMana(5));
    dispatch(removeBuff(StatusId.VerstoneReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.VerstoneReady),
  isGlowing: (state) => hasBuff(state, StatusId.VerstoneReady),
  reducedBySpellSpeed: true,
});

const riposte: CombatAction = createCombatAction({
  id: ActionId.Riposte,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Riposte, context, { potency: 130 }));
    dispatch(combo(ActionId.Riposte));
  },
  redirect: (state) =>
    (whiteMana(state) >= 20 && blackMana(state) >= 20) || hasBuff(state, StatusId.MagickedSwordplay)
      ? ActionId.EnchantedRiposte
      : ActionId.Riposte,
  reducedBySkillSpeed: true,
});

const enchantedRiposte: CombatAction = createCombatAction({
  id: ActionId.EnchantedRiposte,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EnchantedRiposte, context, { potency: 280, type: DamageType.Magical }));
    dispatch(combo(ActionId.Riposte));
    dispatch(removeBuffStack(StatusId.MagickedSwordplay));
    dispatch(addManaStack(1));
  },
  cost: (state, baseCost) => (hasBuff(state, StatusId.MagickedSwordplay) ? 0 : baseCost),
});

const zwerchhau: CombatAction = createCombatAction({
  id: ActionId.Zwerchhau,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Zwerchhau, context, { potency: 100, comboPotency: 150 }));

    if (context.comboed) {
      dispatch(combo(ActionId.Zwerchhau));
    }
  },
  redirect: (state) =>
    (whiteMana(state) >= 15 && blackMana(state) >= 15) || hasBuff(state, StatusId.MagickedSwordplay)
      ? ActionId.EnchantedZwerchhau
      : ActionId.Zwerchhau,
  isGlowing: (state) => hasCombo(state, ActionId.Zwerchhau),
  reducedBySkillSpeed: true,
});

const enchantedZwerchhau: CombatAction = createCombatAction({
  id: ActionId.EnchantedZwerchhau,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EnchantedZwerchhau, context, { potency: 150, comboPotency: 340, type: DamageType.Magical }));
    dispatch(removeBuffStack(StatusId.MagickedSwordplay));

    if (context.comboed) {
      dispatch(combo(ActionId.Zwerchhau));
      dispatch(addManaStack(1));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Zwerchhau),
  cost: (state, baseCost) => (hasBuff(state, StatusId.MagickedSwordplay) ? 0 : baseCost),
});

const redoublement: CombatAction = createCombatAction({
  id: ActionId.Redoublement,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Redoublement, context, { potency: 100, comboPotency: 230 }));
  },
  redirect: (state) =>
    (whiteMana(state) >= 15 && blackMana(state) >= 15) || hasBuff(state, StatusId.MagickedSwordplay)
      ? ActionId.EnchantedRedoublement
      : ActionId.Redoublement,
  isGlowing: (state) => hasCombo(state, ActionId.Redoublement),
  reducedBySkillSpeed: true,
});

const enchantedRedoublement: CombatAction = createCombatAction({
  id: ActionId.EnchantedRedoublement,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EnchantedRedoublement, context, { potency: 130, comboPotency: 500, type: DamageType.Magical }));
    dispatch(removeBuffStack(StatusId.MagickedSwordplay));

    if (context.comboed) {
      dispatch(addManaStack(1));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Redoublement),
  cost: (state, baseCost) => (hasBuff(state, StatusId.MagickedSwordplay) ? 0 : baseCost),
  reducedBySkillSpeed: true,
});

const manafication: CombatAction = createCombatAction({
  id: ActionId.Manafication,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Manafication));
    dispatch(buff(StatusId.MagickedSwordplay));
  },
  isUsable: (state) => inCombat(state),
  redirect: (state) => (hasBuff(state, StatusId.PrefulgenceReady) ? ActionId.Prefulgence : ActionId.Manafication),
});

const prefulgence: CombatAction = createCombatAction({
  id: ActionId.Prefulgence,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.ViceofThorns, context, { potency: 900 }));
    dispatch(removeBuff(StatusId.PrefulgenceReady));
  },
  isGlowing: () => true,
});

const verflare: CombatAction = createCombatAction({
  id: ActionId.Verflare,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Verflare, context, { potency: 600 }));
    dispatch(combo(ActionId.Verflare));

    if (whiteMana(getState()) > blackMana(getState()) || rng(20)) {
      dispatch(buff(StatusId.VerfireReady));
    }

    dispatch(addBlackMana(11));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const verholy: CombatAction = createCombatAction({
  id: ActionId.Verholy,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Verholy, context, { potency: 600 }));
    dispatch(combo(ActionId.Verflare));

    if (blackMana(getState()) > whiteMana(getState()) || rng(20)) {
      dispatch(buff(StatusId.VerstoneReady));
    }

    dispatch(addWhiteMana(11));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const scorch: CombatAction = createCombatAction({
  id: ActionId.Scorch,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Scorch, context, { potency: 680 }));
    dispatch(combo(ActionId.Scorch));
    dispatch(addBlackAndWhiteMana(4));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const resolution: CombatAction = createCombatAction({
  id: ActionId.Resolution,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Resolution, context, { potency: 750 }));
    dispatch(addBlackAndWhiteMana(4));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const acceleration: CombatAction = createCombatAction({
  id: ActionId.Acceleration,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Acceleration));
    dispatch(buff(StatusId.GrandImpactReady));
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const grandImpact: CombatAction = createCombatAction({
  id: ActionId.GrandImpact,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.GrandImpact, context, { potency: 600 }));
    dispatch(removeBuff(StatusId.GrandImpactReady));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const embolden: CombatAction = createCombatAction({
  id: ActionId.Embolden,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Embolden));
    dispatch(buff(StatusId.ThornedFlourish));
  },
  redirect: (state) => (hasBuff(state, StatusId.ThornedFlourish) ? ActionId.ViceofThorns : ActionId.Embolden),
});

const viceOfThorns: CombatAction = createCombatAction({
  id: ActionId.ViceofThorns,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.ViceofThorns, context, { potency: 700 }));
    dispatch(removeBuff(StatusId.ThornedFlourish));
  },
  isUsable: (state) => hasBuff(state, StatusId.ThornedFlourish),
  isGlowing: (state) => hasBuff(state, StatusId.ThornedFlourish),
});

const fleche: CombatAction = createCombatAction({
  id: ActionId.Fleche,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Fleche, context, { potency: 460, type: DamageType.Physical }));
  },
});

const contreSixte: CombatAction = createCombatAction({
  id: ActionId.ContreSixte,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.ContreSixte, context, { potency: 380, type: DamageType.Physical }));
  },
});

const corpsaCorps: CombatAction = createCombatAction({
  id: ActionId.Corpsacorps,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Corpsacorps, context, { potency: 130, type: DamageType.Physical }));
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
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Engagement, context, { potency: 180, type: DamageType.Physical }));
    dispatch(ogcdLock());
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1002,
    duration: 1,
  }),
});

const displacement: CombatAction = createCombatAction({
  id: ActionId.Displacement,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Displacement, context, { potency: 180, type: DamageType.Physical }));
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
  execute: (dispatch) => {
    dispatch(event(ActionId.Vercure, { healthPotency: 350 }));
  },
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
    dispatch(buff(StatusId.MagickBarrier));
  },
});

const reprise: CombatAction = createCombatAction({
  id: ActionId.Reprise,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Reprise, context, { potency: 100 }));
  },
  redirect: (state) => (whiteMana(state) >= 5 && blackMana(state) >= 5 ? ActionId.EnchantedReprise : ActionId.Reprise),
  reducedBySkillSpeed: true,
});

const enchantedReprise: CombatAction = createCombatAction({
  id: ActionId.EnchantedReprise,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EnchantedReprise, context, { potency: 340, type: DamageType.Magical }));
  },
  reducedBySkillSpeed: true,
});

const veraero2: CombatAction = createCombatAction({
  id: ActionId.VeraeroII,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.VeraeroII, context, { potency: 140 }));
    dispatch(addWhiteMana(7));
  },
  redirect: (state) => (manaStack(state) === 3 ? ActionId.Verholy : ActionId.VeraeroII),
  reducedBySpellSpeed: true,
});

const verthunder2: CombatAction = createCombatAction({
  id: ActionId.VerthunderII,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.VerthunderII, context, { potency: 140 }));
    dispatch(addBlackMana(7));
  },
  redirect: (state) => (manaStack(state) === 3 ? ActionId.Verflare : ActionId.VerthunderII),
  reducedBySpellSpeed: true,
});

function impactRedirect(state: RootState) {
  return hasBuff(state, StatusId.GrandImpactReady)
    ? ActionId.GrandImpact
    : hasCombo(state, ActionId.Resolution)
    ? ActionId.Resolution
    : hasCombo(state, ActionId.Scorch)
    ? ActionId.Scorch
    : ActionId.Impact;
}

const scatter: CombatAction = createCombatAction({
  id: ActionId.Scatter,
  execute: () => {},
  redirect: impactRedirect,
  reducedBySpellSpeed: true,
});

const impact: CombatAction = createCombatAction({
  id: ActionId.Impact,
  execute: (dispatch, _, context) => {
    dispatch(
      dmgEvent(ActionId.Impact, context, {
        potency: 210,
        enhancedPotency: 260,
        isEnhanced: context.consumedStatuses.includes(StatusId.Acceleration),
      })
    );
    dispatch(addBlackAndWhiteMana(3));
  },
  redirect: impactRedirect,
  castTime: (state) => (hasBuff(state, StatusId.Acceleration) ? 0 : 5),
  reducedBySpellSpeed: true,
});

const moulinet: CombatAction = createCombatAction({
  id: ActionId.Moulinet,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Moulinet, context, { potency: 60 }));
  },
  redirect: (state) =>
    (whiteMana(state) >= 20 && blackMana(state) >= 20) || hasBuff(state, StatusId.MagickedSwordplay)
      ? hasCombo(state, ActionId.EnchantedMoulinetDeux)
        ? ActionId.EnchantedMoulinetDeux
        : hasCombo(state, ActionId.EnchantedMoulinetTrois)
        ? ActionId.EnchantedMoulinetTrois
        : ActionId.EnchantedMoulinet
      : ActionId.Moulinet,
  reducedBySkillSpeed: true,
});

const enchantedMoulinet: CombatAction = createCombatAction({
  id: ActionId.EnchantedMoulinet,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EnchantedMoulinet, context, { potency: 130, type: DamageType.Magical }));
    dispatch(combo(ActionId.EnchantedMoulinet));
    dispatch(removeBuffStack(StatusId.MagickedSwordplay));
    dispatch(addManaStack(1));
  },
  cost: (state, baseCost) => (hasBuff(state, StatusId.MagickedSwordplay) ? 0 : baseCost),
});

const enchantedMoulinetDeux: CombatAction = createCombatAction({
  id: ActionId.EnchantedMoulinetDeux,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EnchantedMoulinetDeux, context, { potency: 140, type: DamageType.Magical }));
    dispatch(combo(ActionId.EnchantedMoulinetDeux));
    dispatch(removeBuffStack(StatusId.MagickedSwordplay));
    dispatch(addManaStack(1));
  },
  cost: (state, baseCost) => (hasBuff(state, StatusId.MagickedSwordplay) ? 0 : baseCost),
});

const enchantedMoulinetTrois: CombatAction = createCombatAction({
  id: ActionId.EnchantedMoulinetTrois,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EnchantedMoulinetTrois, context, { potency: 150, type: DamageType.Magical }));
    dispatch(removeBuffStack(StatusId.MagickedSwordplay));
    dispatch(addManaStack(1));
  },
  cost: (state, baseCost) => (hasBuff(state, StatusId.MagickedSwordplay) ? 0 : baseCost),
});

export const rdmStatuses: CombatStatus[] = [
  dualcastStatus,
  verfireReadyStatus,
  verstoneReadyStatus,
  accelerationStatus,
  emboldenStatus,
  manaficationStatus,
  magickBarrierStatus,
  magickedSwordplayStatus,
  prefulgeceReadyStatus,
  thornedFlourishStatus,
  grandImpactReadyStatus,
];

export const rdm: CombatAction[] = [
  jolt,
  jolt2,
  jolt3,
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
  enchantedMoulinetDeux,
  enchantedMoulinetTrois,
  prefulgence,
  viceOfThorns,
  grandImpact,
];

export const rdmEpics = combineEpics(consumeManaficationEpic, removeManaStackEpic, removeDualcastWithPotionEpic);
