import React, { useRef, useState } from 'react';
import useDraggable from './draggable';

export type ItemDivProps = {
  id: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onDelete?: (id: string) => void;
  onEnd?: (id: string) => void;
};

export default function ItemDiv({
  id,
  containerRef,
  onDelete,
  onEnd,
}: ItemDivProps) {
  const elRef = useRef<HTMLDivElement | null>(null);

  // rendered state
  const [pos, setPos] = useState({ x: 0, y: 0 }); // accumulated final position
  const [offset, setOffset] = useState({ dx: 0, dy: 0 }); // transient during drag

  // refs for values used during dragging but that don't need re-renders
  const startRef = useRef({ x: 0, y: 0 }); // element position relative to container at drag start
  const maxRef = useRef({ x: 0, y: 0 }); // max allowed x/y inside container

  useDraggable(elRef, {
    onStart: () => {
      const container = containerRef?.current;
      const node = elRef.current;
      if (!container || !node) return;

      const containerRect = container.getBoundingClientRect();
      const elRect = node.getBoundingClientRect();

      // position of element relative to container at drag start
      startRef.current = {
        x: elRect.x - containerRect.x,
        y: elRect.y - containerRect.y,
      };

      maxRef.current = {
        x: Math.max(0, containerRect.width - elRect.width),
        y: Math.max(0, containerRect.height - elRect.height),
      };
    },

    onDrag: ({ dx, dy }: { dx: number; dy: number }) => {
      const sx = startRef.current.x;
      const sy = startRef.current.y;
      const maxX = maxRef.current.x;
      const maxY = maxRef.current.y;

      const rawX = sx + dx;
      const rawY = sy + dy;

      // clamp to bounds
      const clampedX = Math.min(Math.max(0, rawX), maxX);
      const clampedY = Math.min(Math.max(0, rawY), maxY);

      // transient offset to apply with transform
      setOffset({ dx: clampedX - sx, dy: clampedY - sy });
    },

    onEnd: () => {
      // accumulate offset into final position and reset transient offset
      setPos(p => ({ x: p.x + offset.dx, y: p.y + offset.dy }));
      setOffset({ dx: 0, dy: 0 });
      onEnd?.(id);
    },
  });

  return (
    <div
      ref={elRef}
      className='absolute border-2 p-1'
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate3d(${offset.dx}px, ${offset.dy}px, 0)`,
      }}
    >
      <div className='select-none'>Item {id}</div>
      <button onClick={() => onDelete?.(id)}>Delete</button>
    </div>
  );
}
