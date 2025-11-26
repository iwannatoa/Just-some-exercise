import React from 'react';

interface SpinnerProcessProps {
  value: number;
}

function SpinnerProcess({ value }: SpinnerProcessProps) {
  return (
    <div className='relative w-6 h-6'>
      <svg className='w-6 h-6' viewBox='0 0 36 36'>
        {/* Background circle */}
        <circle cx='18' cy='18' r='15.9155' fill='none' stroke='#e5e7eb' strokeWidth='2' />
        {/* Progress arc */}
        <circle
          cx='18'
          cy='18'
          r='15.9155'
          fill='none'
          stroke='#3b82f6'
          strokeWidth='2'
          strokeDasharray='100'
          strokeDashoffset={100 - value}
          strokeLinecap='round'
          transform='rotate(-90 18 18)'
          className='transition-all duration-700 ease-out'
        />
      </svg>
      {/* Percentage text */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <span className='text-[6px] font-medium text-gray-700'>{value}%</span>
      </div>
    </div>
  );
}

export default React.memo(SpinnerProcess);
