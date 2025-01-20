import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { bufferTime, filter, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addEvent } from './combatSlice';
import { actionStream$ } from './general';

interface Item {
  id: number;
  abilityName: string;
  mana: number;
  healthPotency: number;
  healthPercent: number;
  health: number;
}

let id = 0;

export const ResourceScrollingText = () => {
  const hudLock = useSelector((state: RootState) => selectLock(state));
  const [items, setItems] = useState<Item[]>([]);

  const removeItem = (itemId: number) => {
    setItems(items => items.filter(item => item.id !== itemId));
  };

  useEffect(() => {
    const unsubscribe$ = new Subject<void>();

    actionStream$
      .pipe(
        filter(
          (a) =>
            a.type === addEvent.type &&
            (a.payload.mana > 0 || a.payload.healthPotency > 0 || a.payload.healthPercent > 0 || a.payload.health > 0)
        ),
        takeUntil(unsubscribe$),
        bufferTime(0),
        filter((actions) => actions.length > 0)
      )
      .subscribe((actions) => {
        const item: Item = {
          id: id++,
          abilityName: '',
          mana: 0,
          healthPotency: 0,
          healthPercent: 0,
          health: 0,
        };

        actions.forEach((a) => {
          if (!item.abilityName) {
            item.abilityName = a.payload.actionId === 0 ? '' : getActionById(a.payload.actionId).name;
          }

          if (a.payload.mana) {
            item.mana += a.payload.mana;
          }

          if (a.payload.healthPotency) {
            item.healthPotency += a.payload.healthPotency;
          }

          if (a.payload.healthPercent) {
            item.healthPercent += a.payload.healthPercent;
          }

          if (a.payload.health) {
            item.health += a.payload.health;
          }
        });

        setItems(items => [...items, item]);
        setTimeout(() => removeItem(item.id), 5000);
      });

    return () => {
      unsubscribe$.next();
      unsubscribe$.complete();
    };
  }, []);

  return (
    <HudItem name="ResourceScrollingText" defaultPosition={{ x: 150, y: 150 }}>
      {hudLock ? (
        <div className="w-[350px] h-[320px] relative overflow-hidden">
          {items.map((i) => (
            <div 
              key={i.id}
              className="grid grid-flow-col auto-cols-max items-end absolute text-xiv-heal gap-1 scroll-down-enter"
            >
              <span className="text-lg">{i.abilityName}</span>
              {i.mana > 0 && (
                <>
                  <span className="text-lg">{i.mana}</span>
                  <span className="font-ui-medium text-xs">MP</span>
                </>
              )}
              {i.healthPotency > 0 && (
                <>
                  <span className="text-lg">{i.healthPotency}</span>
                  <span className="font-ui-medium text-xs">HP potency</span>
                </>
              )}
              {i.healthPercent > 0 && (
                <>
                  <span className="text-lg">{i.healthPercent}%</span>
                  <span className="font-ui-medium text-xs">HP</span>
                </>
              )}
              {i.health > 0 && (
                <>
                  <span className="text-lg">{i.health}</span>
                  <span className="font-ui-medium text-xs">HP</span>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[300px] w-[350px]">Mana/HP scrolling text</div>
      )}
    </HudItem>
  );
};
