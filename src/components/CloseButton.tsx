import { FaXmark } from 'react-icons/fa6';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

export const CloseButton = ({ onClick, className = 'absolute right-2 top-2' }: CloseButtonProps) => {
  return (
    <button className={className} onClick={onClick}>
      <FaXmark size={24} />
    </button>
  );
}; 