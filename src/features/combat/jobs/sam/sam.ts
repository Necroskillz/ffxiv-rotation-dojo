import { combineEpics, Epic } from 'redux-observable';
import { filter, first, interval, map, of, switchMap, takeUntil, takeWhile, withLatestFrom } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import {
  addBuff,
  addKenki,
  addMeditation,
  buff,
  combo,
  debuff,
  executeAction,
  gcd,
  hasBuff,
  hasCombo,
  inCombat,
  ogcdLock,
  removeBuff,
  removeBuffStack,
  resource,
  setSen,
} from '../../combatSlice';

function kenki(state: RootState) {
  return resource(state, 'kenki');
}

function sen(state: RootState) {
  return resource(state, 'sen');
}

function meditation(state: RootState) {
  return resource(state, 'meditation');
}

const senMap: Record<number, number> = {
  [ActionId.Yukikaze]: 1,
  [ActionId.Mangetsu]: 10,
  [ActionId.Gekko]: 10,
  [ActionId.Oka]: 100,
  [ActionId.Kasha]: 100,
};

function senCount(state: RootState) {
  let value = sen(state);
  let count = 0;

  while (value !== 0) {
    if (value % 10 === 1) {
      count++;
    }

    value = Math.floor(value / 10);
  }

  return count;
}

export const addSen =
  (actionId: number): AppThunk =>
  (dispatch, getState) => {
    const current = sen(getState());
    const value = senMap[actionId];

    if (current % (value * 10) < value) {
      dispatch(setSen(current + value));
    }
  };

const consumeMeikyoEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.MeikyoShisui),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            getActionById(aa.payload.id).type === 'Weaponskill' &&
            ![
              ActionId.OgiNamikiri,
              ActionId.Higanbana,
              ActionId.MidareSetsugekka,
              ActionId.TenkaGoken,
              ActionId.KaeshiNamikiri,
              ActionId.KaeshiHiganbana,
              ActionId.KaeshiSetsugekka,
              ActionId.KaeshiGoken,
              ActionId.Enpi,
            ].includes(aa.payload.id)
        ),
        takeUntil(action$.pipe(first((a) => a.type === removeBuff.type && a.payload === a.payload.id)))
      )
    ),
    map(() => removeBuffStack(StatusId.MeikyoShisui))
  );

const removeKaeshiEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        a.type === executeAction.type &&
        getActionById(a.payload.id).type === 'Weaponskill' &&
        ![ActionId.Higanbana, ActionId.MidareSetsugekka, ActionId.TenkaGoken].includes(a.payload.id)
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      if (hasBuff(state, StatusId.KaeshiHigenbanaActive)) {
        return of(removeBuff(StatusId.KaeshiHigenbanaActive));
      }

      if (hasBuff(state, StatusId.KaeshiGokenActive)) {
        return of(removeBuff(StatusId.KaeshiGokenActive));
      }

      if (hasBuff(state, StatusId.KaeshiSetsugekkaActive)) {
        return of(removeBuff(StatusId.KaeshiSetsugekkaActive));
      }

      return of();
    })
  );

const removeKaeshiNamikiriEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Weaponskill' && a.payload.id !== ActionId.OgiNamikiri
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      if (hasBuff(state, StatusId.KaeshiNamikiriActive)) {
        return of(removeBuff(StatusId.KaeshiNamikiriActive));
      }

      return of();
    })
  );

const meditateEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Meditate),
    switchMap((a) =>
      interval(3000).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id) && inCombat(state)),
        takeUntil(action$.pipe(first((aa) => aa.type === executeAction.type && aa.payload.id !== ActionId.Meditate))),
        switchMap(() => of(addKenki(10), addMeditation(1)))
      )
    )
  );

const meditateStopEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Meditate),
    switchMap(() => action$.pipe(first((aa) => aa.type === executeAction.type && aa.payload.id !== ActionId.Meditate))),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const actions: any[] = [];

      if (hasBuff(state, StatusId.Meditate)) {
        actions.push(removeBuff(StatusId.Meditate));
      }

      return of(...actions);
    })
  );

const hakaze: CombatAction = createCombatAction({
  id: ActionId.Hakaze,
  execute: (dispatch) => {
    dispatch(combo(ActionId.Hakaze));

    dispatch(addKenki(5));
  },
  reducedBySkillSpeed: true,
});

const shifu: CombatAction = createCombatAction({
  id: ActionId.Shifu,
  execute: (dispatch, getState, context) => {
    if (context.comboed || hasBuff(getState(), StatusId.MeikyoShisui)) {
      dispatch(combo(ActionId.Shifu));
      dispatch(addKenki(5));
      dispatch(buff(StatusId.Fuka, 40));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Shifu) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
});

const kasha: CombatAction = createCombatAction({
  id: ActionId.Kasha,
  execute: (dispatch, getState, context) => {
    const meikyo = hasBuff(getState(), StatusId.MeikyoShisui);

    if (context.comboed || meikyo) {
      dispatch(addKenki(10));
      dispatch(addSen(ActionId.Kasha));
    }

    if (meikyo) {
      dispatch(buff(StatusId.Fuka, 40));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Kasha) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
});

const jinpu: CombatAction = createCombatAction({
  id: ActionId.Jinpu,
  execute: (dispatch, getState, context) => {
    if (context.comboed || hasBuff(getState(), StatusId.MeikyoShisui)) {
      dispatch(combo(ActionId.Jinpu));
      dispatch(addKenki(5));
      dispatch(buff(StatusId.Fugetsu, 40));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Jinpu) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
});

const gekko: CombatAction = createCombatAction({
  id: ActionId.Gekko,
  execute: (dispatch, getState, context) => {
    const meikyo = hasBuff(getState(), StatusId.MeikyoShisui);

    if (context.comboed || meikyo) {
      dispatch(addKenki(10));
      dispatch(addSen(ActionId.Gekko));
    }

    if (meikyo) {
      dispatch(buff(StatusId.Fugetsu, 40));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Gekko) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
});

const yukikaze: CombatAction = createCombatAction({
  id: ActionId.Yukikaze,
  execute: (dispatch, getState, context) => {
    if (context.comboed || hasBuff(getState(), StatusId.MeikyoShisui)) {
      dispatch(addKenki(15));
      dispatch(addSen(ActionId.Yukikaze));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Yukikaze) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
});

const iaijutsu: CombatAction = createCombatAction({
  id: ActionId.Iaijutsu,
  execute: () => {},
  redirect: (state) => {
    const sen = senCount(state);

    switch (sen) {
      case 1:
        return ActionId.Higanbana;
      case 2:
        return ActionId.TenkaGoken;
      case 3:
        return ActionId.MidareSetsugekka;
    }

    return ActionId.Iaijutsu;
  },
  isUsable: () => false,
  castTime: () => 1.3,
  reducedBySkillSpeed: false,
});

const higenbana: CombatAction = createCombatAction({
  id: ActionId.Higanbana,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Higanbana, 60));
    dispatch(setSen(0));
    dispatch(addMeditation(1));
    dispatch(buff(StatusId.KaeshiHigenbanaActive, 30, { isVisible: false }));
  },
  reducedBySkillSpeed: true,
  castTime: () => 1.3,
});

const tenkaGoken: CombatAction = createCombatAction({
  id: ActionId.TenkaGoken,
  execute: (dispatch) => {
    dispatch(setSen(0));
    dispatch(addMeditation(1));
    dispatch(buff(StatusId.KaeshiGokenActive, 30, { isVisible: false }));
  },
  reducedBySkillSpeed: true,
  castTime: () => 1.3,
});

const midareSetsugekka: CombatAction = createCombatAction({
  id: ActionId.MidareSetsugekka,
  execute: (dispatch) => {
    dispatch(setSen(0));
    dispatch(addMeditation(1));
    dispatch(buff(StatusId.KaeshiSetsugekkaActive, 30, { isVisible: false }));
  },
  reducedBySkillSpeed: true,
  castTime: () => 1.3,
});

const meikyoShisui: CombatAction = createCombatAction({
  id: ActionId.MeikyoShisui,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.MeikyoShisui, 15, { stacks: 3 }));
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
  entersCombat: false,
});

const tsubamegaeshi: CombatAction = createCombatAction({
  id: ActionId.Tsubamegaeshi,
  execute: () => {},
  redirect: (state) => {
    if (hasBuff(state, StatusId.KaeshiHigenbanaActive)) {
      return ActionId.KaeshiHiganbana;
    }

    if (hasBuff(state, StatusId.KaeshiGokenActive)) {
      return ActionId.KaeshiGoken;
    }

    if (hasBuff(state, StatusId.KaeshiSetsugekkaActive)) {
      return ActionId.KaeshiSetsugekka;
    }

    return ActionId.Tsubamegaeshi;
  },
  isUsable: () => false,
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
  reducedBySkillSpeed: false,
});

const kaeshiHigenbana: CombatAction = createCombatAction({
  id: ActionId.KaeshiHiganbana,
  execute: (dispatch) => {
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(debuff(StatusId.Higanbana, 60));
    dispatch(removeBuff(StatusId.KaeshiHigenbanaActive));
  },
  reducedBySkillSpeed: true,
  isGlowing: () => true,
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
  isGcdAction: true,
});

const kaeshiGoken: CombatAction = createCombatAction({
  id: ActionId.KaeshiGoken,
  execute: (dispatch) => {
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(removeBuff(StatusId.KaeshiGokenActive));
  },
  reducedBySkillSpeed: true,
  isGlowing: () => true,
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
  isGcdAction: true,
});

const kaeshiSetsugekka: CombatAction = createCombatAction({
  id: ActionId.KaeshiSetsugekka,
  execute: (dispatch) => {
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(removeBuff(StatusId.KaeshiSetsugekkaActive));
  },
  reducedBySkillSpeed: true,
  isGlowing: () => true,
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
  isGcdAction: true,
});

const shoha: CombatAction = createCombatAction({
  id: ActionId.Shoha,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => meditation(state) === 3,
  isGlowing: (state) => meditation(state) === 3,
});

const ikishoten: CombatAction = createCombatAction({
  id: ActionId.Ikishoten,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(addKenki(50));
    dispatch(buff(StatusId.OgiNamikiriReady, 30));
  },
  isUsable: (state) => inCombat(state),
});

const hissatsuShinten: CombatAction = createCombatAction({
  id: ActionId.HissatsuShinten,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 25,
});

const hissatsuGyoten: CombatAction = createCombatAction({
  id: ActionId.HissatsuGyoten,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 10,
});

const hissatsuYaten: CombatAction = createCombatAction({
  id: ActionId.HissatsuYaten,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.EnhancedEnpi, 15));
  },
  isGlowing: (state) => kenki(state) >= 10,
});

const hissatsuSenei: CombatAction = createCombatAction({
  id: ActionId.HissatsuSenei,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 25,
});

const ogiNamikiri: CombatAction = createCombatAction({
  id: ActionId.OgiNamikiri,
  execute: (dispatch) => {
    dispatch(addMeditation(1));
    dispatch(buff(StatusId.KaeshiNamikiriActive, 30, { isVisible: false }));
    dispatch(removeBuff(StatusId.OgiNamikiriReady));
  },
  redirect: (state) => (hasBuff(state, StatusId.KaeshiNamikiriActive) ? ActionId.KaeshiNamikiri : ActionId.OgiNamikiri),
  isUsable: (state) => hasBuff(state, StatusId.OgiNamikiriReady),
  isGlowing: (state) => hasBuff(state, StatusId.OgiNamikiriReady),
  castTime: () => 1.3,
  reducedBySkillSpeed: true,
});

const kaeshiNamikiri: CombatAction = createCombatAction({
  id: ActionId.KaeshiNamikiri,
  execute: (dispatch) => {
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(removeBuff(StatusId.KaeshiNamikiriActive));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
  isGcdAction: true,
});

const enpi: CombatAction = createCombatAction({
  id: ActionId.Enpi,
  execute: (dispatch) => {
    dispatch(addKenki(5));
    dispatch(removeBuff(StatusId.EnhancedEnpi));
  },
  isGlowing: (state) => hasBuff(state, StatusId.EnhancedEnpi),
  reducedBySkillSpeed: true,
});

const meditate: CombatAction = createCombatAction({
  id: ActionId.Meditate,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(buff(StatusId.Meditate, 15));
  },
  entersCombat: false,
});

const hagakure: CombatAction = createCombatAction({
  id: ActionId.Hagakure,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());
    dispatch(addKenki(senCount(getState()) * 10));
    dispatch(setSen(0));
  },
  isUsable: (state) => senCount(state) > 0,
});

const thirdEye: CombatAction = createCombatAction({
  id: ActionId.ThirdEye,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ThirdEye, 4));
  },
});

const fuga: CombatAction = createCombatAction({
  id: ActionId.Fuga,
  execute: () => {},
  redirect: () => ActionId.Fuko,
  reducedBySkillSpeed: true,
});

const fuko: CombatAction = createCombatAction({
  id: ActionId.Fuko,
  execute: (dispatch) => {
    dispatch(combo(ActionId.Fuga));

    dispatch(addKenki(5));
  },
  reducedBySkillSpeed: true,
});

const oka: CombatAction = createCombatAction({
  id: ActionId.Oka,
  execute: (dispatch, getState, context) => {
    const meikyo = hasBuff(getState(), StatusId.MeikyoShisui);

    if (context.comboed || meikyo) {
      dispatch(addKenki(10));
      dispatch(addSen(ActionId.Oka));
      dispatch(buff(StatusId.Fuka, 40));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Oka) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
});

const mangetsu: CombatAction = createCombatAction({
  id: ActionId.Mangetsu,
  execute: (dispatch, getState, context) => {
    const meikyo = hasBuff(getState(), StatusId.MeikyoShisui);

    if (context.comboed || meikyo) {
      dispatch(addKenki(10));
      dispatch(addSen(ActionId.Mangetsu));
      dispatch(buff(StatusId.Fugetsu, 40));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Mangetsu) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
});

const hissatsuKyuten: CombatAction = createCombatAction({
  id: ActionId.HissatsuKyuten,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 25,
});

const hissatsuGuren: CombatAction = createCombatAction({
  id: ActionId.HissatsuGuren,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 25,
});

const shoha2: CombatAction = createCombatAction({
  id: ActionId.ShohaII,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => meditation(state) === 3,
  isGlowing: (state) => meditation(state) === 3,
});

export const sam: CombatAction[] = [
  hakaze,
  shifu,
  kasha,
  jinpu,
  gekko,
  yukikaze,
  iaijutsu,
  higenbana,
  tenkaGoken,
  midareSetsugekka,
  meikyoShisui,
  tsubamegaeshi,
  kaeshiHigenbana,
  kaeshiGoken,
  kaeshiSetsugekka,
  shoha,
  ikishoten,
  hissatsuShinten,
  hissatsuGyoten,
  hissatsuYaten,
  hissatsuSenei,
  ogiNamikiri,
  kaeshiNamikiri,
  enpi,
  meditate,
  hagakure,
  thirdEye,
  fuga,
  fuko,
  oka,
  mangetsu,
  hissatsuKyuten,
  hissatsuGuren,
  shoha2,
];

export const samEpics = combineEpics(consumeMeikyoEpic, removeKaeshiEpic, removeKaeshiNamikiriEpic, meditateEpic, meditateStopEpic);
