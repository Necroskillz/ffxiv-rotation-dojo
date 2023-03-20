import { getActionById } from '../actions/actions';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { actions } from '../combat/actions';
import { buff, cooldown, debuff, ResourceTypes, setCombat, setPet, setPullTimer, setResource } from '../combat/combatSlice';
import { setPartySize, setSkillSpeed, setSpellSpeed } from '../player/playerSlice';
import { stateInitializer } from './state_initializer';

export enum CommandArgType {
  String,
  Number,
  Boolean,
}

export enum CommandType {
  SetState,
}

interface ScriptEngineCommandArg {
  type: CommandArgType;
  optional?: boolean;
}

export interface ScriptEngineCommandDefinition {
  name: string;
  args: ScriptEngineCommandArg[];
  register: (...args: any[]) => void;
}

const combatCommands: ScriptEngineCommandDefinition = {
  name: 'combat',
  args: [{ type: CommandArgType.Boolean }],
  register: (combat: boolean) => {
    stateInitializer.registerAction((dispatch) => {
      dispatch(setCombat(combat));
    });
  },
};

const resourceCommand: ScriptEngineCommandDefinition = {
  name: 'resource',
  args: [{ type: CommandArgType.String }, { type: CommandArgType.Number }],
  register: (resourceType: string, amount: number) => {
    if (!ResourceTypes.includes(resourceType)) {
      throw new Error(`Invalid resource type: ${resourceType}`);
    }

    stateInitializer.registerAction((dispatch) => {
      dispatch(setResource({ resourceType, amount }));
    });
  },
};

const buffCommand: ScriptEngineCommandDefinition = {
  name: 'buff',
  args: [{ type: CommandArgType.Number }, { type: CommandArgType.Number, optional: true }, { type: CommandArgType.Number, optional: true }],
  register: (id: number, duration?: number, stacks?: number) => {
    if (!Object.values(StatusId).includes(id)) {
      throw new Error(`Invalid status id: ${id}`);
    }

    stateInitializer.registerAction((dispatch) => {
      dispatch(buff(id, { duration, stacks }));
    });
  },
};

const debuffCommand: ScriptEngineCommandDefinition = {
  name: 'debuff',
  args: [{ type: CommandArgType.Number }, { type: CommandArgType.Number }, { type: CommandArgType.Number, optional: true }],
  register: (id: number, duration: number, stacks?: number) => {
    if (!Object.values(StatusId).includes(id)) {
      throw new Error(`Invalid status id: ${id}`);
    }

    stateInitializer.registerAction((dispatch) => {
      dispatch(debuff(id, { duration, stacks }));
    });
  },
};

const cooldownCommand: ScriptEngineCommandDefinition = {
  name: 'cooldown',
  args: [{ type: CommandArgType.Number }, { type: CommandArgType.Number }],
  register: (id: number, remaining: number) => {
    if (!Object.values(ActionId).includes(id)) {
      throw new Error(`Invalid action id: ${id}`);
    }

    stateInitializer.registerAction((dispatch, getState) => {
      const combatAction = actions[id];
      const action = getActionById(id);
      const cd = combatAction.cooldown(getState());

      dispatch(cooldown(action.cooldownGroup, cd, Date.now() - (cd - remaining * 1000)));
    });
  },
};

const petCommand: ScriptEngineCommandDefinition = {
  name: 'pet',
  args: [{ type: CommandArgType.String }],
  register: (name: string) => {
    stateInitializer.registerAction((dispatch) => {
      dispatch(setPet({ name }));
    });
  },
};

const pullTimerCommand: ScriptEngineCommandDefinition = {
  name: 'pull_timer',
  args: [{ type: CommandArgType.Number }],
  register: (value: number) => {
    stateInitializer.registerAction((dispatch) => {
      dispatch(setPullTimer(value));
    });
  },
};

const skillSpeedCommand: ScriptEngineCommandDefinition = {
  name: 'skill_speed',
  args: [{ type: CommandArgType.Number }],
  register: (value: number) => {
    stateInitializer.registerAction((dispatch) => {
      dispatch(setSkillSpeed(value));
    });
  },
};

const spellSpeedCommand: ScriptEngineCommandDefinition = {
  name: 'spell_speed',
  args: [{ type: CommandArgType.Number }],
  register: (value: number) => {
    stateInitializer.registerAction((dispatch) => {
      dispatch(setSpellSpeed(value));
    });
  },
};

const partySizeCommand: ScriptEngineCommandDefinition = {
  name: 'party_size',
  args: [{ type: CommandArgType.Number }],
  register: (value: number) => {
    stateInitializer.registerAction((dispatch) => {
      dispatch(setPartySize(value));
    });
  },
};

export const commands: ScriptEngineCommandDefinition[] = [
  combatCommands,
  resourceCommand,
  buffCommand,
  debuffCommand,
  cooldownCommand,
  petCommand,
  pullTimerCommand,
  skillSpeedCommand,
  spellSpeedCommand,
  partySizeCommand,
];
