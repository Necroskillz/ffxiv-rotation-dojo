import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface PlayerState {
  partySize: number;
  level: number;
  speed: number;
  job: string;
  pullTimerDuration: number;
}

const initialState: PlayerState = {
  partySize: 8,
  level: 90,
  speed: 539,
  job: 'DNC',
  pullTimerDuration: 17,
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPartySize: (state, action: PayloadAction<number>) => {
      state.partySize = action.payload;
    },
    setSkillSpeed: (state, action: PayloadAction<number>) => {
      state.speed = action.payload;
    },
    setPullTimerDuration: (state, action: PayloadAction<number>) => {
      state.pullTimerDuration = action.payload;
    },
  },
});

export const { setPartySize, setSkillSpeed, setPullTimerDuration } = playerSlice.actions;

export const selectJob = (state: RootState) => state.player.job;
export const selectPlayer = (state: RootState) => state.player;
export const selectLevel = (state: RootState) => state.player.level;
export const selectSpeed = (state: RootState) => state.player.speed;
export const selectPartySize = (state: RootState) => state.player.partySize;
export const selectPullTimerDuration = (state: RootState) => state.player.pullTimerDuration;

export default playerSlice.reducer;
