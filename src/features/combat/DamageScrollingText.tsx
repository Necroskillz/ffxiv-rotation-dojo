import { faHammer, faMagicWandSparkles } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { createRef } from 'react';
import { connect } from 'react-redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { filter, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addEvent, DamageType } from './combatSlice';
import { actionStream$ } from './general';

interface Item {
  id: number;
  ref: any;
  abilityName: string;
  damage: number;
  type: DamageType;
}

type DamageScrollingTextState = {
  items: Item[];
};

type DamageScrollingTextProps = {
  hudLock: boolean;
};

let id = 0;

export class DamageScrollingText extends React.Component<DamageScrollingTextProps, DamageScrollingTextState> {
  private unsubscribe = new Subject<void>();
  private buffer: Item[] = [];

  constructor(props: DamageScrollingTextProps) {
    super(props);

    this.state = { items: [] };
  }

  componentDidMount(): void {
    actionStream$
      .pipe(
        filter((a) => a.type === addEvent.type && a.payload.potency > 0 && a.payload.actionId !== 0),
        takeUntil(this.unsubscribe)
      )
      .subscribe((action) => {
        const item: Item = {
          id: id++,
          ref: createRef<HTMLDivElement>(),
          abilityName: getActionById(action.payload.actionId).name,
          damage: action.payload.potency,
          type: action.payload.type,
        };

        this.buffer.push(item);

        this.setState({ items: this.buffer });

        setTimeout(() => this.removeItem(item), 2000);
      });
  }

  private removeItem(item: Item) {
    this.buffer = this.buffer.filter((i) => i !== item);
    this.setState({ items: this.buffer });
  }

  componentWillUnmount(): void {
    this.unsubscribe.next();
  }

  render(): React.ReactNode {
    return (
      <HudItem name="DamageScrollingText" defaultPosition={{ x: 200, y: 20 }}>
        {this.props.hudLock ? (
          <div className="w-[350px] h-[120px]">
            <TransitionGroup>
              {this.state.items.map((i) => (
                <CSSTransition key={i.id} nodeRef={i.ref} classNames={`scroll-up`} timeout={{ enter: 2000, exit: 0 }}>
                  <div ref={i.ref} className="grid grid-flow-col auto-cols-max items-end absolute text-xiv-offensive gap-1">
                    <span className="text-lg">
                      {i.damage}{' '}
                      <FontAwesomeIcon
                        color={i.type === DamageType.Magical ? '#E399FB' : '#CBFDFB'}
                        icon={i.type === DamageType.Magical ? faMagicWandSparkles : faHammer}
                      />{' '}
                      {i.abilityName}
                    </span>
                  </div>
                </CSSTransition>
              ))}
            </TransitionGroup>
          </div>
        ) : (
          <div className="h-[120px] w-[350px]">Damage scrolling text</div>
        )}
      </HudItem>
    );
  }
}

export default connect<DamageScrollingTextProps, {}, {}, RootState>((state) => ({ hudLock: selectLock(state) }))(DamageScrollingText);
