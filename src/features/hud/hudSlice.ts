import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface HudElementPlacement {
  xOffset: number;
  yOffset: number;
  isVisible: boolean;
  job?: string | string[];
}

export interface HudState {
  locked: boolean;
  elements: Record<string, HudElementPlacement>;
}

function createDefaultElementPlacement(options: Pick<HudElementPlacement, 'isVisible' | 'job'>): HudElementPlacement {
  return {
    xOffset: 0,
    yOffset: 0,
    isVisible: options.isVisible,
    job: options.job,
  };
}
const initialState: HudState = {
  locked: true,
  elements: {
    ActionList: createDefaultElementPlacement({ isVisible: false }),
    DanceGauge: createDefaultElementPlacement({ isVisible: true, job: 'DNC' }),
    EspritGauge: createDefaultElementPlacement({ isVisible: true, job: 'DNC' }),
    SoulAndShroudGauge: createDefaultElementPlacement({ isVisible: true, job: 'RPR' }),
    DeathGauge: createDefaultElementPlacement({ isVisible: true, job: 'RPR' }),
    Hotbar1: createDefaultElementPlacement({ isVisible: true }),
    Hotbar2: createDefaultElementPlacement({ isVisible: true }),
    Hotbar3: createDefaultElementPlacement({ isVisible: true }),
    Hotbar4: createDefaultElementPlacement({ isVisible: true }),
    Hotbar5: createDefaultElementPlacement({ isVisible: true }),
    Hotbar6: createDefaultElementPlacement({ isVisible: true }),
    Hotbar7: createDefaultElementPlacement({ isVisible: true }),
    Hotbar8: createDefaultElementPlacement({ isVisible: true }),
    HotbarConfig1: createDefaultElementPlacement({ isVisible: false }),
    HotbarConfig2: createDefaultElementPlacement({ isVisible: false }),
    HotbarConfig3: createDefaultElementPlacement({ isVisible: false }),
    HotbarConfig4: createDefaultElementPlacement({ isVisible: false }),
    HotbarConfig5: createDefaultElementPlacement({ isVisible: false }),
    HotbarConfig6: createDefaultElementPlacement({ isVisible: false }),
    HotbarConfig7: createDefaultElementPlacement({ isVisible: false }),
    HotbarConfig8: createDefaultElementPlacement({ isVisible: false }),
    Settings: createDefaultElementPlacement({ isVisible: false }),
    Buffs: createDefaultElementPlacement({ isVisible: true }),
    Debuffs: createDefaultElementPlacement({ isVisible: true }),
    CastBar: createDefaultElementPlacement({ isVisible: true }),
    PullTimer: createDefaultElementPlacement({ isVisible: true }),
    ManaBar: createDefaultElementPlacement({ isVisible: true, job: ['SMN'] }),
    Pet: createDefaultElementPlacement({ isVisible: true, job: ['SMN'] }),
    AetherflowGauge: createDefaultElementPlacement({ isVisible: true, job: ['SMN'] }),
    TranceGauge: createDefaultElementPlacement({ isVisible: true, job: ['SMN'] }),
    HeatGauge: createDefaultElementPlacement({ isVisible: true, job: ['MCH'] }),
    BeastGauge: createDefaultElementPlacement({ isVisible: true, job: ['WAR'] }),
    SongGauge: createDefaultElementPlacement({ isVisible: true, job: ['BRD'] }),
    HutonGauge: createDefaultElementPlacement({ isVisible: true, job: ['NIN'] }),
    NinkiGauge: createDefaultElementPlacement({ isVisible: true, job: ['NIN'] }),
    DragonGauge: createDefaultElementPlacement({ isVisible: true, job: ['DRG'] }),
    BalanceGauge: createDefaultElementPlacement({ isVisible: true, job: ['RDM'] }),
    SenGauge: createDefaultElementPlacement({ isVisible: true, job: ['SAM'] }),
    KenkiGauge: createDefaultElementPlacement({ isVisible: true, job: ['SAM'] }),
  },
};

export interface SetVisibilityActionPayload {
  element: string;
  isVisible: boolean;
}

export interface SetOffsetActionPayload {
  element: string;
  xOffset: number;
  yOffset: number;
}

function setElement(state: HudState, name: string, action: (element: HudElementPlacement) => void) {
  if (!state.elements[name]) {
    state.elements[name] = Object.assign({}, initialState.elements[name]);
  }

  action(state.elements[name]);
}

export const hudSlice = createSlice({
  name: 'hotbars',
  initialState,
  reducers: {
    setVisility: (state, action: PayloadAction<SetVisibilityActionPayload>) => {
      setElement(state, action.payload.element, (e) => (e.isVisible = action.payload.isVisible));
    },
    setOffset: (state, action: PayloadAction<SetOffsetActionPayload>) => {
      setElement(state, action.payload.element, (e) => {
        e.xOffset = action.payload.xOffset;
        e.yOffset = action.payload.yOffset;
      });
    },
    lock: (state, action: PayloadAction<boolean>) => {
      state.locked = action.payload;
    },
  },
});

export const { setVisility, setOffset, lock } = hudSlice.actions;

export const selectElements = (state: RootState) => state.hud.elements;
export const selectLock = (state: RootState) => state.hud.locked;

export const selectElement = createSelector(
  selectElements,
  (_: any, name: string) => name,
  (elements, name) => elements[name] || initialState.elements[name]
);

export default hudSlice.reducer;
