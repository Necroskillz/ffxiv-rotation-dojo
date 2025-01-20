import { ChangeEvent, FC, useEffect, useReducer } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { HudElement, selectElement, selectElements, setOffset, setVisility } from '../hud/hudSlice';
import { CloseButton } from '../../components/CloseButton';

export const HudEditor = () => {
  const hudElement = useAppSelector((state) => selectElement(state, 'HudEditor'));
  const elements = useAppSelector(selectElements);
  const dispatch = useAppDispatch();

  function close() {
    dispatch(setVisility({ element: 'HudEditor', isVisible: false }));
  }

  if (!hudElement.isVisible) {
    return null;
  }

  return (
    <HudItem name="HudEditor" dragHandle=".title" defaultPosition={{ x: 20, y: 20 }} z={100}>
      <div className="bg-xiv-bg border pb-2 pt-1 border-xiv-gold rounded-md w-[800px] h-[900px]">
        <div className="title grid grid-cols-2 items-center mb-4 ml-4">
          <h2 className="text-2xl">HUD</h2>
          <CloseButton onClick={close} />
        </div>
        <div className="overflow-auto h-[calc(100%-4rem)]">
          <table className="border-collapse table-auto w-full">
            <thead>
              <tr>
                <th className="w-[220px] border-b border-slate-700 font-medium pl-8 pt-0 pb-3 text-slate-200 text-left">Element</th>
                <th className="w-[90px] border-b border-slate-700 font-medium pt-0 pb-3 text-slate-200 text-center">X Offset</th>
                <th className="w-[90px] border-b border-slate-700 font-medium pt-0 pb-3 text-slate-200 text-center">Y Offset</th>
                <th className="w-[50px] border-b border-slate-700 font-medium pt-0 pb-3 text-slate-200 text-left">Visible</th>
                <th className="border-b border-slate-700 font-medium pt-0 pl-8 pb-3 text-slate-200 text-left">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(elements).map((key, i) => (
                <HudEditorRow key={i} name={key} element={elements[key]} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </HudItem>
  );
};

type HudEditorRowProps = {
  element: HudElement;
  name: string;
};

type HudEditorRowState = {
  xOffset: number | null;
  yOffset: number | null;
  isVisible?: boolean;
  job?: string | string[];
};

const HudEditorRow: FC<HudEditorRowProps> = ({ name, element }) => {
  const dispatch = useAppDispatch();
  const [state, setState] = useReducer((state: HudEditorRowState, newState: Partial<HudEditorRowState>) => ({ ...state, ...newState }), {
    ...element,
  });

  useEffect(() => {
    setState({ ...element, xOffset: element.xOffset, yOffset: element.yOffset });
  }, [element]);

  function handleOffset(axis: 'x' | 'y', value: string, runDispatch = false) {
    const offset = parseInt(value);
    const isX = axis === 'x';
    const isInvalid = isNaN(offset);
    
    const newOffset = isInvalid && runDispatch ? 0 : (isInvalid ? null : offset);
    setState({ [isX ? 'xOffset' : 'yOffset']: newOffset });

    if (isInvalid && !runDispatch) return;

    const xOffset = isX ? (newOffset ?? 0) : (state.xOffset ?? 0);
    const yOffset = isX ? (state.yOffset ?? 0) : (newOffset ?? 0);
    
    dispatch(setOffset({ element: name, xOffset, yOffset }));
  }

  const setX = (event: ChangeEvent<HTMLInputElement>) => handleOffset('x', event.target.value);
  const setY = (event: ChangeEvent<HTMLInputElement>) => handleOffset('y', event.target.value);
  const blurX = (event: ChangeEvent<HTMLInputElement>) => handleOffset('x', event.target.value, true);
  const blurY = (event: ChangeEvent<HTMLInputElement>) => handleOffset('y', event.target.value, true);

  function setVisible(event: ChangeEvent<HTMLInputElement>) {
    dispatch(setVisility({ element: name, isVisible: event.target.checked }));
  }

  return (
    <tr>
      <td className="border-b border-slate-700 p-4 pl-8 text-slate-300">{name}</td>
      <td className="border-b border-slate-700 p-4 text-center">
        <input className="w-20" type="number" value={state.xOffset ?? ''} onChange={setX} onBlur={blurX} />
      </td>
      <td className="border-b border-slate-700 p-4 text-center">
        <input className="w-20" type="number" value={state.yOffset ?? ''} onChange={setY} onBlur={blurY} />
      </td>
      <td className="border-b border-slate-700 p-4 text-center">
        <input type="checkbox" checked={element.isVisible} onChange={setVisible} />
      </td>
      <td className="border-b border-slate-700 p-4 pl-8">{Array.isArray(element.job) ? element.job.join(', ') : element.job}</td>
    </tr>
  );
};
