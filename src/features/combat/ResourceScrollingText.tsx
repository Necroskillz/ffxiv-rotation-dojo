import React from 'react';
import { createRef } from 'react';
import { connect } from 'react-redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { bufferTime, filter, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addEvent } from './combatSlice';
import { actionStream$ } from './general';

interface Item {
  id: number;
  ref: any;
  abilityName: string;
  mana: number;
  healthPotency: number;
  healthPercent: number;
  health: number;
}

type ResourceScrollingTextState = {
  items: Item[];
};

type ResourceScrollingTextProps = {
  hudLock: boolean;
};

let id = 0;

export class ResourceScrollingText extends React.Component<ResourceScrollingTextProps, ResourceScrollingTextState> {
  private unsubscribe = new Subject<void>();
  private buffer: Item[] = [];

  constructor(props: ResourceScrollingTextProps) {
    super(props);

    this.state = { items: [] };
  }

  componentDidMount(): void {
    actionStream$
      .pipe(
        filter(
          (a) =>
            a.type === addEvent.type &&
            (a.payload.mana > 0 || a.payload.healthPotency > 0 || a.payload.healthPercent > 0 || a.payload.health > 0)
        ),
        takeUntil(this.unsubscribe),
        bufferTime(0),
        filter((actions) => actions.length > 0)
      )
      .subscribe((actions) => {
        const item: Item = {
          id: id++,
          ref: createRef<HTMLDivElement>(),
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

        console.log(item);

        this.buffer.push(item);

        this.setState({ items: this.buffer });

        setTimeout(() => this.removeItem(item), 5000);
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
      <HudItem name="ResourceScrollingText" defaultPosition={{ x: 150, y: 150 }}>
        {this.props.hudLock ? (
          <div className="w-[350px] h-[300px]">
            <TransitionGroup>
              {this.state.items.map((i) => (
                <CSSTransition key={i.id} nodeRef={i.ref} classNames={`scroll-down`} timeout={{ enter: 5000, exit: 0 }}>
                  <div ref={i.ref} className="grid grid-flow-col auto-cols-max items-end absolute text-xiv-heal gap-1">
                    <span className="text-lg">{i.abilityName}</span>
                    {i.mana > 0 && (
                      <React.Fragment>
                        <span className="text-lg">{i.mana}</span>
                        <span className="font-ui-medium text-xs">MP</span>
                      </React.Fragment>
                    )}
                    {i.healthPotency > 0 && (
                      <React.Fragment>
                        <span className="text-lg">{i.healthPotency}</span>
                        <span className="font-ui-medium text-xs">HP potency</span>
                      </React.Fragment>
                    )}
                    {i.healthPercent > 0 && (
                      <React.Fragment>
                        <span className="text-lg">{i.healthPercent}%</span>
                        <span className="font-ui-medium text-xs">HP</span>
                      </React.Fragment>
                    )}
                    {i.health > 0 && (
                      <React.Fragment>
                        <span className="text-lg">{i.health}</span>
                        <span className="font-ui-medium text-xs">HP</span>
                      </React.Fragment>
                    )}
                  </div>
                </CSSTransition>
              ))}
            </TransitionGroup>
          </div>
        ) : (
          <div className="h-[300px] w-[350px]">Mana/HP scrolling text</div>
        )}
      </HudItem>
    );
  }
}

export default connect<ResourceScrollingTextProps, {}, {}, RootState>((state) => ({ hudLock: selectLock(state) }))(ResourceScrollingText);
