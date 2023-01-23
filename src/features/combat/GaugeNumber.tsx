import { FC } from 'react';
import { clsx } from 'clsx';

type GaugeNumberProps = {
  number: number;
  className?: string;
};

export const GaugeNumber: FC<GaugeNumberProps> = ({ number, className }) => {
  return <div className={clsx(className, 'font-ui-medium drop-shadow-[0_0_10px_rgba(0,0,0,1)] tracking-wider text-[21px]')}>{number}</div>;
};
