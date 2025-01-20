import { FC, ReactElement } from 'react';
import { StatusInfo } from '@/features/actions/status';
import { StatusTooltip } from '@/features/combat/StatusTooltip';
import { WithTooltip } from './WithTooltip';

type Props = {
  status: StatusInfo | null;
  children: ReactElement;
};

export const WithStatusTooltip: FC<Props> = ({ status, children }) => {
  if (!status) {
    return children;
  }

  return (
    <WithTooltip<StatusInfo>
      item={status}
      disabled={false}
      content={<StatusTooltip status={status} />}
    >
      {children}
    </WithTooltip>
  );
}; 