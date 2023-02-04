import { CombatAction } from './combat-action';
import { general } from './general';
import { brd } from './jobs/brd/brd';
import { dnc } from './jobs/dnc/dnc';
import { mch } from './jobs/mch/mch';
import { nin } from './jobs/nin/nin';
import { rpr } from './jobs/rpr/rpr';
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

export const actions = combineActions(dnc, mch, brd, nin, rpr, smn, war, role, general);
