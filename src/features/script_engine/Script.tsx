import { FormEvent, useEffect, useReducer } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectElement, setVisility } from '../hud/hudSlice';
import { selectJob } from '../player/playerSlice';
import { deleteScript, selectScripts, setScript } from './scriptEngineSlice';
import Select from 'react-select';
import { Option } from '../../types';
import { CloseButton } from '../../components/CloseButton';

interface ScriptState {
  script: string;
  name: string;
}

export const Script = () => {
  const hudElement = useAppSelector((state) => selectElement(state, 'Script'));
  const dispatch = useAppDispatch();
  const job = useAppSelector(selectJob);
  const scripts = useAppSelector(selectScripts);

  const activeScript = scripts.find((s) => s.active);

  const [state, setState] = useReducer((state: ScriptState, updates: Partial<ScriptState>) => ({ ...state, ...updates }), {
    script: activeScript?.script || '',
    name: '',
  });

  const scriptOptions = [{ value: '', label: '<no script>' }].concat(scripts.map((s) => ({ value: s.name, label: s.name })));

  useEffect(() => {
    setState({ script: activeScript?.script || '' });
  }, [activeScript]);

  function close() {
    dispatch(setVisility({ element: 'Script', isVisible: false }));
  }

  if (!hudElement.isVisible) {
    return null;
  }

  function saveScript(event: FormEvent<HTMLFormElement>) {
    dispatch(setScript({ script: state.script!, job, name: activeScript!.name, active: true }));

    event.preventDefault();
  }

  function addNewScript(event: FormEvent<HTMLFormElement>) {
    dispatch(setScript({ script: '', job, name: state.name!, active: true }));

    setState({ name: '', script: '' });

    event.preventDefault();
  }

  function setActiveScript(value: Option<string> | null) {
    if (value?.value) {
      const script = scripts.find((s) => s.name === value.value);
      dispatch(setScript({ ...script!, active: true }));
    } else {
      dispatch(setScript({ script: '', job, name: '', active: true }));
    }
  }

  function deleteActiveScipt() {
    if (window.confirm(`Are you sure you want to delete ${activeScript!.name}?`)) {
      dispatch(deleteScript({ job, name: activeScript!.name }));
    }
  }

  return (
    <HudItem name="Script" dragHandle=".title" defaultPosition={{ x: 20, y: 20 }} z={100}>
      <div className="bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[900px] h-[1000px] overflow-auto">
        <div className="title grid grid-cols-2 items-center mb-4">
          <h2 className="text-2xl">Script</h2>
          <CloseButton onClick={close} />
        </div>

        <div className="text-sm my-4">
          For more information on how to use scripts, please see the{' '}
          <a
            className="text-xiv-orange"
            target="_blank"
            rel="noreferrer"
            href="https://github.com/Necroskillz/ffxiv-rotation-dojo/wiki/Scripts"
          >
            wiki
          </a>
          .
        </div>

        <div className="grid grid-flow-col auto-cols-max justify-items-start gap-2 mb-4">
          <Select
            className="w-[250px]"
            options={scriptOptions}
            value={scriptOptions.find((s) => s.value === activeScript?.name) || scriptOptions[0]}
            styles={{ option: (styles) => ({ ...styles, color: '#000' }) }}
            onChange={setActiveScript}
          />

          <form onSubmit={addNewScript}>
            <div className="grid grid-flow-col auto-cols-max justify-items-start gap-2 h-9">
              <input type="text" onChange={(e) => setState({ name: e.target.value })} value={state.name} />

              <button className="border px-1 rounded disabled:opacity-25" type="submit" disabled={!state.name}>
                Add
              </button>
            </div>
          </form>
        </div>
        {activeScript && (
          <form onSubmit={saveScript}>
            <div className="grid grid-flow-row auto-rows-max justify-items-start gap-4">
              <div className="grid grid-flow-row auto-rows-max justify-items-start gap-1">
                {activeScript?.errors.map((e) => (
                  <div key={e} className="text-red-500">
                    {e}
                  </div>
                ))}
              </div>

              <textarea
                value={state.script}
                onChange={(e) => setState({ script: e.target.value })}
                className="w-[800px] h-[580px] text-black"
              ></textarea>

              <div className="grid grid-flow-col auto-cols-max justify-items-start gap-1">
                <button className="border px-1 rounded disabled:opacity-25" type="submit" disabled={state.script === activeScript.script}>
                  Save
                </button>
                <button className="border px-1 rounded disabled:opacity-25" type="button" onClick={deleteActiveScipt}>
                  Delete
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </HudItem>
  );
};
