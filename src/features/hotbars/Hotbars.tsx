import React from 'react';
import { usePreview } from 'react-dnd-preview';
import { useAppSelector } from '../../app/hooks';
import { getActionById } from '../actions/actions';
import { ActionId } from '../actions/action_enums';
import { Hotbar } from './Hotbar';
import { HotbarConfig } from './HotbarConfig';
import { selectHotbars } from './hotbarSlice';

const ActionIconPreview = () => {
  const preview = usePreview<{ id: ActionId }>();
  if (!preview.display) {
    return null;
  }

  const { item, style, itemType } = preview;

  if (itemType !== 'action') {
    return null;
  }

  const action = getActionById(item.id);

  return (
    <div style={style}>
      <img style={{ width: '40px', height: '40px' }} src={'https://xivapi.com' + action.icon} alt={action.name} />
    </div>
  );
};

export const Hotbars = () => {
  const hotbars = useAppSelector(selectHotbars);

  return (
    <div className="grid auto-rows-max grid-flow-row gap-1.5">
      {hotbars.map((h) => (
        <React.Fragment key={h.id}>
          <Hotbar hotbar={h} />
          <HotbarConfig hotbar={h} />
        </React.Fragment>
      ))}
      <ActionIconPreview />
    </div>
  );
};
