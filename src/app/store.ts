import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';
import { createMigrate, FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import hotbarReducer from '../features/hotbars/hotbarSlice';
import combatReducer from '../features/combat/combatSlice';
import playerReducer from '../features/player/playerSlice';
import hudReducer from '../features/hud/hudSlice';
import scriptEngineReducer, { scriptEngineEpics } from '../features/script_engine/scriptEngineSlice';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { dncEpics } from '../features/combat/jobs/dnc/dnc';
import { roleEpics } from '../features/combat/role';
import { rprEpics } from '../features/combat/jobs/rpr/rpr';
import { smnEpics } from '../features/combat/jobs/smn/smn';
import { generalEpics } from '../features/combat/general';
import { mchEpics } from '../features/combat/jobs/mch/mch';
import { warEpics } from '../features/combat/jobs/war/war';
import { brdEpics } from '../features/combat/jobs/brd/brd';
import { ninEpics } from '../features/combat/jobs/nin/nin';
import { drgEpics } from '../features/combat/jobs/drg/drg';
import { rdmEpics } from '../features/combat/jobs/rdm/rdm';
import { samEpics } from '../features/combat/jobs/sam/sam';
import { gnbEpics } from '../features/combat/jobs/gnb/gnb';
import { mnkEpics } from '../features/combat/jobs/mnk/mnk';
import { drkEpics } from '../features/combat/jobs/drk/drk';
import { blmEpics } from '../features/combat/jobs/blm/blm';
import { pldEpics } from '../features/combat/jobs/pld/pld';
import { bluEpics } from '../features/combat/jobs/blu/blu';
import { vprEpics } from '../features/combat/jobs/vpr/vpr';
import { pctEpics } from '../features/combat/jobs/pct/pct';

const rootEpic = combineEpics<ReducerAction<any>, ReducerAction<any>, any>(
  dncEpics,
  mchEpics,
  brdEpics,
  drgEpics,
  mnkEpics,
  ninEpics,
  rprEpics,
  samEpics,
  blmEpics,
  smnEpics,
  rdmEpics,
  bluEpics,
  drkEpics,
  gnbEpics,
  pldEpics,
  warEpics,
  vprEpics,
  pctEpics,
  roleEpics,
  generalEpics,
  scriptEngineEpics
);

const hotbarMigrations: any = {
  0: (state: any) => ({
    hotbars: state.hotbars.map((h: any) => ({
      config: h.config,
      id: h.id,
      keybinds: h.keybinds,
      slots: h.slots.map((s: any) => ({
        id: s.id,
        actionId: { DNC: s.actionId },
      })),
    })),
    keybindingMode: state.keybindingMode,
  }),
};

const hudMigrations: any = {
  0: (state: any) => {
    const elements = state.elements;
    elements['ManaBar'].job = ['SMN', 'DRK', 'BLM', 'PLD'];
    return {
      locked: state.locked,
      elements,
    };
  },
  1: (state: any) => {
    const elements = state.elements;
    elements['ManaBar'].job = ['SMN', 'DRK', 'BLM', 'PLD', 'BLU'];
    return {
      locked: state.locked,
      elements,
    };
  },
};

const rootReducer = combineReducers({
  hotbars: persistReducer({ key: 'store_hotbars', storage, version: 0, migrate: createMigrate(hotbarMigrations) }, hotbarReducer),
  combat: combatReducer,
  player: persistReducer({ key: 'store_player', storage }, playerReducer),
  hud: persistReducer({ key: 'store_hud', storage, version: 1, migrate: createMigrate(hudMigrations) }, hudReducer),
  scriptEngine: persistReducer({ key: 'store_scriptEngine', storage }, scriptEngineReducer),
});

const epicMiddleware = createEpicMiddleware<ReducerAction<any>, ReducerAction<any>, any>();

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(epicMiddleware)
});

epicMiddleware.run(rootEpic);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void, ExtraArgType = unknown> = ThunkAction<ReturnType, RootState, ExtraArgType, Action<string>>;
export interface ReducerAction<P> {
  type: string;
  payload: P;
}

export const persistor = persistStore(store);
