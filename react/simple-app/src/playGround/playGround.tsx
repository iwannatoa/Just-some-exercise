import { useEffect, useRef, useState } from 'react';
import useDraggable from './draggable';
import ItemDiv from './itemDiv';
import { nanoid } from 'nanoid';

type ItemDesc = {
  id: string;
  type: string;
  props?: Record<string, any>;
};

export default function playGround() {
  const playGroundRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ItemDesc[]>([]);

  const createNewElement = (
    type: ItemDesc['type'],
    props?: Record<string, any>,
  ) => {
    const id = nanoid(6);
    setItems(s => [...s, { id, type, props }]);
  };

  const remove = (id: string) => setItems(s => s.filter(it => it.id !== id));

  const createNewDiv = () => {
    createNewElement('div');
  };

  return (
    <div className='flex flex-col h-full p-4 gap-2'>
      <div
        ref={playGroundRef}
        className='flex-1 w-full relative border-2 border-collapse border-amber-700 text-center content-center'
      >
        playGround
        {items.map(item => (
          <ItemDiv
            key={item.id}
            id={item.id}
            containerRef={playGroundRef}
            onDelete={() => remove(item.id)}
          ></ItemDiv>
        ))}
      </div>
      <div className='flex-none'>
        <button onClick={createNewDiv}>Add New Div</button>
      </div>
    </div>
  );
}
