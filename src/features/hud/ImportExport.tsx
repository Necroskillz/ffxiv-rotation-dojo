import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { store } from '@/app/store';
import { CloseButton } from '@/components/CloseButton';
import { Option } from '@/types';
import Select from 'react-select';
import { useReducer } from 'react';
import { HotbarConfig, HotbarSlotActionState, HotbarSlotKeybindState, setSize, setRows, removeAllActions, assignAction, removeAllKeybinds, assignKeybind } from '../hotbars/hotbarSlice';
import { deleteAllScripts, setScript } from '../script_engine/scriptEngineSlice';
import { HudItem } from './HudItem';
import { HudElement, selectElement, setVisility, setOffset } from './hudSlice';
import { BlueMagicSpellSet, ActionChangeSettings, setActionChangeSettings, setBlueMagicSpellbook } from '../player/playerSlice';


interface ImportExportState {
  data: string;
  layout: boolean;
  hotbarMapping: boolean;
  keybindings: boolean;
  scripts: boolean;
  scriptMergeMode: string;
  blueMagicSpellbook: boolean;
  actionChangeSettings: boolean;
}

interface ImportExportData {
  layout?: { elements: Record<string, HudElement>; hotbars: { id: number; config: HotbarConfig }[] };
  hotbarMapping?: { id: number; slots: HotbarSlotActionState[] }[];
  keybindings?: { id: number; keybinds: HotbarSlotKeybindState[] }[];
  scripts?: { name: string; job: string; script: string }[];
  blueMagicSpellbook?: BlueMagicSpellSet[];
  actionChangeSettings?: Record<number, ActionChangeSettings>;
}

const scriptMergeMode: Option<string>[] = [
  { value: 'Merge', label: 'Keep existing and overwrite if name matches' },
  { value: 'Replace', label: 'Remove existing and only use imported' },
];

const checkboxOptions = [
  { id: 'layout' as const, label: 'Layout' },
  { id: 'hotbarMapping' as const, label: 'Hotbar skills mapping' },
  { id: 'keybindings' as const, label: 'Keybindings' },
  { id: 'scripts' as const, label: 'Scripts' },
  { id: 'blueMagicSpellbook' as const, label: 'BLU Spellbook' },
  { id: 'actionChangeSettings' as const, label: 'Action change settings' },
] as const;

export const ImportExport = () => {
  const hudElement = useAppSelector((state) => selectElement(state, 'ImportExport'));
  const dispatch = useAppDispatch();
  const [state, setState] = useReducer((state: ImportExportState, updates: Partial<ImportExportState>) => ({ ...state, ...updates }), {
    data: '',
    layout: true,
    hotbarMapping: true,
    keybindings: true,
    scripts: true,
    scriptMergeMode: 'Merge',
    blueMagicSpellbook: true,
    actionChangeSettings: true,
  });

  function close() {
    dispatch(setVisility({ element: 'ImportExport', isVisible: false }));
  }

  if (!hudElement.isVisible) {
    return null;
  }

  function importData() {
    const data: ImportExportData = JSON.parse(state.data);

    if (data.layout && state.layout) {
      Object.keys(data.layout.elements).forEach((name) => {
        const element = data.layout!.elements[name];
        dispatch(setOffset({ element: name, xOffset: element.xOffset, yOffset: element.yOffset }));
        dispatch(setVisility({ element: name, isVisible: element.isVisible }));
      });

      data.layout.hotbars.forEach((h) => {
        dispatch(setSize({ hotbarId: h.id, size: h.config.size }));
        dispatch(setRows({ hotbarId: h.id, rows: h.config.rows }));
      });
    }

    if (data.hotbarMapping && state.hotbarMapping) {
      dispatch(removeAllActions());
      data.hotbarMapping.forEach((h) =>
        h.slots.forEach((s) =>
          Object.keys(s.actionId).forEach((j) => {
            dispatch(assignAction({ hotbarId: h.id, slotId: s.id, actionId: s.actionId[j], job: j }));
          })
        )
      );
    }

    if (data.keybindings && state.keybindings) {
      dispatch(removeAllKeybinds());
      data.keybindings.forEach((h) =>
        h.keybinds.forEach((k) => {
          dispatch(assignKeybind({ hotbarId: h.id, slotId: k.id, key: k.key, modifier: k.modifier }));
        })
      );
    }

    if (data.scripts && state.scripts) {
      if (state.scriptMergeMode === 'Replace') {
        dispatch(deleteAllScripts());
      }

      data.scripts.forEach((s) => {
        dispatch(setScript({ name: s.name, job: s.job, script: s.script, active: false }));
      });
    }

    if (data.blueMagicSpellbook && state.blueMagicSpellbook) {
      dispatch(setBlueMagicSpellbook(data.blueMagicSpellbook));
    }

    if (data.actionChangeSettings && state.actionChangeSettings) {
      Object.entries(data.actionChangeSettings).forEach(([actionId, settings]) => {
        dispatch(setActionChangeSettings({ actionId: Number(actionId), ...settings }));
      });
    }
  }

  function exportData() {
    const data: ImportExportData = {};
    const appState = store.getState();

    if (state.layout) {
      data.layout = {
        elements: appState.hud.elements,
        hotbars: appState.hotbars.hotbars.map((h) => ({ id: h.id, config: h.config })),
      };
    }

    if (state.hotbarMapping) {
      data.hotbarMapping = appState.hotbars.hotbars.map((h) => ({ id: h.id, slots: h.slots }));
    }

    if (state.keybindings) {
      data.keybindings = appState.hotbars.hotbars.map((h) => ({ id: h.id, keybinds: h.keybinds }));
    }

    if (state.scripts) {
      data.scripts = appState.scriptEngine.scripts
        .filter((s) => s.errors.length === 0)
        .map((s) => ({ name: s.name, job: s.job, script: s.script }));
    }

    if (state.blueMagicSpellbook) {
      data.blueMagicSpellbook = appState.player.blueMagicSpellbook;
    }

    if (state.actionChangeSettings) {
      data.actionChangeSettings = appState.player.actionChangeSettings;
    }

    setState({ data: JSON.stringify(data) });
  }

  return (
    <HudItem name="ImportExport" dragHandle=".title" defaultPosition={{ x: 20, y: 20 }} z={100}>
      <div className="bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[900px] h-[1000px] overflow-auto">
        <div className="title grid grid-cols-2 items-center mb-4">
          <h2 className="text-2xl">Import/Export</h2>
          <CloseButton onClick={close} />
        </div>
        <div className="grid grid-flow-row auto-rows-max justify-items-start gap-4">
          <textarea
            value={state.data}
            onChange={(e) => setState({ data: e.target.value })}
            className="w-[800px] h-[580px] text-black"
          ></textarea>

          <div className="grid grid-cols-3 gap-x-8 gap-y-2 w-[800px]">
            {checkboxOptions.map(({ id, label }) => (
              <div key={id} className="grid grid-flow-col auto-cols-max justify-items-start gap-1">
                <input
                  id={id}
                  type="checkbox"
                  checked={state[id]}
                  onChange={(e) => {
                    const update = { [id]: e.target.checked };
                    setState(update);
                  }}
                />
                <label htmlFor={id}>{label}</label>
              </div>
            ))}
          </div>

          <div className="grid grid-flow-col auto-cols-max items-center gap-4">
            <label>Script import handling</label>
            <Select
              options={scriptMergeMode}
              value={scriptMergeMode.find((o) => o.value === state.scriptMergeMode)}
              styles={{ option: (styles) => ({ ...styles, color: '#000' }) }}
              onChange={(e) => setState({ scriptMergeMode: e?.value })}
              isDisabled={!state.scripts}
            ></Select>
          </div>
          <div className="grid grid-flow-col auto-cols-max justify-items-start gap-1">
            <button className="border px-1 rounded disabled:opacity-25" type="button" onClick={exportData}>
              Export
            </button>
            <button className="border px-1 rounded disabled:opacity-25" type="button" onClick={importData}>
              Import
            </button>
          </div>
        </div>
      </div>
    </HudItem>
  );
}
