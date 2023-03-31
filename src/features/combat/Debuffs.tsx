import { useAppSelector } from '../../app/hooks';
import { selectDebuffs } from './combatSlice';
import { Status } from './Status';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { StatusTarget } from './combat-status';

export const Debuffs = () => {
  const debuffs = useAppSelector(selectDebuffs);
  const hudLock = useAppSelector(selectLock);

  return (
    <HudItem name="Debuffs" defaultPosition={{ x: 20, y: 150 }}>
      <div className="h-20 grid auto-cols-max grid-flow-col gap-x-1">
        {hudLock || debuffs.length
          ? debuffs.filter((d) => d.target === StatusTarget.Enemy && d.visible).map((d) => <Status key={d.id} status={d} />)
          : 'Enemy debuffs'}
      </div>
    </HudItem>
  );
};
