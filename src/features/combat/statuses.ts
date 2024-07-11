import { CombatStatus } from './combat-status';
import { generalStatuses } from './general';
import { blmStatuses } from './jobs/blm/blm';
import { bluStatuses } from './jobs/blu/blu';
import { brdStatuses } from './jobs/brd/brd';
import { dncStatuses } from './jobs/dnc/dnc';
import { drgStatuses } from './jobs/drg/drg';
import { drkStatuses } from './jobs/drk/drk';
import { gnbStatuses } from './jobs/gnb/gnb';
import { mchStatuses } from './jobs/mch/mch';
import { mnkStatuses } from './jobs/mnk/mnk';
import { ninStatuses } from './jobs/nin/nin';
import { pctStatuses } from './jobs/pct/pct';
import { pldStatuses } from './jobs/pld/pld';
import { rdmStatuses } from './jobs/rdm/rdm';
import { rprStatuses } from './jobs/rpr/rpr';
import { samStatuses } from './jobs/sam/sam';
import { smnStatuses } from './jobs/smn/smn';
import { vprStatuses } from './jobs/vpr/vpr';
import { warStatuses } from './jobs/war/war';
import { roleStatuses } from './role';

function combineStatuses(...statuses: CombatStatus[][]): Record<number, CombatStatus> {
  const result: Record<number, CombatStatus> = {};

  for (const statusSection of statuses) {
    statusSection.reduce((r: Record<number, CombatStatus>, s: CombatStatus) => {
      r[s.id] = s;
      return r;
    }, result);
  }

  return result;
}

export const statuses = combineStatuses(
  generalStatuses,
  roleStatuses,
  blmStatuses,
  brdStatuses,
  dncStatuses,
  drgStatuses,
  drkStatuses,
  gnbStatuses,
  mchStatuses,
  mnkStatuses,
  ninStatuses,
  pldStatuses,
  rdmStatuses,
  bluStatuses,
  rprStatuses,
  samStatuses,
  smnStatuses,
  warStatuses,
  vprStatuses,
  pctStatuses
);
