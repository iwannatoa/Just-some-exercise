/* Step 1: Basic Implementation (Fixed Height)
Task Description:Implement a useVirtualList Hook that supports fixed-height list items for efficient rendering of large datasets.Requirements:
1. Only render elements within the visible viewport
2. Assume all list items have the same height
3. Return virtual list data and container props needed for rendering */

import { useEffect, useRef, useState } from 'react';

// Implement Virtual Scroll List with Variable Height Items
interface VirtualListOptions<T> {
  items: T[];
  containerHeight: number;
  itemHeight: number; // Fixed height
  overscan?: number;
}

interface VirtualListResult<T> {
  virtualItems: {
    index: number;
    item: T;
    offsetTop: number;
  }[];
  containerProps: { style: { height: number }; onScroll: (e: any) => void };
  wrapperProps: { style: { height: number } };
}

function useVirtualList<T>(options: VirtualListOptions<T>): VirtualListResult<T> {
  const [virtualItems, setVirtualItems] = useState<any[]>([]);
  const needItems = options.containerHeight / options.itemHeight + (options.overscan ?? 0);
  let containerProps = {
    style: {
      height: options.containerHeight,
      overflow: 'scroll',
    },
    onScroll: (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      const top = (e.target as HTMLDivElement).scrollTop;
      const firstIndex = Math.floor(top / options.itemHeight);

      setVirtualItems(prevItems => {
        return options.items.slice(firstIndex, firstIndex + needItems).map((item, index) => {
          return { item, offsetTop: index * options.itemHeight + firstIndex * options.itemHeight };
        });
      });
    },
  };
  let wrapperProps = {
    style: { height: options.items.length * options.itemHeight, position: 'relative' },
  };

  useEffect(() => {
    setVirtualItems(
      options.items.slice(0, needItems).map((item, index) => {
        return { item, offsetTop: index * options.itemHeight };
      }),
    );
  }, []);

  return { virtualItems, containerProps, wrapperProps };
}

// usage example

export default function VirtualList() {
  const items = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
  }));

  const { virtualItems, containerProps, wrapperProps } = useVirtualList({
    items,
    containerHeight: 600,
    itemHeight: 50, // Fixed height
    overscan: 3,
  });

  useEffect(() => {
    console.log(virtualItems);
  }, [virtualItems]);

  return (
    <>
      <div>Virtual List work</div>
      <div {...containerProps}>
        <div {...wrapperProps}>
          {virtualItems.map(({ index, item, offsetTop }) => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: offsetTop,
                height: 50,
                width: '100%',
              }}
            >
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
