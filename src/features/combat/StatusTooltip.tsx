import { FC } from 'react';
import { StatusInfo } from '../actions/status';

type StatusTooltipProps = {
  status: StatusInfo;
};

export const StatusTooltip: FC<StatusTooltipProps> = ({ status }) => {
  return (
      <div className="grid auto-rows-max grid-flow-row gap-2 items-center w-[360px]">
        <div className="grid auto-cols-max grid-flow-col gap-2 items-center">
          <div>
            {status.name} [{status.id}]
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: status.description }}></div>
      </div>
  );
};
