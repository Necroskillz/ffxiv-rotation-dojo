import './App.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useEffect } from 'react';
import { init } from './features/script_engine/scriptEngineSlice';
import { useAppDispatch, useAppSelector } from './app/hooks';

function App() {
  const dispatch = useAppDispatch();
  const appState = useAppSelector((s) => s);

  const data: any = {};

  data.layout = {
    elements: appState.hud.elements,
    hotbars: appState.hotbars.hotbars.map((h) => ({ id: h.id, config: h.config })),
  };

  data.hotbarMapping = appState.hotbars.hotbars.map((h) => ({ id: h.id, slots: h.slots }));

  data.keybindings = appState.hotbars.hotbars.map((h) => ({ id: h.id, keybinds: h.keybinds }));

  data.scripts = appState.scriptEngine.scripts
    .filter((s) => s.errors.length === 0)
    .map((s) => ({ name: s.name, job: s.job, script: s.script }));

  const exportData = JSON.stringify(data);

  useEffect(() => {
    const callback = (e: MouseEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!localStorage.getItem('dev')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', callback);

    dispatch(init());

    return () => document.removeEventListener('contextmenu', callback);
  }, [dispatch]);

  return (
    <div className="App">
      <DndProvider backend={HTML5Backend}>
        <div className="p-2 min-h-screen">
          <div className="mb-8">
            The site has moved to{' '}
            <a className="text-xiv-orange" href="https://ffxiv-rotation-dojo.vercel.app/">
              https://ffxiv-rotation-dojo.vercel.app
            </a>
            . You can copy your layout, keybindings and scripts configuration from the below field, and use import feature in the new app
            location to restore it.
          </div>
          <textarea
            value={exportData}
            className="w-[800px] h-[580px] text-black"
          ></textarea>
        </div>
      </DndProvider>
    </div>
  );
}

export default App;
