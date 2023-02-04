import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface PlayerState {
  partySize: number;
  level: number;
  skillSpeed: number;
  spellSpeed: number;
  job: string;
  pullTimerDuration: number;
}

const initialState: PlayerState = {
  partySize: 8,
  level: 90,
  skillSpeed: 400,
  spellSpeed: 400,
  job: 'WAR',
  pullTimerDuration: 17,
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setJob: (state, action: PayloadAction<string>) => {
      state.job = action.payload;
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
  },
});

export const { setPartySize, setSkillSpeed, setSpellSpeed, setPullTimerDuration, setJob } = playerSlice.actions;

export const selectJob = (state: RootState) => state.player.job;
export const selectPlayer = (state: RootState) => state.player;
export const selectLevel = (state: RootState) => state.player.level;
export const selectSkillSpeed = (state: RootState) => state.player.skillSpeed;
export const selectSpellSpeed = (state: RootState) => state.player.spellSpeed;
export const selectPartySize = (state: RootState) => state.player.partySize;
export const selectPullTimerDuration = (state: RootState) => state.player.pullTimerDuration;

export default playerSlice.reducer;
