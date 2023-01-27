import { FC } from 'react';
import ProgressBar from '@ramonak/react-progress-bar';

import style from './Gauge.module.css';

type GaugeBarProps = {
  current: number;
  max: number;
  texture: string;
  animate?: boolean;
};

export const GaugeBar: FC<GaugeBarProps> = ({ current, max, texture, animate }) => {
  return (
    <ProgressBar
      completed={current}
      maxCompleted={max}
      isLabelVisible={false}
      className={style.bar}
      bgColor={texture}
      animateOnRender={false}
      transitionDuration={animate === false ? '0s' : '300ms'}
    />
  );
};
