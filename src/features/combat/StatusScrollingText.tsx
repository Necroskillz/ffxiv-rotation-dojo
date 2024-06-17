import clsx from 'clsx';
import React from 'react';
import { createRef } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { bufferTime, filter, map, Subject, takeUntil, tap } from 'rxjs';
import { getStatusById } from '../actions/status';
import { actionStream$ } from './general';
import { statuses } from './statuses';
import { statusIcon } from './utils';

interface Item {
  id: number;
  addedText: string;
  removedText: string;
  addedIcons: string[];
  removedIcons: string[];
  addedColor: string;
  ref: any;
}

type StatusScrollingTextState = {
  items: Item[];
};

type StatusScrollingTextProps = {
  addType: string[];
  removeType: string[];
  multipleText: string;
  direction: string;
  time: number;
};

let id = 0;

export class StatusScrollingText extends React.Component<StatusScrollingTextProps, StatusScrollingTextState> {
  private unsubscribe = new Subject<void>();
  private stackCache: Map<number, number> = new Map();
  private buffer: Item[] = [];

  constructor(props: StatusScrollingTextProps) {
    super(props);

    this.state = { items: [] };
  }

  componentDidMount(): void {
    actionStream$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((a) => this.props.addType.includes(a.type) || this.props.removeType.includes(a.type)),
        map((action) => ({
          action,
          status: this.props.addType.includes(action.type) ? getStatusById(action.payload.id) : getStatusById(action.payload),
        })),
        filter(({ status }) => status.icon.length > 0),
        filter(({ action }) => {
          if (action.payload.stacks != null) {
            const previousStacks = this.stackCache.get(action.payload.id) || 0;
            this.stackCache.set(action.payload.id, action.payload.stacks);

            if (action.payload.stacks < previousStacks && action.payload.stacks > 0) {
              return false;
            }
          }

          return true;
        }),
        map(({ action, status }) => ({
          ...status,
          direction: this.props.addType.includes(action.type) ? '+' : '-',
          stacks: this.stackCache.get(status.id) || null,
          isHarmful: statuses[status.id].isHarmful
        })),
        tap((item) => {
          if (item.direction === '-') {
            this.stackCache.delete(item.id);
          }
        }),
        bufferTime(0),
        filter((items) => items.length > 0)
      )
      .subscribe((items) => {
        const added = items.filter((i) => i.direction === '+');
        const removed = items.filter((i) => i.direction === '-');

        const item: Item = {
          id: id++,
          addedText: `+ ${added.length === 1 ? added[0].name : this.props.multipleText}`,
          removedText: `- ${removed.length === 1 ? removed[0].name : this.props.multipleText}`,
          addedIcons: added.map((i) => statusIcon(i.icon, i.stacks)),
          removedIcons: removed.map((i) => statusIcon(i.icon, i.stacks)),
          addedColor: added.some(i => i.isHarmful) ? 'text-xiv-offensive' : 'text-teal-300',
          ref: createRef<HTMLDivElement>(),
        };

        this.buffer.push(item);

        this.setState({ items: this.buffer });

        setTimeout(() => this.removeItem(item), this.props.time);
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
      <div className="w-[350px]" style={{ height: (300 / 5000) * this.props.time }}>
        <TransitionGroup>
          {this.state.items.map((i) => (
            <CSSTransition
              key={i.id}
              nodeRef={i.ref}
              classNames={`scroll-${this.props.direction}`}
              timeout={{ enter: this.props.time, exit: 0 }}
            >
              <div ref={i.ref} className="grid grid-flow-col auto-cols-max items-center absolute">
                {i.addedIcons.length > 0 && (
                  <React.Fragment>
                    {i.addedIcons.map((icon, index) => (
                      <img key={index} className="w-7" src={'https://beta.xivapi.com' + icon} alt="Icon" />
                    ))}
                    <span className={clsx('mx-1', i.addedColor)}>{i.addedText}</span>
                  </React.Fragment>
                )}
                {i.removedIcons.length > 0 && (
                  <React.Fragment>
                    {i.removedIcons.map((icon, index) => (
                      <img key={index} className="w-7" src={'https://beta.xivapi.com' + icon} alt="Icon" />
                    ))}
                    <span className="ml-1 text-slate-300">{i.removedText}</span>
                  </React.Fragment>
                )}
              </div>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    );
  }
}
