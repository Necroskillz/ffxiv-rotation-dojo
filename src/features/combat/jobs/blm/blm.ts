import { combineEpics, Epic } from 'redux-observable';
import { filter, switchMap, interval, map, takeUntil, first } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
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
  addAstralSoul,
  setAstralSoul,
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

function astralSoul(state: RootState) {
  return resource(state, 'astralSoul');
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

function iceMana(state: RootState) {
  switch (umbralIce(state)) {
    case 1:
      return 2500;
    case 2:
      return 5000;
    case 3:
      return 10000;
  }
}

const setFireIce =
  (fire: number, ice: number): AppThunk =>
  (dispatch, getState) => {
    fire = Math.min(fire, 3);
    ice = Math.min(ice, 3);

    const state = getState();
    const currentFire = astralFire(state);
    const currentIce = umbralIce(state);

    if (currentIce === 3 && umbralHeart(getState()) === 3 && fire > 0) {
      dispatch(setParadox(1));
    }

    if ((currentIce === 0 && ice > 0) || (currentFire === 0 && fire > 0)) {
      dispatch(buff(StatusId.Thunderhead));
    }

    if (fire === 0) {
      dispatch(removeBuff(StatusId.AstralFireActive));
      dispatch(setParadox(0));
      dispatch(setAstralSoul(0));
    } else {
      dispatch(buff(StatusId.AstralFireActive, { stacks: fire }));
    }

    if (ice === 0) {
      dispatch(removeBuff(StatusId.UmbralIceActive));
    } else {
      dispatch(buff(StatusId.UmbralIceActive, { stacks: ice }));
    }

    if (fire === 0 && ice === 0) {
      dispatch(removeBuff(StatusId.EnochianActive));
    } else if (!hasBuff(getState(), StatusId.EnochianActive)) {
      dispatch(buff(StatusId.EnochianActive));
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
    if (astralFire(state) || umbralIce(state)) {
      return 0;
    }

    return baseCost;
  }
}

function adjustedPotency(state: RootState, potency: number, aspect: 'fire' | 'ice') {
  if (aspect === 'fire') {
    if (umbralIce(state)) {
      return Math.round(potency * (1 - umbralIce(state) / 10));
    } else if (astralFire(state)) {
      switch (astralFire(state)) {
        case 1:
          return potency;
        case 2:
          return Math.round(potency * 1.6);
        case 3:
          return Math.round(potency * 1.8);
      }
    }

    return potency;
  } else {
    if (astralFire(state)) {
      return Math.round(potency * (1 - astralFire(state) / 10));
    }

    return potency;
  }
}

const enochianActive: CombatStatus = createCombatStatus({
  id: StatusId.EnochianActive,
  duration: null,
  isHarmful: false,
  isVisible: false,
});

const astralFireActive: CombatStatus = createCombatStatus({
  id: StatusId.AstralFireActive,
  duration: 15,
  isHarmful: false,
  isVisible: false,
  onExpire: (dispatch, getState) => {
    dispatch(removeBuff(StatusId.EnochianActive));
    dispatch(removeUmbralHeart(umbralHeart(getState())));
    dispatch(setParadox(0));
    dispatch(setAstralSoul(0));
  },
});

const umbralIceActive: CombatStatus = createCombatStatus({
  id: StatusId.UmbralIceActive,
  duration: 15,
  isHarmful: false,
  isVisible: false,
  onExpire: (dispatch, getState) => {
    dispatch(removeBuff(StatusId.EnochianActive));
    dispatch(removeUmbralHeart(umbralHeart(getState())));
  },
});

const firestarterStatus: CombatStatus = createCombatStatus({
  id: StatusId.Firestarter,
  duration: 30,
  isHarmful: false,
});

const thunderheadStatus: CombatStatus = createCombatStatus({
  id: StatusId.Thunderhead,
  duration: 30,
  isHarmful: false,
});

const highThunderStatus: CombatStatus = createCombatStatus({
  id: StatusId.HighThunder,
  duration: 30,
  isHarmful: true,
  tick: (dispatch) => {
    dispatch(event(0, { potency: 55 }));
  },
});

const manawardStatus: CombatStatus = createCombatStatus({
  id: StatusId.Manaward,
  duration: 20,
  isHarmful: false,
});

const highThunderIIStatus: CombatStatus = createCombatStatus({
  id: StatusId.HighThunderII,
  duration: 30,
  isHarmful: true,
  tick: (dispatch) => {
    dispatch(event(0, { potency: 40 }));
  },
});

const leyLinesStatus: CombatStatus = createCombatStatus({
  id: StatusId.LeyLines,
  duration: 30,
  isHarmful: false,
  onExpire: (dispatch) => {
    dispatch(removeBuff(StatusId.CircleofPower));
  },
});

const circleOfPowerStatus: CombatStatus = createCombatStatus({
  id: StatusId.CircleofPower,
  duration: null,
  isHarmful: false,
});

const triplecastStatus: CombatStatus = createCombatStatus({
  id: StatusId.Triplecast,
  duration: 15,
  isHarmful: false,
  initialStacks: 3,
});

const fire: CombatAction = createCombatAction({
  id: ActionId.Fire,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Fire, context, { potency: adjustedPotency(getState(), 180, 'fire') }));

    if (umbralIce(getState()) > 0) {
      dispatch(setFireIce(0, 0));
    } else {
      dispatch(setFireIce(astralFire(getState()) + 1, 0));
    }

    if (rng(40)) {
      dispatch(buff(StatusId.Firestarter));
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
    dispatch(dmgEvent(ActionId.Blizzard, context, { potency: adjustedPotency(getState(), 180, 'ice'), mana: iceMana(getState()) }));

    if (astralFire(getState()) > 0) {
      dispatch(setFireIce(0, 0));
    } else {
      dispatch(setFireIce(0, umbralIce(getState()) + 1));
    }
  },
  cost: (state, baseCost) => cost(state, baseCost, 'ice'),
  reducedBySpellSpeed: true,
});

const fire3: CombatAction = createCombatAction({
  id: ActionId.FireIII,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FireIII, context, { potency: adjustedPotency(getState(), 280, 'fire') }));

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
    dispatch(dmgEvent(ActionId.FireIV, context, { potency: adjustedPotency(getState(), 310, 'fire') }));
    dispatch(addAstralSoul(1));

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
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.BlizzardIII, context, { potency: adjustedPotency(getState(), 280, 'ice'), mana: iceMana(getState()) }));

    dispatch(setFireIce(0, 3));
  },
  cost: (state, baseCost) => cost(state, baseCost, 'ice'),
  reducedBySpellSpeed: true,
});

const blizzard4: CombatAction = createCombatAction({
  id: ActionId.BlizzardIV,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.BlizzardIV, context, { potency: adjustedPotency(getState(), 310, 'ice'), mana: iceMana(getState()) }));

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
    dispatch(setFireIce(astralFire(getState()) + 1, 0));
    dispatch(buff(StatusId.Firestarter));
  },
  isUsable: (state) => paradox(state) > 0,
  isGlowing: (state) => paradox(state) > 0,
  reducedBySpellSpeed: true,
});

const xenoglossy: CombatAction = createCombatAction({
  id: ActionId.Xenoglossy,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Xenoglossy, context, { potency: 880 }));
  },
  isGlowing: (state) => polyglot(state) > 0,
  reducedBySpellSpeed: true,
});

const thunder: CombatAction = createCombatAction({
  id: ActionId.Thunder,
  execute: () => {},
  redirect: () => ActionId.HighThunder,
  reducedBySpellSpeed: true,
});

const thunder3: CombatAction = createCombatAction({
  id: ActionId.ThunderIII,
  execute: () => {},
  redirect: () => ActionId.HighThunder,
  reducedBySpellSpeed: true,
});

const highThunder: CombatAction = createCombatAction({
  id: ActionId.HighThunder,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HighThunder, context, { potency: 200 }));
    dispatch(debuff(StatusId.HighThunder));
    dispatch(removeBuff(StatusId.Thunderhead));
    dispatch(removeDebuff(StatusId.HighThunderII));
  },
  isUsable: (state) => hasBuff(state, StatusId.Thunderhead),
  isGlowing: (state) => hasBuff(state, StatusId.Thunderhead),
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

const leyLines: CombatAction = createCombatAction({
  id: ActionId.LeyLines,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.LeyLines));
    dispatch(buff(StatusId.CircleofPower));
  },
  redirect: (state) => (hasBuff(state, StatusId.LeyLines) ? ActionId.Retrace : ActionId.LeyLines),
  actionChangeTo: ActionId.Retrace,
});

const retrace: CombatAction = createCombatAction({
  id: ActionId.Retrace,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => hasBuff(state, StatusId.LeyLines),
});

const triplecast: CombatAction = createCombatAction({
  id: ActionId.Triplecast,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Triplecast));
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
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.Manafont, { mana: 10000 - mana(getState()) }));
    if (astralFire(getState()) > 0) {
      dispatch(buff(StatusId.Thunderhead));
    }
    dispatch(setFireIce(3, 0));
    dispatch(addUmbralHeart(3));
    dispatch(setParadox(1));
  },
  cooldown: () => 100,
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
    dispatch(event(ActionId.UmbralSoul, { mana: iceMana(getState()) }));
  },
  isUsable: (state) => umbralIce(state) > 0,
  reducedBySpellSpeed: true,
});

const scathe: CombatAction = createCombatAction({
  id: ActionId.Scathe,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Scathe, context, { potency: rng(20) ? 100 : 200 }));
  },
  reducedBySpellSpeed: true,
});

const manaward: CombatAction = createCombatAction({
  id: ActionId.Manaward,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Manaward));
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
    dispatch(dmgEvent(ActionId.HighFireII, context, { potency: adjustedPotency(getState(), 100, 'fire') }));

    dispatch(setFireIce(3, 0));

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
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.HighBlizzardII, context, { potency: adjustedPotency(getState(), 100, 'ice'), mana: iceMana(getState()) }));

    dispatch(setFireIce(0, 3));
  },
  cost: (state, baseCost) => cost(state, baseCost, 'ice'),
  reducedBySpellSpeed: true,
});

const freeze: CombatAction = createCombatAction({
  id: ActionId.Freeze,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Freeze, context, { potency: adjustedPotency(getState(), 120, 'ice'), mana: iceMana(getState()) }));

    dispatch(addUmbralHeart(3));
  },
  cost: (state, baseCost) => cost(state, baseCost, 'ice'),
  isUsable: (state) => umbralIce(state) > 0,
  reducedBySpellSpeed: true,
});

const flare: CombatAction = createCombatAction({
  id: ActionId.Flare,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Flare, context, { potency: adjustedPotency(getState(), 240, 'fire') }));

    dispatch(setFireIce(3, 0));
    dispatch(addAstralSoul(3));

    if (umbralHeart(getState())) {
      dispatch(removeUmbralHeart(umbralHeart(getState())));
    }
  },
  cost: (state) => (umbralHeart(state) ? Math.round(mana(state) * 0.66) : mana(state)),
  isUsable: (state) => astralFire(state) > 0 && mana(state) > 0,
  reducedBySpellSpeed: true,
});

const flareStar: CombatAction = createCombatAction({
  id: ActionId.FlareStar,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Flare, context, { potency: adjustedPotency(getState(), 400, 'fire') }));
  },
  cost: () => 6,
  reducedBySpellSpeed: true,
  isGlowing: (state) => astralSoul(state) === 6,
});

const thunder2: CombatAction = createCombatAction({
  id: ActionId.ThunderII,
  execute: () => {},
  redirect: () => ActionId.HighThunderII,
  reducedBySpellSpeed: true,
});

const thunder4: CombatAction = createCombatAction({
  id: ActionId.ThunderIV,
  execute: () => {},
  redirect: () => ActionId.HighThunderII,
  reducedBySpellSpeed: true,
});

const highThunderII: CombatAction = createCombatAction({
  id: ActionId.HighThunderII,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HighThunderII, context, { potency: 100 }));
    dispatch(debuff(StatusId.HighThunderII));
    dispatch(removeBuff(StatusId.Thunderhead));
    dispatch(removeDebuff(StatusId.HighThunder));
  },
  isUsable: (state) => hasBuff(state, StatusId.Thunderhead),
  isGlowing: (state) => hasBuff(state, StatusId.Thunderhead),
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

export const blmStatuses = [
  enochianActive,
  astralFireActive,
  umbralIceActive,
  highThunderStatus,
  highThunderIIStatus,
  thunderheadStatus,
  firestarterStatus,
  triplecastStatus,
  manawardStatus,
  leyLinesStatus,
  circleOfPowerStatus,
];

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
  highThunder,
  highThunderII,
  flareStar,
  retrace,
];

export const blmEpics = combineEpics(enochianEpic);
