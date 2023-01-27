import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';
import { createMigrate, FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import hotbarReducer from '../features/hotbars/hotbarSlice';
import combatReducer from '../features/combat/combatSlice';
import playerReducer from '../features/player/playerSlice';
import hudReducer from '../features/hud/hudSlice';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { dncEpics } from '../features/combat/jobs/dnc/dnc';
import { roleEpics } from '../features/combat/role';
import { rprEpics } from '../features/combat/jobs/rpr/rpr';

const rootEpic = combineEpics(dncEpics, rprEpics, roleEpics);

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

const rootReducer = combineReducers({
  hotbars: persistReducer({ key: 'store_hotbars', storage, version: 0, migrate: createMigrate(hotbarMigrations) }, hotbarReducer),
  combat: combatReducer,
  player: persistReducer({ key: 'store_player', storage }, playerReducer),
  hud: persistReducer({ key: 'store_hud', storage }, hudReducer),
});

const epicMiddleware = createEpicMiddleware<ReducerAction<any>, ReducerAction<any>, any>();

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(epicMiddleware),
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
