import './App.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Hud } from './features/hud/Hud';
import { ControlBar } from './features/hud/ControlBar';
import { useEffect } from 'react';
import { init } from './features/script_engine/scriptEngineSlice';
import { useAppDispatch } from './app/hooks';

function App() {
  const dispatch = useAppDispatch();

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
        <div className="p-2 min-h-screen grid grid-rows-[1fr_50px]">
          <Hud />
          <div className="self-end">
            <ControlBar />
          </div>
        </div>
      </DndProvider>
    </div>
  );
}

export default App;
