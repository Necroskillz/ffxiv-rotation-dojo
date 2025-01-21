import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { filter, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addEvent } from './combatSlice';
import { actionStream$ } from './general';
import styles from './ScrollingText.module.css';

interface Slot {
  id: number;
  x: number;
  y: number;
  isExiting?: boolean;
  letters: { letter: string }[] | null;
}

const initialSlots: Slot[] = [
  { id: 1, x: 0, y: 0, letters: null },
  { id: 2, x: 10, y: 23, letters: null },
  { id: 3, x: 0, y: 46, letters: null },
  { id: 4, x: 10, y: 69, letters: null },
  { id: 5, x: 0, y: 92, letters: null },
  { id: 6, x: 10, y: 115, letters: null },
  { id: 7, x: 70, y: 0, letters: null },
  { id: 8, x: 60, y: 23, letters: null },
  { id: 9, x: 70, y: 46, letters: null },
  { id: 10, x: 60, y: 69, letters: null },
  { id: 11, x: 70, y: 92, letters: null },
  { id: 12, x: 60, y: 115, letters: null },
];

export const DotScrollingText = () => {
  const hudLock = useSelector((state: RootState) => selectLock(state));
  const [slots, setSlots] = useState<Slot[]>(initialSlots);

  const startExitAnimation = (slotId: number) => {
    setSlots((slots) => slots.map((slot) => (slot.id === slotId ? { ...slot, isExiting: true } : slot)));
  };

  const clearSlot = (slotId: number) => {
    setSlots((slots) => slots.map((slot) => (slot.id === slotId ? { ...slot, letters: null, isExiting: false } : slot)));
  };

  useEffect(() => {
    function getFreeSlot(): Slot {
      const freeSlots = slots.filter((s) => s.letters === null);
      return freeSlots[Math.floor(Math.random() * freeSlots.length)];
    }

    const unsubscribe$ = new Subject<void>();

    actionStream$
      .pipe(
        filter((a) => a.type === addEvent.type && a.payload.potency > 0 && a.payload.actionId === 0),
        takeUntil(unsubscribe$)
      )
      .subscribe((action) => {
        const slot = getFreeSlot();
        const letters = Array.from<string>(action.payload.potency.toString()).map((l) => ({ letter: l }));

        setSlots((slots) => slots.map((s) => (s.id === slot.id ? { ...s, letters } : s)));

        setTimeout(() => startExitAnimation(slot.id), 1000);
        setTimeout(() => clearSlot(slot.id), 1500);
      });

    return () => {
      unsubscribe$.next();
      unsubscribe$.complete();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HudItem name="DotScrollingText" defaultPosition={{ x: 450, y: 50 }}>
      {hudLock ? (
        <div className="w-[120px] h-[120px]">
          {slots.map((slot) => (
            <div style={{ top: slot.y, left: slot.x }} className="absolute text-xiv-dot" key={slot.id}>
              {slot.letters &&
                slot.letters.map((letter, index) => (
                  <span 
                    key={index} 
                    style={{ ['--i' as string]: index }} 
                    className={`${styles.dot} ${slot.isExiting ? styles.dotExit : styles.dotEnter}`}
                  >
                    {letter.letter}
                  </span>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[120px] w-[120px]">Dot scrolling text</div>
      )}
    </HudItem>
  );
};
