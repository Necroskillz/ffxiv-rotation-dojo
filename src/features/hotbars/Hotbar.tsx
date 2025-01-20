import { FC } from 'react';
import { FaGear, FaLock, FaLockOpen } from 'react-icons/fa6';
import { HotbarState, selectHotbarLock, setLock } from './hotbarSlice';
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
  const hotbarLock = useAppSelector(selectHotbarLock);
  const configElement = useAppSelector((state) => selectElement(state, `HotbarConfig${hotbar.id}`));
  const config = hotbar.config;
  const rows = Array.from({ length: config.rows }).map(() => 12 / config.rows);

  function toggleConfig() {
    dispatch(setVisility({ element: `HotbarConfig${hotbar.id}`, isVisible: !configElement.isVisible }));
  }
  function toggleLock() {
    dispatch(setLock(!hotbarLock));
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
        {hudLock && hotbar.id === 1 && (
          <button onClick={toggleLock} className="place-self-center">
            {hotbarLock ? <FaLock /> : <FaLockOpen />}
          </button>
        )}
        {!hudLock && (
          <button onClick={toggleConfig}>
            <FaGear />
          </button>
        )}
      </div>
    </HudItem>
  );
};
