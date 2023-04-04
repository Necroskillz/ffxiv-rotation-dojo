import React from 'react';
import { connect } from 'react-redux';
import { filter, scan, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addEvent, setCombat } from './combatSlice';
import { actionStream$ } from './general';

type PotencyPerSecondDisplayState = {
  value: number;
  time: number;
};

type PotencyPerSecondDisplayProps = {
  hudLock: boolean;
};

export class PotencyPerSecondDisplay extends React.Component<PotencyPerSecondDisplayProps, PotencyPerSecondDisplayState> {
  private unsubscribe = new Subject<void>();
  private timerRunning = false;
  private timerStart = 0;

  constructor(props: PotencyPerSecondDisplayProps) {
    super(props);

    this.state = { value: 0, time: 0 };
  }

  componentDidMount(): void {
    actionStream$
      .pipe(
        filter((a) => a.type === addEvent.type && a.payload.potency > 0),
        takeUntil(this.unsubscribe),
        scan((acc, a) => acc + a.payload.potency, 0)
      )
      .subscribe((value) => {
        this.setState({ value });
      });

    actionStream$
      .pipe(
        filter((a) => a.type === setCombat.type),
        takeUntil(this.unsubscribe)
      )
      .subscribe((action) => {
        this.timerRunning = action.payload;

        if (this.timerRunning) {
          this.timerStart = Date.now();
        }
      });

    setInterval(() => {
      if (this.timerRunning) {
        this.setState({ time: Date.now() - this.timerStart });
      }
    }, 500);
  }

  componentWillUnmount(): void {
    this.unsubscribe.next();
  }

  render(): React.ReactNode {
    return (
      <HudItem name="PotencyPerSecondDisplay" defaultPosition={{ x: 650, y: 175 }}>
        <div className="grid grid-flow-row w-60">
          <div>
            Combat time:{' '}
            <b>
              {Math.floor(this.state.time / 60000)
                .toString()
                .padStart(2, '0')}
              :
              {Math.floor((this.state.time % 60000) / 1000)
                .toString()
                .padStart(2, '0')}
            </b>
          </div>
          <div>Potency per second: <strong>{this.state.time ? Math.round(this.state.value / (this.state.time / 1000)) : 0}</strong></div>
        </div>
      </HudItem>
    );
  }
}

export default connect<PotencyPerSecondDisplayProps, {}, {}, RootState>((state) => ({ hudLock: selectLock(state) }))(
  PotencyPerSecondDisplay
);
