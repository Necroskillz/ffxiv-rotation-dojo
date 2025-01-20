import { FaSnowflake, FaMoon, FaClover } from 'react-icons/fa6';
import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectSen } from '../../combatSlice';

export const SenGauge = () => {
  const sen = useAppSelector(selectSen);
  const setsuColor = '#8DD6EF';
  const getsuColor = '#5A65C8';
  const kaColor = '#E2837E';
  const emptyColor = '#0D1932';

  /* Sen can take the base 10 integer values 0, 1, 10, 11, 100, 110, 111.
   * If the ones digit is 1, then the yukikaze (setsu) sen is present.
   * If the tens digit is 1, then the gekko (getsu) sen is present.
   * If the 100s digit is 1, then the kasha (ka) sen is present.
   */
  return (
    <HudItem name="SenGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid grid-flow-col auto-cols-max gap-1.5">
        <FaSnowflake size={16} color={sen % 10 > 0 ? setsuColor : emptyColor} />
        <FaMoon size={16} color={sen % 100 >= 10 ? getsuColor : emptyColor} />
        <FaClover size={16} color={sen >= 100 ? kaColor : emptyColor} />
      </div>
    </HudItem>
  );
};
