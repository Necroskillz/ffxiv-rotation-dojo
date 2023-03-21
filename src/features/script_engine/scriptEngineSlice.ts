import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { combineEpics, Epic } from 'redux-observable';
import { filter, map } from 'rxjs';
import { RootState, AppThunk } from '../../app/store';
import { selectJob, setJob } from '../player/playerSlice';
import { parse } from './parser';
import { stateInitializer } from './state_initializer';

export interface ScriptState {
  name: string;
  job: string;
  script: string;
  errors: string[];
  active: boolean;
}

export interface ScriptEngineState {
  scripts: ScriptState[];
}

const initialState: ScriptEngineState = {
  scripts: [],
};

function run(state: ScriptState) {
  const script = parse(state.script);
  stateInitializer.clear();

  if (script.errors.length > 0) {
    state.errors = script.errors.map((error) => `Error parsing script on line ${error.line}: ${error.message}`);
  } else {
    state.errors = script.execute();
  }
}

interface ScriptPayload {
  name: string;
  script: string;
  job: string;
}

interface DeleteScriptPayload {
  name: string;
  job: string;
}

export const scriptEngineSlice = createSlice({
  name: 'scriptEngine',
  initialState,
  reducers: {
    setScript: (state, action: PayloadAction<ScriptPayload>) => {
      state.scripts.filter((script) => script.job === action.payload.job).forEach((script) => (script.active = false));

      if (!action.payload.name) {
        stateInitializer.clear();

        return;
      }

      let script = state.scripts.find((script) => script.name === action.payload.name);

      if (script) {
        script.script = action.payload.script;
        script.active = true;
      } else {
        script = {
          name: action.payload.name,
          job: action.payload.job,
          script: action.payload.script,
          errors: [],
          active: true,
        };

        state.scripts.push(script);
      }

      run(script);
    },
    deleteScript: (state, action: PayloadAction<DeleteScriptPayload>) => {
      state.scripts = state.scripts.filter((script) => !(script.name === action.payload.name && script.job === action.payload.job));
    },
  },
});

export const { setScript, deleteScript } = scriptEngineSlice.actions;

export const init = (): AppThunk => (dispatch, getState) => {
  const script = selectScripts(getState()).find((script) => script.active);

  if (script) {
    dispatch(setScript(script));
  } else {
    dispatch(setScript({ name: '', script: '', job: selectJob(getState()) }));
  }
};

export const selectScripts = (state: RootState) => {
  const job = selectJob(state);

  return state.scriptEngine.scripts.filter((script) => script.job === job);
};
export const selectIsScriptActive = (state: RootState) => {
  const scripts = selectScripts(state);

  return scripts.some((script) => script.active);
};

export default scriptEngineSlice.reducer;

const reinitWhenJobChanges: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === setJob.type),
    map(() => init())
  );

export const scriptEngineEpics = combineEpics(reinitWhenJobChanges);
