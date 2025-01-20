import { ReactElement } from 'react';
import Tippy from '@tippyjs/react';
import { followCursor } from 'tippy.js';

type Props<T> = {
  content: ReactElement;
  children: ReactElement;
  disabled?: boolean;
  item: T | null;
};

export const WithTooltip = <T,>({ content, children, disabled = false }: Props<T>) => {
  return (
    <Tippy
      disabled={disabled}
      content={content}
      arrow={false}
      duration={[0, 0]}
      maxWidth={600}
      plugins={[followCursor]}
      followCursor={true}
    >
      {children}
    </Tippy>
  );
}; 