import { useRef, useState, useEffect, useMemo } from 'react';
import type { KeyValueData, LanguageValue } from './reports.type';
import React from 'react';

interface DetailProps {
  data: KeyValueData;
  status: string;
}

const TableRow = React.memo(
  ({ row, categories, index }: { row: LanguageValue; categories: string[]; index: number }) => (
    <tr className='hover:bg-blue-50 transition-colors duration-200 even:bg-gray-50'>
      <td className='px-6 py-3 font-medium text-gray-700'>{row.formattedTime}</td>
      {categories.map(type => (
        <td key={`${index}_${type}`} className='px-6 py-3 text-gray-600'>
          {row[type]}
        </td>
      ))}
    </tr>
  ),
);

// Infinite scroll will be slower and slower when data increase, because more DOM node need to be rendered
const LazyLoadDetail: React.FC<DetailProps> = (prop: DetailProps) => {
  const data = prop.data;
  const pageStatus = prop.status;

  const [visibleRows, setVisibleRows] = useState(20);
  const loadMoreRef = useRef(null);
  const step = 20;
  const processedData = useMemo(
    () =>
      data.data.map(item => ({
        ...item,
        formattedTime: new Date(item.time).toLocaleString(),
      })) as Array<LanguageValue>,
    [data.data],
  );
  const memoizedCategories = useMemo(() => data.categories, [data.categories]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleRows < data.data.length) {
          setVisibleRows(prev => Math.min(prev + step, data.data.length));
        }
      },
      {
        threshold: 0.1,
      },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleRows, data.data]);

  const visibleData = useMemo(() => {
    return processedData.slice(0, visibleRows);
  }, [processedData, visibleRows]);

  if (data.data.length === 0) {
    if (pageStatus === 'Loading') {
      return (
        <div className='flex-1 flex items-center justify-center bg-white border border-gray-200 rounded-lg p-8'>
          <div className='text-yellow-700 font-medium text-lg'>Loading data...</div>
        </div>
      );
    } else if (pageStatus === 'Failed') {
      return (
        <div className='flex-1 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-8'>
          <div className='text-red-700 font-medium text-lg'>Load data failed</div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className='flex flex-row flex-1 min-h-0'>
      <table className='flex-1 text-center bg-white min-h-0 overflow-hidden border-separate border-spacing-0 rounded-lg shadow-lg border border-gray-200'>
        <thead>
          <tr key='header' className='bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0'>
            <th key='time' className='px-6 py-4 font-semibold'>
              Time
            </th>
            {data.categories.map(type => (
              <th key={type} className='px-6 py-4 font-semibold'>
                {type}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-100'>
          {visibleData.map((row, i) => (
            <TableRow key={`row-${i}`} row={row} categories={memoizedCategories} index={i} />
          ))}
          {visibleRows < data.data.length && (
            <tr ref={loadMoreRef}>
              <td>Loading More...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LazyLoadDetail;
