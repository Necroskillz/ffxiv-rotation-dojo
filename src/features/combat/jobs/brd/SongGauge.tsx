import { faDove, faHorseHead, faLeaf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { getStatusById } from '../../../actions/status';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import {
  selectArmyCoda,
  selectArmyRepertoire,
  selectBuff,
  selectMageCoda,
  selectSoulVoice,
  selectWandererCoda,
  selectWandererRepertoire,
  StatusState,
} from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';

export const SongGauge = () => {
  const soulVoice = useAppSelector(selectSoulVoice);
  const wandererRepertoire = useAppSelector(selectWandererRepertoire);
  const armyRepertoire = useAppSelector(selectArmyRepertoire);
  const wandererCoda = useAppSelector(selectWandererCoda);
  const armyCoda = useAppSelector(selectArmyCoda);
  const mageCoda = useAppSelector(selectMageCoda);
  const wandererRepertoireFillColor = '#C1E5FE';
  const armyRepertoireFillColor = '#D2FF5A';
  const wanderersMinuetTexture = 'linear-gradient(45deg, rgba(82,106,3, 1) 0%, rgba(118,143,24, 1) 50%, rgba(224,249,132, 1) 100%)';
  const magesBalladTexture = 'linear-gradient(45deg, rgba(112,51,88, 1) 0%, rgba(203,140,178, 1) 50%, rgba(254,198,238, 1) 100%)';
  const armysPaeonTexture = 'linear-gradient(45deg, rgba(118,59,4, 1) 0%, rgba(186,117,15, 1) 50%, rgba(255,209,104, 1) 100%)';
  const lowSoulVoiceTexture = 'linear-gradient(45deg, rgba(0,123,152, 1) 0%, rgba(0,166,193, 1) 50%, rgba(0,221,232, 1) 100%)';
  const soulVoiceTexture = 'linear-gradient(45deg, rgba(77,125,0, 1) 0%, rgba(125,174,0, 1) 50%, rgba(181,227,0, 1) 100%)';

  const emptyCodaColor = '#0D1932';
  const wandererCodaColor = '#94BA40';
  const mageCodaColor = '#EB9CE6';
  const armyCodaColor = '#ECBB8D';

  const wanderersMinuet = useAppSelector((state) => selectBuff(state, StatusId.WanderersMinuetActive));
  const magesBallad = useAppSelector((state) => selectBuff(state, StatusId.MagesBalladActive));
  const armysPaeon = useAppSelector((state) => selectBuff(state, StatusId.ArmysPaeonActive));

  const [songTime, setSongTime] = useState<number | null>(null);
  const [songRemainingTime, setSongRemainingTime] = useState<number | null>(null);
  const [songName, setSongName] = useState<string | null>(null);

  useEffect(() => {
    function setBuff(buff: StatusState | null) {
      if (buff) {
        setSongTime(Date.now() - buff.timestamp);
        setSongRemainingTime(Math.round(buff.duration! - (Date.now() - buff.timestamp) / 1000));

        const map: Record<number, StatusId> = {
          [StatusId.WanderersMinuetActive]: StatusId.TheWanderersMinuet,
          [StatusId.MagesBalladActive]: StatusId.MagesBallad,
          [StatusId.ArmysPaeonActive]: StatusId.ArmysPaeon,
        };

        setSongName(getStatusById(map[buff.id]).name);
      }
    }

    function set() {
      setSongTime(null);
      setSongRemainingTime(null);
      setSongName(null);
      setBuff(wanderersMinuet);
      setBuff(magesBallad);
      setBuff(armysPaeon);
    }

    set();
    const timer = setInterval(() => set(), 100);

    return () => clearInterval(timer);
  }, [wanderersMinuet, magesBallad, armysPaeon, setSongTime]);

  return (
    <HudItem name="SongGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid grid-flow-col auto-cols-max gap-2">
        <div className="grid gap-0.5">
          <div className="h-[20px] -mb-[5px] text-sm leading-0 text-xiv-ui">{songName}</div>
          <GaugeBar
            current={songTime || 0}
            max={45000}
            texture={wanderersMinuet ? wanderersMinuetTexture : magesBallad ? magesBalladTexture : armysPaeonTexture}
            animate={songTime ? songTime >= 1 : true}
          />
          <div className="grid grid-flow-col h-[25px]">
            <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
              {wanderersMinuet && (
                <React.Fragment>
                  <GaugeDiamond fill={wandererRepertoire > 0} fillColor={wandererRepertoireFillColor} />
                  <GaugeDiamond fill={wandererRepertoire > 1} fillColor={wandererRepertoireFillColor} />
                  <GaugeDiamond fill={wandererRepertoire > 2} fillColor={wandererRepertoireFillColor} />
                </React.Fragment>
              )}
              {armysPaeon && (
                <React.Fragment>
                  <GaugeDiamond fill={armyRepertoire > 0} fillColor={armyRepertoireFillColor} />
                  <GaugeDiamond fill={armyRepertoire > 1} fillColor={armyRepertoireFillColor} />
                  <GaugeDiamond fill={armyRepertoire > 2} fillColor={armyRepertoireFillColor} />
                  <GaugeDiamond fill={armyRepertoire > 3} fillColor={armyRepertoireFillColor} />
                </React.Fragment>
              )}
            </div>
            {songRemainingTime && <GaugeNumber className="-mt-[7px] mr-4 place-self-end" number={songRemainingTime} />}
          </div>
          <GaugeBar current={soulVoice} max={100} texture={soulVoice >= 20 ? soulVoiceTexture : lowSoulVoiceTexture} />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-4 -mt-[7px]" number={soulVoice} />
          </div>
        </div>
        <div className="grid grid-flow-row auto-rows-max gap-1.5 place-content-center">
          <FontAwesomeIcon icon={faLeaf} color={mageCoda ? mageCodaColor : emptyCodaColor} />
          <FontAwesomeIcon icon={faHorseHead} color={armyCoda ? armyCodaColor : emptyCodaColor} />
          <FontAwesomeIcon icon={faDove} color={wandererCoda ? wandererCodaColor : emptyCodaColor} />
        </div>
      </div>
    </HudItem>
  );
};
