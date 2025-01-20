import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { assignAction } from './hotbarSlice';
import { selectJob, selectBlueMagicSpellSet } from '@/features/player/playerSlice';
import { createPortal } from 'react-dom';
import { getActionById } from '@/features/actions/actions';
import { XivIcon } from '@/components/XivIcon';
import { useState } from 'react';

export const DragDropProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const job = useAppSelector(selectJob);
  const blueMagicSpellSet = useAppSelector(selectBlueMagicSpellSet);
  const jobId = job === 'BLU' ? `${job}${blueMagicSpellSet.id}` : job;
  const [draggedAction, setDraggedAction] = useState<number | null>(null);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.data.current?.type === 'action') {
      if (active.data.current.hotbarId && active.data.current.slotId) {
        dispatch(
          assignAction({
            hotbarId: active.data.current.hotbarId,
            slotId: active.data.current.slotId,
            job: jobId,
            actionId: null,
          })
        );
      }

      if (over) {
        const draggedActionId = active.data.current.id;
        const targetData = over.data.current;
        if (targetData && 'type' in targetData && targetData.type === 'slot' && 'hotbarId' in targetData && 'slotId' in targetData) {
          dispatch(
            assignAction({
              hotbarId: targetData.hotbarId,
              slotId: targetData.slotId,
              job: jobId,
              actionId: draggedActionId,
            })
          );
        }
      }
    }
  }

  function handleDragStart(event: DragEndEvent) {
    if (event.active.data.current?.type === 'action') {
      setDraggedAction(event.active.data.current.id);
    }
  }

  return (
    <DndContext 
      onDragEnd={handleDragEnd} 
      onDragStart={handleDragStart}
      autoScroll={false}
    >
      {children}
      {createPortal(
        <DragOverlay dropAnimation={null}>
          {draggedAction && (
            <XivIcon className="w-10" icon={getActionById(draggedAction).icon} alt="Dragged action" />
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}; 