import { useRef, useCallback } from 'react';

/**
 * Закрывает модалку только если и mousedown, и mouseup произошли на оверлее.
 * Не закрывает, если пользователь выделял текст внутри и отпустил кнопку снаружи.
 */
export function useOverlayDismiss(onDismiss, disabled = false) {
  const mouseDownOnOverlay = useRef(false);

  const onMouseDown = useCallback(
    (e) => {
      if (disabled) return;
      mouseDownOnOverlay.current = e.target === e.currentTarget;
    },
    [disabled]
  );

  const onMouseUp = useCallback(
    (e) => {
      if (disabled) return;
      if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
        onDismiss();
      }
      mouseDownOnOverlay.current = false;
    },
    [disabled, onDismiss]
  );

  return { onMouseDown, onMouseUp };
}
