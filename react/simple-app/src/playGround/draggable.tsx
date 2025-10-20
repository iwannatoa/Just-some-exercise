import { useEffect, useRef } from 'react';

type Bounds = Partial<Record<'left' | 'right' | 'top' | 'bottom', number>>;

export type UseDraggableOptions = {
  bounds?: Bounds;
  onEnd?: Function;
  onStart?: Function;
  onDrag?: Function;
};

export default function useDraggable(
  el: React.RefObject<HTMLElement | null>,
  options: UseDraggableOptions,
) {
  const isDragging = useRef(false);
  const startPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onStartRef = useRef<Function>(() => {});
  const onDragRef = useRef<Function>(() => {});
  const onEndRef = useRef<Function>(() => {});
  const boundsRef = useRef<Bounds>({});

  useEffect(() => {
    onStartRef.current = options?.onStart ?? (() => {});
    onDragRef.current = options?.onDrag ?? (() => {});
    onEndRef.current = options?.onEnd ?? (() => {});
    boundsRef.current = options?.bounds ?? {};
  }, [options?.onStart, options?.onDrag, options?.onEnd, options?.bounds]);

  useEffect(() => {
    const mouseUp = (e: MouseEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      onEndRef.current();
      cleanUp();
    };
    const mouseDown = (e: MouseEvent) => {
      window.addEventListener('mouseup', mouseUp);
      window.addEventListener('mousemove', mouseMove);
      window.addEventListener('mouseleave', mouseLeave);
      startPosition.current = { x: e.x, y: e.y };
      isDragging.current = true;
      onStartRef.current();
    };
    const mouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      onDragRef.current({
        dx: e.x - startPosition.current.x,
        dy: e.y - startPosition.current.y,
      });
    };
    const mouseLeave = (e: MouseEvent) => {
      if (isDragging.current) {
        mouseUp(e);
      }
    };

    const cleanUp = () => {
      window.removeEventListener('mouseup', mouseUp);
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseleave', mouseLeave);
    };
    el.current?.addEventListener('mousedown', mouseDown);
    return () => {
      cleanUp();
      el.current?.removeEventListener('mousedown', mouseDown);
    };
  }, [el]);
}
