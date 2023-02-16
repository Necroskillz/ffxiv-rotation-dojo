import { useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addBuff, removeBuff } from './combatSlice';
import { StatusScrollingText } from './StatusScrollingText';

export const BuffScrollingText = () => {
  const hudLock = useAppSelector(selectLock);
  return (
    <HudItem name="BuffScrollingText" defaultPosition={{ x: 650, y: 250 }}>
      {hudLock ? (
        <StatusScrollingText
          addType={addBuff.type}
          removeType={removeBuff.type}
          direction="down"
          multipleText="Multiple Buffs"
          addTextColor="text-teal-300"
          time={5000}
        />
      ) : (
        <div className="h-[300px] w-[350px]">Buff scrolling text</div>
      )}
    </HudItem>
  );
};
