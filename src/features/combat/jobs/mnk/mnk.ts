import { combineEpics, Epic } from 'redux-observable';
import { filter, interval, map, of, switchMap, takeWhile, withLatestFrom } from 'rxjs';
import { AppThunk, ReducerAction, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  addBuff,
  setChakra,
  buff,
  dmgEvent,
  event,
  gcd,
  hasBuff,
  inCombat,
  ogcdLock,
  removeBuff,
  removeBuffStack,
  removeCoeurlsFury,
  removeOpooposFury,
  removeRaptorsFury,
  resource,
  selectBeastChakra,
  setBeastChakra,
  setCoeurlsFury,
  setLunarNadi,
  setOpooposFury,
  setRaptorsFury,
  setSolarNadi,
  StatusState,
  addEvent,
  EventStatus,
} from '../../combatSlice';
import { rng } from '../../utils';

function chakra(state: RootState) {
  return resource(state, 'chakra');
}

const addChakra =
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const current = chakra(state);
    const max = hasBuff(state, StatusId.MeditativeBrotherhood) ? 10 : 5;

    dispatch(setChakra(Math.min(current + amount, max)));
  };

function solarNadi(state: RootState) {
  return resource(state, 'solarNadi');
}

function lunarNadi(state: RootState) {
  return resource(state, 'lunarNadi');
}

function opooposFury(state: RootState) {
  return resource(state, 'opooposFury');
}

function raptorsFury(state: RootState) {
  return resource(state, 'raptorsFury');
}

function coeurlsFury(state: RootState) {
  return resource(state, 'coeurlsFury');
}

export enum BeastChakra {
  OpoOpo = 1,
  Couerl = 2,
  Raptor = 3,
}

function beastChakra(state: RootState) {
  return selectBeastChakra(state);
}

const procChakraEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        a.type === addEvent.type &&
        a.payload.actionId !== 0 &&
        getActionById(a.payload.actionId).job.includes('MNK') &&
        getActionById(a.payload.actionId).type === 'Weaponskill'
    ),
    withLatestFrom(state$),
    switchMap(([action, state]) => {
      const actions = [];

      if (hasBuff(state, StatusId.MeditativeBrotherhood)) {
        actions.push(addChakra(1));
      }

      const statuses = action.payload.statuses.map((s: EventStatus) => s.id);

      if (
        action.payload.actionId !== ActionId.SixsidedStar &&
        (rng(27) ||
          ([ActionId.LeapingOpo, ActionId.ShadowoftheDestroyer].includes(action.payload.actionId) &&
            statuses.some((s: number) => [StatusId.OpoopoForm, StatusId.FormlessFist, StatusId.PerfectBalance].includes(s))))
      ) {
        actions.push(addChakra(1));
      }

      return of(...actions);
    })
  );

const brotherhoodChakraEpic: Epic<ReducerAction<StatusState>, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.MeditativeBrotherhood),
    switchMap((a) =>
      interval(1250).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id)),
        map((state) => {
          let chakraGenerators = state.player.partySize - 1;

          let chakra = 0;

          for (let i = 0; i < chakraGenerators; i++) {
            if (rng(10)) {
              chakra += 1;
            }
          }

          return addChakra(chakra);
        })
      )
    )
  );

export const addBeastChakra =
  (chakra: BeastChakra): AppThunk =>
  (dispatch, getState) => {
    const current = resource(getState(), 'beastChakra');

    dispatch(setBeastChakra(current * 10 + chakra));
  };

function hasForm(state: RootState, form: StatusId) {
  return hasBuff(state, form) || hasBuff(state, StatusId.FormlessFist) || hasBuff(state, StatusId.PerfectBalance);
}

const forms = [StatusId.OpoopoForm, StatusId.RaptorForm, StatusId.CoeurlForm, StatusId.FormlessFist, StatusId.PerfectBalance];

export const setForm =
  (form: StatusId, chakra?: BeastChakra): AppThunk =>
  (dispatch, getState) => {
    function clear() {
      forms.forEach((f) => {
        if (f !== form && hasBuff(getState(), f)) {
          dispatch(removeBuff(f));
        }
      });
    }

    if ([StatusId.FormlessFist, StatusId.PerfectBalance].includes(form)) {
      clear();

      if (form === StatusId.PerfectBalance) {
        dispatch(buff(StatusId.PerfectBalance));
      } else {
        dispatch(buff(StatusId.FormlessFist));
      }
    } else {
      if (hasBuff(getState(), StatusId.PerfectBalance)) {
        dispatch(removeBuffStack(StatusId.PerfectBalance));
        dispatch(addBeastChakra(chakra!));
      } else {
        clear();

        dispatch(buff(form));
      }
    }
  };

const perfectBalanceStatus: CombatStatus = createCombatStatus({
  id: StatusId.PerfectBalance,
  duration: 20,
  isHarmful: false,
  initialStacks: 3,
});

const formlessFistStatus: CombatStatus = createCombatStatus({
  id: StatusId.FormlessFist,
  duration: 30,
  isHarmful: false,
});

const raptorFormStatus: CombatStatus = createCombatStatus({
  id: StatusId.RaptorForm,
  duration: 30,
  isHarmful: false,
});

const coeurlFormStatus: CombatStatus = createCombatStatus({
  id: StatusId.CoeurlForm,
  duration: 30,
  isHarmful: false,
});

const opoopoFormStatus: CombatStatus = createCombatStatus({
  id: StatusId.OpoopoForm,
  duration: 30,
  isHarmful: false,
});

const leadenFistStatus: CombatStatus = createCombatStatus({
  id: StatusId.LeadenFist,
  duration: 30,
  isHarmful: false,
});

const mantraStatus: CombatStatus = createCombatStatus({
  id: StatusId.Mantra,
  duration: 15,
  isHarmful: false,
});

const riddleOfFireStatus: CombatStatus = createCombatStatus({
  id: StatusId.RiddleofFire,
  duration: 20,
  isHarmful: false,
});

const riddleOfEarthStatus: CombatStatus = createCombatStatus({
  id: StatusId.RiddleofEarth,
  duration: 15,
  isHarmful: false,
});

const riddleOfWindStatus: CombatStatus = createCombatStatus({
  id: StatusId.RiddleofWind,
  duration: 15,
  isHarmful: false,
});

const brotherhoodStatus: CombatStatus = createCombatStatus({
  id: StatusId.Brotherhood,
  duration: 20,
  isHarmful: false,
});

const meditativeBrotherhoodStatus = createCombatStatus({
  id: StatusId.MeditativeBrotherhood,
  duration: 20,
  isHarmful: false,
  onExpire: (dispatch) => dispatch(addChakra(0)),
});

const sixsidedStarStatus: CombatStatus = createCombatStatus({
  id: StatusId.SixsidedStar,
  duration: 5,
  isHarmful: false,
});

const bootshine: CombatAction = createCombatAction({
  id: ActionId.Bootshine,
  execute: () => {},
  reducedBySkillSpeed: true,
  redirect: () => ActionId.LeapingOpo,
});

const earthsRuminationStatus: CombatStatus = createCombatStatus({
  id: StatusId.EarthsRumination,
  duration: 30,
  isHarmful: false,
});

const windsRuminationStatus: CombatStatus = createCombatStatus({
  id: StatusId.WindsRumination,
  duration: 15,
  isHarmful: false,
});

const firesRuminationStatus: CombatStatus = createCombatStatus({
  id: StatusId.FiresRumination,
  duration: 20,
  isHarmful: false,
});

const leapingOpo: CombatAction = createCombatAction({
  id: ActionId.LeapingOpo,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.LeapingOpo, context, { potency: 260, enhancedPotency: 460, isEnhanced: opooposFury(getState()) > 0 }));
    dispatch(removeOpooposFury(1));
    dispatch(setForm(StatusId.RaptorForm, BeastChakra.OpoOpo));
  },
  isGlowing: (state) => hasForm(state, StatusId.OpoopoForm) && opooposFury(state) > 0,
  reducedBySkillSpeed: true,
});

const trueStrike: CombatAction = createCombatAction({
  id: ActionId.TrueStrike,
  execute: () => {},
  reducedBySkillSpeed: true,
  redirect: () => ActionId.RisingRaptor,
});

const risingRaptor: CombatAction = createCombatAction({
  id: ActionId.RisingRaptor,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.RisingRaptor, context, { potency: 340, enhancedPotency: 540, isEnhanced: raptorsFury(getState()) > 0 }));
    dispatch(removeRaptorsFury(1));
    dispatch(setForm(StatusId.CoeurlForm, BeastChakra.Raptor));
  },
  isGlowing: (state) => hasForm(state, StatusId.RaptorForm) && raptorsFury(state) > 0,
  isUsable: (state) => hasForm(state, StatusId.RaptorForm),
  reducedBySkillSpeed: true,
});

const snapPunch: CombatAction = createCombatAction({
  id: ActionId.SnapPunch,
  execute: () => {},
  reducedBySkillSpeed: true,
  redirect: () => ActionId.PouncingCoeurl,
});

const pouncingCoeurl: CombatAction = createCombatAction({
  id: ActionId.PouncingCoeurl,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.PouncingCoeurl, context, {
        potency: 310,
        flankPotency: 370,
        enhancedPotency: 460,
        flankEnhancedPotency: 520,
        isEnhanced: coeurlsFury(getState()) > 0,
      })
    );
    dispatch(removeCoeurlsFury(1));
    dispatch(setForm(StatusId.OpoopoForm, BeastChakra.Couerl));
  },
  isGlowing: (state) => hasForm(state, StatusId.CoeurlForm) && coeurlsFury(state) > 0,
  isUsable: (state) => hasForm(state, StatusId.CoeurlForm),
  reducedBySkillSpeed: true,
});

const dragonKick: CombatAction = createCombatAction({
  id: ActionId.DragonKick,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.DragonKick, context, { potency: 320 }));

    if (hasForm(getState(), StatusId.OpoopoForm)) {
      dispatch(setOpooposFury(1));
    }

    dispatch(setForm(StatusId.RaptorForm, BeastChakra.OpoOpo));
  },
  isGlowing: (state) => hasForm(state, StatusId.OpoopoForm) && opooposFury(state) === 0,
  reducedBySkillSpeed: true,
});

const twinSnakes: CombatAction = createCombatAction({
  id: ActionId.TwinSnakes,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TwinSnakes, context, { potency: 420 }));
    dispatch(setRaptorsFury(1));
    dispatch(setForm(StatusId.CoeurlForm, BeastChakra.Raptor));
  },
  isGlowing: (state) => hasForm(state, StatusId.RaptorForm) && raptorsFury(state) === 0,
  isUsable: (state) => hasForm(state, StatusId.RaptorForm),
  reducedBySkillSpeed: true,
});

const demolish: CombatAction = createCombatAction({
  id: ActionId.Demolish,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Demolish, context, { potency: 360, rearPotency: 420 }));
    dispatch(setCoeurlsFury(2));
    dispatch(setForm(StatusId.OpoopoForm, BeastChakra.Couerl));
  },
  isGlowing: (state) => hasForm(state, StatusId.CoeurlForm) && coeurlsFury(state) === 0,
  isUsable: (state) => hasForm(state, StatusId.CoeurlForm),
  reducedBySkillSpeed: true,
});

const steeledMeditation: CombatAction = createCombatAction({
  id: ActionId.SteeledMeditation,
  execute: () => {},
  redirect: (state) => (chakra(state) >= 5 ? ActionId.TheForbiddenChakra : ActionId.ForbiddenMeditation),
});

const forbiddenMeditation: CombatAction = createCombatAction({
  id: ActionId.ForbiddenMeditation,
  execute: (dispatch, getState) => {
    dispatch(addChakra(inCombat(getState()) ? 1 : 5));
    dispatch(gcd({ time: 1000 }));
  },
  redirect: (state) => (chakra(state) >= 5 ? ActionId.TheForbiddenChakra : ActionId.ForbiddenMeditation),
  entersCombat: false,
  isGcdAction: true,
  actionChangeTo: ActionId.TheForbiddenChakra,
});

const inspiredMeditation: CombatAction = createCombatAction({
  id: ActionId.InspiritedMeditation,
  execute: () => {},
  redirect: (state) => (chakra(state) >= 5 ? ActionId.Enlightenment : ActionId.ForbiddenMeditation),
});

const enlightenedMeditation: CombatAction = createCombatAction({
  id: ActionId.EnlightenedMeditation,
  execute: (dispatch, getState) => {
    dispatch(addChakra(inCombat(getState()) ? 1 : 5));
    dispatch(gcd({ time: 1000 }));
  },
  redirect: (state) => (chakra(state) >= 5 ? ActionId.Enlightenment : ActionId.ForbiddenMeditation),
  entersCombat: false,
  isGcdAction: true,
  actionChangeTo: ActionId.Enlightenment,
});

const formShift: CombatAction = createCombatAction({
  id: ActionId.FormShift,
  execute: (dispatch) => {
    dispatch(setForm(StatusId.FormlessFist));
  },
  entersCombat: false,
  reducedBySkillSpeed: true,
});

const steelPeak: CombatAction = createCombatAction({
  id: ActionId.SteelPeak,
  execute: () => {},
});

const theForbiddenChakra: CombatAction = createCombatAction({
  id: ActionId.TheForbiddenChakra,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TheForbiddenChakra, context, { potency: 400 }));
    dispatch(ogcdLock());
  },
  isUsable: (state) => inCombat(state),
  isGlowing: (state) => inCombat(state),
});

const howlingFist: CombatAction = createCombatAction({
  id: ActionId.HowlingFist,
  execute: () => {},
});

const enlightenment: CombatAction = createCombatAction({
  id: ActionId.Enlightenment,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Enlightenment, context, { potency: 200 }));
    dispatch(ogcdLock());
  },
  isUsable: (state) => inCombat(state) && chakra(state) === 5,
  isGlowing: (state) => inCombat(state) && chakra(state) === 5,
});

const perfectBalance: CombatAction = createCombatAction({
  id: ActionId.PerfectBalance,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(setForm(StatusId.PerfectBalance));
  },
  isUsable: (state) => inCombat(state),
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const masterfulBlitz: CombatAction = createCombatAction({
  id: ActionId.MasterfulBlitz,
  execute: () => {},
  isUsable: () => false,
  redirect: (state) => {
    const beastChakras = beastChakra(state);
    if (beastChakras.length === 3) {
      if (solarNadi(state) && lunarNadi(state)) {
        return ActionId.PhantomRush;
      }

      const types = Object.keys(
        beastChakras.reduce((a, b) => {
          a[b] = true;
          return a;
        }, {} as Record<number, boolean>)
      ).length;

      switch (types) {
        case 1:
          return ActionId.ElixirBurst;
        case 2:
          return ActionId.CelestialRevolution;
        case 3:
          return ActionId.RisingPhoenix;
      }
    }

    return ActionId.MasterfulBlitz;
  },
  reducedBySkillSpeed: true,
});

const elixirField: CombatAction = createCombatAction({
  id: ActionId.ElixirField,
  execute: () => {},
  isGlowing: () => true,
  reducedBySkillSpeed: true,
  redirect: () => ActionId.ElixirBurst,
});

const elixirBurst: CombatAction = createCombatAction({
  id: ActionId.ElixirBurst,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ElixirField, context, { potency: 900 }));
    dispatch(setBeastChakra(0));
    dispatch(setLunarNadi(1));
    dispatch(setForm(StatusId.FormlessFist));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const risingPhoenix: CombatAction = createCombatAction({
  id: ActionId.RisingPhoenix,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RisingPhoenix, context, { potency: 900 }));
    dispatch(setBeastChakra(0));
    dispatch(setSolarNadi(1));
    dispatch(setForm(StatusId.FormlessFist));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const celestialRevolution: CombatAction = createCombatAction({
  id: ActionId.CelestialRevolution,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.CelestialRevolution, context, { potency: 600 }));
    dispatch(setBeastChakra(0));
    if (lunarNadi(getState())) {
      dispatch(setSolarNadi(1));
    } else {
      dispatch(setLunarNadi(1));
    }
    dispatch(setForm(StatusId.FormlessFist));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const phantomRush: CombatAction = createCombatAction({
  id: ActionId.PhantomRush,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.PhantomRush, context, { potency: 1500 }));
    dispatch(setBeastChakra(0));
    dispatch(setSolarNadi(0));
    dispatch(setLunarNadi(0));
    dispatch(setForm(StatusId.FormlessFist));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const flintStrike: CombatAction = createCombatAction({
  id: ActionId.FlintStrike,
  execute: () => {},
  reducedBySkillSpeed: true,
});

const tornadoKick: CombatAction = createCombatAction({
  id: ActionId.TornadoKick,
  execute: () => {},
  reducedBySkillSpeed: true,
});

const thunderclap: CombatAction = createCombatAction({
  id: ActionId.Thunderclap,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
});

const mantra: CombatAction = createCombatAction({
  id: ActionId.Mantra,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Mantra));
  },
  entersCombat: false,
});

const riddleOfFire: CombatAction = createCombatAction({
  id: ActionId.RiddleofFire,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RiddleofFire));
    dispatch(buff(StatusId.FiresRumination));
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.FiresRumination) ? ActionId.FiresReply : ActionId.RiddleofFire),
  actionChangeTo: ActionId.FiresReply,
});

const firesReply: CombatAction = createCombatAction({
  id: ActionId.FiresReply,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FiresReply, context, { potency: 1200 }));
    dispatch(removeBuff(StatusId.FiresRumination));
  },
  isUsable: (state) => hasBuff(state, StatusId.FiresRumination),
  isGlowing: (state) => hasBuff(state, StatusId.FiresRumination),
  reducedBySkillSpeed: true,
});

const riddleOfWind: CombatAction = createCombatAction({
  id: ActionId.RiddleofWind,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RiddleofWind));
    dispatch(buff(StatusId.WindsRumination));
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.WindsRumination) ? ActionId.WindsReply : ActionId.RiddleofWind),
  actionChangeTo: ActionId.WindsReply,
});

const windsReply: CombatAction = createCombatAction({
  id: ActionId.WindsReply,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.WindsReply, context, { potency: 900 }));
    dispatch(removeBuff(StatusId.WindsRumination));
  },
  isUsable: (state) => hasBuff(state, StatusId.WindsRumination),
  isGlowing: (state) => hasBuff(state, StatusId.WindsRumination),
  reducedBySkillSpeed: true,
});

const riddleOfEarth: CombatAction = createCombatAction({
  id: ActionId.RiddleofEarth,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RiddleofEarth));
    dispatch(buff(StatusId.EarthsRumination));
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.EarthsRumination) ? ActionId.EarthsReply : ActionId.RiddleofEarth),
  actionChangeTo: ActionId.EarthsReply,
});

const earthsReply: CombatAction = createCombatAction({
  id: ActionId.EarthsReply,
  execute: (dispatch) => {
    dispatch(event(ActionId.EarthsReply, { healthPotency: 300 }));
    dispatch(removeBuff(StatusId.EarthsRumination));
  },
  isUsable: (state) => hasBuff(state, StatusId.EarthsRumination),
  isGlowing: (state) => hasBuff(state, StatusId.EarthsRumination),
  reducedBySkillSpeed: true,
});

const brotherhood: CombatAction = createCombatAction({
  id: ActionId.Brotherhood,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Brotherhood));
    dispatch(buff(StatusId.MeditativeBrotherhood));
  },
  entersCombat: false,
});

const sixsidedStar: CombatAction = createCombatAction({
  id: ActionId.SixsidedStar,
  execute: (dispatch, getState, context) => {
    const chakraCount = chakra(getState());
    dispatch(setChakra(0));

    dispatch(dmgEvent(ActionId.SixsidedStar, context, { potency: 780 + chakraCount * 80 }));
    dispatch(buff(StatusId.SixsidedStar));
  },
  reducedBySkillSpeed: true,
});

const armOfTheDestroyer: CombatAction = createCombatAction({
  id: ActionId.ArmoftheDestroyer,
  execute: () => {},
  redirect: () => ActionId.ShadowoftheDestroyer,
  reducedBySkillSpeed: true,
});

const shadowOfTheDestroyer: CombatAction = createCombatAction({
  id: ActionId.ShadowoftheDestroyer,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ShadowoftheDestroyer, context, { potency: 120 }));
    dispatch(setForm(StatusId.RaptorForm, BeastChakra.OpoOpo));
  },
  reducedBySkillSpeed: true,
});

const fourPointFury: CombatAction = createCombatAction({
  id: ActionId.FourpointFury,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FourpointFury, context, { potency: 140 }));
    dispatch(setForm(StatusId.CoeurlForm, BeastChakra.Raptor));
  },
  isGlowing: (state) => hasForm(state, StatusId.RaptorForm),
  isUsable: (state) => hasForm(state, StatusId.RaptorForm),
  reducedBySkillSpeed: true,
});

const rockbreaker: CombatAction = createCombatAction({
  id: ActionId.Rockbreaker,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Rockbreaker, context, { potency: 150 }));
    dispatch(setForm(StatusId.OpoopoForm, BeastChakra.Couerl));
  },
  isGlowing: (state) => hasForm(state, StatusId.CoeurlForm),
  isUsable: (state) => hasForm(state, StatusId.CoeurlForm),
  reducedBySkillSpeed: true,
});

export const mnkStatuses = [
  perfectBalanceStatus,
  formlessFistStatus,
  raptorFormStatus,
  coeurlFormStatus,
  opoopoFormStatus,
  brotherhoodStatus,
  meditativeBrotherhoodStatus,
  sixsidedStarStatus,
  riddleOfFireStatus,
  riddleOfWindStatus,
  riddleOfEarthStatus,
  mantraStatus,
  leadenFistStatus,
  earthsRuminationStatus,
  firesRuminationStatus,
  windsRuminationStatus,
];

export const mnk: CombatAction[] = [
  bootshine,
  trueStrike,
  snapPunch,
  dragonKick,
  twinSnakes,
  demolish,
  forbiddenMeditation,
  formShift,
  steelPeak,
  theForbiddenChakra,
  howlingFist,
  enlightenment,
  perfectBalance,
  masterfulBlitz,
  risingPhoenix,
  elixirField,
  celestialRevolution,
  phantomRush,
  flintStrike,
  tornadoKick,
  mantra,
  riddleOfEarth,
  riddleOfFire,
  riddleOfWind,
  brotherhood,
  sixsidedStar,
  thunderclap,
  armOfTheDestroyer,
  shadowOfTheDestroyer,
  fourPointFury,
  rockbreaker,
  leapingOpo,
  risingRaptor,
  pouncingCoeurl,
  elixirBurst,
  steeledMeditation,
  inspiredMeditation,
  enlightenedMeditation,
  earthsReply,
  windsReply,
  firesReply,
];

export const mnkEpics = combineEpics(procChakraEpic, brotherhoodChakraEpic);
