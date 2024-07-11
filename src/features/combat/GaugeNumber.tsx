import { FC } from 'react';
import { clsx } from 'clsx';

type GaugeNumberProps = {
  number: number;
  className?: string;
  shadow?: boolean;
};

export const GaugeNumber: FC<GaugeNumberProps> = ({ number, className, shadow }) => {
  return <div className={clsx(className, 'font-ui-medium tracking-wider text-[21px]', { 'drop-shadow-[0_0_10px_rgba(0,0,0,1)]': shadow })}>{number}</div>;
};
