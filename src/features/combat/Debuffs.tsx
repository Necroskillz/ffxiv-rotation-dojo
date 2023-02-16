import { useAppSelector } from '../../app/hooks';
import { selectDebuffs } from './combatSlice';
import { Status } from './Status';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';

export const Debuffs = () => {
  const debuffs = useAppSelector(selectDebuffs);
  const hudLock = useAppSelector(selectLock);

  return (
    <HudItem name="Debuffs" defaultPosition={{ x: 20, y: 150 }}>
      <div className="h-20 grid auto-cols-max grid-flow-col gap-x-1">
        {hudLock || debuffs.length ? debuffs.map((b) => <Status key={b.id} status={b} />) : 'Debuffs'}
      </div>
    </HudItem>
  );
};
