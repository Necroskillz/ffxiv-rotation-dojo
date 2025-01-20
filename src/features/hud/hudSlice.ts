import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Local imports
import { RootState } from '@/app/store';

export interface HudElement {
  xOffset: number;
  yOffset: number;
  isVisible: boolean;
  job?: string | string[];
  extraOptions: any;
}

export interface HudState {
  locked: boolean;
  elements: Record<string, HudElement>;
}

function createDefaultElementPlacement(options: Pick<HudElement, 'isVisible' | 'job'>): HudElement {
  return {
    xOffset: 0,
    yOffset: 0,
    isVisible: options.isVisible,
    job: options.job,
    extraOptions: null,
  };
}
const initialState: HudState = {
  locked: true,
  elements: {
    Help: createDefaultElementPlacement({ isVisible: true }),
    ActionList: createDefaultElementPlacement({ isVisible: false }),
    Settings: createDefaultElementPlacement({ isVisible: false }),
    HudEditor: createDefaultElementPlacement({ isVisible: false }),
    Script: createDefaultElementPlacement({ isVisible: false }),
    ImportExport: createDefaultElementPlacement({ isVisible: false }),
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
    Buffs: createDefaultElementPlacement({ isVisible: true }),
    Debuffs: createDefaultElementPlacement({ isVisible: true }),
    PlayerDebuffs: createDefaultElementPlacement({ isVisible: true }),
    CastBar: createDefaultElementPlacement({ isVisible: true }),
    PullTimer: createDefaultElementPlacement({ isVisible: true }),
    BuffScrollingText: createDefaultElementPlacement({ isVisible: true }),
    DebuffScrollingText: createDefaultElementPlacement({ isVisible: true }),
    ResourceScrollingText: createDefaultElementPlacement({ isVisible: true }),
    DamageScrollingText: createDefaultElementPlacement({ isVisible: true }),
    DotScrollingText: createDefaultElementPlacement({ isVisible: true }),
    PotencyPerSecondDisplay: createDefaultElementPlacement({ isVisible: true }),
    DanceGauge: createDefaultElementPlacement({ isVisible: true, job: 'DNC' }),
    EspritGauge: createDefaultElementPlacement({ isVisible: true, job: 'DNC' }),
    SoulAndShroudGauge: createDefaultElementPlacement({ isVisible: true, job: 'RPR' }),
    DeathGauge: createDefaultElementPlacement({ isVisible: true, job: 'RPR' }),
    ManaBar: createDefaultElementPlacement({ isVisible: true, job: ['SMN', 'DRK', 'BLM', 'PLD', 'BLU'] }),
    Pet: createDefaultElementPlacement({ isVisible: true, job: ['SMN'] }),
    AetherflowGauge: createDefaultElementPlacement({ isVisible: true, job: ['SMN'] }),
    TranceGauge: createDefaultElementPlacement({ isVisible: true, job: ['SMN'] }),
    HeatGauge: createDefaultElementPlacement({ isVisible: true, job: ['MCH'] }),
    BeastGauge: createDefaultElementPlacement({ isVisible: true, job: ['WAR'] }),
    SongGauge: createDefaultElementPlacement({ isVisible: true, job: ['BRD'] }),
    KazematoiGauge: createDefaultElementPlacement({ isVisible: true, job: ['NIN'] }),
    NinkiGauge: createDefaultElementPlacement({ isVisible: true, job: ['NIN'] }),
    DragonGauge: createDefaultElementPlacement({ isVisible: true, job: ['DRG'] }),
    BalanceGauge: createDefaultElementPlacement({ isVisible: true, job: ['RDM'] }),
    SenGauge: createDefaultElementPlacement({ isVisible: true, job: ['SAM'] }),
    KenkiGauge: createDefaultElementPlacement({ isVisible: true, job: ['SAM'] }),
    PowderGauge: createDefaultElementPlacement({ isVisible: true, job: ['GNB'] }),
    ChakraGauge: createDefaultElementPlacement({ isVisible: true, job: ['MNK'] }),
    MastersGauge: createDefaultElementPlacement({ isVisible: true, job: ['MNK'] }),
    DarksideGauge: createDefaultElementPlacement({ isVisible: true, job: ['DRK'] }),
    BloodGauge: createDefaultElementPlacement({ isVisible: true, job: ['DRK'] }),
    ElementalGauge: createDefaultElementPlacement({ isVisible: true, job: ['BLM'] }),
    AstralSoulGauge: createDefaultElementPlacement({ isVisible: true, job: ['BLM'] }),
    OathGauge: createDefaultElementPlacement({ isVisible: true, job: ['PLD'] }),
    MimicryGauge: createDefaultElementPlacement({ isVisible: true, job: ['BLU'] }),
    SerpentsOfferingsGauge: createDefaultElementPlacement({ isVisible: true, job: ['VPR'] }),
    VipersightGauge: createDefaultElementPlacement({ isVisible: true, job: ['VPR'] }),
    PaletteGauge: createDefaultElementPlacement({ isVisible: true, job: ['PCT'] }),
    CanvasGauge: createDefaultElementPlacement({ isVisible: true, job: ['PCT'] }),
    ActionChangeSettings: createDefaultElementPlacement({ isVisible: false }),
    Positionals: createDefaultElementPlacement({ isVisible: true, job: ['SAM', 'NIN', 'MNK', 'RPR', 'VPR', 'DRG', 'BLU'] }),
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

export interface SetExtraOptionsPayload {
  element: string;
  extraOptions: any;
}

function setElement(state: HudState, name: string, action: (element: HudElement) => void) {
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
    setExtraOptions: (state, action: PayloadAction<SetExtraOptionsPayload>) => {
      setElement(state, action.payload.element, (e) => (e.extraOptions = action.payload.extraOptions));
    },
    lock: (state, action: PayloadAction<boolean>) => {
      state.locked = action.payload;
    },
  },
});

export const { setVisility, setOffset, setExtraOptions, lock } = hudSlice.actions;

export const selectElements = (state: RootState) => state.hud.elements;
export const selectLock = (state: RootState) => state.hud.locked;

export const selectElement = createSelector(
  selectElements,
  (_: any, name: string) => name,
  (elements, name) => elements[name] || initialState.elements[name]
);

export default hudSlice.reducer;
