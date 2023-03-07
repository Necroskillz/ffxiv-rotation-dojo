import React from 'react';
import { createRef } from 'react';
import { connect } from 'react-redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { filter, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addEvent } from './combatSlice';
import { actionStream$ } from './general';

interface Slot {
  id: number;
  x: number;
  y: number;
  letters: { letter: string; ref: any }[] | null;
}

type DotScrollingTextState = {
  slots: Slot[];
};

type DotScrollingTextProps = {
  hudLock: boolean;
};

export class DotScrollingText extends React.Component<DotScrollingTextProps, DotScrollingTextState> {
  private unsubscribe = new Subject<void>();
  private buffer: Slot[] = [
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

  constructor(props: DotScrollingTextProps) {
    super(props);

    this.state = { slots: this.buffer };
  }

  componentDidMount(): void {
    actionStream$
      .pipe(
        filter((a) => a.type === addEvent.type && a.payload.potency > 0 && a.payload.actionId === 0),
        takeUntil(this.unsubscribe)
      )
      .subscribe((action) => {
        const slot = this.getFreeSlot();
        slot.letters = Array.from<string>(action.payload.potency.toString()).map((l) => ({ letter: l, ref: createRef<HTMLSpanElement>() }));

        this.setState({ slots: this.buffer });

        setTimeout(() => this.clearSlot(slot), 1500);
      });
  }

  private getFreeSlot(): Slot {
    const freeSlots = this.buffer.filter((s) => s.letters === null);

    return freeSlots[Math.floor(Math.random() * freeSlots.length)];
  }

  private clearSlot(slot: Slot): void {
    slot.letters = null;

    this.setState({ slots: this.buffer });
  }

  componentWillUnmount(): void {
    this.unsubscribe.next();
  }

  render(): React.ReactNode {
    return (
      <HudItem name="DotScrollingText" defaultPosition={{ x: 450, y: 50 }}>
        {this.props.hudLock ? (
          <div className="w-[120px] h-[120px]">
            {this.state.slots.map((slot) => (
              <div style={{ top: slot.y, left: slot.x }} className="absolute text-xiv-dot" key={slot.id}>
                <TransitionGroup>
                  {slot.letters &&
                    slot.letters.map((letter, index) => (
                      <CSSTransition key={index} nodeRef={letter.ref} timeout={{ enter: 250 + 100 * (index - 1), exit: 200 }} classNames={'dot'}>
                        <span style={{ ['--i' as string]: index }} className="dot" ref={letter.ref}>
                          {letter.letter}
                        </span>
                      </CSSTransition>
                    ))}
                </TransitionGroup>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[120px] w-[120px]">Dot scrolling text</div>
        )}
      </HudItem>
    );
  }
}

export default connect<DotScrollingTextProps, {}, {}, RootState>((state) => ({ hudLock: selectLock(state) }))(DotScrollingText);
