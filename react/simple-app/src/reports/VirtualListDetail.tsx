import type { FC } from 'react';
import { List, type RowComponentProps } from 'react-window';
import type { KeyValueData } from './reports.type';

interface VirtualListProps {
  data: KeyValueData;
  status: string;
}

const VirtualListDetail: FC<VirtualListProps> = prop => {
  const data = prop.data;
  const pageStatus = prop.status;
  return (
    <div className='flex flex-row flex-1 min-h-0'>
      {data.data.length > 0 ? (
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
          {/* The List from react-window cannot be used in table, because it will always create a div at the end */}
          {/* And it use position:absolute & transformX to load few element, which will destroy table's style */}
          <List
            rowCount={data.data.length}
            rowHeight={50}
            rowProps={{ data }}
            rowComponent={TableRow}
            tagName='tbody'
            className={'divide-y divide-gray-100'}
          ></List>
        </table>
      ) : pageStatus === 'Loading' ? (
        <div className='flex-1 flex items-center justify-center bg-white border border-gray-200 rounded-lg p-8'>
          <div className='text-yellow-700 font-medium text-lg'>Loading data...</div>
        </div>
      ) : (
        pageStatus === 'Failed' && (
          <div className='flex-1 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-8'>
            <div className='text-red-700 font-medium text-lg'>Load data failed</div>
          </div>
        )
      )}
    </div>
  );
};
const TableRow = ({ data, index, style }: RowComponentProps<{ data: KeyValueData }>) => {
  const row = data.data[index];
  return (
    <tr style={style} className='hover:bg-blue-50 transition-colors duration-200 even:bg-gray-50'>
      <td className='px-6 py-3 font-medium text-gray-700'>{new Date(row.time).toDateString()}</td>
      {data.categories.map(type => (
        <td key={`${index}_${type}`} className='px-6 py-3 text-gray-600'>
          {row[type]}
        </td>
      ))}
    </tr>
  );
};

export default VirtualListDetail;
