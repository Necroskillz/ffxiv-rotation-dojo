import { useAppSelector } from '../../app/hooks';
import { Hotbar } from './Hotbar';
import { HotbarConfig } from './HotbarConfig';
import { selectHotbars } from './hotbarSlice';
import { KeyboardHandler } from './KeyboardHandler';
import { Fragment } from 'react';

export const Hotbars = () => {
  const hotbars = useAppSelector(selectHotbars);

  return (
    <div className="grid auto-rows-max grid-flow-row gap-1.5">
      {hotbars.map((h) => (
        <Fragment key={h.id}>
          <Hotbar hotbar={h} />
          <HotbarConfig hotbar={h} />
        </Fragment>
      ))}
      <KeyboardHandler />
    </div>
  );
};
