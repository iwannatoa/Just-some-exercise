import React from 'react';
import type { Customer, CustomerStatus } from '../store/data.type';
import StatusIcon from './StatusIcon';

export interface CustomerProps {
  customer: Customer;
  showStatus?: boolean;
}

const Customer = ({ customer, showStatus = true }: CustomerProps) => {
  return (
    <div className='flex items-center gap-2 p-1 rounded-md bg-white shadow-sm'>
      <div
        className='w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 ring-1 ring-white/20 shadow-sm'
        style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}
        aria-hidden
      >
        <span className='leading-none'>{customer.count}</span>
      </div>

      <div className='flex-1 min-w-0'>
        <div className='text-xs font-medium truncate'>guest{customer.count !== 1 ? 's' : ''}</div>
      </div>

      {showStatus && (
        <div className={`text-[10px] px-1 py-0.5 rounded-full font-medium flex-shrink-0`}>
          <StatusIcon type='CUSTOMER' status={customer.status} />
        </div>
      )}
    </div>
  );
};
export default React.memo(Customer);
