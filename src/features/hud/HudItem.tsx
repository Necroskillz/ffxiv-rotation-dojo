import { useAppDispatch, useAppSelector } from '@/app/hooks';
import clsx from 'clsx';
import { FC, useEffect, useRef, useState } from 'react';
import Draggable, { ControlPosition, DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable';
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
  const ref = useRef<any>(null);

  const hudElement = useAppSelector((state) => selectElement(state, name));
  const hudLock = useAppSelector(selectLock);
  const job = useAppSelector(selectJob);
  const [position, setPosition] = useState({ x: hudElement.xOffset + defaultPosition.x, y: hudElement.yOffset + defaultPosition.y });

  useEffect(() => {
    setPosition({ x: hudElement.xOffset + defaultPosition.x, y: hudElement.yOffset + defaultPosition.y });
  }, [hudElement.isVisible, hudElement.xOffset, hudElement.yOffset, defaultPosition.x, defaultPosition.y]);

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
        xOffset: data.x - defaultPosition.x,
        yOffset: data.y - defaultPosition.y,
      })
    );
  };

  const updatePosition: DraggableEventHandler = (_: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <Draggable nodeRef={ref} handle={dragHandle || '.handle' + name} position={position} onStop={savePosition} onDrag={updatePosition}>
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
