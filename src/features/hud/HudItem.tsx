import clsx from 'clsx';
import { FC, useRef, useState } from 'react';
import Draggable, { ControlPosition, DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectJob } from '../player/playerSlice';
import { selectElement, selectLock, setOffset } from './hudSlice';

type HudItemProps = {
  children: any;
  name: string;
  defaultPosition: ControlPosition;
  dragHandle?: string;
  z?: number;
};

export const HudItem: FC<HudItemProps> = ({ children, name, defaultPosition, dragHandle, z }) => {
  const dispatch = useAppDispatch();
  const ref = useRef(null);

  const hudElement = useAppSelector((state) => selectElement(state, name));
  const hudLock = useAppSelector(selectLock);
  const job = useAppSelector(selectJob);
  const [initialPosition] = useState({ x: hudElement.xOffset, y: hudElement.yOffset });

  if (!hudElement.isVisible && hudLock) {
    return null;
  }

  if (hudElement.job && !((Array.isArray(hudElement.job) && hudElement.job.includes(job)) || hudElement.job === job)) {
    return null;
  }

  const savePosition: DraggableEventHandler = (_: DraggableEvent, data: DraggableData) => {
    dispatch(
      setOffset({
        element: name,
        xOffset: data.x - defaultPosition.x + initialPosition.x,
        yOffset: data.y - defaultPosition.y + initialPosition.y,
      })
    );
  };

  return (
    <Draggable
      nodeRef={ref}
      handle={dragHandle || '.handle' + name}
      defaultPosition={defaultPosition}
      positionOffset={initialPosition}
      onStop={savePosition}
    >
      <div
        ref={ref}
        style={{ zIndex: z || 0 }}
        className={clsx(`w-fit grid grid-flow-col auto-cols-min absolute`, !hudLock && !dragHandle ? `border border-white` : 'p-px')}
      >
        {!hudLock && !dragHandle && <div className={`w-2 bg-white cursor-move handle${name}`}></div>}
        {children}
      </div>
    </Draggable>
  );
};
