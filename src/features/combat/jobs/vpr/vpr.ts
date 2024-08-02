import { Epic, combineEpics } from 'redux-observable';
import { RootState } from '../../../../app/store';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import { StatusId } from '../../../actions/status_enums';
import {
  addAnguineTribute,
  addBuff,
  addRattlingCoil,
  addSerpentsOfferings,
  buff,
  buffStacks,
  combo,
  dmgEvent,
  executeAction,
  gcd,
  hasBuff,
  hasCombo,
  inCombat,
  ogcdLock,
  previousGCDAction,
  removeBuff,
  removeBuffAction,
  removeBuffStack,
  removeCombo,
  resource,
  setAnguineTribute,
  setResource,
} from '../../combatSlice';
import { ActionId } from '../../../actions/action_enums';
import { filter, withLatestFrom, map, switchMap, takeWhile, of } from 'rxjs';
import { getActionById } from '../../../actions/actions';

function rattlingCoil(state: RootState) {
  return resource(state, 'rattlingCoil');
}

function serpentsOfferings(state: RootState) {
  return resource(state, 'serpentsOfferings');
}

const removeRattleEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.ReadytoRattle),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            getActionById(aa.payload.id).type === 'Weaponskill' &&
            ![ActionId.FlankstingStrike, ActionId.FlanksbaneFang, ActionId.HindstingStrike, ActionId.HindsbaneFang].includes(aa.payload.id)
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.ReadytoRattle))
      )
    ),
    map(() => removeBuff(StatusId.ReadytoRattle))
  );

const removeLashEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.ReadytoLash),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            getActionById(aa.payload.id).type === 'Weaponskill' &&
            ![ActionId.JaggedMaw, ActionId.BloodiedMaw].includes(aa.payload.id)
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.ReadytoLash))
      )
    ),
    map(() => removeBuff(StatusId.ReadytoLash))
  );

const removeBiteEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.ReadytoBite),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            getActionById(aa.payload.id).type === 'Weaponskill' &&
            ![ActionId.HuntersCoil, ActionId.SwiftskinsCoil].includes(aa.payload.id)
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.ReadytoBite))
      )
    ),
    switchMap(() => of(removeBuff(StatusId.ReadytoBite), removeBuff(StatusId.HuntersVenom), removeBuff(StatusId.SwiftskinsVenom)))
  );

const removeUncoilEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.ReadytoUncoil),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            getActionById(aa.payload.id).type === 'Weaponskill' &&
            ![ActionId.UncoiledFury].includes(aa.payload.id)
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.ReadytoUncoil))
      )
    ),
    map(() => removeBuff(StatusId.ReadytoUncoil))
  );

const removeReawakenedEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Reawakened),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === setResource.type && aa.payload.resourceType === 'anguineTribute' && aa.payload.amount === 0),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.Reawakened))
      )
    ),
    map(() => removeBuff(StatusId.Reawakened))
  );

const removePoisedEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && a.payload === StatusId.ReadytoUncoil),
    switchMap(() => of(removeBuff(StatusId.PoisedforTwinfang), removeBuff(StatusId.PoisedforTwinblood)))
  );

const venoms = [
  StatusId.FlankstungVenom,
  StatusId.FlanksbaneVenom,
  StatusId.HindstungVenom,
  StatusId.HindsbaneVenom,
  StatusId.GrimhuntersVenom,
  StatusId.GrimskinsVenom,
];

const removeVenomsEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && venoms.includes(a.payload.id)),
    switchMap((a) => of(...venoms.filter((v) => v !== a.payload.id).map((v) => removeBuff(v))))
  );

const honed = [StatusId.HonedReavers, StatusId.HonedSteel];

const removeHonedEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && honed.includes(a.payload.id)),
    switchMap((a) => of(...honed.filter((v) => v !== a.payload.id).map((v) => removeBuff(v))))
  );

const swiftscaledStatus: CombatStatus = createCombatStatus({
  id: StatusId.Swiftscaled,
  duration: 40,
  isHarmful: false,
});

const huntersInstinctStatus: CombatStatus = createCombatStatus({
  id: StatusId.HuntersInstinct,
  duration: 40,
  isHarmful: false,
});

const honedReaversStatus: CombatStatus = createCombatStatus({
  id: StatusId.HonedReavers,
  duration: 60,
  isHarmful: false,
});

const honedSteelStatus: CombatStatus = createCombatStatus({
  id: StatusId.HonedSteel,
  duration: 60,
  isHarmful: false,
});

const flankstungVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.FlankstungVenom,
  duration: 60,
  isHarmful: false,
});

const flanksbaneVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.FlanksbaneVenom,
  duration: 60,
  isHarmful: false,
});

const hindstungVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.HindstungVenom,
  duration: 60,
  isHarmful: false,
});

const hindsbaneVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.HindsbaneVenom,
  duration: 60,
  isHarmful: false,
});

const grimhuntersVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.GrimhuntersVenom,
  duration: 60,
  isHarmful: false,
});

const grimskinsVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.GrimskinsVenom,
  duration: 60,
  isHarmful: false,
});

const readyToRattleStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoRattle,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const readyToLashStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoLash,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const readyToHuntStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoHunt,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const readyToSwiftStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoSwift,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const readyToBiteStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoBite,
  duration: 30,
  isHarmful: false,
  isVisible: false,
  initialStacks: 2,
});

const readyToThreshStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoThresh,
  duration: 30,
  isHarmful: false,
  isVisible: false,
  initialStacks: 2,
});

const readyToUncoilStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoUncoil,
  duration: 60,
  isHarmful: false,
  isVisible: false,
  initialStacks: 2,
});

const huntersVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.HuntersVenom,
  duration: 30,
  isHarmful: false,
});

const swiftskinsVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.SwiftskinsVenom,
  duration: 30,
  isHarmful: false,
});

const fellhuntersVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.FellhuntersVenom,
  duration: 30,
  isHarmful: false,
});

const fellskinsVenomStatus: CombatStatus = createCombatStatus({
  id: StatusId.FellskinsVenom,
  duration: 30,
  isHarmful: false,
});

const poisedForTwinfangStatus: CombatStatus = createCombatStatus({
  id: StatusId.PoisedforTwinfang,
  duration: 60,
  isHarmful: false,
});

const poisedForTwinbloodStatus: CombatStatus = createCombatStatus({
  id: StatusId.PoisedforTwinblood,
  duration: 60,
  isHarmful: false,
});

const readyToReawakenStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoReawaken,
  duration: 30,
  isHarmful: false,
});

const reawakenedStatus: CombatStatus = createCombatStatus({
  id: StatusId.Reawakened,
  duration: 30,
  isHarmful: false,
  onExpire: (dispatch) => dispatch(setAnguineTribute(0)),
});

const generationStatus: CombatStatus = createCombatStatus({
  id: StatusId.Generation,
  duration: 30,
  isHarmful: false,
  isVisible: false,
  initialStacks: 1,
});

const readyToLegacyStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoLegacy,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const steelFangs: CombatAction = createCombatAction({
  id: ActionId.SteelFangs,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.SteelFangs, context, { potency: 200, enhancedPotency: 300, isEnhanced: hasBuff(getState(), StatusId.HonedSteel) })
    );
    dispatch(combo(ActionId.SteelFangs));
    dispatch(buff(StatusId.HonedReavers));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasBuff(state, StatusId.HonedSteel),
  redirect: (state) =>
    hasBuff(state, StatusId.Reawakened)
      ? ActionId.FirstGeneration
      : hasCombo(state, ActionId.HindstingStrike)
      ? ActionId.HindstingStrike
      : hasCombo(state, ActionId.FlankstingStrike)
      ? ActionId.FlankstingStrike
      : hasCombo(state, ActionId.HuntersSting)
      ? ActionId.HuntersSting
      : ActionId.SteelFangs,
});

const reavingFangs: CombatAction = createCombatAction({
  id: ActionId.ReavingFangs,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.ReavingFangs, context, {
        potency: 200,
        enhancedPotency: 300,
        isEnhanced: hasBuff(getState(), StatusId.HonedReavers),
      })
    );
    dispatch(combo(ActionId.SteelFangs));
    dispatch(buff(StatusId.HonedSteel));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasBuff(state, StatusId.HonedReavers),
  redirect: (state) =>
    hasBuff(state, StatusId.Reawakened)
      ? ActionId.SecondGeneration
      : hasCombo(state, ActionId.HindsbaneFang)
      ? ActionId.HindsbaneFang
      : hasCombo(state, ActionId.FlanksbaneFang)
      ? ActionId.FlanksbaneFang
      : hasCombo(state, ActionId.SwiftskinsSting)
      ? ActionId.SwiftskinsSting
      : ActionId.ReavingFangs,
});

const huntersSting: CombatAction = createCombatAction({
  id: ActionId.HuntersSting,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HuntersSting, context, { potency: 300 }));
    dispatch(buff(StatusId.HuntersInstinct));
    dispatch(combo(ActionId.HuntersSting));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !(hasBuff(state, StatusId.HindstungVenom) || hasBuff(state, StatusId.HindsbaneVenom)),
});

const swiftkinsSting: CombatAction = createCombatAction({
  id: ActionId.SwiftskinsSting,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SwiftskinsSting, context, { potency: 300 }));
    dispatch(buff(StatusId.Swiftscaled));
    dispatch(combo(ActionId.SwiftskinsSting));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !(hasBuff(state, StatusId.FlankstungVenom) || hasBuff(state, StatusId.FlanksbaneVenom)),
});

const flankstingStrike: CombatAction = createCombatAction({
  id: ActionId.FlankstingStrike,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.FlankstingStrike, context, {
        potency: 340,
        flankPotency: 400,
        enhancedPotency: 440,
        flankEnhancedPotency: 500,
        isEnhanced: hasBuff(getState(), StatusId.FlankstungVenom),
      })
    );
    dispatch(removeBuff(StatusId.FlankstungVenom));
    dispatch(buff(StatusId.HindstungVenom));
    dispatch(buff(StatusId.ReadytoRattle));
    dispatch(addSerpentsOfferings(10));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !hasBuff(state, StatusId.FlanksbaneVenom),
});

const flanksbaneFang: CombatAction = createCombatAction({
  id: ActionId.FlanksbaneFang,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.FlanksbaneFang, context, {
        potency: 340,
        flankPotency: 400,
        enhancedPotency: 440,
        flankEnhancedPotency: 500,
        isEnhanced: hasBuff(getState(), StatusId.FlanksbaneVenom),
      })
    );
    dispatch(removeBuff(StatusId.FlanksbaneVenom));
    dispatch(buff(StatusId.HindsbaneVenom));
    dispatch(buff(StatusId.ReadytoRattle));
    dispatch(addSerpentsOfferings(10));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !hasBuff(state, StatusId.FlankstungVenom),
});

const hindstingStrike: CombatAction = createCombatAction({
  id: ActionId.HindstingStrike,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.HindstingStrike, context, {
        potency: 340,
        rearPotency: 400,
        enhancedPotency: 440,
        rearEnhancedPotency: 500,
        isEnhanced: hasBuff(getState(), StatusId.HindstungVenom),
      })
    );
    dispatch(removeBuff(StatusId.HindstungVenom));
    dispatch(buff(StatusId.FlanksbaneVenom));
    dispatch(buff(StatusId.ReadytoRattle));
    dispatch(addSerpentsOfferings(10));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !hasBuff(state, StatusId.HindsbaneVenom),
});

const hindsbaneFang: CombatAction = createCombatAction({
  id: ActionId.HindsbaneFang,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.HindsbaneFang, context, {
        potency: 340,
        rearPotency: 440,
        enhancedPotency: 440,
        rearEnhancedPotency: 500,
        isEnhanced: hasBuff(getState(), StatusId.HindsbaneVenom),
      })
    );
    dispatch(removeBuff(StatusId.HindsbaneVenom));
    dispatch(buff(StatusId.FlankstungVenom));
    dispatch(buff(StatusId.ReadytoRattle));
    dispatch(addSerpentsOfferings(10));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !hasBuff(state, StatusId.HindstungVenom),
});

const serpentsTail: CombatAction = createCombatAction({
  id: ActionId.SerpentsTail,
  execute: () => {},
  isUsable: () => false,
  redirect: (state) => {
    if (hasBuff(state, StatusId.ReadytoLegacy)) {
      switch (previousGCDAction(state)) {
        case ActionId.FirstGeneration:
          return ActionId.FirstLegacy;
        case ActionId.SecondGeneration:
          return ActionId.SecondLegacy;
        case ActionId.ThirdGeneration:
          return ActionId.ThirdLegacy;
        case ActionId.FourthGeneration:
          return ActionId.FourthLegacy;
      }
    }

    return hasBuff(state, StatusId.ReadytoLash)
      ? ActionId.LastLash
      : hasBuff(state, StatusId.ReadytoRattle)
      ? ActionId.DeathRattle
      : ActionId.SerpentsTail;
  },
});

const deathRattle: CombatAction = createCombatAction({
  id: ActionId.DeathRattle,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.DeathRattle, context, { potency: 280 }));
    dispatch(removeBuff(StatusId.ReadytoRattle));
  },
  isGlowing: () => true,
});

const writhingSnap: CombatAction = createCombatAction({
  id: ActionId.WrithingSnap,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.WrithingSnap, context, { potency: 200 }));
  },
  reducedBySkillSpeed: true,
});

const steelMaw: CombatAction = createCombatAction({
  id: ActionId.SteelMaw,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.SteelMaw, context, { potency: 100, enhancedPotency: 120, isEnhanced: hasBuff(getState(), StatusId.HonedSteel) })
    );
    dispatch(combo(ActionId.SteelMaw));
    dispatch(buff(StatusId.HonedReavers));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasBuff(state, StatusId.HonedSteel),
  redirect: (state) =>
    hasBuff(state, StatusId.Reawakened)
      ? ActionId.FirstGeneration
      : hasCombo(state, ActionId.JaggedMaw)
      ? ActionId.JaggedMaw
      : hasCombo(state, ActionId.HuntersBite)
      ? ActionId.HuntersBite
      : ActionId.SteelMaw,
});

const reavingMaw: CombatAction = createCombatAction({
  id: ActionId.ReavingMaw,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.ReavingMaw, context, { potency: 100, enhancedPotency: 120, isEnhanced: hasBuff(getState(), StatusId.HonedReavers) })
    );
    dispatch(combo(ActionId.SteelMaw));
    dispatch(buff(StatusId.HonedSteel));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasBuff(state, StatusId.HonedReavers),
  redirect: (state) =>
    hasBuff(state, StatusId.Reawakened)
      ? ActionId.SecondGeneration
      : hasCombo(state, ActionId.BloodiedMaw)
      ? ActionId.BloodiedMaw
      : hasCombo(state, ActionId.SwiftskinsBite)
      ? ActionId.SwiftskinsBite
      : ActionId.ReavingMaw,
});

const huntersBite: CombatAction = createCombatAction({
  id: ActionId.HuntersBite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HuntersSting, context, { potency: 130 }));
    dispatch(buff(StatusId.HuntersInstinct));
    dispatch(combo(ActionId.HuntersBite));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !hasBuff(state, StatusId.GrimskinsVenom),
});

const swiftskinsBite: CombatAction = createCombatAction({
  id: ActionId.SwiftskinsBite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SwiftskinsBite, context, { potency: 130 }));
    dispatch(buff(StatusId.Swiftscaled));
    dispatch(combo(ActionId.HuntersBite));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !hasBuff(state, StatusId.GrimhuntersVenom),
});

const jaggedMaw: CombatAction = createCombatAction({
  id: ActionId.JaggedMaw,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.JaggedMaw, context, {
        potency: 140,
        enhancedPotency: 160,
        isEnhanced: hasBuff(getState(), StatusId.GrimhuntersVenom),
      })
    );
    dispatch(removeBuff(StatusId.GrimhuntersVenom));
    dispatch(buff(StatusId.GrimskinsVenom));
    dispatch(buff(StatusId.ReadytoLash));
    dispatch(addSerpentsOfferings(10));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !hasBuff(state, StatusId.GrimskinsVenom),
});

const bloodiedMaw: CombatAction = createCombatAction({
  id: ActionId.BloodiedMaw,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.BloodiedMaw, context, {
        potency: 140,
        enhancedPotency: 160,
        isEnhanced: hasBuff(getState(), StatusId.GrimskinsVenom),
      })
    );
    dispatch(removeBuff(StatusId.GrimskinsVenom));
    dispatch(buff(StatusId.GrimhuntersVenom));
    dispatch(buff(StatusId.ReadytoLash));
    dispatch(addSerpentsOfferings(10));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => !hasBuff(state, StatusId.GrimhuntersVenom),
});

const lastLash: CombatAction = createCombatAction({
  id: ActionId.LastLash,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.LastLash, context, { potency: 100 }));
    dispatch(removeBuff(StatusId.ReadytoLash));
  },
  reducedBySkillSpeed: true,
  isGlowing: () => true,
});

const slither: CombatAction = createCombatAction({
  id: ActionId.Slither,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
});

const vicewinder: CombatAction = createCombatAction({
  id: ActionId.Vicewinder,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Vicewinder, context, { potency: 500 }));
    dispatch(gcd({ time: 3000, reducedBySkillSpeed: true }));
    dispatch(removeCombo(ActionId.Vicepit));
    dispatch(combo(ActionId.Vicewinder));
    dispatch(buff(StatusId.ReadytoHunt));
    dispatch(buff(StatusId.ReadytoSwift));
    dispatch(addRattlingCoil(1));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Reawakened),
});

const huntersCoil: CombatAction = createCombatAction({
  id: ActionId.HuntersCoil,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HuntersCoil, context, { potency: 570, flankPotency: 620 }));
    dispatch(combo(ActionId.Vicewinder));
    dispatch(removeBuff(StatusId.ReadytoHunt));
    dispatch(buff(StatusId.HuntersInstinct));
    dispatch(buff(StatusId.HuntersVenom));
    dispatch(buff(StatusId.ReadytoBite));
    dispatch(addSerpentsOfferings(5));
  },
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.Reawakened) ? ActionId.ThirdGeneration : ActionId.HuntersCoil),
  isUsable: (state) => hasCombo(state, ActionId.HuntersCoil) && hasBuff(state, StatusId.ReadytoHunt),
  isGlowing: (state) => hasCombo(state, ActionId.HuntersCoil) && hasBuff(state, StatusId.ReadytoHunt),
});

const swiftskinsCoil: CombatAction = createCombatAction({
  id: ActionId.SwiftskinsCoil,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SwiftskinsCoil, context, { potency: 570, rearPotency: 620 }));
    dispatch(combo(ActionId.Vicewinder));
    dispatch(removeBuff(StatusId.ReadytoSwift));
    dispatch(buff(StatusId.Swiftscaled));
    dispatch(buff(StatusId.SwiftskinsVenom));
    dispatch(buff(StatusId.ReadytoBite));
    dispatch(addSerpentsOfferings(5));
  },
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.Reawakened) ? ActionId.FourthGeneration : ActionId.SwiftskinsCoil),
  isUsable: (state) => hasCombo(state, ActionId.SwiftskinsCoil) && hasBuff(state, StatusId.ReadytoSwift),
  isGlowing: (state) => hasCombo(state, ActionId.SwiftskinsCoil) && hasBuff(state, StatusId.ReadytoSwift),
});

const vicepit: CombatAction = createCombatAction({
  id: ActionId.Vicepit,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Vicepit, context, { potency: 220 }));
    dispatch(gcd({ time: 3000, reducedBySkillSpeed: true }));
    dispatch(removeCombo(ActionId.Vicewinder));
    dispatch(combo(ActionId.Vicepit));
    dispatch(buff(StatusId.ReadytoHunt));
    dispatch(buff(StatusId.ReadytoSwift));
    dispatch(addRattlingCoil(1));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Reawakened),
});

const huntersDen: CombatAction = createCombatAction({
  id: ActionId.HuntersDen,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HuntersDen, context, { potency: 280 }));
    dispatch(combo(ActionId.Vicepit));
    dispatch(removeBuff(StatusId.ReadytoHunt));
    dispatch(buff(StatusId.HuntersInstinct));
    dispatch(buff(StatusId.FellhuntersVenom));
    dispatch(buff(StatusId.ReadytoThresh));
    dispatch(addSerpentsOfferings(5));
  },
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.Reawakened) ? ActionId.ThirdGeneration : ActionId.HuntersDen),
  isUsable: (state) => hasCombo(state, ActionId.HuntersDen) && hasBuff(state, StatusId.ReadytoHunt),
  isGlowing: (state) => hasCombo(state, ActionId.HuntersDen) && hasBuff(state, StatusId.ReadytoHunt),
});

const swiftskinsDen: CombatAction = createCombatAction({
  id: ActionId.SwiftskinsDen,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SwiftskinsDen, context, { potency: 280 }));
    dispatch(combo(ActionId.Vicepit));
    dispatch(removeBuff(StatusId.ReadytoSwift));
    dispatch(buff(StatusId.Swiftscaled));
    dispatch(buff(StatusId.FellskinsVenom));
    dispatch(buff(StatusId.ReadytoThresh));
    dispatch(addSerpentsOfferings(5));
  },
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.Reawakened) ? ActionId.FourthGeneration : ActionId.SwiftskinsDen),
  isUsable: (state) => hasCombo(state, ActionId.SwiftskinsDen) && hasBuff(state, StatusId.ReadytoSwift),
  isGlowing: (state) => hasCombo(state, ActionId.SwiftskinsDen) && hasBuff(state, StatusId.ReadytoSwift),
});

const twinfang: CombatAction = createCombatAction({
  id: ActionId.Twinfang,
  execute: () => {},
  isUsable: () => false,
  redirect: (state) =>
    hasBuff(state, StatusId.ReadytoBite)
      ? ActionId.TwinfangBite
      : hasBuff(state, StatusId.ReadytoThresh)
      ? ActionId.TwinfangThresh
      : hasBuff(state, StatusId.ReadytoUncoil)
      ? ActionId.UncoiledTwinfang
      : ActionId.Twinfang,
});

const twinblood: CombatAction = createCombatAction({
  id: ActionId.Twinblood,
  execute: () => {},
  isUsable: () => false,
  redirect: (state) =>
    hasBuff(state, StatusId.ReadytoBite)
      ? ActionId.TwinbloodBite
      : hasBuff(state, StatusId.ReadytoThresh)
      ? ActionId.TwinbloodThresh
      : hasBuff(state, StatusId.ReadytoUncoil)
      ? ActionId.UncoiledTwinblood
      : ActionId.Twinblood,
});

const twinfangBite: CombatAction = createCombatAction({
  id: ActionId.TwinfangBite,
  execute: (dispatch, getState, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.TwinfangBite, context, {
        potency: 120,
        enhancedPotency: 170,
        isEnhanced: hasBuff(getState(), StatusId.HuntersVenom),
      })
    );
    dispatch(removeBuff(StatusId.HuntersVenom));
    if (previousGCDAction(getState()) === ActionId.HuntersCoil) {
      dispatch(buff(StatusId.SwiftskinsVenom));
    }
    dispatch(removeBuffStack(StatusId.ReadytoBite));
  },
  isGlowing: (state) => hasBuff(state, StatusId.HuntersVenom),
});

const twinbloodBite: CombatAction = createCombatAction({
  id: ActionId.TwinbloodBite,
  execute: (dispatch, getState, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.TwinbloodBite, context, {
        potency: 120,
        enhancedPotency: 170,
        isEnhanced: hasBuff(getState(), StatusId.SwiftskinsVenom),
      })
    );
    dispatch(removeBuff(StatusId.SwiftskinsVenom));
    if (previousGCDAction(getState()) === ActionId.SwiftskinsCoil) {
      dispatch(buff(StatusId.HuntersVenom));
    }
    dispatch(removeBuffStack(StatusId.ReadytoBite));
  },
  isGlowing: (state) => hasBuff(state, StatusId.SwiftskinsVenom),
});

const twinfangThresh: CombatAction = createCombatAction({
  id: ActionId.TwinfangThresh,
  execute: (dispatch, getState, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.TwinfangThresh, context, {
        potency: 50,
        enhancedPotency: 80,
        isEnhanced: hasBuff(getState(), StatusId.FellhuntersVenom),
      })
    );
    dispatch(removeBuff(StatusId.FellhuntersVenom));
    if (previousGCDAction(getState()) === ActionId.HuntersDen) {
      dispatch(buff(StatusId.FellskinsVenom));
    }
    dispatch(removeBuffStack(StatusId.ReadytoThresh));
  },
  isGlowing: (state) => hasBuff(state, StatusId.FellhuntersVenom),
});

const twinbloodThresh: CombatAction = createCombatAction({
  id: ActionId.TwinbloodThresh,
  execute: (dispatch, getState, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.TwinbloodThresh, context, {
        potency: 50,
        enhancedPotency: 80,
        isEnhanced: hasBuff(getState(), StatusId.FellskinsVenom),
      })
    );
    dispatch(removeBuff(StatusId.FellskinsVenom));
    if (previousGCDAction(getState()) === ActionId.SwiftskinsDen) {
      dispatch(buff(StatusId.FellhuntersVenom));
    }
    dispatch(removeBuffStack(StatusId.ReadytoThresh));
  },
  isGlowing: (state) => hasBuff(state, StatusId.FellskinsVenom),
});

const uncoiledFury: CombatAction = createCombatAction({
  id: ActionId.UncoiledFury,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.UncoiledFury, context, { potency: 680 }));
    dispatch(buff(StatusId.ReadytoUncoil));
    dispatch(buff(StatusId.PoisedforTwinfang));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => rattlingCoil(state) > 0,
});

const uncoiledTwinfang: CombatAction = createCombatAction({
  id: ActionId.UncoiledTwinfang,
  execute: (dispatch, getState, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.UncoiledTwinfang, context, {
        potency: 100,
        enhancedPotency: 150,
        isEnhanced: hasBuff(getState(), StatusId.PoisedforTwinfang),
      })
    );
    dispatch(removeBuff(StatusId.PoisedforTwinfang));
    dispatch(buff(StatusId.PoisedforTwinblood));
    dispatch(removeBuffStack(StatusId.ReadytoUncoil));
  },
  isGlowing: (state) => hasBuff(state, StatusId.PoisedforTwinfang),
});

const uncoiledTwinblood: CombatAction = createCombatAction({
  id: ActionId.UncoiledTwinblood,
  execute: (dispatch, getState, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.UncoiledTwinfang, context, {
        potency: 100,
        enhancedPotency: 150,
        isEnhanced: hasBuff(getState(), StatusId.PoisedforTwinblood),
      })
    );
    dispatch(removeBuff(StatusId.PoisedforTwinblood));
    dispatch(removeBuffStack(StatusId.ReadytoUncoil));
  },
  isGlowing: (state) => hasBuff(state, StatusId.PoisedforTwinblood),
});

const serpentsIre: CombatAction = createCombatAction({
  id: ActionId.SerpentsIre,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(addRattlingCoil(1));
    dispatch(buff(StatusId.ReadytoReawaken));
  },
  isUsable: (state) => inCombat(state),
});

const reawaken: CombatAction = createCombatAction({
  id: ActionId.Reawaken,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Reawaken, context, { potency: 750 }));
    dispatch(removeBuff(StatusId.ReadytoReawaken));
    dispatch(buff(StatusId.Reawakened));
    dispatch(buff(StatusId.Generation));
    dispatch(removeCombo(ActionId.Vicewinder));
    dispatch(removeCombo(ActionId.Vicepit));
    dispatch(addAnguineTribute(5));
  },
  reducedBySkillSpeed: true,
  cost: (state, baseCost) => (hasBuff(state, StatusId.ReadytoReawaken) ? 0 : baseCost),
  redirect: (state) => (hasBuff(state, StatusId.Reawakened) ? ActionId.Ouroboros : ActionId.Reawaken),
  isGlowing: (state) => serpentsOfferings(state) >= 50 || hasBuff(state, StatusId.ReadytoReawaken),
});

const firstGeneration: CombatAction = createCombatAction({
  id: ActionId.FirstGeneration,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.FirstGeneration, context, {
        potency: 480,
        enhancedPotency: 680,
        isEnhanced: buffStacks(getState(), StatusId.Generation) === 1,
      })
    );

    dispatch(buff(StatusId.Generation, { stacks: 2 }));
    dispatch(buff(StatusId.ReadytoLegacy));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => buffStacks(state, StatusId.Generation) === 1,
});

const secondGeneration: CombatAction = createCombatAction({
  id: ActionId.SecondGeneration,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.SecondGeneration, context, {
        potency: 480,
        enhancedPotency: 680,
        isEnhanced: buffStacks(getState(), StatusId.Generation) === 2,
      })
    );

    dispatch(buff(StatusId.Generation, { stacks: 3 }));
    dispatch(buff(StatusId.ReadytoLegacy));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => buffStacks(state, StatusId.Generation) === 2,
});

const thirdGeneration: CombatAction = createCombatAction({
  id: ActionId.ThirdGeneration,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.ThirdGeneration, context, {
        potency: 480,
        enhancedPotency: 680,
        isEnhanced: buffStacks(getState(), StatusId.Generation) === 3,
      })
    );

    dispatch(buff(StatusId.Generation, { stacks: 4 }));
    dispatch(buff(StatusId.ReadytoLegacy));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => buffStacks(state, StatusId.Generation) === 3,
});

const fourthGeneration: CombatAction = createCombatAction({
  id: ActionId.FourthGeneration,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.FourthGeneration, context, {
        potency: 480,
        enhancedPotency: 680,
        isEnhanced: buffStacks(getState(), StatusId.Generation) === 4,
      })
    );

    dispatch(buff(StatusId.Generation, { stacks: 5 }));
    dispatch(buff(StatusId.ReadytoLegacy));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => buffStacks(state, StatusId.Generation) === 4,
});

const ouroboros: CombatAction = createCombatAction({
  id: ActionId.Ouroboros,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Ouroboros, context, { potency: 1150 }));
    dispatch(removeBuff(StatusId.Generation));
    dispatch(removeBuff(StatusId.Reawakened));
    dispatch(setAnguineTribute(0));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => buffStacks(state, StatusId.Generation) === 5,
});

const firstLegacy: CombatAction = createCombatAction({
  id: ActionId.FirstLegacy,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.FirstLegacy, context, { potency: 280 }));
    dispatch(removeBuff(StatusId.ReadytoLegacy));
  },
  isGlowing: () => true,
});

const secondLegacy: CombatAction = createCombatAction({
  id: ActionId.SecondLegacy,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.SecondLegacy, context, { potency: 280 }));
    dispatch(removeBuff(StatusId.ReadytoLegacy));
  },
  isGlowing: () => true,
});

const thirdLegacy: CombatAction = createCombatAction({
  id: ActionId.ThirdLegacy,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.ThirdLegacy, context, { potency: 280 }));
    dispatch(removeBuff(StatusId.ReadytoLegacy));
  },
  isGlowing: () => true,
});

const fourthLegacy: CombatAction = createCombatAction({
  id: ActionId.FourthLegacy,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.FourthLegacy, context, { potency: 280 }));
    dispatch(removeBuff(StatusId.ReadytoLegacy));
  },
  isGlowing: () => true,
});

export const vprStatuses: CombatStatus[] = [
  swiftscaledStatus,
  huntersInstinctStatus,
  honedReaversStatus,
  honedSteelStatus,
  flankstungVenomStatus,
  flanksbaneVenomStatus,
  hindstungVenomStatus,
  hindsbaneVenomStatus,
  readyToRattleStatus,
  grimhuntersVenomStatus,
  grimskinsVenomStatus,
  readyToLashStatus,
  readyToBiteStatus,
  readyToThreshStatus,
  readyToHuntStatus,
  readyToSwiftStatus,
  readyToUncoilStatus,
  huntersVenomStatus,
  swiftskinsVenomStatus,
  fellhuntersVenomStatus,
  fellskinsVenomStatus,
  poisedForTwinfangStatus,
  poisedForTwinbloodStatus,
  readyToReawakenStatus,
  reawakenedStatus,
  generationStatus,
  readyToLegacyStatus,
];

export const vpr: CombatAction[] = [
  steelFangs,
  reavingFangs,
  huntersSting,
  swiftkinsSting,
  flankstingStrike,
  flanksbaneFang,
  hindstingStrike,
  hindsbaneFang,
  serpentsTail,
  deathRattle,
  writhingSnap,
  steelMaw,
  reavingMaw,
  huntersBite,
  swiftskinsBite,
  jaggedMaw,
  bloodiedMaw,
  lastLash,
  slither,
  vicewinder,
  huntersCoil,
  swiftskinsCoil,
  twinfang,
  twinblood,
  twinfangBite,
  twinbloodBite,
  vicepit,
  huntersDen,
  swiftskinsDen,
  twinfangThresh,
  twinbloodThresh,
  uncoiledFury,
  uncoiledTwinfang,
  uncoiledTwinblood,
  serpentsIre,
  reawaken,
  firstGeneration,
  secondGeneration,
  thirdGeneration,
  fourthGeneration,
  ouroboros,
  firstLegacy,
  secondLegacy,
  thirdLegacy,
  fourthLegacy,
];

export const vprEpics = combineEpics(
  removeRattleEpic,
  removeLashEpic,
  removeBiteEpic,
  removeUncoilEpic,
  removeReawakenedEpic,
  removePoisedEpic,
  removeVenomsEpic,
  removeHonedEpic
);
