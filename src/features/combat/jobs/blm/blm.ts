import { combineEpics, Epic } from 'redux-observable';
import { filter, switchMap, interval, map, takeUntil, first } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import {
  buff,
  hasBuff,
  removeBuff,
  resource,
  buffStacks,
  removeUmbralHeart,
  setParadox,
  addUmbralHeart,
  addBuff,
  addPolyglot,
  debuff,
  ogcdLock,
  mana,
  event,
  removeBuffAction,
  dmgEvent,
  removeDebuff,
} from '../../combatSlice';
import { rng } from '../../utils';

function polyglot(state: RootState) {
  return resource(state, 'polyglot');
}

function paradox(state: RootState) {
  return resource(state, 'paradox');
}

function umbralHeart(state: RootState) {
  return resource(state, 'umbralHeart');
}

function astralFire(state: RootState) {
  return buffStacks(state, StatusId.AstralFireActive);
}

function umbralIce(state: RootState) {
  return buffStacks(state, StatusId.UmbralIceActive);
}

const enochianEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.EnochianActive),
    switchMap(() =>
      interval(30000).pipe(
        takeUntil(action$.pipe(first((aa) => aa.type === removeBuffAction.type && aa.payload === StatusId.EnochianActive))),
        map(() => addPolyglot(1))
      )
    )
  );

const setFireIce =
  (fire: number, ice: number): AppThunk =>
  (dispatch, getState) => {
    fire = Math.min(fire, 3);
    ice = Math.min(ice, 3);

    if ((astralFire(getState()) === 3 && ice > 0) || (umbralIce(getState()) === 3 && umbralHeart(getState()) === 3 && fire > 0)) {
      dispatch(setParadox(1));
    }

    function drop() {
      dispatch(removeBuff(StatusId.EnochianActive));
      dispatch(removeUmbralHeart(umbralHeart(getState())));
    }

    if (fire === 0) {
      dispatch(removeBuff(StatusId.AstralFireActive));
      dispatch(removeBuff(StatusId.EnhancedFlare));
    } else {
      dispatch(
        buff(StatusId.AstralFireActive, 15, {
          stacks: fire,
          isVisible: false,
          expireCallback: () => drop(),
        })
      );
    }

    if (ice === 0) {
      dispatch(removeBuff(StatusId.UmbralIceActive));
    } else {
      dispatch(
        buff(StatusId.UmbralIceActive, 15, {
          stacks: ice,
          isVisible: false,
          expireCallback: () => drop(),
        })
      );
    }

    if (fire === 0 && ice === 0) {
      dispatch(removeBuff(StatusId.EnochianActive));
    } else if (!hasBuff(getState(), StatusId.EnochianActive)) {
      dispatch(buff(StatusId.EnochianActive, null, { isVisible: false }));
    }
  };

function cost(state: RootState, baseCost: number, aspect: 'fire' | 'ice') {
  if (aspect === 'fire') {
    if (astralFire(state)) {
      if (umbralHeart(state)) {
        return baseCost;
      }

      return baseCost * 2;
    } else if (umbralIce(state)) {
      return 0;
    }

    return baseCost;
  } else {
    if (astralFire(state)) {
      return 0;
    } else if (umbralIce(state)) {
      switch (umbralIce(state)) {
        case 1:
          return baseCost * 0.75;
        case 2:
          return baseCost * 0.5;
        case 3:
          return 0;
      }
    }

    return baseCost;
  }
}

const fire: CombatAction = createCombatAction({
  id: ActionId.Fire,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Fire, context, { potency: 180 }));

    if (umbralIce(getState()) > 0) {
      dispatch(setFireIce(0, 0));
    } else {
      dispatch(setFireIce(astralFire(getState()) + 1, 0));
    }

    if (rng(40) || hasBuff(getState(), StatusId.Sharpcast)) {
      dispatch(removeBuff(StatusId.Sharpcast));
      dispatch(buff(StatusId.Firestarter, 30));
    }

    if (context.cost && umbralHeart(getState())) {
      dispatch(removeUmbralHeart(1));
    }
  },
  cost: (state, baseCost) => cost(state, baseCost, 'fire'),
  redirect: (state) => (paradox(state) ? ActionId.Paradox : ActionId.Fire),
  reducedBySpellSpeed: true,
});

const blizzard: CombatAction = createCombatAction({
  id: ActionId.Blizzard,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Blizzard, context, { potency: 180 }));

    if (astralFire(getState()) > 0) {
      dispatch(setFireIce(0, 0));
    } else {
      dispatch(setFireIce(0, umbralIce(getState()) + 1));
    }
  },
  cost: (state, baseCost) => cost(state, baseCost, 'ice'),
  redirect: (state) => (paradox(state) ? ActionId.Paradox : ActionId.Blizzard),
  reducedBySpellSpeed: true,
});

const fire3: CombatAction = createCombatAction({
  id: ActionId.FireIII,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FireIII, context, { potency: 260 }));

    dispatch(setFireIce(3, 0));
    dispatch(removeBuff(StatusId.Firestarter));

    if (context.cost && umbralHeart(getState())) {
      dispatch(removeUmbralHeart(1));
    }
  },
  cost: (state, baseCost) => (hasBuff(state, StatusId.Firestarter) ? 0 : cost(state, baseCost, 'fire')),
  castTime: (state, baseCastTime) => (hasBuff(state, StatusId.Firestarter) ? 0 : baseCastTime),
  reducedBySpellSpeed: true,
});

const fire4: CombatAction = createCombatAction({
  id: ActionId.FireIV,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FireIV, context, { potency: 310 }));

    if (umbralHeart(getState())) {
      dispatch(removeUmbralHeart(1));
    }
  },
  cost: (state, baseCost) => cost(state, baseCost, 'fire'),
  isUsable: (state) => astralFire(state) > 0,
  reducedBySpellSpeed: true,
});

const blizzard3: CombatAction = createCombatAction({
  id: ActionId.BlizzardIII,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BlizzardIII, context, { potency: 260 }));

    dispatch(setFireIce(0, 3));
  },
  cost: (state, baseCost) => cost(state, baseCost, 'ice'),
  reducedBySpellSpeed: true,
});

const blizzard4: CombatAction = createCombatAction({
  id: ActionId.BlizzardIV,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BlizzardIV, context, { potency: 310 }));

    dispatch(addUmbralHeart(3));
  },
  cost: (state, baseCost) => cost(state, baseCost, 'ice'),
  isUsable: (state) => umbralIce(state) > 0,
  reducedBySpellSpeed: true,
});

const paradox1: CombatAction = createCombatAction({
  id: ActionId.Paradox,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Paradox, context, { potency: 500 }));

    dispatch(setParadox(0));

    const fire = astralFire(getState());
    const ice = umbralIce(getState());

    if (fire) {
      dispatch(setFireIce(fire + 1, 0));
      if (rng(40) || hasBuff(getState(), StatusId.Sharpcast)) {
        dispatch(removeBuff(StatusId.Sharpcast));
        dispatch(buff(StatusId.Firestarter, 30));
      }
    } else if (ice) {
      dispatch(setFireIce(0, ice + 1));
    }
  },
  cost: (state, baseCost) => (umbralIce(state) ? 0 : baseCost),
  castTime: (state, baseCastTime) => (umbralIce(state) ? 0 : baseCastTime),
  isUsable: (state) => paradox(state) > 0,
  isGlowing: (state) => paradox(state) > 0,
  reducedBySpellSpeed: true,
});

const xenoglossy: CombatAction = createCombatAction({
  id: ActionId.Xenoglossy,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Xenoglossy, context, { potency: 800 }));
  },
  isGlowing: (state) => polyglot(state) > 0,
  reducedBySpellSpeed: true,
});

const thunder: CombatAction = createCombatAction({
  id: ActionId.Thunder,
  execute: () => {},
  redirect: () => ActionId.ThunderIII,
  reducedBySpellSpeed: true,
});

const thunder3: CombatAction = createCombatAction({
  id: ActionId.ThunderIII,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.ThunderIII, context, { potency: 50 }));
    dispatch(
      debuff(StatusId.ThunderIII, 30, {
        periodicEffect: () => {
          dispatch(dmgEvent(0, context, { potency: 35 }));
          if (rng(10)) {
            dispatch(buff(StatusId.Thundercloud, 30));
          }
        },
      })
    );
    dispatch(removeBuff(StatusId.Thundercloud));
    dispatch(removeDebuff(StatusId.ThunderIV));

    if (hasBuff(getState(), StatusId.Sharpcast)) {
      dispatch(removeBuff(StatusId.Sharpcast));
      dispatch(buff(StatusId.Thundercloud, 40));
    }
  },
  isGlowing: (state) => hasBuff(state, StatusId.Thundercloud),
  castTime: (state, baseCastTime) => (hasBuff(state, StatusId.Thundercloud) ? 0 : baseCastTime),
  cost: (state, baseCost) => (hasBuff(state, StatusId.Thundercloud) ? 0 : baseCost),
  reducedBySpellSpeed: true,
});

const transpose: CombatAction = createCombatAction({
  id: ActionId.Transpose,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());

    if (astralFire(getState())) {
      dispatch(setFireIce(0, 1));
    } else if (umbralIce(getState())) {
      dispatch(setFireIce(1, 0));
    }
  },
});

const sharpcast: CombatAction = createCombatAction({
  id: ActionId.Sharpcast,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Sharpcast, 30));
  },
  cooldown: () => 30,
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const leyLines: CombatAction = createCombatAction({
  id: ActionId.LeyLines,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.LeyLines, 30, { expireCallback: () => dispatch(removeBuff(StatusId.CircleofPower)) }));
    dispatch(buff(StatusId.CircleofPower, null));
  },
});

const triplecast: CombatAction = createCombatAction({
  id: ActionId.Triplecast,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Triplecast, 15, { stacks: 3 }));
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
});

const amplifier: CombatAction = createCombatAction({
  id: ActionId.Amplifier,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(addPolyglot(1));
  },
  isUsable: (state) => !!(astralFire(state) || umbralIce(state)),
});

const manafont: CombatAction = createCombatAction({
  id: ActionId.Manafont,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.Manafont, { mana: 3000 }));
  },
  cooldown: () => 120,
});

const despair: CombatAction = createCombatAction({
  id: ActionId.Despair,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Despair, context, { potency: 340 }));

    dispatch(setFireIce(3, 0));
  },
  cost: (state) => mana(state),
  isUsable: (state) => astralFire(state) > 0 && mana(state) > 0,
  reducedBySpellSpeed: true,
});

const umbralSoul: CombatAction = createCombatAction({
  id: ActionId.UmbralSoul,
  execute: (dispatch, getState) => {
    dispatch(setFireIce(0, umbralIce(getState()) + 1));
    dispatch(addUmbralHeart(1));
  },
  isUsable: (state) => umbralIce(state) > 0,
  reducedBySpellSpeed: true,
});

const scathe: CombatAction = createCombatAction({
  id: ActionId.Scathe,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Scathe, context, { potency: hasBuff(getState(), StatusId.Sharpcast) || rng(20) ? 100 : 200 }));
    dispatch(removeBuff(StatusId.Sharpcast));
  },
  reducedBySpellSpeed: true,
});

const manaward: CombatAction = createCombatAction({
  id: ActionId.Manaward,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Manaward, 20));
  },
});

const aetherialManipulation: CombatAction = createCombatAction({
  id: ActionId.AetherialManipulation,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

const betweenTheLines: CombatAction = createCombatAction({
  id: ActionId.BetweentheLines,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => hasBuff(state, StatusId.LeyLines),
});

const fire2: CombatAction = createCombatAction({
  id: ActionId.FireII,
  execute: () => {},
  redirect: () => ActionId.HighFireII,
  reducedBySpellSpeed: true,
});

const highFire2: CombatAction = createCombatAction({
  id: ActionId.HighFireII,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.HighFireII, context, { potency: 140 }));

    dispatch(setFireIce(3, 0));
    dispatch(buff(StatusId.EnhancedFlare, null));

    if (context.cost && umbralHeart(getState())) {
      dispatch(removeUmbralHeart(1));
    }
  },
  cost: (state, baseCost) => cost(state, baseCost, 'fire'),
  reducedBySpellSpeed: true,
});

const blizzard2: CombatAction = createCombatAction({
  id: ActionId.BlizzardII,
  execute: () => {},
  redirect: () => ActionId.HighBlizzardII,
  reducedBySpellSpeed: true,
});

const highBlizzard2: CombatAction = createCombatAction({
  id: ActionId.HighBlizzardII,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HighBlizzardII, context, { potency: 140 }));

    dispatch(setFireIce(0, 3));
  },
  cost: (state, baseCost) => cost(state, baseCost, 'ice'),
  reducedBySpellSpeed: true,
});

const freeze: CombatAction = createCombatAction({
  id: ActionId.Freeze,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Freeze, context, { potency: 120 }));

    dispatch(addUmbralHeart(3));
  },
  cost: (state, baseCost) => cost(state, baseCost, 'ice'),
  isUsable: (state) => umbralIce(state) > 0,
  reducedBySpellSpeed: true,
});

const flare: CombatAction = createCombatAction({
  id: ActionId.Flare,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Flare, context, { potency: 220 }));

    dispatch(setFireIce(3, 0));
    dispatch(removeBuff(StatusId.EnhancedFlare));

    if (umbralHeart(getState())) {
      dispatch(removeUmbralHeart(umbralHeart(getState())));
    }
  },
  cost: (state) => (umbralHeart(state) ? Math.round(mana(state) * 0.66) : mana(state)),
  isUsable: (state) => astralFire(state) > 0 && mana(state) > 0,
  reducedBySpellSpeed: true,
});

const thunder2: CombatAction = createCombatAction({
  id: ActionId.ThunderII,
  execute: () => {},
  redirect: () => ActionId.ThunderIV,
  reducedBySpellSpeed: true,
});

const thunder4: CombatAction = createCombatAction({
  id: ActionId.ThunderIV,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.ThunderIV, context, { potency: 50 }));
    dispatch(
      debuff(StatusId.ThunderIV, 30, {
        periodicEffect: () => {
          dispatch(dmgEvent(0, context, { potency: 20 }));
          for (let i = 0; i < 5 /* targets */; i++) {
            if (rng(3)) {
              dispatch(buff(StatusId.Thundercloud, 30));
              break;
            }
          }
        },
      })
    );
    dispatch(removeBuff(StatusId.Thundercloud));
    dispatch(removeDebuff(StatusId.ThunderIII));

    if (hasBuff(getState(), StatusId.Sharpcast)) {
      dispatch(removeBuff(StatusId.Sharpcast));
      dispatch(buff(StatusId.Thundercloud, 40));
    }
  },
  isGlowing: (state) => hasBuff(state, StatusId.Thundercloud),
  castTime: (state, baseCastTime) => (hasBuff(state, StatusId.Thundercloud) ? 0 : baseCastTime),
  cost: (state, baseCost) => (hasBuff(state, StatusId.Thundercloud) ? 0 : baseCost),
  reducedBySpellSpeed: true,
});

const foul: CombatAction = createCombatAction({
  id: ActionId.Foul,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Foul, context, { potency: 600 }));
  },
  isGlowing: (state) => polyglot(state) > 0,
  reducedBySpellSpeed: true,
});

export const blm: CombatAction[] = [
  fire,
  blizzard,
  fire3,
  blizzard3,
  fire4,
  blizzard4,
  paradox1,
  xenoglossy,
  thunder,
  thunder3,
  transpose,
  sharpcast,
  leyLines,
  triplecast,
  amplifier,
  manafont,
  despair,
  umbralSoul,
  scathe,
  manaward,
  aetherialManipulation,
  betweenTheLines,
  fire2,
  highFire2,
  blizzard2,
  highBlizzard2,
  freeze,
  flare,
  thunder2,
  thunder4,
  foul,
];

export const blmEpics = combineEpics(enochianEpic);
