import React, { FC, useEffect, useRef, useState } from 'react';
import { CooldownState } from '../combat/combatSlice';
import { clsx } from 'clsx';

import style from './CooldownSwipe.module.css';

type CooldownSwipeProps = {
  cooldown: CooldownState | null;
  globalCooldown: CooldownState | null;
  extraCooldown: CooldownState | null;
  isGcdAction: boolean;
  maxCharges: number;
  size: number;
};

type Cooldown = {
  progress: number;
  duration: number;
};

export const CooldownSwipe: FC<CooldownSwipeProps> = ({ cooldown, globalCooldown, extraCooldown, isGcdAction, maxCharges, size }) => {
  const [primaryCooldown, setPrimaryCooldown] = useState<Cooldown | null>(null);
  const [secondaryCooldown, setSecondaryCooldown] = useState<Cooldown | null>(null);
  const [textCooldown, setTextCooldown] = useState<Cooldown | null>(null);
  const [charges, setCharges] = useState<number | null>(maxCharges > 1 ? maxCharges : null);

  const { current: id } = useRef('circleMask' + (Math.random().toString(36) + '00000000000000000').slice(2, 7));

  useEffect(() => {
    function set(cd: CooldownState | null, action: (cd: React.SetStateAction<Cooldown | null>) => void) {
      if (cd) {
        let progress = cd.timestamp + cd.duration - Date.now();
        if (maxCharges > 1) {
          setCharges(maxCharges - Math.ceil(progress / cd.duration));
          progress = progress % cd.duration;
        }

        action({ progress, duration: cd.duration });
      } else {
        action(null);
      }
    }

    function setPrimary(cd: CooldownState | null) {
      set(cd, setPrimaryCooldown);
    }

    function setSecondary(cd: CooldownState | null) {
      set(cd, setSecondaryCooldown);
    }

    function setText(cd: CooldownState | null) {
      set(cd, setTextCooldown);
    }

    let timerId: NodeJS.Timer | null = null;

    if (cooldown || globalCooldown || extraCooldown) {
      timerId = setInterval(() => {
        if (isGcdAction) {
          setPrimary(globalCooldown);
          setSecondary(cooldown);
        } else if (maxCharges > 1) {
          setPrimary(extraCooldown);
          setSecondary(cooldown); // alternative
        } else {
          setPrimary(cooldown);
        }

        setText(cooldown);
      }, 10);
    } else {
      setPrimary(null);
      setSecondary(null);
      setText(null);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [cooldown, globalCooldown, extraCooldown, setPrimaryCooldown, setSecondaryCooldown, setTextCooldown, maxCharges, isGcdAction]);

  return (
    <div
      className={style.cooldown}
      style={{
        width: 40 * size,
        height: 40 * size,
      }}
    >
      {(primaryCooldown || secondaryCooldown) && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          transform={size > 1.6 ? `scale(${(1 / 64) * size * 40})` : 'scale(1)'}
        >
          <mask id={id}>
            <g transform="translate(32, 32)">
              <rect className={style.mask_rect} x="-32" y="-32" width="64" height="64" rx="6" ry="6"></rect>
              <circle
                className={style.mask_circle}
                style={{
                  strokeDashoffset: primaryCooldown ? (100 / primaryCooldown.duration) * primaryCooldown.progress * 0.88 : 0,
                }}
                cx="0"
                cy="0"
                r="14"
              ></circle>
            </g>
          </mask>
          <rect x="0" y="0" width="64" height="64" rx="6" ry="6" fill="black" mask={'url(#' + id + ')'}></rect>
          {secondaryCooldown && (
            <circle
              className={style.secondary_circle}
              style={{
                strokeDashoffset: (100 / secondaryCooldown.duration) * secondaryCooldown.progress * 1.5,
              }}
              cx="-32"
              cy="32"
              r="24"
            ></circle>
          )}
        </svg>
      )}
      {textCooldown && (
        <span className={style.text} style={{ fontSize: 26 * size }}>
          {Math.ceil(textCooldown.progress / 1000)}
        </span>
      )}
      {maxCharges > 0 && <span className={clsx(style.charges, { [style.charges_empty]: charges === 0 })}>{charges}</span>}
    </div>
  );
};
