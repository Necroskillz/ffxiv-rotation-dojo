import clsx from 'clsx';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import { ActionId } from '../../../actions/action_enums';
import { getStatusById } from '../../../actions/status';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBlueMagicSpellSet } from '../../../player/playerSlice';
import { selectMimicry, setMimicry } from '../../combatSlice';
import { XivIcon } from '@/components/XivIcon';

export const MimicryGauge = () => {
  const mimicry = useAppSelector(selectMimicry);
  const dispatch = useAppDispatch();
  const spellSet = useAppSelector(selectBlueMagicSpellSet);

  const items = [
    { id: StatusId.AethericMimicryDPS, icon: getStatusById(StatusId.AethericMimicryDPS).icon },
    { id: StatusId.AethericMimicryTank, icon: getStatusById(StatusId.AethericMimicryTank).icon },
    { id: StatusId.AethericMimicryHealer, icon: getStatusById(StatusId.AethericMimicryHealer).icon },
  ];

  const [selectedItem, setSelectedItem] = useState(mimicry);

  function selectItem(id: StatusId) {
    dispatch(setMimicry(id));
    setSelectedItem(id);
  }

  if (!spellSet.spells.includes(ActionId.AethericMimicry)) return null;

  return (
    <HudItem name="MimicryGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-20 h-50">
        <div className="grid grid-flow-row auto-rows-max place-items-center gap-1">
          {items.map((item, id) => (
            <div onClick={() => selectItem(item.id)} key={id} className={clsx({ border: selectedItem === item.id }, 'rounded')}>
              <XivIcon icon={item.icon} />
            </div>
          ))}
        </div>
      </div>
    </HudItem>
  );
};
