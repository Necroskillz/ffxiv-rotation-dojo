import { useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectPet } from './combatSlice';

export const Pet = () => {
  const pet = useAppSelector(selectPet);

  return (
    <HudItem name="Pet" defaultPosition={{ x: 450, y: 20 }}>
      <div className="grid auto-rows-max grid-flow-row w-40 font-ui-light justify-center">
        <div className="font-bold text-center">Pet</div>
        <div className="text-center">{pet ? pet.name : '-'}</div>
      </div>
    </HudItem>
  );
};
