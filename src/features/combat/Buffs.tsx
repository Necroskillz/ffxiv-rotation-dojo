import { useAppSelector } from '../../app/hooks';
import { selectBuffs } from './combatSlice';
import { Status } from './Status';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';

export const Buffs = () => {
  const buffs = useAppSelector(selectBuffs);
  const hudLock = useAppSelector(selectLock);

  return (
    <HudItem name="Buffs" defaultPosition={{ x: 20, y: 250 }}>
      <div className="h-20 grid auto-cols-max grid-flow-col gap-x-1">
        {hudLock || buffs.length ? buffs.filter((b) => b.visible).map((b) => <Status key={b.id} buff={b} />) : 'Buffs'}
      </div>
    </HudItem>
  );
};
