import { FC } from 'react';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HotbarState } from './hotbarSlice';
import { HotbarSlot } from './HotbarSlot';
import { HudItem } from '../hud/HudItem';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectElement, selectLock, setVisility } from '../hud/hudSlice';

type HotbarProps = {
  hotbar: HotbarState;
};

export const Hotbar: FC<HotbarProps> = ({ hotbar }) => {
  const dispatch = useAppDispatch();
  const hudLock = useAppSelector(selectLock);
  const configElement = useAppSelector((state) => selectElement(state, `HotbarConfig${hotbar.id}`));
  const config = hotbar.config;
  const rows = Array.from({ length: config.rows }).map(() => 12 / config.rows);

  function toggleConfig() {
    dispatch(setVisility({ element: `HotbarConfig${hotbar.id}`, isVisible: !configElement.isVisible }));
  }

  return (
    <HudItem name={'Hotbar' + hotbar.id} defaultPosition={{ x: 20, y: 300 + hotbar.id * 50 }}>
      <div className="grid grid-flow-col auto-cols-min items-start gap-2">
        <div className="grid auto-rows-max grid-flow-row gap-1.5">
          {rows.map((c, i) => (
            <div key={i * c} className="grid auto-cols-max grid-flow-col gap-1.5">
              {hotbar.slots.slice(i * c, i * c + c).map((s) => (
                <HotbarSlot key={s.id} hotbarId={hotbar.id} slotId={s.id} size={config.size} />
              ))}
            </div>
          ))}
        </div>
        {!hudLock && (
          <button onClick={toggleConfig}>
            <FontAwesomeIcon icon={faGear}></FontAwesomeIcon>
          </button>
        )}
      </div>
    </HudItem>
  );
};
