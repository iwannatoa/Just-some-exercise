import { useTableStore } from '../store/table.store';
import TableCard from '../component/TableCard';
import Process from './Process';

export default function DiningRoom() {
  const { tables } = useTableStore();

  const tableList = Array.from(tables.values());
  const totalTables = tableList.length;
  const occupiedCount = tableList.filter(
    t => t.status === 'WAITING_FOR_ORDER' || t.status === 'HAVING_MEAL',
  ).length;
  const emptyTableCount = tableList.filter(
    table => table.status === 'EMPTY',
  ).length;
  return (
    <div className='flex-3 border-2 p-3 overflow-auto border-fuchsia-500 bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-sm'>
      <div className='flex items-center justify-between mb-3'>
        <div>
          <h2 className='text-base font-semibold text-gray-800'>Dining Room</h2>
          <div className='flex items-center gap-2 mt-1'>
            <Process
              className='text-xs text-gray-600'
              value={occupiedCount}
              format={val => `${val} / ${totalTables} occupied`}
            ></Process>
            <span className='inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 rounded-full'>
              Live
            </span>
            <Process
              className='inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-full'
              value={emptyTableCount}
              format={val => `${val} Empty`}
            ></Process>
          </div>
        </div>

        <div className='text-xs text-gray-500'>
          Updated live •&nbsp;
          <span className='font-medium text-gray-700'>{tableList.length}</span>
          &nbsp;tables
        </div>
      </div>

      <div>
        {tableList.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-y-auto'>
            {tableList.map(table => (
              <TableCard table={table} />
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='w-16 h-16 mb-4 text-gray-300'>
              <svg fill='currentColor' viewBox='0 0 20 20'>
                <path d='M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8-6a6 6 0 100 12 6 6 0 000-12zm-1 5a1 1 0 10-2 0v3a1 1 0 102 0V9zm1 5a1 1 0 100-2 1 1 0 000 2z' />
              </svg>
            </div>
            <h3 className='text-sm font-medium text-gray-600 mb-1'>
              No Tables Available
            </h3>
            <p className='text-xs text-gray-500 max-w-xs'>
              There are currently no tables in the dining room. Add tables to
              start managing reservations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
