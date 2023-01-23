import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createParameterSelector } from '../../app/hooks';
import { RootState } from '../../app/store';

export interface HotbarConfig {
  buttons: number;
  size: number;
  rows: number;
}

export interface HotbarSlotActionState {
  id: number;
  actionId: number | null;
}

export interface HotbarSlotKeybindState {
  id: number;
  key: string | null;
  modifier: string | null;
}

export interface HotbarState {
  id: number;
  config: HotbarConfig;
  slots: HotbarSlotActionState[];
  keybinds: HotbarSlotKeybindState[];
}

export interface HotbarsState {
  hotbars: HotbarState[];
  keybindingMode: boolean;
}

function createDefaultHotbar(id: number): HotbarState {
  const hotbar: HotbarState = {
    id,
    config: {
      buttons: 12,
      rows: 1,
      size: 1
    },
    keybinds: [],
    slots: [],
  };

  for (let i = 0; i < 12; i++) {
    hotbar.slots[i] = { id: i + 1, actionId: null };
  }

  for (let i = 0; i < 12; i++) {
    let key: string | null = null;
    let modifier: string | null = null;

    if (id <= 3) {
      if (i < 9) {
        key = `Digit${(i + 1).toString()}`;
      } else {
        switch (i) {
          case 9:
            key = 'Digit0';
            break;
          case 10:
            key = 'Minus';
            break;
          case 11:
            key = 'Equal';
            break;
        }
      }

      switch (id) {
        case 2:
          modifier = 'SHIFT';
          break;
        case 3:
          modifier = 'CONTROL';
          break;
      }
    }

    hotbar.keybinds[i] = { id: i + 1, key, modifier };
  }

  return hotbar;
}

const initialState: HotbarsState = {
  hotbars: [
    createDefaultHotbar(1),
    createDefaultHotbar(2),
    createDefaultHotbar(3),
    createDefaultHotbar(4),
    createDefaultHotbar(5),
    createDefaultHotbar(6),
    createDefaultHotbar(7),
    createDefaultHotbar(8),
  ],
  keybindingMode: false,
};

export interface AssingActionPayload {
  hotbarId: number;
  slotId: number;
  actionId: number | null;
}

export interface AssingKeybindPayload {
  hotbarId: number;
  slotId: number;
  key: string | null;
  modifier: string | null;
}

export interface SetSizePaylaod {
  hotbarId: number;
  size: number;
}

export interface SetRowsPaylaod {
  hotbarId: number;
  rows: number;
}

function getHotbar(hotbars: HotbarState[], hotbarId: number) {
  return hotbars.find((h) => h.id === hotbarId)!;
}

function getSlot(hotbars: HotbarState[], hotbarId: number, slotId: number) {
  const hotbar = getHotbar(hotbars, hotbarId);
  return hotbar.slots.find((s) => s.id === slotId)!;
}

function getKeybind(hotbars: HotbarState[], hotbarId: number, slotId: number) {
  const hotbar = getHotbar(hotbars, hotbarId);
  return hotbar.keybinds.find((s) => s.id === slotId)!;
}

export const hotbarSlice = createSlice({
  name: 'hotbars',
  initialState,
  reducers: {
    assignAction: (state, action: PayloadAction<AssingActionPayload>) => {
      const slot = getSlot(state.hotbars, action.payload.hotbarId, action.payload.slotId);
      slot.actionId = action.payload.actionId;
    },
    assignKeybind: (state, action: PayloadAction<AssingKeybindPayload>) => {
      const keybind = getKeybind(state.hotbars, action.payload.hotbarId, action.payload.slotId);
      keybind.key = action.payload.key;
      keybind.modifier = action.payload.modifier;
    },
    setKeybindingMode: (state, action: PayloadAction<boolean>) => {
      state.keybindingMode = action.payload;
    },
    setSize: (state, action: PayloadAction<SetSizePaylaod>) => {
      const config = getHotbar(state.hotbars, action.payload.hotbarId).config;
      config.size = action.payload.size;
    },
    setRows: (state, action: PayloadAction<SetRowsPaylaod>) => {
      const config = getHotbar(state.hotbars, action.payload.hotbarId).config;
      config.rows = action.payload.rows;
    },
  },
});

export const { assignAction, assignKeybind, setKeybindingMode, setSize, setRows } = hotbarSlice.actions;

export const selectHotbars = (state: RootState) => state.hotbars.hotbars;
export const selectKeybindingMode = (state: RootState) => state.hotbars.keybindingMode;

export interface SelectSlotParams {
  hotbarId: number;
  slotId: number;
}

const getHotbarIdParam = createParameterSelector<SelectSlotParams, number>((p) => p.hotbarId);
const getSlotIdParam = createParameterSelector<SelectSlotParams, number>((p) => p.slotId);

export const selectSlot = createSelector(selectHotbars, getHotbarIdParam, getSlotIdParam, (hotbars, hotbarId, slotId) => {
  return getSlot(hotbars, hotbarId, slotId);
});

export const selectKeybind = createSelector(selectHotbars, getHotbarIdParam, getSlotIdParam, (hotbars, hotbarId, slotId) => {
  return getKeybind(hotbars, hotbarId, slotId);
});

export default hotbarSlice.reducer;
