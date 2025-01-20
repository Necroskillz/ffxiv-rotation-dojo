import { FC } from 'react';
import clsx from 'clsx';

interface XivIconProps {
  icon: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  id?: string;
}

export const XivIcon: FC<XivIconProps> = ({ icon, alt, width, height, className, id }) => {
  return (
    <img
      id={id}
      src={`https://beta.xivapi.com${icon}`}
      alt={alt || icon}
      className={clsx(className)}
      style={{
        width: width,
        height: height || width,
      }}
    />
  );
}; 