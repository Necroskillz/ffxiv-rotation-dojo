import './App.css';
import 'react-tooltip/dist/react-tooltip.css';
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
    dispatch(init());

    return () => {};
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
