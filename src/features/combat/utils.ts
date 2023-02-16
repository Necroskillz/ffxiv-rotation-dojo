export const rng = (chance: number) => Math.random() <= chance / 100;

export function statusIcon(icon: string, stacks: number | null) {
  if (stacks && stacks > 1) {
    const stackIcon = icon.replace(/(\/i\/\d{6}\/)(\d{6})(_hr1\.png)/, (_: string, start: string, id: string, end: string) => {
      return `${start}${(parseInt(id) + stacks - 1).toString().padStart(6, '0')}${end}`;
    });

    return stackIcon;
  } else {
    return icon;
  }
}
