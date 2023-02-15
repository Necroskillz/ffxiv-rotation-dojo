import { combineEpics, Epic } from 'redux-observable';
import { filter, first, interval, map, of, switchMap, takeUntil, takeWhile, withLatestFrom } from 'rxjs';
import { AppThunk, ReducerAction, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import {
  addBuff,
  addChakra,
  buff,
  debuff,
  executeAction,
  gcd,
  hasBuff,
  inCombat,
  ogcdLock,
  removeBuff,
  removeBuffStack,
  resource,
  selectBeastChakra,
  setBeastChakra,
  setLunarNadi,
  setSolarNadi,
  StatusState,
} from '../../combatSlice';
import { rng } from '../../utils';

function chakra(state: RootState) {
  return resource(state, 'chakra');
}

function solarNadi(state: RootState) {
  return resource(state, 'solarNadi');
}

function lunarNadi(state: RootState) {
  return resource(state, 'lunarNadi');
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
    filter((a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Weaponskill'),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const actions = [];

      if (hasBuff(state, StatusId.MeditativeBrotherhood)) {
        actions.push(addChakra(1));
      }

      if (rng(27)) {
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

const anatmanEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Anatman),
    switchMap((a) =>
      interval(100).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id)),
        takeUntil(action$.pipe(first((aa) => aa.type === executeAction.type && aa.payload.id !== ActionId.Anatman))),
        switchMap((state) => {
          const actions = [];

          if (hasBuff(state, StatusId.DisciplinedFist)) {
            actions.push(buff(StatusId.DisciplinedFist, 15));
          }

          if (hasBuff(state, StatusId.OpoopoForm)) {
            actions.push(buff(StatusId.OpoopoForm, 30));
          }

          if (hasBuff(state, StatusId.RaptorForm)) {
            actions.push(buff(StatusId.RaptorForm, 30));
          }

          if (hasBuff(state, StatusId.CoeurlForm)) {
            actions.push(buff(StatusId.CoeurlForm, 30));
          }

          return of(...actions);
        })
      )
    )
  );

const anatmapStopEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Anatman),
    switchMap(() =>
      action$.pipe(
        first(
          (aa) =>
            (aa.type === executeAction.type && aa.payload.id !== ActionId.Anatman) ||
            (aa.type === removeBuff.type && aa.payload === StatusId.Anatman)
        )
      )
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const actions: any[] = [];

      if (hasBuff(state, StatusId.Anatman)) {
        actions.push(removeBuff(StatusId.Anatman));
      }

      return of(...actions);
    })
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
        dispatch(buff(StatusId.PerfectBalance, 20, { stacks: 3 }));
      } else {
        dispatch(buff(StatusId.FormlessFist, 30));
      }
    } else {
      if (hasBuff(getState(), StatusId.PerfectBalance)) {
        dispatch(removeBuffStack(StatusId.PerfectBalance));
        dispatch(addBeastChakra(chakra!));
      } else {
        clear();

        dispatch(buff(form, 30));
      }
    }
  };

const bootshine: CombatAction = createCombatAction({
  id: ActionId.Bootshine,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.LeadenFist));
    dispatch(setForm(StatusId.RaptorForm, BeastChakra.OpoOpo));
  },
  isGlowing: (state) => hasForm(state, StatusId.OpoopoForm),
  reducedBySkillSpeed: true,
});

const trueStrike: CombatAction = createCombatAction({
  id: ActionId.TrueStrike,
  execute: (dispatch) => {
    dispatch(setForm(StatusId.CoeurlForm, BeastChakra.Raptor));
  },
  isGlowing: (state) => hasForm(state, StatusId.RaptorForm),
  isUsable: (state) => hasForm(state, StatusId.RaptorForm),
  reducedBySkillSpeed: true,
});

const snapPunch: CombatAction = createCombatAction({
  id: ActionId.SnapPunch,
  execute: (dispatch) => {
    dispatch(setForm(StatusId.OpoopoForm, BeastChakra.Couerl));
  },
  isGlowing: (state) => hasForm(state, StatusId.CoeurlForm),
  isUsable: (state) => hasForm(state, StatusId.CoeurlForm),
  reducedBySkillSpeed: true,
});

const dragonKick: CombatAction = createCombatAction({
  id: ActionId.DragonKick,
  execute: (dispatch, getState) => {
    if (hasForm(getState(), StatusId.OpoopoForm)) {
      dispatch(buff(StatusId.LeadenFist, 30));
    }

    dispatch(setForm(StatusId.RaptorForm, BeastChakra.OpoOpo));
  },
  isGlowing: (state) => hasForm(state, StatusId.OpoopoForm),
  reducedBySkillSpeed: true,
});

const twinSnakes: CombatAction = createCombatAction({
  id: ActionId.TwinSnakes,
  execute: (dispatch) => {
    dispatch(buff(StatusId.DisciplinedFist, 15));
    dispatch(setForm(StatusId.CoeurlForm, BeastChakra.Raptor));
  },
  isGlowing: (state) => hasForm(state, StatusId.RaptorForm),
  isUsable: (state) => hasForm(state, StatusId.RaptorForm),
  reducedBySkillSpeed: true,
});

const demolish: CombatAction = createCombatAction({
  id: ActionId.Demolish,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Demolish, 18));
    dispatch(setForm(StatusId.OpoopoForm, BeastChakra.Couerl));
  },
  isGlowing: (state) => hasForm(state, StatusId.CoeurlForm),
  isUsable: (state) => hasForm(state, StatusId.CoeurlForm),
  reducedBySkillSpeed: true,
});

const meditation: CombatAction = createCombatAction({
  id: ActionId.Meditation,
  execute: (dispatch, getState) => {
    dispatch(addChakra(inCombat(getState()) ? 1 : 5));
    dispatch(gcd({ time: 1000 }));
  },
  redirect: (state) => (chakra(state) === 5 ? ActionId.TheForbiddenChakra : ActionId.Meditation),
  entersCombat: false,
  isGcdAction: true,
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
  execute: (dispatch) => {
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
  execute: (dispatch) => {
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
          return ActionId.ElixirField;
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
  execute: (dispatch) => {
    dispatch(setBeastChakra(0));
    dispatch(setLunarNadi(1));
    dispatch(setForm(StatusId.FormlessFist));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const risingPhoenix: CombatAction = createCombatAction({
  id: ActionId.RisingPhoenix,
  execute: (dispatch) => {
    dispatch(setBeastChakra(0));
    dispatch(setSolarNadi(1));
    dispatch(setForm(StatusId.FormlessFist));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const celestialRevolution: CombatAction = createCombatAction({
  id: ActionId.CelestialRevolution,
  execute: (dispatch, getState) => {
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
  execute: (dispatch) => {
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
    dispatch(buff(StatusId.Mantra, 15));
  },
  entersCombat: false,
});

const riddleOfFire: CombatAction = createCombatAction({
  id: ActionId.RiddleofFire,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RiddleofFire, 20));
  },
  entersCombat: false,
});

const riddleOfWind: CombatAction = createCombatAction({
  id: ActionId.RiddleofWind,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RiddleofWind, 15));
  },
  entersCombat: false,
});

const riddleOfEarth: CombatAction = createCombatAction({
  id: ActionId.RiddleofEarth,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RiddleofEarth, 15));
  },
  entersCombat: false,
});

const brotherhood: CombatAction = createCombatAction({
  id: ActionId.Brotherhood,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Brotherhood, 15));
    dispatch(buff(StatusId.MeditativeBrotherhood, 15));
  },
  entersCombat: false,
});

const sixsidedStar: CombatAction = createCombatAction({
  id: ActionId.SixsidedStar,
  execute: (dispatch) => {
    dispatch(buff(StatusId.SixsidedStar, 5));
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
  execute: (dispatch) => {
    dispatch(setForm(StatusId.RaptorForm, BeastChakra.OpoOpo));
  },
  reducedBySkillSpeed: true,
});

const fourPointFury: CombatAction = createCombatAction({
  id: ActionId.FourpointFury,
  execute: (dispatch) => {
    dispatch(buff(StatusId.DisciplinedFist, 15));
    dispatch(setForm(StatusId.CoeurlForm, BeastChakra.Raptor));
  },
  isGlowing: (state) => hasForm(state, StatusId.RaptorForm),
  isUsable: (state) => hasForm(state, StatusId.RaptorForm),
  reducedBySkillSpeed: true,
});

const rockbreaker: CombatAction = createCombatAction({
  id: ActionId.Rockbreaker,
  execute: (dispatch) => {
    dispatch(setForm(StatusId.OpoopoForm, BeastChakra.Couerl));
  },
  isGlowing: (state) => hasForm(state, StatusId.CoeurlForm),
  isUsable: (state) => hasForm(state, StatusId.CoeurlForm),
  reducedBySkillSpeed: true,
});

const anatman: CombatAction = createCombatAction({
  id: ActionId.Anatman,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Anatman, 30));
  },
  entersCombat: false,
});

export const mnk: CombatAction[] = [
  bootshine,
  trueStrike,
  snapPunch,
  dragonKick,
  twinSnakes,
  demolish,
  meditation,
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
  anatman,
];

export const mnkEpics = combineEpics(procChakraEpic, brotherhoodChakraEpic, anatmanEpic, anatmapStopEpic);
