import { FaWandSparkles, FaHammer, FaBahai } from 'react-icons/fa6';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { filter, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { getStatusById } from '../actions/status';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addEvent, DamageType, EventStatus, Position, Positional } from './combatSlice';
import { actionStream$ } from './general';
import { statusIcon } from './utils';
import { XivIcon } from '@/components/XivIcon';

interface Item {
  id: number;
  abilityName: string;
  damage: number;
  damagePercent: number;
  damageAbsolute: number;
  type: DamageType;
  icons: string[];
  missedPositional: boolean;
}

let id = 0;

const matchPositional = (positional: Positional, position: Position) => {
  switch (positional) {
    case 'rear':
      return position === 'S';
    case 'flank':
      return ['E', 'W'].includes(position);
    case 'front':
      return position === 'N';
    default:
      return true;
  }
};

export const DamageScrollingText = () => {
  const hudLock = useSelector((state: RootState) => selectLock(state));
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const unsubscribe$ = new Subject<void>();

    actionStream$
      .pipe(
        filter(
          (a) =>
            a.type === addEvent.type &&
            (a.payload.potency > 0 || a.payload.damagePercent > 0 || a.payload.damage > 0) &&
            a.payload.actionId !== 0
        ),
        takeUntil(unsubscribe$)
      )
      .subscribe((action) => {
        const item: Item = {
          id: id++,
          abilityName: getActionById(action.payload.actionId).name,
          damage: action.payload.potency,
          damagePercent: action.payload.damagePercent,
          damageAbsolute: action.payload.damage,
          type: action.payload.type,
          icons: action.payload.statuses.map((status: EventStatus) => statusIcon(getStatusById(status.id).icon, status.stacks)),
          missedPositional: !matchPositional(action.payload.positional, action.payload.position),
        };

        setItems((items) => [item, ...items]);

        setTimeout(() => {
          setItems((items) => items.filter((i) => i !== item));
        }, 2500);
      });

    return () => {
      unsubscribe$.next();
      unsubscribe$.complete();
    };
  }, []);

  return (
    <HudItem name="DamageScrollingText" defaultPosition={{ x: 200, y: 20 }}>
      {hudLock ? (
        <div className="w-[350px] h-[140px] relative overflow-hidden">
          {items.map((i) => (
            <div
              key={i.id}
              className="grid grid-flow-col auto-cols-max items-center absolute text-xiv-offensive gap-2 text-lg scroll-up-enter"
            >
              {i.abilityName}
              {i.type === DamageType.Magical ? (
                <FaWandSparkles color="#E399FB" />
              ) : i.type === DamageType.Physical ? (
                <FaHammer color="#CBFDFB" />
              ) : (
                <FaBahai color="#E4FFCB" />
              )}
              {!!(i.damage || i.damageAbsolute) && <>{i.damage || i.damageAbsolute}</>}
              {i.damagePercent > 0 && <>{i.damagePercent}%</>}
              {i.missedPositional && <span className="text-orange-500">(missed positional)</span>}
              {i.icons.length > 0 && (
                <div className="grid grid-flow-col auto-cols-max">
                  {i.icons.map((i, id) => (
                    <XivIcon className="w-7" key={id} icon={i} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[120px] w-[350px]">Damage scrolling text</div>
      )}
    </HudItem>
  );
};
