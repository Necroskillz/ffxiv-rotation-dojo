import { faClover, faMoon, faSnowflake } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectSen } from '../../combatSlice';

export const SenGauge = () => {
  const sen = useAppSelector(selectSen);
  const setsuColor = '#8DD6EF';
  const getsuColor = '#5A65C8';
  const kaColor = '#E2837E';
  const emptyColor = '#0D1932';

  return (
    <HudItem name="SenGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid grid-flow-col auto-cols-max gap-1.5">
        <FontAwesomeIcon icon={faSnowflake} color={sen % 10 > 0 ? setsuColor : emptyColor} />
        <FontAwesomeIcon icon={faMoon} color={sen % 100 > 0 ? getsuColor : emptyColor} />
        <FontAwesomeIcon icon={faClover} color={sen >= 100 ? kaColor : emptyColor} />
      </div>
    </HudItem>
  );
};
