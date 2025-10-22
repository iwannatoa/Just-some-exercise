import { useTableStore } from '../store/table.store';
import TableCard from '../component/TableCard';

export default function DiningRoom() {
  const { tables } = useTableStore();

  const tableList = Array.from(tables.values());
  const totalTables = tableList.length;
  const occupiedCount = tableList.filter(
    t => t.status === 'WAITING_FOR_ORDER' || t.status === 'HAVING_MEAL',
  ).length;

  return (
    <div className='flex-3 border-2 p-3 overflow-auto border-fuchsia-500 bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-sm'>
      <div className='flex items-center justify-between mb-3'>
        <div>
          <h2 className='text-base font-semibold text-gray-800'>Dining Room</h2>
          <div className='flex items-center gap-2 mt-1'>
            <div className='text-xs text-gray-600'>
              {occupiedCount} / {totalTables} occupied
            </div>
            <span className='inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 rounded-full'>
              Live
            </span>
          </div>
        </div>

        <div className='text-xs text-gray-500'>
          Updated live •{' '}
          <span className='font-medium text-gray-700'>{tableList.length}</span>{' '}
          tables
        </div>
      </div>

      <div className='p-1'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-y-auto pr-2'>
          {tableList.map(table => (
            <TableCard table={table} />
          ))}
        </div>
      </div>
    </div>
  );
}
