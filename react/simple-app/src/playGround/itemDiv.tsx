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
  const elRef = useRef<HTMLDivElement>(null);
  const containerRect = containerRef?.current?.getBoundingClientRect();
  const [maxX, setMaxX] = useState(0);
  const [maxY, setMaxY] = useState(0);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  useDraggable(elRef, {
    bounds: containerRect ? { ...containerRect } : {},
    onStart: () => {
      if (containerRect && elRef.current) {
        let containerX = containerRect.x;
        let containerY = containerRect.y;
        const elRect = elRef.current.getBoundingClientRect();
        setX(elRect.x - containerX);
        setY(elRect.y - containerY);
        setMaxX(containerRect.width - elRect.width);
        setMaxY(containerRect.height - elRect.height);
      }
    },
    onDrag: ({ dx, dy }: { dx: number; dy: number }) => {
      if (dx + x < 0) {
        setDx(0);
      } else if (dx + x > maxX) {
        setDx(maxX);
      } else {
        setDx(dx + x);
      }
      if (dy + y < 0) {
        setDy(0);
      } else if (dy + y > maxY) {
        setDy(maxY);
      } else {
        setDy(dy + y);
      }
    },
    onEnd: () => onEnd?.(id),
  });
  return (
    <div
      ref={elRef}
      className='absolute border-2'
      style={{
        left: dx,
        top: dy,
      }}
    >
      <div className='select-none'>Item {id}</div>
      <button onClick={() => onDelete?.(id)}>Delete</button>
    </div>
  );
}
