import { combineEpics, Epic } from 'redux-observable';
import { concatMap, filter, first, map, of, switchMap, takeUntil, takeWhile, timer, withLatestFrom } from 'rxjs';
import { ReducerAction, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import {
  addBuff,
  addBuffStack,
  addLemure,
  addShroud,
  addSoul,
  addVoid,
  buff,
  combo,
  executeAction,
  extendableDebuff,
  gcd,
  hasBuff,
  hasCombo,
  inCombat,
  ogcdLock,
  removeBuff,
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
    filter((a) => a.type === removeBuff.type && a.payload === StatusId.Enshrouded),
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

      actions.push(removeLemure(lemure(state)));
      actions.push(removeVoid(voidShroud(state)));

      return of(...actions);
    })
  );

const removeSoulReaverEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.SoulReaver),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            ![
              ActionId.Gallows,
              ActionId.Gibbet,
              ActionId.Guillotine,
              ActionId.BloodStalk,
              ActionId.UnveiledGallows,
              ActionId.UnveiledGibbet,
              ActionId.Gluttony,
              ActionId.GrimSwathe,
            ].includes(aa.payload.id)
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.SoulReaver))
      )
    ),
    map(() => removeBuff(StatusId.SoulReaver))
  );

const consumeCircleOfSacrificeEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.CircleofSacrifice),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === executeAction.type && getActionById(aa.payload.id).type === 'Weaponskill'),
        takeUntil(action$.pipe(first((a) => a.type === removeBuff.type && a.payload === StatusId.CircleofSacrifice)))
      )
    ),
    switchMap(() => of(removeBuff(StatusId.CircleofSacrifice), addBuffStack(StatusId.ImmortalSacrifice, 30)))
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
        times.push(Math.random() * 2500);
      }

      times.sort((a, b) => a - b);

      const actions = [timer(times[0])];

      for (let i = 1; i < partyConsumers; i++) {
        actions.push(timer(times[i] - times[i - 1]));
      }

      return actions;
    }),
    concatMap((a) => a.pipe(map(() => addBuffStack(StatusId.ImmortalSacrifice, 30))))
  );

const slice: CombatAction = createCombatAction({
  id: ActionId.Slice,
  execute: (dispatch) => {
    dispatch(combo(ActionId.Slice));

    dispatch(addSoul(10));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  reducedBySkillSpeed: true,
});

const waxingSlice: CombatAction = createCombatAction({
  id: ActionId.WaxingSlice,
  execute: (dispatch, _, context) => {
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
  execute: (dispatch) => {
    dispatch(extendableDebuff(StatusId.DeathsDesign, 30, 60));
  },
  reducedBySkillSpeed: true,
});

const harpe: CombatAction = createCombatAction({
  id: ActionId.Harpe,
  execute: (dispatch, getState) => {
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
    dispatch(buff(StatusId.Threshold, 10));
    dispatch(buff(StatusId.EnhancedHarpe, 20));
    dispatch(setResource({ resourceType: 'hell', amount: 1 }));
  },
  redirect: (state) => (hasBuff(state, StatusId.Threshold) && resource(state, 'hell') === 2 ? ActionId.Regress : ActionId.HellsIngress),
});

const hellsEgress: CombatAction = createCombatAction({
  id: ActionId.HellsEgress,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Threshold, 10));
    dispatch(buff(StatusId.EnhancedHarpe, 20));
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
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SoulReaver, 30, { stacks: 1 }));
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
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SoulReaver, 30, { stacks: 1 }));
  },
  isGlowing: (state) => soul(state) >= 50,
});

const unveiledGibbet: CombatAction = createCombatAction({
  id: ActionId.UnveiledGibbet,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SoulReaver, 30, { stacks: 1 }));
  },
  isGlowing: (state) => soul(state) >= 50,
});

const soulSlice: CombatAction = createCombatAction({
  id: ActionId.SoulSlice,
  execute: (dispatch) => {
    dispatch(addSoul(50));
    dispatch(gcd({ reducedBySkillSpeed: true }));
  },
  maxCharges: () => 2,
});

const gibbet: CombatAction = createCombatAction({
  id: ActionId.Gibbet,
  execute: (dispatch, getState) => {
    dispatch(removeBuffStack(StatusId.SoulReaver));

    if (hasBuff(getState(), StatusId.EnhancedGibbet)) {
      dispatch(removeBuff(StatusId.EnhancedGibbet));
    }

    dispatch(buff(StatusId.EnhancedGallows, 60));

    dispatch(addShroud(10));
  },
  isUsable: (state) => hasBuff(state, StatusId.SoulReaver),
  isGlowing: (state) =>
    (hasBuff(state, StatusId.SoulReaver) && !hasBuff(state, StatusId.EnhancedGallows)) || hasBuff(state, StatusId.EnhancedGibbet),
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.Enshrouded) ? ActionId.VoidReaping : ActionId.Gibbet),
});

const gallows: CombatAction = createCombatAction({
  id: ActionId.Gallows,
  execute: (dispatch, getState) => {
    dispatch(removeBuffStack(StatusId.SoulReaver));

    if (hasBuff(getState(), StatusId.EnhancedGallows)) {
      dispatch(removeBuff(StatusId.EnhancedGallows));
    }

    dispatch(buff(StatusId.EnhancedGibbet, 60));

    dispatch(addShroud(10));
  },
  isUsable: (state) => hasBuff(state, StatusId.SoulReaver),
  isGlowing: (state) =>
    (hasBuff(state, StatusId.SoulReaver) && !hasBuff(state, StatusId.EnhancedGibbet)) || hasBuff(state, StatusId.EnhancedGallows),
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.Enshrouded) ? ActionId.CrossReaping : ActionId.Gallows),
});

const gluttony: CombatAction = createCombatAction({
  id: ActionId.Gluttony,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SoulReaver, 30, { stacks: 2 }));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  isGlowing: (state) => !hasBuff(state, StatusId.Enshrouded) && soul(state) >= 50,
});

const enshround: CombatAction = createCombatAction({
  id: ActionId.Enshroud,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Enshrouded, 30));
    dispatch(addLemure(5));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  isGlowing: (state) => !hasBuff(state, StatusId.Enshrouded) && shroud(state) >= 50,
});

const crossReaping: CombatAction = createCombatAction({
  id: ActionId.CrossReaping,
  execute: (dispatch, getState) => {
    if (hasBuff(getState(), StatusId.EnhancedCrossReaping)) {
      dispatch(removeBuff(StatusId.EnhancedCrossReaping));
    }

    if (lemure(getState()) > 0) {
      dispatch(buff(StatusId.EnhancedVoidReaping, 30));

      dispatch(addVoid(1));
    }
  },
  isGlowing: (state) => hasBuff(state, StatusId.EnhancedCrossReaping) || !hasBuff(state, StatusId.EnhancedVoidReaping),
});

const voidReaping: CombatAction = createCombatAction({
  id: ActionId.VoidReaping,
  execute: (dispatch, getState) => {
    if (hasBuff(getState(), StatusId.EnhancedVoidReaping)) {
      dispatch(removeBuff(StatusId.EnhancedVoidReaping));
    }

    if (lemure(getState()) > 0) {
      dispatch(buff(StatusId.EnhancedCrossReaping, 30));

      dispatch(addVoid(1));
    }
  },
  isGlowing: (state) => hasBuff(state, StatusId.EnhancedVoidReaping) || !hasBuff(state, StatusId.EnhancedCrossReaping),
});

const lemuresSlice: CombatAction = createCombatAction({
  id: ActionId.LemuresSlice,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isGlowing: (state) => voidShroud(state) >= 2,
});

const arcaneCircle: CombatAction = createCombatAction({
  id: ActionId.ArcaneCircle,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ArcaneCircle, 20));
    dispatch(buff(StatusId.CircleofSacrifice, 5));
    dispatch(buff(StatusId.BloodsownCircle, 6));
  },
});

const plentifulHarvest: CombatAction = createCombatAction({
  id: ActionId.PlentifulHarvest,
  execute: (dispatch) => {
    dispatch(addShroud(50));
    dispatch(removeBuff(StatusId.ImmortalSacrifice));
  },
  isUsable: (state) =>
    !hasBuff(state, StatusId.BloodsownCircle) && hasBuff(state, StatusId.ImmortalSacrifice) && !hasBuff(state, StatusId.Enshrouded),
  isGlowing: (state) =>
    !hasBuff(state, StatusId.BloodsownCircle) && hasBuff(state, StatusId.ImmortalSacrifice) && !hasBuff(state, StatusId.Enshrouded),
  reducedBySkillSpeed: true,
});

const communio: CombatAction = createCombatAction({
  id: ActionId.Communio,
  execute: (dispatch, getState) => {
    dispatch(removeLemure(lemure(getState())));
  },
  isGlowing: (state) => lemure(state) === 1,
  reducedBySkillSpeed: true,
});

const soulsow: CombatAction = createCombatAction({
  id: ActionId.Soulsow,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Soulsow, null));
  },
  castTime: (state) => (inCombat(state) ? 5 : 0),
  redirect: (state) => (hasBuff(state, StatusId.Soulsow) ? ActionId.HarvestMoon : ActionId.Soulsow),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const harvestMoon: CombatAction = createCombatAction({
  id: ActionId.HarvestMoon,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.Soulsow));
  },
  isGlowing: (state) => hasBuff(state, StatusId.Soulsow),
  reducedBySpellSpeed: true,
});

const whorlOfDeath: CombatAction = createCombatAction({
  id: ActionId.WhorlofDeath,
  execute: (dispatch) => {
    dispatch(extendableDebuff(StatusId.DeathsDesign, 30, 60));
  },
  reducedBySkillSpeed: true,
});

const spinningScythe: CombatAction = createCombatAction({
  id: ActionId.SpinningScythe,
  execute: (dispatch) => {
    dispatch(combo(ActionId.SpinningScythe));

    dispatch(addSoul(10));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Enshrouded),
  reducedBySkillSpeed: true,
});

const nightmareScythe: CombatAction = createCombatAction({
  id: ActionId.NightmareScythe,
  execute: (dispatch, _, context) => {
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
  execute: (dispatch, getState) => {
    dispatch(addSoul(50));
    dispatch(gcd({ reducedBySkillSpeed: true }));
  },
  maxCharges: () => 2,
});

const guillotine: CombatAction = createCombatAction({
  id: ActionId.Guillotine,
  execute: (dispatch) => {
    dispatch(removeBuffStack(StatusId.SoulReaver));

    dispatch(addShroud(10));
  },
  isUsable: (state) => hasBuff(state, StatusId.SoulReaver),
  isGlowing: (state) => hasBuff(state, StatusId.SoulReaver),
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.Enshrouded) ? ActionId.GrimReaping : ActionId.Guillotine),
});

const grimReaping: CombatAction = createCombatAction({
  id: ActionId.GrimReaping,
  execute: (dispatch, getState) => {
    if (lemure(getState()) > 0) {
      dispatch(addVoid(1));
    }
  },
  isGlowing: (state) => hasBuff(state, StatusId.Enshrouded),
});

const grimSwathe: CombatAction = createCombatAction({
  id: ActionId.GrimSwathe,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SoulReaver, 30, { stacks: 1 }));
  },
  redirect: (state) => (hasBuff(state, StatusId.Enshrouded) ? ActionId.LemuresScythe : ActionId.GrimSwathe),
  isGlowing: (state) => soul(state) >= 50,
});

const lemuresScythe: CombatAction = createCombatAction({
  id: ActionId.LemuresScythe,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isGlowing: (state) => voidShroud(state) >= 2,
});

const arcaneCrest: CombatAction = createCombatAction({
  id: ActionId.ArcaneCrest,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.CrestofTimeBorrowed, 5));
  },
});

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
];

export const rprEpics = combineEpics(
  removeEnshroudWhenLemureSpentEpic,
  cleanupEnshrouded,
  removeSoulReaverEpic,
  consumeCircleOfSacrificeEpic,
  partyCircleOfSacrificeEpic
);
