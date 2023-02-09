import { CombatAction } from './combat-action';
import { general } from './general';
import { brd } from './jobs/brd/brd';
import { dnc } from './jobs/dnc/dnc';
import { drg } from './jobs/drg/drg';
import { drk } from './jobs/drk/drk';
import { gnb } from './jobs/gnb/gnb';
import { mch } from './jobs/mch/mch';
import { mnk } from './jobs/mnk/mnk';
import { nin } from './jobs/nin/nin';
import { rdm } from './jobs/rdm/rdm';
import { rpr } from './jobs/rpr/rpr';
import { sam } from './jobs/sam/sam';
import { smn } from './jobs/smn/smn';
import { war } from './jobs/war/war';
import { role } from './role';

function combineActions(...actions: CombatAction[][]): Record<number, CombatAction> {
  const result: Record<number, CombatAction> = {};

  for (const actionSection of actions) {
    actionSection.reduce((r: Record<number, CombatAction>, a: CombatAction) => {
      r[a.id] = a;
      return r;
    }, result);
  }

  return result;
}

export const actions = combineActions(dnc, mch, brd, drg, mnk, nin, rpr, sam, smn, rdm, drk, gnb, war, role, general);
