import { combineEpics, Epic } from 'redux-observable';
import { concatMap, filter, first, map, of, switchMap, takeUntil, takeWhile, timer, withLatestFrom } from 'rxjs';
import { ReducerAction, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  addBuff,
  addBuffStack,
  addLemure,
  addShroud,
  addSoul,
  addVoid,
  buff,
  buffStacks,
  combo,
  dmgEvent,
  executeAction,
  extendableDebuff,
  gcd,
  hasBuff,
  hasCombo,
  inCombat,
  ogcdLock,
  removeBuff,
  removeBuffAction,
  removeBuffStack,
  removeLemure,
  removeVoid,
  resource,
  setResource,
  StatusState,
} from '../../combatSlice';

function soul(state: RootState) {
  return resource(state, 'soul');
}

function shroud(state: RootState) {
  return resource(state, 'shroud');
}

function voidShroud(state: RootState) {
  return resource(state, 'void');
}

function lemure(state: RootState) {
  return resource(state, 'lemure');
}

const removeEnshroudWhenLemureSpentEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === setResource.type && a.payload.resourceType === 'lemure' && a.payload.amount === 0),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.Enshrouded)),
    map(() => removeBuff(StatusId.Enshrouded))
  );

const cleanupEnshrouded: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && a.payload === StatusId.Enshrouded),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const actions: any[] = [];

      if (hasBuff(state, StatusId.EnhancedCrossReaping)) {
        actions.push(removeBuff(StatusId.EnhancedCrossReaping));
      }

      if (hasBuff(state, StatusId.EnhancedVoidReaping)) {
        actions.push(removeBuff(StatusId.EnhancedVoidReaping));
      }

      if (hasBuff(state, StatusId.Oblatio)) {
        actions.push(removeBuff(StatusId.Oblatio));
      }

      actions.push(removeLemure(lemure(state)));
      actions.push(removeVoid(voidShroud(state)));

      return of(...actions);
    })
  );

const removeSoulReaverEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && [StatusId.SoulReaver, StatusId.Executioner].includes(a.payload.id)),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            ['Weaponskill', 'Spell'].includes(getActionById(aa.payload.id).type) &&
            ![
              ActionId.Gallows,
              ActionId.Gibbet,
              ActionId.Guillotine,
              ActionId.UnveiledGallows,
              ActionId.UnveiledGibbet,
              ActionId.ExecutionersGallows,
              ActionId.ExecutionersGibbet,
              ActionId.ExecutionersGuillotine,
            ].includes(aa.payload.id)
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.SoulReaver) || hasBuff(state, StatusId.Executioner))
      )
    ),
    switchMap(() => of(removeBuff(StatusId.SoulReaver), removeBuff(StatusId.Executioner)))
  );

const consumeCircleOfSacrificeEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.CircleofSacrifice),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            aa.payload.id !== ActionId.Soulsow &&
            (['Weaponskill', 'Spell'].includes(getActionById(aa.payload.id).type) ||
              [
                ActionId.Gluttony,
                ActionId.BloodStalk,
                ActionId.UnveiledGallows,
                ActionId.UnveiledGibbet,
                ActionId.LemuresScythe,
                ActionId.LemuresSlice,
                ActionId.GrimSwathe,
              ].includes(aa.payload.id))
        ),
        takeUntil(action$.pipe(first((a) => a.type === removeBuffAction.type && a.payload === StatusId.CircleofSacrifice)))
      )
    ),
    switchMap(() => of(removeBuff(StatusId.CircleofSacrifice), addBuffStack(StatusId.ImmortalSacrifice)))
  );

const partyCircleOfSacrificeEpic: Epic<ReducerAction<StatusState>, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.ArcaneCircle),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const partyConsumers = state.player.partySize - 1;
      if (partyConsumers === 0) {
        return of();
      }

      const times = [];
      for (let i = 0; i < partyConsumers; i++) {
        times.push(Math.random() * 1000);
      }

      times.sort((a, b) => a - b);

      const actions = [timer(times[0])];

      for (let i = 1; i < partyConsumers; i++) {
        actions.push(timer(times[i] - times[i - 1]));
      }

      return actions;
    }),
    concatMap((a) => a.pipe(map(() => addBuffStack(StatusId.ImmortalSacrifice))))
  );

const immortalSacrificeStatus: CombatStatus = createCombatStatus({
  id: StatusId.ImmortalSacrifice,
  duration: 30,
  isHarmful: false,
  maxStacks: 8,
});

const deathsDesignStatus: CombatStatus = createCombatStatus({
  id: StatusId.DeathsDesign,
  duration: 30,
  isHarmful: true,
  maxDuration: 60,
});

const thresholdStatus: CombatStatus = createCombatStatus({
  id: StatusId.Threshold,
  duration: 10,
  isHarmful: false,
});

const enhancedHarpeStatus: CombatStatus = createCombatStatus({
  id: StatusId.EnhancedHarpe,
  duration: 20,
  isHarmful: false,
});

const soulReaverStatus: CombatStatus = createCombatStatus({
  id: StatusId.SoulReaver,
  duration: 30,
  isHarmful: false,
});

const enhancedGallowsStatus: CombatStatus = createCombatStatus({
  id: StatusId.EnhancedGallows,
  duration: 60,
  isHarmful: false,
});

const enhancedGibbetStatus: CombatStatus = createCombatStatus({
  id: StatusId.EnhancedGibbet,
  duration: 60,
  isHarmful: false,
});

const enshroudedStatus: CombatStatus = createCombatStatus({
  id: StatusId.Enshrouded,
  duration: 30,
  isHarmful: false,
});

const enhancedCrossReapingStatus: CombatStatus = createCombatStatus({
  id: StatusId.EnhancedCrossReaping,
  duration: 30,
  isHarmful: false,
});

const enhancedVoidReapingStatus: CombatStatus = createCombatStatus({
  id: StatusId.EnhancedVoidReaping,
  duration: 30,
  isHarmful: false,
});

const circleOfSacrificeStatus: CombatStatus = createCombatStatus({
  id: StatusId.CircleofSacrifice,
  duration: 5,
  isHarmful: false,
});

const arcaneCircleStatus: CombatStatus = createCombatStatus({
  id: StatusId.ArcaneCircle,
  duration: 20,
  isHarmful: false,
});

const bloodsownCircleStatus: CombatStatus = createCombatStatus({
  id: StatusId.BloodsownCircle,
  duration: 6,
  isHarmful: false,
});

const soulsowStatus: CombatStatus = createCombatStatus({
  id: StatusId.Soulsow,
  duration: null,
  isHarmful: false,
});

const crestofTimeBorrowedStatus: CombatStatus = createCombatStatus({
  id: StatusId.CrestofTimeBorrowed,
  duration: 5,
  isHarmful: false,
});

const oblatioStatus: CombatStatus = createCombatStatus({
  id: StatusId.Oblatio,
  duration: 30,
  isHarmful: false,
});

const perfectioOccultaStatus: CombatStatus = createCombatStatus({
  id: StatusId.PerfectioOcculta,
  duration: 30,
  isHarmful: false,
});

const perfectioParataStatus: CombatStatus = createCombatStatus({
  id: StatusId.PerfectioParata,
  duration: 30,
  isHarmful: false,
});

const idealHostStatus: CombatStatus = createCombatStatus({
  id: StatusId.IdealHost,
  duration: 30,
  isHarmful: false,
});

const executionerStatus: CombatStatus = createCombatStatus({
  id: StatusId.Executioner,
  duration: 30,
  isHarmful: false,
});

const slice: CombatAction = createCombatAction({
  id: ActionId.Slice,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Slice, context, { potency: 420 }));
    dispatch(combo(ActionId.Slice));

    dispatch(addSoul(10));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  reducedBySkillSpeed: true,
});

const waxingSlice: CombatAction = createCombatAction({
  id: ActionId.WaxingSlice,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.WaxingSlice, context, { potency: 260, comboPotency: 500 }));

    if (context.comboed) {
      dispatch(combo(ActionId.WaxingSlice));
      dispatch(addSoul(10));
    }
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  isGlowing: (state) => hasCombo(state, ActionId.WaxingSlice),
  reducedBySkillSpeed: true,
});

const infernalSlice: CombatAction = createCombatAction({
  id: ActionId.InfernalSlice,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.InfernalSlice, context, { potency: 280, comboPotency: 600 }));

    if (context.comboed) {
      dispatch(addSoul(10));
    }
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  isGlowing: (state) => hasCombo(state, ActionId.InfernalSlice),
  reducedBySkillSpeed: true,
});

const shadowOfDeath: CombatAction = createCombatAction({
  id: ActionId.ShadowofDeath,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ShadowofDeath, context, { potency: 300 }));

    dispatch(extendableDebuff(StatusId.DeathsDesign));
  },
  reducedBySkillSpeed: true,
});

const harpe: CombatAction = createCombatAction({
  id: ActionId.Harpe,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Harpe, context, { potency: 300 }));
    dispatch(addSoul(10));

    if (hasBuff(getState(), StatusId.EnhancedHarpe)) {
      dispatch(removeBuff(StatusId.EnhancedHarpe));
    }
  },
  isGlowing: (state) => hasBuff(state, StatusId.EnhancedHarpe),
  castTime: (state) => (hasBuff(state, StatusId.EnhancedHarpe) ? 0 : 1.3),
  reducedBySpellSpeed: true,
});

const hellsIngress: CombatAction = createCombatAction({
  id: ActionId.HellsIngress,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Threshold));
    dispatch(buff(StatusId.EnhancedHarpe));
    dispatch(setResource({ resourceType: 'hell', amount: 1 }));
  },
  redirect: (state) => (hasBuff(state, StatusId.Threshold) && resource(state, 'hell') === 2 ? ActionId.Regress : ActionId.HellsIngress),
});

const hellsEgress: CombatAction = createCombatAction({
  id: ActionId.HellsEgress,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Threshold));
    dispatch(buff(StatusId.EnhancedHarpe));
    dispatch(setResource({ resourceType: 'hell', amount: 2 }));
  },
  redirect: (state) => (hasBuff(state, StatusId.Threshold) && resource(state, 'hell') === 1 ? ActionId.Regress : ActionId.HellsEgress),
});

const regress: CombatAction = createCombatAction({
  id: ActionId.Regress,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.Threshold));
  },
  isGlowing: () => true,
});

const bloodStalk: CombatAction = createCombatAction({
  id: ActionId.BloodStalk,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BloodStalk, context, { potency: 340 }));
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SoulReaver, { stacks: 1 }));
  },
  redirect: (state) =>
    hasBuff(state, StatusId.Enshrouded)
      ? ActionId.LemuresSlice
      : hasBuff(state, StatusId.EnhancedGibbet)
      ? ActionId.UnveiledGibbet
      : hasBuff(state, StatusId.EnhancedGallows)
      ? ActionId.UnveiledGallows
      : ActionId.BloodStalk,
  isGlowing: (state) => soul(state) >= 50,
});

const unveiledGallows: CombatAction = createCombatAction({
  id: ActionId.UnveiledGallows,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.UnveiledGallows, context, { potency: 440 }));
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SoulReaver, { stacks: 1 }));
  },
  isGlowing: (state) => soul(state) >= 50,
});

const unveiledGibbet: CombatAction = createCombatAction({
  id: ActionId.UnveiledGibbet,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.UnveiledGibbet, context, { potency: 440 }));
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SoulReaver, { stacks: 1 }));
  },
  isGlowing: (state) => soul(state) >= 50,
});

const soulSlice: CombatAction = createCombatAction({
  id: ActionId.SoulSlice,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SoulSlice, context, { potency: 520 }));
    dispatch(addSoul(50));
    dispatch(gcd({ reducedBySkillSpeed: true }));
  },
  maxCharges: () => 2,
});

const gibbet: CombatAction = createCombatAction({
  id: ActionId.Gibbet,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.Gibbet, context, {
        potency: 500,
        flankPotency: 560,
        enhancedPotency: 560,
        flankEnhancedPotency: 620,
        isEnhanced: hasBuff(getState(), StatusId.EnhancedGibbet),
      })
    );

    dispatch(removeBuffStack(StatusId.SoulReaver));

    if (hasBuff(getState(), StatusId.EnhancedGibbet)) {
      dispatch(removeBuff(StatusId.EnhancedGibbet));
    }

    dispatch(buff(StatusId.EnhancedGallows));

    dispatch(addShroud(10));
  },
  isUsable: (state) => hasBuff(state, StatusId.SoulReaver),
  isGlowing: (state) =>
    (hasBuff(state, StatusId.SoulReaver) && !hasBuff(state, StatusId.EnhancedGallows)) || hasBuff(state, StatusId.EnhancedGibbet),
  reducedBySkillSpeed: true,
  redirect: (state) =>
    hasBuff(state, StatusId.Enshrouded)
      ? ActionId.VoidReaping
      : hasBuff(state, StatusId.Executioner)
      ? ActionId.ExecutionersGibbet
      : ActionId.Gibbet,
});

const gallows: CombatAction = createCombatAction({
  id: ActionId.Gallows,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.Gallows, context, {
        potency: 500,
        rearPotency: 560,
        enhancedPotency: 560,
        rearEnhancedPotency: 620,
        isEnhanced: hasBuff(getState(), StatusId.EnhancedGallows),
      })
    );

    dispatch(removeBuffStack(StatusId.SoulReaver));

    if (hasBuff(getState(), StatusId.EnhancedGallows)) {
      dispatch(removeBuff(StatusId.EnhancedGallows));
    }

    dispatch(buff(StatusId.EnhancedGibbet));

    dispatch(addShroud(10));
  },
  isUsable: (state) => hasBuff(state, StatusId.SoulReaver),
  isGlowing: (state) =>
    (hasBuff(state, StatusId.SoulReaver) && !hasBuff(state, StatusId.EnhancedGibbet)) || hasBuff(state, StatusId.EnhancedGallows),
  reducedBySkillSpeed: true,
  redirect: (state) =>
    hasBuff(state, StatusId.Enshrouded)
      ? ActionId.CrossReaping
      : hasBuff(state, StatusId.Executioner)
      ? ActionId.ExecutionersGallows
      : ActionId.Gallows,
});

const executionersGibbet: CombatAction = createCombatAction({
  id: ActionId.ExecutionersGibbet,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.ExecutionersGibbet, context, {
        potency: 700,
        flankPotency: 760,
        enhancedPotency: 760,
        flankEnhancedPotency: 820,
        isEnhanced: hasBuff(getState(), StatusId.EnhancedGibbet),
      })
    );

    dispatch(removeBuffStack(StatusId.Executioner));

    if (hasBuff(getState(), StatusId.EnhancedGibbet)) {
      dispatch(removeBuff(StatusId.EnhancedGibbet));
    }

    dispatch(buff(StatusId.EnhancedGallows));

    dispatch(addShroud(10));
  },
  isGlowing: (state) => !hasBuff(state, StatusId.EnhancedGallows) || hasBuff(state, StatusId.EnhancedGibbet),
  reducedBySkillSpeed: true,
});

const executionersGallows: CombatAction = createCombatAction({
  id: ActionId.ExecutionersGallows,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.ExecutionersGallows, context, {
        potency: 700,
        rearPotency: 760,
        enhancedPotency: 760,
        rearEnhancedPotency: 820,
        isEnhanced: hasBuff(getState(), StatusId.EnhancedGallows),
      })
    );

    dispatch(removeBuffStack(StatusId.Executioner));

    if (hasBuff(getState(), StatusId.EnhancedGallows)) {
      dispatch(removeBuff(StatusId.EnhancedGallows));
    }

    dispatch(buff(StatusId.EnhancedGibbet));

    dispatch(addShroud(10));
  },
  isGlowing: (state) => !hasBuff(state, StatusId.EnhancedGibbet) || hasBuff(state, StatusId.EnhancedGallows),
  reducedBySkillSpeed: true,
});

const gluttony: CombatAction = createCombatAction({
  id: ActionId.Gluttony,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Gluttony, context, { potency: 520 }));
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Executioner, { stacks: 2 }));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  isGlowing: (state) => !hasBuff(state, StatusId.Enshrouded) && soul(state) >= 50,
  redirect: (state) => (hasBuff(state, StatusId.Oblatio) ? ActionId.Sacrificium : ActionId.Gluttony),
});

const sacrificium: CombatAction = createCombatAction({
  id: ActionId.Sacrificium,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Sacrificium, context, { potency: 600 }));
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.Oblatio));
  },
  isGlowing: () => true,
});

const enshround: CombatAction = createCombatAction({
  id: ActionId.Enshroud,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Enshrouded));
    dispatch(buff(StatusId.Oblatio));
    dispatch(removeBuff(StatusId.IdealHost));
    dispatch(addLemure(5));
  },
  cost: (state, baseCost) => (hasBuff(state, StatusId.IdealHost) ? 0 : baseCost),
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  isGlowing: (state) => !hasBuff(state, StatusId.Enshrouded) && (shroud(state) >= 50 || hasBuff(state, StatusId.IdealHost)),
});

const crossReaping: CombatAction = createCombatAction({
  id: ActionId.CrossReaping,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.CrossReaping, context, {
        potency: 540,
        enhancedPotency: 560,
        isEnhanced: hasBuff(getState(), StatusId.EnhancedCrossReaping),
      })
    );

    if (hasBuff(getState(), StatusId.EnhancedCrossReaping)) {
      dispatch(removeBuff(StatusId.EnhancedCrossReaping));
    }

    if (lemure(getState()) > 0) {
      dispatch(buff(StatusId.EnhancedVoidReaping));

      dispatch(addVoid(1));
    }
  },
  isGlowing: (state) =>
    (hasBuff(state, StatusId.EnhancedCrossReaping) || !hasBuff(state, StatusId.EnhancedVoidReaping)) && lemure(state) > 1,
});

const voidReaping: CombatAction = createCombatAction({
  id: ActionId.VoidReaping,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.VoidReaping, context, {
        potency: 540,
        enhancedPotency: 560,
        isEnhanced: hasBuff(getState(), StatusId.EnhancedVoidReaping),
      })
    );

    if (hasBuff(getState(), StatusId.EnhancedVoidReaping)) {
      dispatch(removeBuff(StatusId.EnhancedVoidReaping));
    }

    if (lemure(getState()) > 0) {
      dispatch(buff(StatusId.EnhancedCrossReaping));

      dispatch(addVoid(1));
    }
  },
  isGlowing: (state) =>
    (hasBuff(state, StatusId.EnhancedVoidReaping) || !hasBuff(state, StatusId.EnhancedCrossReaping)) && lemure(state) > 1,
});

const lemuresSlice: CombatAction = createCombatAction({
  id: ActionId.LemuresSlice,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.LemuresSlice, context, { potency: 280 }));
    dispatch(ogcdLock());
  },
  isGlowing: (state) => voidShroud(state) >= 2,
});

const arcaneCircle: CombatAction = createCombatAction({
  id: ActionId.ArcaneCircle,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ArcaneCircle));
    dispatch(buff(StatusId.CircleofSacrifice));
    dispatch(buff(StatusId.BloodsownCircle));
  },
});

const plentifulHarvest: CombatAction = createCombatAction({
  id: ActionId.PlentifulHarvest,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.PlentifulHarvest, context, { potency: 720 + 0.125 * buffStacks(getState(), StatusId.ImmortalSacrifice) * 280 })
    );
    dispatch(removeBuff(StatusId.ImmortalSacrifice));
    dispatch(buff(StatusId.IdealHost));
    dispatch(buff(StatusId.PerfectioOcculta));
  },
  isUsable: (state) =>
    !hasBuff(state, StatusId.BloodsownCircle) && hasBuff(state, StatusId.ImmortalSacrifice) && !hasBuff(state, StatusId.Enshrouded),
  isGlowing: (state) => hasBuff(state, StatusId.ImmortalSacrifice),
  reducedBySkillSpeed: true,
});

const communio: CombatAction = createCombatAction({
  id: ActionId.Communio,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Communio, context, { potency: 1100 }));

    const state = getState();

    dispatch(removeLemure(lemure(state)));
    if (hasBuff(state, StatusId.PerfectioOcculta)) {
      dispatch(removeBuff(StatusId.PerfectioOcculta));
      dispatch(buff(StatusId.PerfectioParata));
    }
  },
  isGlowing: (state) => lemure(state) === 1,
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.PerfectioParata) ? ActionId.Perfectio : ActionId.Communio),
});

const perfectio: CombatAction = createCombatAction({
  id: ActionId.Perfectio,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Perfectio, context, { potency: 1300 }));
    dispatch(removeBuff(StatusId.PerfectioParata));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const soulsow: CombatAction = createCombatAction({
  id: ActionId.Soulsow,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Soulsow));
  },
  castTime: (state) => (inCombat(state) ? 5 : 0),
  redirect: (state) => (hasBuff(state, StatusId.Soulsow) ? ActionId.HarvestMoon : ActionId.Soulsow),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const harvestMoon: CombatAction = createCombatAction({
  id: ActionId.HarvestMoon,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HarvestMoon, context, { potency: 800 }));
    dispatch(removeBuff(StatusId.Soulsow));
  },
  isGlowing: (state) => hasBuff(state, StatusId.Soulsow),
  reducedBySpellSpeed: true,
});

const whorlOfDeath: CombatAction = createCombatAction({
  id: ActionId.WhorlofDeath,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.WhorlofDeath, context, { potency: 100 }));

    dispatch(extendableDebuff(StatusId.DeathsDesign));
  },
  reducedBySkillSpeed: true,
});

const spinningScythe: CombatAction = createCombatAction({
  id: ActionId.SpinningScythe,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SpinningScythe, context, { potency: 140 }));

    dispatch(combo(ActionId.SpinningScythe));
    dispatch(addSoul(10));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  reducedBySkillSpeed: true,
});

const nightmareScythe: CombatAction = createCombatAction({
  id: ActionId.NightmareScythe,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.NightmareScythe, context, { potency: 120, comboPotency: 180 }));

    if (context.comboed) {
      dispatch(addSoul(10));
    }
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  isGlowing: (state) => hasCombo(state, ActionId.NightmareScythe),
  reducedBySkillSpeed: true,
});

const soulScythe: CombatAction = createCombatAction({
  id: ActionId.SoulScythe,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SoulScythe, context, { potency: 180 }));

    dispatch(addSoul(50));
    dispatch(gcd({ reducedBySkillSpeed: true }));
  },
  maxCharges: () => 2,
});

const guillotine: CombatAction = createCombatAction({
  id: ActionId.Guillotine,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Guillotine, context, { potency: 200 }));

    dispatch(removeBuffStack(StatusId.SoulReaver));
    dispatch(addShroud(10));
  },
  isUsable: (state) => hasBuff(state, StatusId.SoulReaver),
  isGlowing: (state) => hasBuff(state, StatusId.SoulReaver),
  reducedBySkillSpeed: true,
  redirect: (state) =>
    hasBuff(state, StatusId.Enshrouded)
      ? ActionId.GrimReaping
      : hasBuff(state, StatusId.Executioner)
      ? ActionId.ExecutionersGuillotine
      : ActionId.Guillotine,
});

const executionersGuillotine: CombatAction = createCombatAction({
  id: ActionId.ExecutionersGuillotine,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ExecutionersGuillotine, context, { potency: 260 }));

    dispatch(removeBuffStack(StatusId.Executioner));
    dispatch(addShroud(10));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const grimReaping: CombatAction = createCombatAction({
  id: ActionId.GrimReaping,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.GrimReaping, context, { potency: 200 }));

    if (lemure(getState()) > 0) {
      dispatch(addVoid(1));
    }
  },
  isGlowing: (state) => hasBuff(state, StatusId.Enshrouded) && lemure(state) > 1,
});

const grimSwathe: CombatAction = createCombatAction({
  id: ActionId.GrimSwathe,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.GrimSwathe, context, { potency: 140 }));
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SoulReaver, { stacks: 1 }));
  },
  redirect: (state) => (hasBuff(state, StatusId.Enshrouded) ? ActionId.LemuresScythe : ActionId.GrimSwathe),
  isGlowing: (state) => soul(state) >= 50,
});

const lemuresScythe: CombatAction = createCombatAction({
  id: ActionId.LemuresScythe,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.LemuresScythe, context, { potency: 100 }));
    dispatch(ogcdLock());
  },
  isGlowing: (state) => voidShroud(state) >= 2,
});

const arcaneCrest: CombatAction = createCombatAction({
  id: ActionId.ArcaneCrest,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.CrestofTimeBorrowed));
  },
});

export const rprStatuses: CombatStatus[] = [
  immortalSacrificeStatus,
  deathsDesignStatus,
  thresholdStatus,
  enhancedHarpeStatus,
  soulReaverStatus,
  enhancedGallowsStatus,
  enhancedGibbetStatus,
  enshroudedStatus,
  enhancedCrossReapingStatus,
  enhancedVoidReapingStatus,
  crestofTimeBorrowedStatus,
  arcaneCircleStatus,
  bloodsownCircleStatus,
  circleOfSacrificeStatus,
  soulsowStatus,
  oblatioStatus,
  perfectioOccultaStatus,
  perfectioParataStatus,
  executionerStatus,
  idealHostStatus,
];

export const rpr: CombatAction[] = [
  slice,
  waxingSlice,
  infernalSlice,
  shadowOfDeath,
  harpe,
  hellsIngress,
  hellsEgress,
  regress,
  bloodStalk,
  soulSlice,
  gibbet,
  gallows,
  gluttony,
  enshround,
  crossReaping,
  voidReaping,
  lemuresSlice,
  arcaneCircle,
  plentifulHarvest,
  communio,
  soulsow,
  harvestMoon,
  whorlOfDeath,
  spinningScythe,
  nightmareScythe,
  soulScythe,
  guillotine,
  grimReaping,
  grimSwathe,
  lemuresScythe,
  arcaneCrest,
  unveiledGallows,
  unveiledGibbet,
  executionersGallows,
  executionersGibbet,
  executionersGuillotine,
  sacrificium,
  perfectio,
];

export const rprEpics = combineEpics(
  removeEnshroudWhenLemureSpentEpic,
  cleanupEnshrouded,
  removeSoulReaverEpic,
  consumeCircleOfSacrificeEpic,
  partyCircleOfSacrificeEpic
);
