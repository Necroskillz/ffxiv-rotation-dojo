import { faBahai, faHammer, faMagicWandSparkles } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { createRef } from 'react';
import { connect } from 'react-redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { filter, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { getStatusById } from '../actions/status';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addEvent, DamageType, EventStatus, Position, Positional } from './combatSlice';
import { actionStream$ } from './general';
import { statusIcon } from './utils';

interface Item {
  id: number;
  ref: any;
  abilityName: string;
  damage: number;
  damagePercent: number;
  damageAbsolute: number;
  type: DamageType;
  icons: string[];
  missedPositional: boolean;
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
        filter(
          (a) =>
            a.type === addEvent.type &&
            (a.payload.potency > 0 || a.payload.damagePercent > 0 || a.payload.damage > 0) &&
            a.payload.actionId !== 0
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((action) => {
        const item: Item = {
          id: id++,
          ref: createRef<HTMLDivElement>(),
          abilityName: getActionById(action.payload.actionId).name,
          damage: action.payload.potency,
          damagePercent: action.payload.damagePercent,
          damageAbsolute: action.payload.damage,
          type: action.payload.type,
          icons: action.payload.statuses.map((status: EventStatus) => statusIcon(getStatusById(status.id).icon, status.stacks)),
          missedPositional: !this.matchPositional(action.payload.positional, action.payload.position),
        };

        this.buffer.push(item);

        this.setState({ items: this.buffer });

        setTimeout(() => this.removeItem(item), 20000);
      });
  }

  private matchPositional(positional: Positional, position: Position) {
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
                  <div ref={i.ref} className="grid grid-flow-col auto-cols-max items-center absolute text-xiv-offensive gap-2 text-lg">
                    {i.abilityName}
                    <FontAwesomeIcon
                      color={i.type === DamageType.Magical ? '#E399FB' : i.type === DamageType.Physical ? '#CBFDFB' : '#E4FFCB'}
                      icon={i.type === DamageType.Magical ? faMagicWandSparkles : i.type === DamageType.Physical ? faHammer : faBahai}
                    />
                    {!!(i.damage || i.damageAbsolute) && <React.Fragment>{i.damage || i.damageAbsolute}</React.Fragment>}
                    {i.damagePercent > 0 && <React.Fragment>{i.damagePercent}%</React.Fragment>}
                    {i.missedPositional && <span className="text-orange-500">(missed positional)</span>}
                    {i.icons.length > 0 && (
                      <div className="grid grid-flow-col auto-cols-max">
                        {i.icons.map((i, id) => (
                          <img className="w-7" key={id} src={'https://beta.xivapi.com' + i} alt="" />
                        ))}
                      </div>
                    )}
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
