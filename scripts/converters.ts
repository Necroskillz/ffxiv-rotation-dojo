import { ActionInfo, StatusInfo, ActionResponse, ItemResponse, GtItemResponse, BoilmasterResponse } from './types';

type CostHandler = (cost: number) => [string | null, number];

const converter = {
  icon(icon: string): string {
    return `/api/1/asset/${icon}?format=png`;
  },
  description(description: string): string {
    description = description
      .replace('<UIForeground>F201F4</UIForeground><UIGlow>F201F5</UIGlow>', '<span style="color:#EE7318;">')
      .replace('<UIForeground>F201FA</UIForeground><UIGlow>F201FB</UIGlow>', '<span style="color:#EEEE60;">')
      .replace('<UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>', '<span style="color:#00CC22;">')
      .replace('<UIGlow>01</UIGlow><UIForeground>01</UIForeground>', '</span>')
      .replace('\n\n', '<br />');

    return description.replace(/<Else\/>.*?<\/If>|<If.*?>/g, '');
  },
  action: {
    name(action: ActionInfo): string {
      switch (action.id) {
        case 11428:
          return 'MountainBusterBlu';
        case 11397:
          return 'ThousandNeedles';
        case 11384:
          return 'FourTonzeWeight';
        case 999000:
          return 'FumaShurikenChi';
        case 999001:
          return 'FumaShurikenJin';
        case 23289:
          return 'PhantomFlurryFinisher';
        default:
          return action.name;
      }
    },
    job(data: BoilmasterResponse<ActionResponse>): string[] {
      if (
        [
          16191, 16192, 16193, 16194, 16195, 16196, 2272, 32068, 32067, 32066, 32065, 18073, 25852, 25853, 25854, 23268, 23274, 23289,
        ].includes(data.row_id)
      ) {
        return [];
      }
      return data.fields.ClassJobCategory.fields.Name.split(' ');
    },
    range(data: BoilmasterResponse<ActionResponse>): number | null {
      if (data.fields.Range === -1) {
        if (['DNC', 'BRD', 'MCH'].includes(data.fields.ClassJobCategory.fields.Name)) {
          return 25;
        } else {
          return 3;
        }
      }
      return data.fields.Range;
    },
    recastTime(data: BoilmasterResponse<ActionResponse>): number {
      const onePointFiveRecasts = [16003, 16004, 24396, 24395, 7410, 16497, 36978];
      if (onePointFiveRecasts.includes(data.row_id)) {
        return 1500;
      }

      if ([15999, 16000, 16001, 16002].includes(data.row_id)) {
        return 1000;
      }

      return data.fields.Recast100ms * 100;
    },
    costType: (() => {
      const specialCostMap = new Map<number, [string, number]>(
        [
          { ids: [25832, 25833, 25834, 25823, 25824, 25825], cost: ['mana', 300] as [string, number] },
          { ids: [7525], cost: ['mana', 400] as [string, number] },
          { ids: [24398], cost: ['lemure', 1] as [string, number] },
          { ids: [25797], cost: ['mana', 1600] as [string, number] },
          { ids: [16505, 162], cost: ['mana', 10000] as [string, number] },
        ].flatMap(({ ids, cost }) => ids.map(id => [id, cost]))
      );

      const costTypeMap = new Map<number, CostHandler>([
        [0, () => [null, 0] as [null, number]],
        [3, (cost) => ['mana', cost * 100] as [string, number]],
        [22, (cost) => ['beast', cost] as [string, number]],
        [23, (cost) => ['polyglot', cost] as [string, number]],
        [25, (cost) => ['blood', cost] as [string, number]],
        [27, (cost) => ['ninki', cost] as [string, number]],
        [28, (cost) => ['chakra', cost] as [string, number]],
        [39, (cost) => ['kenki', cost] as [string, number]],
        [41, (cost) => ['oath', cost] as [string, number]],
        [43, (cost) => ['whiteMana,blackMana', cost] as [string, number]],
        [53, (cost) => ['fans', cost] as [string, number]],
        [54, (cost) => ['esprit', cost] as [string, number]],
        [55, (cost) => ['cartridge', cost] as [string, number]],
        [59, (cost) => ['soulVoice', cost] as [string, number]],
        [61, (cost) => ['heat', cost] as [string, number]],
        [62, (cost) => ['battery', cost] as [string, number]],
        [63, (cost) => ['meditation', cost] as [string, number]],
        [64, (cost) => ['soul', cost] as [string, number]],
        [65, (cost) => ['shroud', cost] as [string, number]],
        [66, (cost) => ['lemure', cost] as [string, number]],
        [67, (cost) => ['void', cost] as [string, number]],
        [75, (cost) => ['firstmindsFocus', cost] as [string, number]],
        [87, (cost) => ['rattlingCoil', cost] as [string, number]],
        [88, (cost) => ['serpentsOfferings', cost] as [string, number]],
        [89, (cost) => ['anguineTribute', cost] as [string, number]],
        [91, (cost) => ['palette', cost] as [string, number]],
        [92, () => ['whitePaint', 1] as [string, number]],
        [98, (cost) => ['astralSoul', cost] as [string, number]],
      ]);

      return (data: BoilmasterResponse<ActionResponse>): [string | null, number] => {
        const specialCost = specialCostMap.get(data.row_id);
        if (specialCost) return specialCost;

        const costHandler = costTypeMap.get(data.fields.PrimaryCostType);
        return costHandler ? costHandler(data.fields.PrimaryCostValue) : ['unknown', data.fields.PrimaryCostType];
      };
    })(),
  },
  status: {
    name(status: StatusInfo): string {
      switch (status.id) {
        case 2695:
          return 'ImprovisationRegen';
        case 1848:
          return 'TechnicalEsprit';
        case 88:
          return 'HolmgangDebuff';
        case 2722:
          return 'PlayingRadiantFinale';
        case 1946:
          return 'WildfireBuff';
        case 3872:
          return 'High Thunder II';
        default:
          return status.name;
      }
    },
  },
  item: {
    description(data: ItemResponse, gtData: GtItemResponse): string {
      const description = data.Description.replace('\n\n', '<br />');
      const lines = ['<span style="color:#828282;">Effects</span><br/>'];

      for (const [key, value] of Object.entries(gtData.item.attr_hq.action)) {
        lines.push(`&nbsp;&nbsp;${key} +${value.rate}% (Max ${value.limit})<br />`);
      }

      lines.push('<br />', description);
      return lines.join('');
    },
    recastTime(data: ItemResponse): number {
      let cd = data.Cooldowns;
      if (data.ItemUICategory.fields.Name === 'Medicine') {
        cd -= 30;
      }
      return cd * 1000;
    },
    job(data: ItemResponse, gtData: GtItemResponse): string[] {
      if (data.ItemUICategory.fields.Name === 'Medicine') {
        if ('Dexterity' in gtData.item.attr_hq.action) {
          return ['DNC', 'BRD', 'MCH', 'NIN'];
        } else if ('Strength' in gtData.item.attr_hq.action) {
          return ['WAR', 'GNB', 'PLD', 'DRK', 'DRG', 'SAM', 'RPR', 'MNK'];
        } else if ('Intelligence' in gtData.item.attr_hq.action) {
          return ['SMN', 'RDM', 'BLM', 'BLU'];
        } else if ('Mind' in gtData.item.attr_hq.action) {
          return ['WHM', 'SGE', 'SCH', 'AST'];
        } else {
          throw new Error('Unknown medicine type');
        }
      } else {
        return ['All'];
      }
    },
  },
};

// Export the converter object
export { converter };
