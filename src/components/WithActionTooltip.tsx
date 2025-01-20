import { FC, ReactElement } from 'react';
import { ActionTooltip } from '@/features/actions/ActionTooltip';
import { ActionInfo } from '@/features/actions/actions';
import { WithTooltip } from './WithTooltip';

type Props = {
  action: ActionInfo | null;
  children: ReactElement;
};

export const WithActionTooltip: FC<Props> = ({ action, children }) => {
  if (!action) {
    return children;
  }

  return (
    <WithTooltip<ActionInfo>
      item={action}
      disabled={false}
      content={<ActionTooltip action={action} />}
    >
      {children}
    </WithTooltip>
  );
}; 