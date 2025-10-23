import { useLobbyStore } from '../store/lobby.store';
import Customer from './Customer';

export default function Entrance() {
  const waitingLine = useLobbyStore().waitingLine;
  return (
    <div className='flex-none h-24 overflow-y-hidden border-2 border-sky-400 p-3 bg-sky-50 rounded-lg shadow-sm'>
      <div className='flex items-center justify-between mb-2'>
        <h2 className='text-sm font-semibold text-sky-700'>Entrance</h2>
        <div className='text-xs text-gray-600'>
          {waitingLine.length} waiting
        </div>
      </div>

      <div className='overflow-x-auto py-1'>
        <div className='grid grid-flow-col auto-cols-min gap-2 items-start'>
          {waitingLine.map(c => (
            <div key={c.id} className='min-w-[72px]'>
              <Customer customer={c} showStatus={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
