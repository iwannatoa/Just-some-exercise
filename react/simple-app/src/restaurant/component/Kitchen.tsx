import useKitchenStore, { type CookTask } from '../store/kitchen.store';
import { useMenuStore } from '../store/menu.store';

export default function Kitchen() {
  const tasks = useKitchenStore(state => state.tasks ?? []);
  const activeTasks = tasks.filter(t => t.status === 'ACTIVE');
  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const menuMap = useMenuStore().menu;

  const progressClasses = (percent: number) => {
    if (percent >= 75) {
      return {
        card: 'bg-emerald-50 border-emerald-200',
        bar: 'bg-emerald-500',
      };
    }
    if (percent >= 40) {
      return { card: 'bg-amber-50 border-amber-200', bar: 'bg-amber-500' };
    }
    return { card: 'bg-rose-50 border-rose-200', bar: 'bg-rose-500' };
  };

  const renderTask = (task: CookTask, idx: number) => {
    const menuId = task.menuId ?? '';
    const total = 100;
    const done = task.process;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const orderIds = task.orderIds;

    const cls = progressClasses(percent);

    return (
      <div
        key={task.taskId}
        className={`relative p-2 border rounded text-xs ${cls.card} border-opacity-80 shadow-sm`}
      >
        <div className='flex justify-between items-baseline'>
          <div className='text-xs font-medium text-slate-800'>
            {menuMap.get(menuId)?.name || menuId}
          </div>
          <div className='text-[10px] text-slate-600'>
            <span
              className='number-counter'
              style={{ '--num': percent } as React.CSSProperties}
            />
            %
          </div>
        </div>

        <div className='mt-1 h-2 w-full bg-gray-200 rounded overflow-hidden'>
          <div
            className={`h-full transition-all duration-1000 ease-out ${cls.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className='mt-1 text-[10px] text-slate-600'>
          {(task as any).status}
        </div>

        {/* order id bottom-right */}
        {orderIds && (
          <div className='absolute bottom-1 right-2 text-[10px] text-slate-400'>
            {orderIds.join(', ')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='flex-none overflow-auto border-2 border-rose-500 p-2 text-sm'>
      <h2 className='mb-2 text-sm font-semibold'>Kitchen</h2>

      <div className='grid grid-cols-4 gap-4 '>
        <div className='flex flex-col col-span-3'>
          <h3 className='text-xs font-semibold mb-2 bg-emerald-100 px-2 py-1 rounded text-emerald-800'>
            Active
          </h3>
          <div className='gap-2 grid grid-cols-3'>
            {activeTasks.length === 0 && (
              <div className='text-xs text-gray-500'>No active tasks</div>
            )}
            {activeTasks.map((t, i) => renderTask(t, i))}
          </div>
        </div>

        <div className='flex flex-col col-span-1'>
          <h3 className='text-xs font-semibold mb-2 bg-slate-100 px-2 py-1 rounded text-slate-800'>
            Pending
          </h3>
          {/* collapse/scroll when overflow */}
          <div className='max-h-52 overflow-auto pr-2 grid grid-cols-1 gap-2'>
            {pendingTasks.length === 0 && (
              <div className='text-xs text-gray-500'>No pending tasks</div>
            )}
            {pendingTasks.map((t, i) => (
              <div key={(t as any).id ?? `pending-${i}`} className='text-xs'>
                {renderTask(t, i)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
