import { combineEpics, Epic } from 'redux-observable';
import { delay, filter, first, interval, map, of, switchMap, takeUntil, takeWhile, withLatestFrom } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  addBuff,
  addKenki,
  addMeditation,
  buff,
  combo,
  debuff,
  dmgEvent,
  event,
  executeAction,
  gcd,
  hasBuff,
  hasCombo,
  inCombat,
  ogcdLock,
  removeBuff,
  removeBuffAction,
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
              ActionId.KaeshiSetsugekka,
              ActionId.KaeshiGoken,
              ActionId.Enpi,
            ].includes(aa.payload.id)
        ),
        takeUntil(action$.pipe(first((a) => a.type === removeBuffAction.type && a.payload === a.payload.id)))
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
        ![ActionId.MidareSetsugekka, ActionId.TenkaGoken, ActionId.TendoSetsugekka, ActionId.TendoGoken].includes(a.payload.id)
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      if (hasBuff(state, StatusId.KaeshiGokenActive)) {
        return of(removeBuff(StatusId.KaeshiGokenActive));
      }

      if (hasBuff(state, StatusId.KaeshiSetsugekkaActive)) {
        return of(removeBuff(StatusId.KaeshiSetsugekkaActive));
      }

      if (hasBuff(state, StatusId.KaeshiTendoGokenActive)) {
        return of(removeBuff(StatusId.KaeshiTendoGokenActive));
      }

      if (hasBuff(state, StatusId.KaeshiTendoSetsugekkaActive)) {
        return of(removeBuff(StatusId.KaeshiTendoSetsugekkaActive));
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

const popTengetsuEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Tengetsu),
    delay(3000),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => inCombat(state)),
    switchMap(() => of(removeBuff(StatusId.Tengetsu), buff(StatusId.TengetsusForesight), addKenki(10)))
  );

const fukaStatus: CombatStatus = createCombatStatus({
  id: StatusId.Fuka,
  duration: 40,
  isHarmful: false,
});

const fugetsuStatus: CombatStatus = createCombatStatus({
  id: StatusId.Fugetsu,
  duration: 40,
  isHarmful: false,
});

const higenbanaStatus: CombatStatus = createCombatStatus({
  id: StatusId.Higanbana,
  duration: 60,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 50 })),
});

const kaeshiGokenActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.KaeshiGokenActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const kaeshiSetsugekkaActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.KaeshiSetsugekkaActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const kaeshiTendoGokenActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.KaeshiTendoGokenActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const kaeshiTendoSetsugekkaActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.KaeshiTendoSetsugekkaActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const meikyoShisuiStatus: CombatStatus = createCombatStatus({
  id: StatusId.MeikyoShisui,
  duration: 20,
  isHarmful: false,
  initialStacks: 3,
});

const ogiNamikiriReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.OgiNamikiriReady,
  duration: 30,
  isHarmful: false,
});

const enhancedEnpiStatus: CombatStatus = createCombatStatus({
  id: StatusId.EnhancedEnpi,
  duration: 15,
  isHarmful: false,
});

const kaeshiNamikiriActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.KaeshiNamikiriActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const meditateStatus: CombatStatus = createCombatStatus({
  id: StatusId.Meditate,
  duration: 15,
  isHarmful: false,
});

const tengetsuStatus: CombatStatus = createCombatStatus({
  id: StatusId.Tengetsu,
  duration: 4,
  isHarmful: false,
});

const tengetsusForesightStatus: CombatStatus = createCombatStatus({
  id: StatusId.TengetsusForesight,
  duration: 8,
  isHarmful: false,
  onExpire: (dispatch) => {
    dispatch(event(0, { healthPotency: 500 }));
  },
});

const zanshinReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.ZanshinReady,
  duration: 30,
  isHarmful: false,
});

const tendoStatus: CombatStatus = createCombatStatus({
  id: StatusId.Tendo,
  duration: 30,
  isHarmful: false,
});

const tsubamegaeshiReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.TsubamegaeshiReady,
  duration: 30,
  isHarmful: false,
});

const hakaze: CombatAction = createCombatAction({
  id: ActionId.Hakaze,
  execute: () => {},
  reducedBySkillSpeed: true,
  redirect: () => ActionId.Gyofu,
});

const gyofu: CombatAction = createCombatAction({
  id: ActionId.Gyofu,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Gyofu, context, { potency: 240 }));

    dispatch(combo(ActionId.Hakaze));
    dispatch(addKenki(5));
  },
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const shifu: CombatAction = createCombatAction({
  id: ActionId.Shifu,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Shifu, context, { potency: 160, comboPotency: 320 }));

    if (context.comboed || hasBuff(getState(), StatusId.MeikyoShisui)) {
      dispatch(combo(ActionId.Shifu));
      dispatch(addKenki(5));
      dispatch(buff(StatusId.Fuka));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Shifu) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const kasha: CombatAction = createCombatAction({
  id: ActionId.Kasha,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Kasha, context, { potency: 180, flankPotency: 230, comboPotency: 390, flankComboPotency: 440 }));

    const meikyo = hasBuff(getState(), StatusId.MeikyoShisui);

    if (context.comboed || meikyo) {
      dispatch(addKenki(10));
      dispatch(addSen(ActionId.Kasha));
    }

    if (meikyo) {
      dispatch(buff(StatusId.Fuka));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Kasha) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const jinpu: CombatAction = createCombatAction({
  id: ActionId.Jinpu,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Jinpu, context, { potency: 160, comboPotency: 320 }));

    if (context.comboed || hasBuff(getState(), StatusId.MeikyoShisui)) {
      dispatch(combo(ActionId.Jinpu));
      dispatch(addKenki(5));
      dispatch(buff(StatusId.Fugetsu));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Jinpu) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const gekko: CombatAction = createCombatAction({
  id: ActionId.Gekko,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Gekko, context, { potency: 180, rearPotency: 230, comboPotency: 390, rearComboPotency: 440 }));

    const meikyo = hasBuff(getState(), StatusId.MeikyoShisui);

    if (context.comboed || meikyo) {
      dispatch(addKenki(10));
      dispatch(addSen(ActionId.Gekko));
    }

    if (meikyo) {
      dispatch(buff(StatusId.Fugetsu));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Gekko) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const yukikaze: CombatAction = createCombatAction({
  id: ActionId.Yukikaze,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Yukikaze, context, { potency: 180, comboPotency: 360 }));

    if (context.comboed || hasBuff(getState(), StatusId.MeikyoShisui)) {
      dispatch(addKenki(15));
      dispatch(addSen(ActionId.Yukikaze));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Yukikaze) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const iaijutsu: CombatAction = createCombatAction({
  id: ActionId.Iaijutsu,
  execute: () => {},
  redirect: (state) => {
    const sen = senCount(state);
    const tendo = hasBuff(state, StatusId.Tendo);

    switch (sen) {
      case 1:
        return ActionId.Higanbana;
      case 2:
        return tendo ? ActionId.TendoGoken : ActionId.TenkaGoken;
      case 3:
        return tendo ? ActionId.TendoSetsugekka : ActionId.MidareSetsugekka;
    }

    return ActionId.Iaijutsu;
  },
  isUsable: () => false,
  castTime: () => 1.3,
  reducedBySkillSpeed: false,
});

const higenbana: CombatAction = createCombatAction({
  id: ActionId.Higanbana,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Higanbana, context, { potency: 200 }));

    dispatch(debuff(StatusId.Higanbana));
    dispatch(setSen(0));
    dispatch(addMeditation(1));
  },
  reducedBySkillSpeed: true,
  castTime: () => 1.3,
});

const tenkaGoken: CombatAction = createCombatAction({
  id: ActionId.TenkaGoken,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TenkaGoken, context, { potency: 300 }));

    dispatch(setSen(0));
    dispatch(addMeditation(1));
    dispatch(buff(StatusId.KaeshiGokenActive));
  },
  reducedBySkillSpeed: true,
  castTime: () => 1.3,
});

const midareSetsugekka: CombatAction = createCombatAction({
  id: ActionId.MidareSetsugekka,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.MidareSetsugekka, context, { potency: 700 }));

    dispatch(setSen(0));
    dispatch(addMeditation(1));
    dispatch(buff(StatusId.KaeshiSetsugekkaActive));
  },
  reducedBySkillSpeed: true,
  castTime: () => 1.3,
});

const tendoGoken: CombatAction = createCombatAction({
  id: ActionId.TendoGoken,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TenkaGoken, context, { potency: 420 }));

    dispatch(setSen(0));
    dispatch(addMeditation(1));
    dispatch(buff(StatusId.KaeshiTendoGokenActive));
    dispatch(removeBuff(StatusId.Tendo));
  },
  reducedBySkillSpeed: true,
  castTime: () => 1.3,
});

const tendoSetsugekka: CombatAction = createCombatAction({
  id: ActionId.TendoSetsugekka,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TendoSetsugekka, context, { potency: 1020 }));

    dispatch(setSen(0));
    dispatch(addMeditation(1));
    dispatch(buff(StatusId.KaeshiTendoSetsugekkaActive));
    dispatch(removeBuff(StatusId.Tendo));
  },
  reducedBySkillSpeed: true,
  castTime: () => 1.3,
});

const meikyoShisui: CombatAction = createCombatAction({
  id: ActionId.MeikyoShisui,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.MeikyoShisui));
    dispatch(buff(StatusId.TsubamegaeshiReady));
    dispatch(buff(StatusId.Tendo));
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
    if (!hasBuff(state, StatusId.TsubamegaeshiReady)) {
      return ActionId.Tsubamegaeshi;
    }

    if (hasBuff(state, StatusId.KaeshiTendoGokenActive)) {
      return ActionId.TendoKaeshiGoken;
    }

    if (hasBuff(state, StatusId.KaeshiTendoSetsugekkaActive)) {
      return ActionId.TendoKaeshiSetsugekka;
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
  reducedBySkillSpeed: false,
});

const kaeshiGoken: CombatAction = createCombatAction({
  id: ActionId.KaeshiGoken,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.KaeshiGoken, context, { potency: 300 }));

    dispatch(removeBuff(StatusId.KaeshiGokenActive));
    dispatch(removeBuff(StatusId.TsubamegaeshiReady));
  },
  reducedBySkillSpeed: true,
  isGlowing: () => true,
});

const kaeshiSetsugekka: CombatAction = createCombatAction({
  id: ActionId.KaeshiSetsugekka,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.KaeshiSetsugekka, context, { potency: 700 }));

    dispatch(removeBuff(StatusId.KaeshiSetsugekkaActive));
    dispatch(removeBuff(StatusId.TsubamegaeshiReady));
  },
  reducedBySkillSpeed: true,
  isGlowing: () => true,
});

const tendoKaeshiGoken: CombatAction = createCombatAction({
  id: ActionId.TendoKaeshiGoken,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TendoKaeshiGoken, context, { potency: 420 }));

    dispatch(removeBuff(StatusId.KaeshiTendoGokenActive));
    dispatch(removeBuff(StatusId.TsubamegaeshiReady));
  },
  reducedBySkillSpeed: true,
  isGlowing: () => true,
});

const tendoKaeshiSetsugekka: CombatAction = createCombatAction({
  id: ActionId.TendoKaeshiSetsugekka,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TendoKaeshiSetsugekka, context, { potency: 1020 }));

    dispatch(removeBuff(StatusId.KaeshiTendoSetsugekkaActive));
    dispatch(removeBuff(StatusId.TsubamegaeshiReady));
  },
  reducedBySkillSpeed: true,
  isGlowing: () => true,
});

const shoha: CombatAction = createCombatAction({
  id: ActionId.Shoha,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Shoha, context, { potency: 640 }));
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
    dispatch(buff(StatusId.OgiNamikiriReady));
    dispatch(buff(StatusId.ZanshinReady));
  },
  isUsable: (state) => inCombat(state),
});

const zanshin: CombatAction = createCombatAction({
  id: ActionId.Zanshin,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Zanshin, context, { potency: 900 }));
    dispatch(removeBuff(StatusId.ZanshinReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.ZanshinReady),
  isGlowing: (state) => hasBuff(state, StatusId.ZanshinReady),
});

const hissatsuShinten: CombatAction = createCombatAction({
  id: ActionId.HissatsuShinten,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HissatsuShinten, context, { potency: 250 }));
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 25,
});

const hissatsuGyoten: CombatAction = createCombatAction({
  id: ActionId.HissatsuGyoten,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HissatsuGyoten, context, { potency: 100 }));
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 10,
});

const hissatsuYaten: CombatAction = createCombatAction({
  id: ActionId.HissatsuYaten,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HissatsuYaten, context, { potency: 100 }));
    dispatch(ogcdLock());
    dispatch(buff(StatusId.EnhancedEnpi));
  },
  isGlowing: (state) => kenki(state) >= 10,
});

const hissatsuSenei: CombatAction = createCombatAction({
  id: ActionId.HissatsuSenei,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HissatsuSenei, context, { potency: 860 }));
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 25,
  cooldown: () => 60,
});

const ogiNamikiri: CombatAction = createCombatAction({
  id: ActionId.OgiNamikiri,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.OgiNamikiri, context, { potency: 900 }));

    dispatch(addMeditation(1));
    dispatch(buff(StatusId.KaeshiNamikiriActive));
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
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.KaeshiNamikiri, context, { potency: 900 }));

    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(removeBuff(StatusId.KaeshiNamikiriActive));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
  isGcdAction: true,
});

const enpi: CombatAction = createCombatAction({
  id: ActionId.Enpi,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.Enpi, context, { potency: 100, enhancedPotency: 270, isEnhanced: hasBuff(getState(), StatusId.EnhancedEnpi) })
    );

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
    dispatch(buff(StatusId.Meditate));
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
  execute: () => {},
  redirect: () => ActionId.Tengetsu,
});

const tengetsu: CombatAction = createCombatAction({
  id: ActionId.Tengetsu,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Tengetsu));
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
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Fuko, context, { potency: 100 }));

    dispatch(combo(ActionId.Fuga));
    dispatch(addKenki(10));
  },
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const oka: CombatAction = createCombatAction({
  id: ActionId.Oka,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Oka, context, { potency: 100, comboPotency: 120 }));

    const meikyo = hasBuff(getState(), StatusId.MeikyoShisui);

    if (context.comboed || meikyo) {
      dispatch(addKenki(10));
      dispatch(addSen(ActionId.Oka));
      dispatch(buff(StatusId.Fuka));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Oka) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const mangetsu: CombatAction = createCombatAction({
  id: ActionId.Mangetsu,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Mangetsu, context, { potency: 100, comboPotency: 120 }));

    const meikyo = hasBuff(getState(), StatusId.MeikyoShisui);

    if (context.comboed || meikyo) {
      dispatch(addKenki(10));
      dispatch(addSen(ActionId.Mangetsu));
      dispatch(buff(StatusId.Fugetsu));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Mangetsu) || hasBuff(state, StatusId.MeikyoShisui),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const hissatsuKyuten: CombatAction = createCombatAction({
  id: ActionId.HissatsuKyuten,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HissatsuKyuten, context, { potency: 120 }));
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 25,
});

const hissatsuGuren: CombatAction = createCombatAction({
  id: ActionId.HissatsuGuren,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HissatsuGuren, context, { potency: 500 }));
    dispatch(ogcdLock());
  },
  isGlowing: (state) => kenki(state) >= 25,
  cooldown: () => 60,
});

export const samStatuses: CombatStatus[] = [
  fukaStatus,
  fugetsuStatus,
  higenbanaStatus,
  kaeshiGokenActiveStatus,
  kaeshiSetsugekkaActiveStatus,
  kaeshiNamikiriActiveStatus,
  meikyoShisuiStatus,
  meditateStatus,
  tengetsuStatus,
  ogiNamikiriReadyStatus,
  enhancedEnpiStatus,
  kaeshiTendoGokenActiveStatus,
  kaeshiTendoSetsugekkaActiveStatus,
  tendoStatus,
  zanshinReadyStatus,
  tsubamegaeshiReadyStatus,
  tengetsusForesightStatus,
];

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
  tengetsu,
  gyofu,
  zanshin,
  tendoGoken,
  tendoKaeshiGoken,
  tendoSetsugekka,
  tendoKaeshiSetsugekka,
];

export const samEpics = combineEpics(popTengetsuEpic, consumeMeikyoEpic, removeKaeshiEpic, removeKaeshiNamikiriEpic, meditateEpic, meditateStopEpic);
