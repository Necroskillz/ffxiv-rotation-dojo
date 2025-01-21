import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { bufferTime, filter, map, Subject, takeUntil, tap } from 'rxjs';
import { getStatusById } from '../actions/status';
import { actionStream$ } from './general';
import { statuses } from './statuses';
import { statusIcon } from './utils';
import { Action } from 'redux';
import { StatusInfo } from '../actions/status';
import { XivIcon } from '@/components/XivIcon';
import styles from './ScrollingText.module.css';

interface Item {
  id: number;
  addedText: string;
  removedText: string;
  addedIcons: string[];
  removedIcons: string[];
  addedColor: string;
}

interface StatusScrollingTextProps {
  addType: string[];
  removeType: string[];
  multipleText: string;
  direction: string;
  time: number;
}

interface StatusAction extends Action {
  payload: {
    id?: number;
    stacks?: number;
  };
}

interface StatusItem extends StatusInfo {
  direction: '+' | '-';
  stacks: number | null;
  isHarmful: boolean;
}

let id = 0;
const stackCache = new Map<number, number>();

export const StatusScrollingText = ({ addType, removeType, multipleText, direction, time }: StatusScrollingTextProps) => {
  const [items, setItems] = useState<Item[]>([]);

  const removeItem = (itemId: number) => {
    setItems(items => items.filter(item => item.id !== itemId));
  };

  useEffect(() => {
    const unsubscribe$ = new Subject<void>();

    actionStream$
      .pipe(
        takeUntil(unsubscribe$),
        filter((a: StatusAction) => addType.includes(a.type) || removeType.includes(a.type)),
        map((action: StatusAction) => ({
          action,
          status: addType.includes(action.type) ? getStatusById(action.payload.id!) : getStatusById(action.payload as number),
        })),
        filter(({ status }) => status.icon.length > 0 && statuses[status.id].isVisible),
        filter(({ action }) => {
          if (action.payload.stacks != null) {
            const previousStacks = stackCache.get(action.payload.id!) || 0;
            stackCache.set(action.payload.id!, action.payload.stacks!);

            if (action.payload.stacks < previousStacks && action.payload.stacks > 0) {
              return false;
            }
          }

          return true;
        }),
        map(({ action, status }) => ({
          ...status,
          direction: addType.includes(action.type) ? '+' as const : '-' as const,
          stacks: stackCache.get(status.id) || null,
          isHarmful: statuses[status.id].isHarmful,
        })),
        tap((item: StatusItem) => {
          if (item.direction === '-') {
            stackCache.delete(item.id);
          }
        }),
        bufferTime(0),
        filter((items: StatusItem[]) => items.length > 0)
      )
      .subscribe((items: StatusItem[]) => {
        const added = items.filter((i) => i.direction === '+');
        const removed = items.filter((i) => i.direction === '-');

        const item: Item = {
          id: id++,
          addedText: `+ ${added.length === 1 ? added[0].name : multipleText}`,
          removedText: `- ${removed.length === 1 ? removed[0].name : multipleText}`,
          addedIcons: added.map((i) => statusIcon(i.icon, i.stacks)),
          removedIcons: removed.map((i) => statusIcon(i.icon, i.stacks)),
          addedColor: added.some((i) => i.isHarmful) ? 'text-xiv-offensive' : 'text-teal-300',
        };

        setItems(items => [...items, item]);
        setTimeout(() => removeItem(item.id), time);
      });

    return () => {
      unsubscribe$.next();
      unsubscribe$.complete();
    };
  }, [addType, removeType, multipleText, time]);

  return (
    <div className="w-[350px]" style={{ height: (300 / 5000) * time }}>
      {items.map((i) => (
        <div 
          key={i.id}
          className={`grid grid-flow-col auto-cols-max items-center absolute ${direction === 'up' ? styles.scrollUp : styles.scrollDown}`}
        >
          {i.addedIcons.length > 0 && (
            <>
              {i.addedIcons.map((icon, index) => (
                <XivIcon key={index} className="w-7" icon={icon} />
              ))}
              <span className={clsx('mx-1', i.addedColor)}>{i.addedText}</span>
            </>
          )}
          {i.removedIcons.length > 0 && (
            <>
              {i.removedIcons.map((icon, index) => (
                <XivIcon key={index} className="w-7" icon={icon} />
              ))}
              <span className="ml-1 text-slate-300">{i.removedText}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
