import { CommandArgType, commands } from './commands';

interface ScriptParserError {
  line: number;
  message: string;
}

export interface ScriptEngineParseResult {
  errors: ScriptParserError[];
  execute: () => string[];
}

const agrParser = {
  [CommandArgType.String]: (arg: string) => arg,
  [CommandArgType.Number]: (arg: string) => {
    const num = Number(arg);
    if (Number.isNaN(num)) {
      throw new Error(`Invalid number: ${arg}`);
    }
    return num;
  },
  [CommandArgType.Boolean]: (arg: string) => {
    if (arg === 'true') {
      return true;
    } else if (arg === 'false') {
      return false;
    } else {
      throw new Error(`Invalid boolean: ${arg}`);
    }
  },
};

/**
 * resource <resource_type> <value>
 * cooldown <action_id> <remaining_time>
 * buff <status_id> <remaining_duration> <stacks?>
 * debuff <status_id> <remaining_duration> <stacks?>
 * combo <action_id>
 * combat <boolean>
 * pet <name>
 * pull_timer <value>
 * skill_speed <value>
 * spell_speed <value>
 * party_size <value>
 * -- comment
 */

export function parse(script: string): ScriptEngineParseResult {
  const lines = script.split('\n');
  const cmdLines = lines.map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith('--'));

  const parseErrors: ScriptParserError[] = [];

  const cmds = cmdLines.map((line, index) => {
    const lineNumber = index + 1;
    const [cmd, ...args] = line.split(' ');
    const command = commands.find((c) => c.name === cmd);

    if (command === undefined) {
      parseErrors.push({
        line: lineNumber,
        message: `Unknown command: ${cmd}`,
      });

      return () => {};
    }

    if (args.length < command.args.filter((arg) => !arg.optional).length) {
      parseErrors.push({
        line: lineNumber,
        message: `Invalid number of arguments for command ${cmd}. Expected at least ${
          command.args.filter((arg) => !arg.optional).length
        }, got ${args.length}`,
      });

      return () => {};
    }

    if (args.length > command.args.length) {
      parseErrors.push({
        line: lineNumber,
        message: `Invalid number of arguments for command ${cmd}. Expected at most ${command.args.length}, got ${args.length}`,
      });
    }

    const errors: string[] = [];

    const parsedArgs = command.args.map((arg, index) => {
      try {
        if (arg.optional && args[index] === undefined) {
          return undefined;
        }

        return agrParser[arg.type](args[index]);
      } catch (error: any) {
        errors.push(`Error parsing argument ${index + 1} for command ${cmd}: ${error.message}`);
        return undefined;
      }
    });

    if (errors.length > 0) {
      parseErrors.push({
        line: lineNumber,
        message: errors.join('\n'),
      });

      return () => {};
    }

    return () => command.register(...parsedArgs);
  });

  return {
    errors: parseErrors,
    execute: () => {
      const errors: string[] = [];

      cmds.forEach((cmd) => {
        try {
          cmd();
        } catch (error: any) {
          errors.push(error.message);
        }
      });

      return errors;
    },
  };
}
