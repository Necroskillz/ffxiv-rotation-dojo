import { combineEpics, Epic } from 'redux-observable';
import { delay, filter, first, map, of, switchMap, takeWhile, withLatestFrom } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  addBuff,
  addBuffStack,
  addEvent,
  addKazematoi,
  addNinki,
  buff,
  buffStacks,
  combo,
  DamageType,
  debuff,
  dmgEvent,
  event,
  EventStatus,
  executeAction,
  gcd,
  hasBuff,
  hasCombo,
  inCombat,
  modifyCooldown,
  ogcdLock,
  removeBuff,
  removeBuffAction,
  removeBuffStack,
  removeDebuff,
  removeKazematoi,
  resource,
  setCombat,
  setMudra,
} from '../../combatSlice';

function ninki(state: RootState) {
  return resource(state, 'ninki');
}

function mudra(state: RootState) {
  return resource(state, 'mudra');
}

function kazematoi(state: RootState) {
  return resource(state, 'kazematoi');
}

const mudraMap: Record<number, number> = { [ActionId.Ten]: 1, [ActionId.Chi]: 2, [ActionId.Jin]: 3, [ActionId.RabbitMedium]: 4 };

function mudraMatches(state: RootState, expectedMudras: number[]) {
  let value = mudra(state);
  const currentMudras = [];

  while (value !== 0) {
    currentMudras.unshift(value % 10);
    value = Math.floor(value / 10);
  }

  if (currentMudras.length !== expectedMudras.length) {
    return false;
  }

  for (let i = 0; i < currentMudras.length; i++) {
    if (currentMudras[i] !== mudraMap[expectedMudras[i]]) {
      return false;
    }
  }

  return true;
}

export const addMudra =
  (actionId: number): AppThunk =>
  (dispatch, getState) => {
    const value = mudra(getState());

    dispatch(setMudra(value * 10 + mudraMap[actionId]));
  };

const consumeBunshinEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Bunshin),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            getActionById(aa.payload.id).type === 'Weaponskill' &&
            aa.payload.id !== ActionId.PhantomKamaitachi
        ),
        withLatestFrom(state$),
        takeWhile(([, state]) => hasBuff(state, StatusId.Bunshin))
      )
    ),
    switchMap(() => of(removeBuffStack(StatusId.Bunshin), addNinki(5)))
  );

const bunshinDamageEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Bunshin),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === addEvent.type &&
            getActionById(aa.payload.actionId)?.type === 'Weaponskill' &&
            aa.payload.actionId !== ActionId.PhantomKamaitachi &&
            !aa.payload.statuses.some((s: EventStatus) => s.id === StatusId.Bunshin)
        ),
        withLatestFrom(state$),
        takeWhile(([, state]) => hasBuff(state, StatusId.Bunshin))
      )
    ),
    delay(500),
    map(([a, state]) =>
      addEvent({
        ...a.payload,
        potency: [ActionId.DeathBlossom, ActionId.HakkeMujinsatsu].includes(a.payload.actionId) ? 80 : 160,
        statuses: [...a.payload.statuses, { id: StatusId.Bunshin, stacks: buffStacks(state, StatusId.Bunshin) }],
      })
    )
  );

const dreamWithinADreamEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((aa) => aa.type === addEvent.type && aa.payload.actionId === ActionId.DreamWithinaDream && aa.payload.count !== 2),
    delay(300),
    map((a) =>
      addEvent({
        ...a.payload,
        count: (a.payload.count ?? 0) + 1,
      })
    )
  );

const hollowNozuchiEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Doton),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === addEvent.type &&
            ([ActionId.Katon, ActionId.GokaMekkyaku, ActionId.PhantomKamaitachi].includes(aa.payload.actionId) ||
              (aa.payload.actionId === ActionId.HakkeMujinsatsu && aa.payload.comboed))
        ),
        withLatestFrom(state$),
        takeWhile(([, state]) => hasBuff(state, StatusId.Doton))
      )
    ),
    delay(500),
    map(() => event(ActionId.HollowNozuchi, { potency: 50, type: DamageType.Magical }))
  );

const removeHideEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Hidden),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            getActionById(aa.payload.id).type !== 'Movement' &&
            ![ActionId.Sprint, ActionId.Hide].includes(aa.payload.id)
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.Hidden))
      )
    ),
    map(() => removeBuff(StatusId.Hidden))
  );

const endTenChiJinEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.TenChiJin),
    switchMap(() =>
      action$.pipe(
        withLatestFrom(state$),
        filter(([aa, state]) => aa.type === executeAction.type && (mudra(state) > 100 || getActionById(aa.payload.id).type === 'Movement')),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.TenChiJin))
      )
    ),
    switchMap(() => of(removeBuff(StatusId.TenChiJin), setMudra(0)))
  );

const dotonHeavyEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    withLatestFrom(state$),
    filter(([a, state]) => a.type === addBuff.type && a.payload.id === StatusId.Doton && !inCombat(state)),
    map(([, state]) => state),
    takeWhile((state) => hasBuff(state, StatusId.Doton)),
    switchMap(() => action$.pipe(first((aa) => aa.type === setCombat.type && aa.payload))),
    map(() => debuff(StatusId.DotonHeavy))
  );

const removeDotonHeavyEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && a.payload === StatusId.Doton),
    withLatestFrom(state$),
    map(([, state]) => state),
    map(() => removeDebuff(StatusId.DotonHeavy))
  );

const mudraFailByOtherActionEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Mudra),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            getActionById(aa.payload.id).type !== 'Movement' &&
            ![ActionId.Ten, ActionId.Chi, ActionId.Jin].includes(aa.payload.id)
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.Mudra))
      )
    ),
    map(() => addMudra(ActionId.RabbitMedium))
  );

const removeRaijuEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.RaijuReady),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            [
              ActionId.SpinningEdge,
              ActionId.GustSlash,
              ActionId.AeolianEdge,
              ActionId.ArmorCrush,
              ActionId.DeathBlossom,
              ActionId.HakkeMujinsatsu,
            ].includes(aa.payload.id)
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.RaijuReady))
      )
    ),
    map(() => removeBuff(StatusId.RaijuReady))
  );

const removeKassatsuEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && a.payload === StatusId.Mudra),
    map(() => removeBuff(StatusId.Kassatsu))
  );

const dotonHeavyStatus: CombatStatus = createCombatStatus({
  id: StatusId.DotonHeavy,
  duration: null,
  isHarmful: true,
});

const dokumoriStatus: CombatStatus = createCombatStatus({
  id: StatusId.Dokumori,
  duration: 20,
  isHarmful: true,
});

const kassatsuStatus: CombatStatus = createCombatStatus({
  id: StatusId.Kassatsu,
  duration: 15,
  isHarmful: false,
});

const bunshinStatus: CombatStatus = createCombatStatus({
  id: StatusId.Bunshin,
  duration: 32,
  isHarmful: false,
  initialStacks: 5,
});

const phantomKamaitachiReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.PhantomKamaitachiReady,
  duration: 45,
  isHarmful: false,
});

const mudraStatus: CombatStatus = createCombatStatus({
  id: StatusId.Mudra,
  duration: 6,
  isHarmful: false,
});

const raijuReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.RaijuReady,
  duration: 30,
  isHarmful: false,
  maxStacks: 3,
});

const dotonStatus: CombatStatus = createCombatStatus({
  id: StatusId.Doton,
  duration: 18,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 80 })),
  ticksImmediately: true,
});

const shadowWalkerStatus: CombatStatus = createCombatStatus({
  id: StatusId.ShadowWalker,
  duration: 20,
  isHarmful: false,
});

const hiddenStatus: CombatStatus = createCombatStatus({
  id: StatusId.Hidden,
  duration: null,
  isHarmful: false,
});

const kunaisBaneStatus: CombatStatus = createCombatStatus({
  id: StatusId.KunaisBane,
  duration: 15,
  isHarmful: true,
});

const meisuiStatus: CombatStatus = createCombatStatus({
  id: StatusId.Meisui,
  duration: 30,
  isHarmful: false,
});

const tenChiJinStatus: CombatStatus = createCombatStatus({
  id: StatusId.TenChiJin,
  duration: 6,
  isHarmful: false,
});

const shadeShiftStatus: CombatStatus = createCombatStatus({
  id: StatusId.ShadeShift,
  duration: 20,
  isHarmful: false,
});

const tenriJindoReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.TenriJindoReady,
  duration: 30,
  isHarmful: false,
});

const higiStatus: CombatStatus = createCombatStatus({
  id: StatusId.Higi,
  duration: 30,
  isHarmful: false,
});

const spinningEdge: CombatAction = createCombatAction({
  id: ActionId.SpinningEdge,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SpinningEdge, context, { potency: 300 }));
    dispatch(combo(ActionId.SpinningEdge));

    dispatch(addNinki(5));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const gustSlash: CombatAction = createCombatAction({
  id: ActionId.GustSlash,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.GustSlash, context, { potency: 240, comboPotency: 400 }));

    if (context.comboed) {
      dispatch(combo(ActionId.GustSlash));
      dispatch(addNinki(5));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.GustSlash),
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const aeolianEdge: CombatAction = createCombatAction({
  id: ActionId.AeolianEdge,
  execute: (dispatch, getState, context) => {
    const bonus = kazematoi(getState()) > 0 ? 100 : 0;

    if (bonus) {
      dispatch(removeKazematoi(1));
    }

    dispatch(
      dmgEvent(ActionId.AeolianEdge, context, {
        potency: 200 + bonus,
        rearPotency: 260 + bonus,
        comboPotency: 380 + bonus,
        rearComboPotency: 440 + bonus,
      })
    );

    if (context.comboed) {
      dispatch(addNinki(15));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.AeolianEdge),
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const armorCrush: CombatAction = createCombatAction({
  id: ActionId.ArmorCrush,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.ArmorCrush, context, { potency: 220, comboPotency: 280, flankPotency: 420, flankComboPotency: 480 }));

    if (context.comboed) {
      dispatch(addNinki(15));
      dispatch(addKazematoi(2));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.ArmorCrush),
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const mug: CombatAction = createCombatAction({
  id: ActionId.Mug,
  execute: () => {},
  redirect: () => ActionId.Dokumori,
});

const dokumori: CombatAction = createCombatAction({
  id: ActionId.Dokumori,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Dokumori, context, { potency: 300 }));
    dispatch(debuff(StatusId.Dokumori));
    dispatch(buff(StatusId.Higi));
    dispatch(addNinki(40));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
});

const kassatsu: CombatAction = createCombatAction({
  id: ActionId.Kassatsu,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Kassatsu));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const bunshin: CombatAction = createCombatAction({
  id: ActionId.Bunshin,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Bunshin));
    dispatch(buff(StatusId.PhantomKamaitachiReady));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: (state) => ninki(state) >= 50,
  redirect: (state) => (hasBuff(state, StatusId.PhantomKamaitachiReady) ? ActionId.PhantomKamaitachi : ActionId.Bunshin),
  entersCombat: false,
  actionChangeTo: ActionId.PhantomKamaitachi,
});

const phantomKamaitachi: CombatAction = createCombatAction({
  id: ActionId.PhantomKamaitachi,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.PhantomKamaitachi, context, { potency: 600 }));
    dispatch(removeBuff(StatusId.PhantomKamaitachiReady));
    dispatch(addNinki(10));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin) && hasBuff(state, StatusId.PhantomKamaitachiReady),
  isGlowing: (state) => hasBuff(state, StatusId.PhantomKamaitachiReady),
});

const ten: CombatAction = createCombatAction({
  id: ActionId.Ten,
  execute: (dispatch, getState) => {
    dispatch(addMudra(ActionId.Ten));

    if (!hasBuff(getState(), StatusId.Mudra)) {
      dispatch(buff(StatusId.Mudra));
      dispatch(gcd({ time: 500 }));
    }
  },
  maxCharges: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0 : 2),
  cooldown: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0.5 : 20),
  cooldownGroup: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 58 : 4),
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGcdAction: true,
  entersCombat: false,
  redirect: (state) => {
    if (hasBuff(state, StatusId.TenChiJin)) {
      if (mudraMatches(state, [])) {
        return ActionId.FumaShuriken;
      }

      if (mudraMatches(state, [ActionId.Chi]) || mudraMatches(state, [ActionId.Jin])) {
        return ActionId.Katon;
      }

      if (mudraMatches(state, [ActionId.Chi, ActionId.Jin]) || mudraMatches(state, [ActionId.Jin, ActionId.Chi])) {
        return ActionId.Huton;
      }
    }

    return ActionId.Ten;
  },
});

const chi: CombatAction = createCombatAction({
  id: ActionId.Chi,
  execute: (dispatch, getState) => {
    dispatch(addMudra(ActionId.Chi));

    if (!hasBuff(getState(), StatusId.Mudra)) {
      dispatch(buff(StatusId.Mudra));
      dispatch(gcd({ time: 500 }));
    }
  },
  maxCharges: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0 : 2),
  cooldown: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0.5 : 20),
  cooldownGroup: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 58 : 4),
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGcdAction: true,
  entersCombat: false,
  redirect: (state) => {
    if (hasBuff(state, StatusId.TenChiJin)) {
      if (mudraMatches(state, [])) {
        return ActionId.FumaShurikenChi;
      }

      if (mudraMatches(state, [ActionId.Ten]) || mudraMatches(state, [ActionId.Jin])) {
        return ActionId.Raiton;
      }

      if (mudraMatches(state, [ActionId.Ten, ActionId.Jin]) || mudraMatches(state, [ActionId.Jin, ActionId.Ten])) {
        return ActionId.Doton;
      }
    }

    return ActionId.Chi;
  },
});

const jin: CombatAction = createCombatAction({
  id: ActionId.Jin,
  execute: (dispatch, getState) => {
    dispatch(addMudra(ActionId.Jin));

    if (!hasBuff(getState(), StatusId.Mudra)) {
      dispatch(buff(StatusId.Mudra));
      dispatch(gcd({ time: 500 }));
    }
  },
  maxCharges: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0 : 2),
  cooldown: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0.5 : 20),
  cooldownGroup: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 58 : 4),
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGcdAction: true,
  entersCombat: false,
  redirect: (state) => {
    if (hasBuff(state, StatusId.TenChiJin)) {
      if (mudraMatches(state, [])) {
        return ActionId.FumaShurikenJin;
      }

      if (mudraMatches(state, [ActionId.Ten]) || mudraMatches(state, [ActionId.Chi])) {
        return ActionId.Hyoton;
      }

      if (mudraMatches(state, [ActionId.Ten, ActionId.Chi]) || mudraMatches(state, [ActionId.Chi, ActionId.Ten])) {
        return ActionId.Suiton;
      }
    }

    return ActionId.Jin;
  },
});

const ninjutsu: CombatAction = createCombatAction({
  id: ActionId.Ninjutsu,
  execute: () => {},
  redirect: (state) => {
    if (!hasBuff(state, StatusId.Mudra) || mudraMatches(state, [])) {
      return ActionId.Ninjutsu;
    }

    if (mudraMatches(state, [ActionId.Ten]) || mudraMatches(state, [ActionId.Chi]) || mudraMatches(state, [ActionId.Jin])) {
      return ActionId.FumaShuriken;
    }

    if (mudraMatches(state, [ActionId.Chi, ActionId.Ten]) || mudraMatches(state, [ActionId.Jin, ActionId.Ten])) {
      if (hasBuff(state, StatusId.Kassatsu)) {
        return ActionId.GokaMekkyaku;
      } else {
        return ActionId.Katon;
      }
    }

    if (mudraMatches(state, [ActionId.Ten, ActionId.Chi]) || mudraMatches(state, [ActionId.Jin, ActionId.Chi])) {
      return ActionId.Raiton;
    }

    if (mudraMatches(state, [ActionId.Ten, ActionId.Jin]) || mudraMatches(state, [ActionId.Chi, ActionId.Jin])) {
      if (hasBuff(state, StatusId.Kassatsu)) {
        return ActionId.HyoshoRanryu;
      } else {
        return ActionId.Hyoton;
      }
    }

    if (
      mudraMatches(state, [ActionId.Jin, ActionId.Chi, ActionId.Ten]) ||
      mudraMatches(state, [ActionId.Chi, ActionId.Jin, ActionId.Ten])
    ) {
      return ActionId.Huton;
    }

    if (
      mudraMatches(state, [ActionId.Ten, ActionId.Jin, ActionId.Chi]) ||
      mudraMatches(state, [ActionId.Jin, ActionId.Ten, ActionId.Chi])
    ) {
      return ActionId.Doton;
    }

    if (
      mudraMatches(state, [ActionId.Ten, ActionId.Chi, ActionId.Jin]) ||
      mudraMatches(state, [ActionId.Chi, ActionId.Ten, ActionId.Jin])
    ) {
      return ActionId.Suiton;
    }

    return ActionId.RabbitMedium;
  },
  isUsable: () => false,
  isGcdAction: true,
});

const fumaShuriken: CombatAction = createCombatAction({
  id: ActionId.FumaShuriken,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FumaShuriken, context, { potency: 500 }));
    dispatch(gcd({ time: 1500 }));

    if (hasBuff(getState(), StatusId.TenChiJin)) {
      dispatch(addMudra(ActionId.Ten));
    } else {
      dispatch(removeBuff(StatusId.Mudra));
      dispatch(setMudra(0));
    }
  },
  isGcdAction: true,
});

const fumaShurikenChi: CombatAction = createCombatAction({
  id: ActionId.FumaShurikenChi,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FumaShurikenChi, context, { potency: 500 }));
    dispatch(addMudra(ActionId.Chi));
  },
  isGcdAction: true,
});

const fumaShurikenJin: CombatAction = createCombatAction({
  id: ActionId.FumaShurikenJin,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FumaShurikenJin, context, { potency: 500 }));
    dispatch(addMudra(ActionId.Jin));
  },
  isGcdAction: true,
});

const rabbitMedium: CombatAction = createCombatAction({
  id: ActionId.RabbitMedium,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.Mudra));
    dispatch(setMudra(0));
    dispatch(gcd({ time: 1500 }));
  },
  isGcdAction: true,
});

const katon: CombatAction = createCombatAction({
  id: ActionId.Katon,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Katon, context, { potency: 350, type: DamageType.Magical }));
    dispatch(gcd({ time: 1500 }));

    if (hasBuff(getState(), StatusId.TenChiJin)) {
      dispatch(addMudra(ActionId.Ten));
    } else {
      dispatch(removeBuff(StatusId.Mudra));
      dispatch(setMudra(0));
    }
  },
  isGcdAction: true,
});

const raiton: CombatAction = createCombatAction({
  id: ActionId.Raiton,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Raiton, context, { potency: 740, type: DamageType.Magical }));
    dispatch(gcd({ time: 1500 }));
    dispatch(addBuffStack(StatusId.RaijuReady));

    if (hasBuff(getState(), StatusId.TenChiJin)) {
      dispatch(addMudra(ActionId.Chi));
    } else {
      dispatch(removeBuff(StatusId.Mudra));
      dispatch(setMudra(0));
    }
  },
  isGcdAction: true,
});

const fleetingRaiju: CombatAction = createCombatAction({
  id: ActionId.FleetingRaiju,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FleetingRaiju, context, { potency: 700, type: DamageType.Magical }));
    dispatch(removeBuffStack(StatusId.RaijuReady));
    dispatch(addNinki(5));
  },
  isUsable: (state) => hasBuff(state, StatusId.RaijuReady),
  isGlowing: (state) => hasBuff(state, StatusId.RaijuReady),
  reducedBySkillSpeed: true,
});

const forkedRaiju: CombatAction = createCombatAction({
  id: ActionId.ForkedRaiju,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ForkedRaiju, context, { potency: 700, type: DamageType.Magical }));
    dispatch(removeBuffStack(StatusId.RaijuReady));
    dispatch(addNinki(5));
  },
  isUsable: (state) => hasBuff(state, StatusId.RaijuReady),
  isGlowing: (state) => hasBuff(state, StatusId.RaijuReady),
  reducedBySkillSpeed: true,
});

const hyoton: CombatAction = createCombatAction({
  id: ActionId.Hyoton,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Hyoton, context, { potency: 350, type: DamageType.Magical }));
    dispatch(gcd({ time: 1500 }));
    dispatch(debuff(StatusId.Bind, { duration: 15 }));

    if (hasBuff(getState(), StatusId.TenChiJin)) {
      dispatch(addMudra(ActionId.Jin));
    } else {
      dispatch(removeBuff(StatusId.Mudra));
      dispatch(setMudra(0));
    }
  },
  isGcdAction: true,
});

const huton: CombatAction = createCombatAction({
  id: ActionId.Huton,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Huton, context, { potency: 240, type: DamageType.Magical }));
    dispatch(gcd({ time: 1500 }));
    dispatch(buff(StatusId.ShadowWalker));

    if (!hasBuff(getState(), StatusId.TenChiJin)) {
      dispatch(removeBuff(StatusId.Mudra));
      dispatch(setMudra(0));
    } else {
      dispatch(setMudra(ActionId.Ten));
    }
  },
  isGcdAction: true,
  entersCombat: false,
});

const doton: CombatAction = createCombatAction({
  id: ActionId.Doton,
  execute: (dispatch, getState) => {
    dispatch(gcd({ time: 1500 }));
    dispatch(buff(StatusId.Doton));

    if (inCombat(getState())) {
      dispatch(debuff(StatusId.DotonHeavy));
    }

    if (!hasBuff(getState(), StatusId.TenChiJin)) {
      dispatch(removeBuff(StatusId.Mudra));
      dispatch(setMudra(0));
    } else {
      dispatch(setMudra(ActionId.Chi));
    }
  },
  isGcdAction: true,
  entersCombat: false,
});

const suiton: CombatAction = createCombatAction({
  id: ActionId.Suiton,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Suiton, context, { potency: 580, type: DamageType.Magical }));
    dispatch(gcd({ time: 1500 }));
    dispatch(buff(StatusId.ShadowWalker));

    if (!hasBuff(getState(), StatusId.TenChiJin)) {
      dispatch(removeBuff(StatusId.Mudra));
      dispatch(setMudra(0));
    } else {
      dispatch(setMudra(ActionId.Jin));
    }
  },
  isGcdAction: true,
});

const gokaMekkyaku: CombatAction = createCombatAction({
  id: ActionId.GokaMekkyaku,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.GokaMekkyaku, context, { potency: 600, type: DamageType.Magical }));
    dispatch(removeBuff(StatusId.Mudra));
    dispatch(setMudra(0));
    dispatch(gcd({ time: 1500 }));
  },
  isGcdAction: true,
});

const hyoshoRanryu: CombatAction = createCombatAction({
  id: ActionId.HyoshoRanryu,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HyoshoRanryu, context, { potency: 1300, type: DamageType.Magical }));
    dispatch(removeBuff(StatusId.Mudra));
    dispatch(setMudra(0));
    dispatch(gcd({ time: 1500 }));
  },
  isGcdAction: true,
});

const hide: CombatAction = createCombatAction({
  id: ActionId.Hide,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Hidden));
    dispatch(removeBuff(StatusId.Doton));
    dispatch(modifyCooldown(getActionById(ActionId.Ten).cooldownGroup, -40000));
  },
  entersCombat: false,
  isUsable: (state) => !inCombat(state) && !hasBuff(state, StatusId.TenChiJin),
});

const trickAttack: CombatAction = createCombatAction({
  id: ActionId.TrickAttack,
  execute: () => {},
  redirect: () => ActionId.KunaisBane,
});

const kunaisBane: CombatAction = createCombatAction({
  id: ActionId.KunaisBane,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.KunaisBane, context, { potency: 600 }));
    dispatch(debuff(StatusId.KunaisBane));
    dispatch(removeBuff(StatusId.ShadowWalker));
  },
  isUsable: (state) => (hasBuff(state, StatusId.Hidden) || hasBuff(state, StatusId.ShadowWalker)) && !hasBuff(state, StatusId.TenChiJin),
});

const tenChiJin: CombatAction = createCombatAction({
  id: ActionId.TenChiJin,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.TenChiJin));
    dispatch(buff(StatusId.TenriJindoReady));
    dispatch(setMudra(0));
    dispatch(removeBuff(StatusId.Mudra));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Kassatsu),
  redirect: (state) => (hasBuff(state, StatusId.TenriJindoReady) ? ActionId.TenriJindo : ActionId.TenChiJin),
});

const tenriJindo: CombatAction = createCombatAction({
  id: ActionId.TenriJindo,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.TenriJindo, context, {
        potency: 1100,
        type: DamageType.Magical,
      })
    );
    dispatch(removeBuff(StatusId.TenriJindoReady));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: () => true,
});

const meisui: CombatAction = createCombatAction({
  id: ActionId.Meisui,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.ShadowWalker));
    dispatch(buff(StatusId.Meisui));
    dispatch(addNinki(50));
  },
  isUsable: (state) => hasBuff(state, StatusId.ShadowWalker) && !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const bhavacakra: CombatAction = createCombatAction({
  id: ActionId.Bhavacakra,
  execute: (dispatch, getState, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.Bhavacakra, context, {
        potency: 380,
        enhancedPotency: 530,
        isEnhanced: hasBuff(getState(), StatusId.Meisui),
        type: DamageType.Magical,
      })
    );
    dispatch(removeBuff(StatusId.Meisui));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: (state) => ninki(state) >= 50,
  redirect: (state) => (hasBuff(state, StatusId.Higi) ? ActionId.ZeshoMeppo : ActionId.Bhavacakra),
});

const zeshoMeppo: CombatAction = createCombatAction({
  id: ActionId.ZeshoMeppo,
  execute: (dispatch, getState, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.ZeshoMeppo, context, {
        potency: 700,
        enhancedPotency: 850,
        isEnhanced: hasBuff(getState(), StatusId.Meisui),
        type: DamageType.Magical,
      })
    );
    dispatch(removeBuff(StatusId.Meisui));
    dispatch(removeBuff(StatusId.Higi));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: () => true,
});

const assassinate: CombatAction = createCombatAction({
  id: ActionId.Assassinate,
  execute: () => {},
  redirect: () => ActionId.DreamWithinaDream,
});

const dreamWithinADream: CombatAction = createCombatAction({
  id: ActionId.DreamWithinaDream,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.DreamWithinaDream, context, { potency: 150 }));
    dispatch(ogcdLock());
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
});

const throwingDagger: CombatAction = createCombatAction({
  id: ActionId.ThrowingDagger,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ThrowingDagger, context, { potency: 120 }));
    dispatch(addNinki(5));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const shadeShift: CombatAction = createCombatAction({
  id: ActionId.ShadeShift,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ShadeShift));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
});

const shukkuchi: CombatAction = createCombatAction({
  id: ActionId.Shukuchi,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const deathBlossom: CombatAction = createCombatAction({
  id: ActionId.DeathBlossom,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.DeathBlossom, context, { potency: 100 }));
    dispatch(combo(ActionId.DeathBlossom));

    dispatch(addNinki(5));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const hakkeMujinsatsu: CombatAction = createCombatAction({
  id: ActionId.HakkeMujinsatsu,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HakkeMujinsatsu, context, { potency: 100, comboPotency: 130 }));

    if (context.comboed) {
      dispatch(addNinki(5));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.HakkeMujinsatsu),
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const hellfrogMedium: CombatAction = createCombatAction({
  id: ActionId.HellfrogMedium,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HellfrogMedium, context, { potency: 160, type: DamageType.Magical }));
    dispatch(ogcdLock());
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: (state) => ninki(state) >= 50,
  redirect: (state) => (hasBuff(state, StatusId.Higi) ? ActionId.DeathfrogMedium : ActionId.HellfrogMedium),
});

const deathfrogMedium: CombatAction = createCombatAction({
  id: ActionId.DeathfrogMedium,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.ZeshoMeppo, context, {
        potency: 300,
        type: DamageType.Magical,
      })
    );
    dispatch(removeBuff(StatusId.Higi));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: () => true,
});

const hollowNozuchi: CombatAction = createCombatAction({
  id: ActionId.HollowNozuchi,
  execute: () => {},
});

export const ninStatuses: CombatStatus[] = [
  dotonHeavyStatus,
  dokumoriStatus,
  kassatsuStatus,
  tenChiJinStatus,
  shadowWalkerStatus,
  meisuiStatus,
  kunaisBaneStatus,
  shadeShiftStatus,
  bunshinStatus,
  phantomKamaitachiReadyStatus,
  mudraStatus,
  raijuReadyStatus,
  dotonStatus,
  hiddenStatus,
  dokumoriStatus,
  kunaisBaneStatus,
  tenriJindoReadyStatus,
  higiStatus,
];

export const nin: CombatAction[] = [
  spinningEdge,
  gustSlash,
  aeolianEdge,
  armorCrush,
  mug,
  kassatsu,
  bunshin,
  phantomKamaitachi,
  ten,
  chi,
  jin,
  ninjutsu,
  fumaShuriken,
  rabbitMedium,
  katon,
  raiton,
  fleetingRaiju,
  forkedRaiju,
  hyoton,
  huton,
  doton,
  suiton,
  gokaMekkyaku,
  hyoshoRanryu,
  hide,
  trickAttack,
  tenChiJin,
  fumaShurikenChi,
  fumaShurikenJin,
  meisui,
  bhavacakra,
  assassinate,
  dreamWithinADream,
  throwingDagger,
  shadeShift,
  shukkuchi,
  deathBlossom,
  hakkeMujinsatsu,
  hellfrogMedium,
  hollowNozuchi,
  dokumori,
  kunaisBane,
  zeshoMeppo,
  deathfrogMedium,
  tenriJindo,
];

export const ninEpics = combineEpics(
  consumeBunshinEpic,
  removeHideEpic,
  dotonHeavyEpic,
  removeDotonHeavyEpic,
  mudraFailByOtherActionEpic,
  endTenChiJinEpic,
  bunshinDamageEpic,
  hollowNozuchiEpic,
  dreamWithinADreamEpic,
  removeRaijuEpic,
  removeKassatsuEpic
);
