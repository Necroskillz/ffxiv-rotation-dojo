import { FC } from 'react';
import { Tooltip } from 'react-tooltip';
import { StatusInfo } from '../actions/status';

type StatusTooltipProps = {
  status: StatusInfo;
  anchorId: string;
};

export const StatusTooltip: FC<StatusTooltipProps> = ({ status, anchorId }) => {
  return (
    <Tooltip anchorId={anchorId} float={true} noArrow={true} style={{ zIndex: 1000 }}>
      <div className="grid auto-rows-max grid-flow-row gap-2 items-center w-[360px]">
        <div className="grid auto-cols-max grid-flow-col gap-2 items-center">
          <div>
            {status.name} [{status.id}]
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: status.description }}></div>
      </div>
    </Tooltip>
  );
};
