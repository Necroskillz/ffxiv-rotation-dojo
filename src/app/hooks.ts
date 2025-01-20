import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { useCallback } from 'react';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function createParameterSelector<S, T>(selector: (s: S) => T) {
  return (_: any, params: S) => selector(params);
}

/**
 * Returns a callback ref that calls `drag(element)` when the DOM node is attached.
 */
function useDragRef(drag: (el: HTMLDivElement) => void) {
  return useCallback(
    (element: HTMLDivElement | null) => {
      if (element) {
        drag(element);
      }
    },
    [drag]
  );
}

export default useDragRef;
