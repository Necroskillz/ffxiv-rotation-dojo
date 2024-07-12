import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC, useEffect, useReducer } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { HudElement, selectElement, selectElements, setOffset, setVisility } from '../hud/hudSlice';

export function HudEditor() {
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
      <div className="bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[800px] h-[900px] overflow-auto">
        <div className="title grid grid-cols-2 items-center mb-4">
          <h2 className="text-2xl">HUD</h2>
          <button className="place-self-end p-1" onClick={close}>
            <FontAwesomeIcon size="2x" icon={faXmark} />
          </button>
        </div>
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
    </HudItem>
  );
}

type HudEditorRowProps = {
  element: HudElement;
  name: string;
};

const HudEditorRow: FC<HudEditorRowProps> = ({ name, element }) => {
  const dispatch = useAppDispatch();
  const [state, setState] = useReducer(
    (state: HudElement, newState: Partial<HudElement>) => ({ ...state, ...newState }),
    element
  );

  useEffect(() => {
    setState(element);
  }, [element]);

  function setX(event: React.ChangeEvent<HTMLInputElement>) {
    let xOffset = parseInt(event.target.value);

    if (isNaN(xOffset)) {
      xOffset = 0;
    } else {
      setState({ xOffset });
    }

    dispatch(setOffset({ element: name, xOffset, yOffset: state.yOffset }));
  }

  function setY(event: React.ChangeEvent<HTMLInputElement>) {
    let yOffset = parseInt(event.target.value);

    if (isNaN(yOffset)) {
      yOffset = 0;
    } else {
      setState({ yOffset });
    }

    dispatch(setOffset({ element: name, xOffset: state.xOffset, yOffset }));
  }

  function setVisible(event: React.ChangeEvent<HTMLInputElement>) {
    dispatch(setVisility({ element: name, isVisible: event.target.checked }));
  }

  return (
    <tr>
      <td className="border-b border-slate-700 p-4 pl-8 text-slate-300">{name}</td>
      <td className="border-b border-slate-700 p-4 text-center">
        <input className="w-20" type="number" value={state.xOffset} onChange={setX} />
      </td>
      <td className="border-b border-slate-700 p-4 text-center">
        <input className="w-20" type="number" value={state.yOffset} onChange={setY} />
      </td>
      <td className="border-b border-slate-700 p-4 text-center">
        <input type="checkbox" checked={element.isVisible} onChange={setVisible} />
      </td>
      <td className="border-b border-slate-700 p-4 pl-8">{Array.isArray(element.job) ? element.job.join(', ') : element.job}</td>
    </tr>
  );
};
