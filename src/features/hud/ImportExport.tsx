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


interface ImportExportState {
  data: string;
  layout: boolean;
  hotbarMapping: boolean;
  keybindings: boolean;
  scripts: boolean;
  scriptMergeMode: string;
}

interface ImportExportData {
  layout?: { elements: Record<string, HudElement>; hotbars: { id: number; config: HotbarConfig }[] };
  hotbarMapping?: { id: number; slots: HotbarSlotActionState[] }[];
  keybindings?: { id: number; keybinds: HotbarSlotKeybindState[] }[];
  scripts?: { name: string; job: string; script: string }[];
}

const scriptMergeMode: Option<string>[] = [
  { value: 'Merge', label: 'Keep existing and overwrite if name matches' },
  { value: 'Replace', label: 'Remove existing and only use imported' },
];

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
  });

  function close() {
    dispatch(setVisility({ element: 'ImportExport', isVisible: false }));
  }

  if (!hudElement.isVisible) {
    return null;
  }

  function importData() {
    const data: ImportExportData = JSON.parse(state.data);

    if (data.layout) {
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

    if (data.hotbarMapping) {
      dispatch(removeAllActions());
      data.hotbarMapping.forEach((h) =>
        h.slots.forEach((s) =>
          Object.keys(s.actionId).forEach((j) => {
            dispatch(assignAction({ hotbarId: h.id, slotId: s.id, actionId: s.actionId[j], job: j }));
          })
        )
      );
    }

    if (data.keybindings) {
      dispatch(removeAllKeybinds());
      data.keybindings.forEach((h) =>
        h.keybinds.forEach((k) => {
          dispatch(assignKeybind({ hotbarId: h.id, slotId: k.id, key: k.key, modifier: k.modifier }));
        })
      );
    }

    if (data.scripts) {
      if (state.scriptMergeMode === 'Replace') {
        dispatch(deleteAllScripts());
      }

      data.scripts.forEach((s) => {
        dispatch(setScript({ name: s.name, job: s.job, script: s.script, active: false }));
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

          <div className="grid grid-flow-col auto-cols-max justify-items-start gap-8">
            <div className="grid grid-flow-col auto-cols-max justify-items-start gap-1">
              <input id="layout" type="checkbox" checked={state.layout} onChange={(e) => setState({ layout: e.target.checked })} />
              <label htmlFor="layout">Layout</label>
            </div>
            <div className="grid grid-flow-col auto-cols-max justify-items-start gap-1">
              <input
                id="hotbarMapping"
                type="checkbox"
                checked={state.hotbarMapping}
                onChange={(e) => setState({ hotbarMapping: e.target.checked })}
              />
              <label htmlFor="hotbarMapping">Hotbar skills mapping</label>
            </div>
            <div className="grid grid-flow-col auto-cols-max justify-items-start gap-1">
              <input
                id="keybindings"
                type="checkbox"
                checked={state.keybindings}
                onChange={(e) => setState({ keybindings: e.target.checked })}
              />
              <label htmlFor="keybindings">Keybindings</label>
            </div>
            <div className="grid grid-flow-col auto-cols-max justify-items-start gap-1">
              <input id="scripts" type="checkbox" checked={state.scripts} onChange={(e) => setState({ scripts: e.target.checked })} />
              <label htmlFor="scripts">Scripts</label>
            </div>
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
