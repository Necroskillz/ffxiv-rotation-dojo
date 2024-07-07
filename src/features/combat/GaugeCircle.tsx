import { FC } from 'react';

import style from './Gauge.module.css';

type GaugeDiamondProps = {
  fill: boolean;
  fillColor: string;
};

export const GaugeCircle: FC<GaugeDiamondProps> = ({ fill, fillColor }) => {
  return <div className={style.circle} style={fill ? { background: fillColor } : {}}></div>;
};
