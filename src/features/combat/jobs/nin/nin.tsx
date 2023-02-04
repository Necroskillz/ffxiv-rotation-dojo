import { combineEpics, Epic } from 'redux-observable';
import { filter, first, map, of, switchMap, takeWhile, withLatestFrom } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import {
  addBuff,
  addNinki,
  buff,
  buffStacks,
  combo,
  debuff,
  executeAction,
  extendableBuff,
  gcd,
  hasBuff,
  hasCombo,
  inCombat,
  modifyCooldown,
  ogcdLock,
  removeBuff,
  removeBuffStack,
  removeDebuff,
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

const mudraMap: Record<number, number> = { [ActionId.Ten]: 1, [ActionId.Chi]: 2, [ActionId.Jin]: 3, [ActionId.RabbitMedium]: 4 };

function mudraMatches(state: RootState, expectedMudras: number[]) {
  let value = resource(state, 'mudra');
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
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.Bunshin))
      )
    ),
    switchMap(() => of(removeBuffStack(StatusId.Bunshin), addNinki(5)))
  );

const removeHideEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Hidden),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === executeAction.type && ![ActionId.Sprint, ActionId.Hide].includes(aa.payload.id)),
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
        filter(([aa, state]) => aa.type === executeAction.type && mudra(state) > 100),
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
    map(() => debuff(StatusId.DotonHeavy, null))
  );

const removeDotonHeavyEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === removeBuff.type && a.payload === StatusId.Doton),
    withLatestFrom(state$),
    map(([, state]) => state),
    map(() => removeDebuff(StatusId.DotonHeavy))
  );

const mudraFailByOtherActionEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Mudra),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === executeAction.type && ![ActionId.Ten, ActionId.Chi, ActionId.Jin].includes(aa.payload.id)),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.Mudra))
      )
    ),
    map(() => addMudra(ActionId.RabbitMedium))
  );

const spinningEdge: CombatAction = createCombatAction({
  id: ActionId.SpinningEdge,
  execute: (dispatch) => {
    dispatch(combo(ActionId.SpinningEdge));

    dispatch(addNinki(5));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const gustSlash: CombatAction = createCombatAction({
  id: ActionId.GustSlash,
  execute: (dispatch, _, context) => {
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
  execute: (dispatch, _, context) => {
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
    if (context.comboed) {
      dispatch(addNinki(15));

      if (hasBuff(getState(), StatusId.HutonActive)) {
        dispatch(extendableBuff(StatusId.HutonActive, 30, 60));
      }
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.ArmorCrush),
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const mug: CombatAction = createCombatAction({
  id: ActionId.Mug,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.VulnerabilityUp, 20));
    dispatch(addNinki(40));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
});

const kassatsu: CombatAction = createCombatAction({
  id: ActionId.Kassatsu,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Kassatsu, 15));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const bunshin: CombatAction = createCombatAction({
  id: ActionId.Bunshin,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Bunshin, 30, { stacks: 5 }));
    dispatch(buff(StatusId.PhantomKamaitachiReady, 45));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: (state) => ninki(state) >= 50,
  redirect: (state) => (hasBuff(state, StatusId.PhantomKamaitachiReady) ? ActionId.PhantomKamaitachi : ActionId.Bunshin),
  entersCombat: false,
});

const phantomKamaitachi: CombatAction = createCombatAction({
  id: ActionId.PhantomKamaitachi,
  execute: (dispatch, getState) => {
    dispatch(removeBuff(StatusId.PhantomKamaitachiReady));
    dispatch(addNinki(10));
    if (hasBuff(getState(), StatusId.HutonActive)) {
      dispatch(extendableBuff(StatusId.HutonActive, 10, 60));
    }
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: () => true,
});

const ten: CombatAction = createCombatAction({
  id: ActionId.Ten,
  execute: (dispatch, getState) => {
    dispatch(addMudra(ActionId.Ten));

    if (!hasBuff(getState(), StatusId.Mudra)) {
      dispatch(buff(StatusId.Mudra, 6));
      dispatch(gcd({ time: 500 }));
    }
  },
  maxCharges: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0 : 2),
  cooldown: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0.5 : 20),
  cooldownGroup: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 58 : 9),
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
      dispatch(buff(StatusId.Mudra, 6));
      dispatch(gcd({ time: 500 }));
    }
  },
  maxCharges: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0 : 2),
  cooldown: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0.5 : 20),
  cooldownGroup: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 58 : 9),
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
      dispatch(buff(StatusId.Mudra, 6));
      dispatch(gcd({ time: 500 }));
    }
  },
  maxCharges: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0 : 2),
  cooldown: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 0.5 : 20),
  cooldownGroup: (state) => (hasBuff(state, StatusId.Mudra) || hasBuff(state, StatusId.Kassatsu) ? 58 : 9),
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
  execute: (dispatch, getState) => {
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
  execute: (dispatch) => {
    dispatch(addMudra(ActionId.Chi));
  },
  isGcdAction: true,
});

const fumaShurikenJin: CombatAction = createCombatAction({
  id: ActionId.FumaShurikenJin,
  execute: (dispatch) => {
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
  execute: (dispatch, getState) => {
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
  execute: (dispatch, getState) => {
    dispatch(gcd({ time: 1500 }));
    dispatch(buff(StatusId.RaijuReady, 30, { stacks: Math.min(buffStacks(getState(), StatusId.RaijuReady) + 1, 3) }));

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
  execute: (dispatch) => {
    dispatch(removeBuffStack(StatusId.RaijuReady));
    dispatch(addNinki(5));
  },
  isUsable: (state) => hasBuff(state, StatusId.RaijuReady),
  isGlowing: (state) => hasBuff(state, StatusId.RaijuReady),
  reducedBySkillSpeed: true,
});

const forkedRaiju: CombatAction = createCombatAction({
  id: ActionId.ForkedRaiju,
  execute: (dispatch) => {
    dispatch(removeBuffStack(StatusId.RaijuReady));
    dispatch(addNinki(5));
  },
  isUsable: (state) => hasBuff(state, StatusId.RaijuReady),
  isGlowing: (state) => hasBuff(state, StatusId.RaijuReady),
  reducedBySkillSpeed: true,
});

const hyoton: CombatAction = createCombatAction({
  id: ActionId.Hyoton,
  execute: (dispatch, getState) => {
    dispatch(gcd({ time: 1500 }));

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
  execute: (dispatch, getState) => {
    dispatch(gcd({ time: 1500 }));
    dispatch(buff(StatusId.HutonActive, 60, { isVisible: false }));

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
    dispatch(buff(StatusId.Doton, 18));

    if (inCombat(getState())) {
      dispatch(debuff(StatusId.DotonHeavy, null));
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
  execute: (dispatch, getState) => {
    dispatch(gcd({ time: 1500 }));
    dispatch(buff(StatusId.Suiton, 20));

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
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.Mudra));
    dispatch(removeBuff(StatusId.Kassatsu));
    dispatch(setMudra(0));
    dispatch(gcd({ time: 1500 }));
  },
  isGcdAction: true,
});

const hyoshoRanryu: CombatAction = createCombatAction({
  id: ActionId.HyoshoRanryu,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.Mudra));
    dispatch(removeBuff(StatusId.Kassatsu));
    dispatch(setMudra(0));
    dispatch(gcd({ time: 1500 }));
  },
  isGcdAction: true,
});

const hide: CombatAction = createCombatAction({
  id: ActionId.Hide,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Hidden, null));
    dispatch(removeBuff(StatusId.Doton));
    dispatch(modifyCooldown(9, -40000));
  },
  entersCombat: false,
  isUsable: (state) => !inCombat(state) && !hasBuff(state, StatusId.TenChiJin),
});

const trickAttack: CombatAction = createCombatAction({
  id: ActionId.TrickAttack,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.TrickAttack, 15));
    dispatch(removeBuff(StatusId.Suiton));
  },
  isUsable: (state) => (hasBuff(state, StatusId.Hidden) || hasBuff(state, StatusId.Suiton)) && !hasBuff(state, StatusId.TenChiJin),
});

const tenChiJin: CombatAction = createCombatAction({
  id: ActionId.TenChiJin,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.TenChiJin, 6));
    dispatch(setMudra(0));
    dispatch(removeBuff(StatusId.Mudra));
  },
  isUsable: (state) => !hasBuff(state, StatusId.Kassatsu),
});

const meisui: CombatAction = createCombatAction({
  id: ActionId.Meisui,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.Suiton));
    dispatch(buff(StatusId.Meisui, 30));
    dispatch(addNinki(50));
  },
  isUsable: (state) => hasBuff(state, StatusId.Suiton) && !hasBuff(state, StatusId.TenChiJin),
  entersCombat: false,
});

const bhavacakra: CombatAction = createCombatAction({
  id: ActionId.Bhavacakra,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.Meisui));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: (state) => ninki(state) >= 50,
});

const assassinate: CombatAction = createCombatAction({
  id: ActionId.Assassinate,
  execute: () => {},
  redirect: () => ActionId.DreamWithinaDream,
});

const dreamWithinADream: CombatAction = createCombatAction({
  id: ActionId.DreamWithinaDream,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
});

const throwingDagger: CombatAction = createCombatAction({
  id: ActionId.ThrowingDagger,
  execute: (dispatch) => {
    dispatch(addNinki(5));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const shadeShift: CombatAction = createCombatAction({
  id: ActionId.ShadeShift,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ShadeShift, 20));
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
  execute: (dispatch) => {
    dispatch(combo(ActionId.DeathBlossom));

    dispatch(addNinki(5));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const hakkeMujinsatsu: CombatAction = createCombatAction({
  id: ActionId.HakkeMujinsatsu,
  execute: (dispatch, getState, context) => {
    if (context.comboed) {
      dispatch(addNinki(5));
      if (hasBuff(getState(), StatusId.HutonActive)) {
        dispatch(extendableBuff(StatusId.HutonActive, 10, 60));
      }
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.GustSlash),
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const hurajin: CombatAction = createCombatAction({
  id: ActionId.Huraijin,
  execute: (dispatch) => {
    dispatch(addNinki(5));
    dispatch(buff(StatusId.HutonActive, 60, { isVisible: false }));
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  reducedBySkillSpeed: true,
});

const hellfrogMedium: CombatAction = createCombatAction({
  id: ActionId.HellfrogMedium,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => !hasBuff(state, StatusId.TenChiJin),
  isGlowing: (state) => ninki(state) >= 50,
});

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
  hurajin,
  hellfrogMedium,
];

export const ninEpics = combineEpics(
  consumeBunshinEpic,
  removeHideEpic,
  dotonHeavyEpic,
  removeDotonHeavyEpic,
  mudraFailByOtherActionEpic,
  endTenChiJinEpic
);
