import { useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addBuff, addPlayerDebuff, removeBuffAction, removePlayerDebuffAction } from './combatSlice';
import { StatusScrollingText } from './StatusScrollingText';

export const BuffScrollingText = () => {
  const hudLock = useAppSelector(selectLock);
  return (
    <HudItem name="BuffScrollingText" defaultPosition={{ x: 650, y: 250 }}>
      {hudLock ? (
        <StatusScrollingText
          addType={[addBuff.type, addPlayerDebuff.type]}
          removeType={[removeBuffAction.type, removePlayerDebuffAction.type]}
          direction="down"
          multipleText="Multiple"
          time={5000}
        />
      ) : (
        <div className="h-[300px] w-[350px]">Buff scrolling text</div>
      )}
    </HudItem>
  );
};
