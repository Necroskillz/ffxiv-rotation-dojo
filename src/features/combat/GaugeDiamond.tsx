import { FC } from 'react';

import style from './Gauge.module.css';

type GaugeDiamondProps = {
  fill: boolean;
  fillColor: string;
};

export const GaugeDiamond: FC<GaugeDiamondProps> = ({ fill, fillColor }) => {
  return <div className={style.diamond} style={fill ? { background: fillColor } : {}}></div>;
};
