import Customer from './Customer';
import { useOrderStore } from '../store/order.store';
import type {
  CustomerStatus,
  OrderItem,
  Table,
  TableStatus,
} from '../store/data.type';
import { useMenuStore } from '../store/menu.store';
import Process from './Process';
import SpinnerProcess from './SpinnerProcess';
import StatusIcon from './StatusIcon';

export interface TableCardProps {
  table: Table;
}

export default function TableCard({ table }: TableCardProps) {
  const orderStore = useOrderStore();

  const statusIcon = (status: TableStatus) => {
    const getIconClasses = (status: TableStatus): string => {
      const base = 'w-5 h-5';
      switch (status) {
        case 'WAITING_FOR_ORDER':
          return `${base} text-yellow-500`;
        case 'HAVING_MEAL':
          return `${base} text-green-500`;
        case 'EMPTY':
          return `${base} text-gray-400`;
        case 'WAITING_FOR_CLEAN':
          return `${base} text-orange-500`;
        default:
          return `${base} text-gray-500`;
      }
    };

    return (
      <StatusIcon
        className={getIconClasses(status)}
        status={status}
        type='TABLE'
      />
    );
  };

  const items = orderStore
    .getActiveOrdersByTableId(table.tableNo)
    .flatMap(order => order.items);

  const menuMap = useMenuStore().menu;

  // render single item row as a function to keep JSX tidy
  const renderItemRow = (item: OrderItem) => {
    // presentation-only: render small dots (max 2) instead of wide progress bar
    const maxDots = 2;
    const qty = Math.max(0, item.quantity || 0);
    const dots = Math.min(qty, maxDots);
    const delivered = Math.min(item.deliveredCount || 0, dots);
    const extraIndicator = qty > maxDots ? `+${qty - maxDots}` : '';

    return (
      <div key={item.menuId} className='flex items-center gap-2'>
        <div className='text-xs font-medium text-gray-700 truncate'>
          {menuMap.get(item.menuId)?.name || item.menuId}
        </div>

        <div className='flex items-center gap-1'>
          {Array.from({ length: dots }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full border ${
                i < delivered
                  ? 'bg-emerald-500 border-emerald-600'
                  : 'bg-gray-200 border-gray-300'
              }`}
              aria-hidden
            />
          ))}

          {extraIndicator ? (
            <div className='text-[10px] text-gray-500 ml-1'>
              &nbsp;{extraIndicator}&nbsp;
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className='p-2 rounded-lg border bg-white shadow-sm flex flex-col gap-2'>
      <div className='flex-none flex justify-between items-center'>
        <div className='flex items-center gap-2'>
          <div className='text-sm font-semibold'>{table.tableNo}</div>
          <SpinnerProcess value={table.process} />
        </div>
        {statusIcon(table.status)}
      </div>

      <div className='flex-none min-h-[44px]'>
        {table.status === 'WAITING_FOR_ORDER' ||
        table.status === 'HAVING_MEAL' ? (
          <Customer customer={table.customer} />
        ) : (
          <div className='text-xs text-gray-500'>Empty</div>
        )}
      </div>

      <div className='flex-1 grid grid-cols-2 auto-rows-min gap-1 overflow-hidden'>
        {items.length === 0 ? (
          <div className='text-xs text-gray-400'>No active items</div>
        ) : (
          items.map(renderItemRow)
        )}
      </div>
    </div>
  );
}
