import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectElement, setVisility } from '../hud/hudSlice';
import { selectJob } from '../player/playerSlice';
import { Action } from './Action';
import { getActionsByJob } from './actions';

export function ActionList() {
  const job = useAppSelector(selectJob);
  const hudElement = useAppSelector((state) => selectElement(state, 'ActionList'));
  const dispatch = useAppDispatch();
  const actions = useMemo(() => getActionsByJob(job), [job]);

  function close() {
    dispatch(setVisility({ element: 'ActionList', isVisible: false }));
  }

  if (!hudElement.isVisible) {
    return null;
  }

  return (
    <HudItem name="ActionList" dragHandle=".title" defaultPosition={{ x: 20, y: 20 }} z={100}>
      <div className="bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[800px] h-[600px] overflow-auto">
        <div className="title grid grid-cols-2 items-center mb-4">
          <h2 className="text-2xl">Actions</h2>
          <button className="place-self-end p-1" onClick={close}>
            <FontAwesomeIcon size="2x" icon={faXmark} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 w-[700px]">
          {actions
            .filter((a) => a.id < 999000)
            .map((a) => (
              <Action key={a.id} action={a} />
            ))}
        </div>
      </div>
    </HudItem>
  );
}
