import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface BlueMagicSpellSet {
  id: number;
  spells: number[];
  active: boolean;
}

export interface PlayerState {
  partySize: number;
  level: number;
  skillSpeed: number;
  spellSpeed: number;
  job: string;
  pullTimerDuration: number;
  blueMagicSpellbook: BlueMagicSpellSet[];
}

const initialState: PlayerState = {
  partySize: 8,
  level: 90,
  skillSpeed: 400,
  spellSpeed: 400,
  job: 'DRK',
  pullTimerDuration: 17,
  blueMagicSpellbook: [
    { id: 1, spells: [], active: true },
    { id: 2, spells: [], active: false },
    { id: 3, spells: [], active: false },
    { id: 4, spells: [], active: false },
    { id: 5, spells: [], active: false },
  ],
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setJob: (state, action: PayloadAction<string>) => {
      state.job = action.payload;

      if (action.payload === 'BLU') {
        state.level = 70;
      } else {
        state.level = 90;
      }
    },
    setPartySize: (state, action: PayloadAction<number>) => {
      state.partySize = action.payload;
    },
    setSkillSpeed: (state, action: PayloadAction<number>) => {
      state.skillSpeed = action.payload;
    },
    setSpellSpeed: (state, action: PayloadAction<number>) => {
      state.spellSpeed = action.payload;
    },
    setPullTimerDuration: (state, action: PayloadAction<number>) => {
      state.pullTimerDuration = action.payload;
    },
    addBluSpell: (state, action: PayloadAction<number>) => {
      const spellSet = state.blueMagicSpellbook.find((set) => set.active);

      if (spellSet) {
        spellSet.spells.push(action.payload);
      }
    },
    removeBluSpell: (state, action: PayloadAction<number>) => {
      const spellSet = state.blueMagicSpellbook.find((set) => set.active);

      if (spellSet) {
        spellSet.spells = spellSet.spells.filter((spell) => spell !== action.payload);
      }
    },
    setBluSpellSet: (state, action: PayloadAction<number>) => {
      state.blueMagicSpellbook.forEach((set) => (set.active = false));
      state.blueMagicSpellbook.find((set) => set.id === action.payload)!.active = true;
    },
  },
});

export const { setPartySize, setSkillSpeed, setSpellSpeed, setPullTimerDuration, setJob, addBluSpell, removeBluSpell, setBluSpellSet } = playerSlice.actions;

export const selectJob = (state: RootState) => state.player.job;
export const selectPlayer = (state: RootState) => state.player;
export const selectLevel = (state: RootState) => state.player.level;
export const selectSkillSpeed = (state: RootState) => state.player.skillSpeed;
export const selectSpellSpeed = (state: RootState) => state.player.spellSpeed;
export const selectPartySize = (state: RootState) => state.player.partySize;
export const selectPullTimerDuration = (state: RootState) => state.player.pullTimerDuration;
export const selectBlueMagicSpellBook = (state: RootState) => state.player.blueMagicSpellbook;
export const selectBlueMagicSpellSet = (state: RootState) => state.player.blueMagicSpellbook.find((set) => set.active)!;

export default playerSlice.reducer;
