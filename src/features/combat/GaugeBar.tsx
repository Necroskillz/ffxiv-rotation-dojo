import { FC } from 'react';
import ProgressBar from '@ramonak/react-progress-bar';

import style from './Gauge.module.css';

type GaugeBarProps = {
  current: number;
  max: number;
  texture: string;
};

export const GaugeBar: FC<GaugeBarProps> = ({ current, max, texture }) => {
  return (
    <ProgressBar
      completed={current}
      maxCompleted={max}
      isLabelVisible={false}
      className={style.bar}
      bgColor={texture}
    />
  );
};
