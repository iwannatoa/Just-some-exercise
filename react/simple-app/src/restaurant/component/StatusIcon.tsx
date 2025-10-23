import type { CustomerStatus, TableStatus } from '../store/data.type';

interface CustomerStatusIconProps {
  type: 'CUSTOMER';
  status: CustomerStatus;
  className?: string;
}
interface TableStatusIconProps {
  type: 'TABLE';
  status: TableStatus;
  className?: string;
}
type StatusIconProps = CustomerStatusIconProps | TableStatusIconProps;
export default function StatusIcon({
  type,
  status,
  className = '',
}: StatusIconProps) {
  if (type === 'CUSTOMER') {
    return (
      <div className={`${className} w-5 h-5`} title={status}>
        {getCustomerStatusIcon(status)}
      </div>
    );
  } else {
    return (
      <div className={`${className} w-5 h-5`} title={status}>
        {getTableStatusIcon(status)}
      </div>
    );
  }
}

// Function to get icon for CustomerStatus
export const getCustomerStatusIcon = (status: CustomerStatus) => {
  switch (status) {
    case 'WAITING_TABLE':
      return (
        <svg
          className='waiting-icon w-full h-full'
          viewBox='0 0 20 20'
          fill='currentColor'
        >
          <path
            fill-rule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
            clip-rule='evenodd'
          />
        </svg>
      );
    case 'ORDERING':
      return (
        <svg
          className='ordering-icon w-full h-full'
          viewBox='0 0 20 20'
          fill='currentColor'
        >
          <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
          <path
            fill-rule='evenodd'
            d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z'
            clip-rule='evenodd'
          />
        </svg>
      );
    case 'HAVING_MEAL':
      return (
        <svg
          fill='currentColor'
          viewBox='0 -20.55 122.88 122.88'
          version='1.1'
          id='Layer_1'
        >
          <g id='SVGRepo_bgCarrier' stroke-width='0'></g>
          <g
            id='SVGRepo_tracerCarrier'
            stroke-linecap='round'
            stroke-linejoin='round'
          ></g>
          <g id='SVGRepo_iconCarrier'>
            <g>
              <path d='M18,33.84c3.46-2.36,5.2-5.45,4.9-12.52V3.14c-0.03-2.54-4.64-2.85-4.87,0l-0.18,14.75 c-0.01,2.76-4.16,2.85-4.15,0l0.18-15.25c-0.05-2.73-4.45-3-4.51,0c0,4.23-0.18,11.02-0.18,15.25c0.22,2.67-3.63,3.02-3.53,0 L5.85,2.73c-0.1-2.06-2.36-2.79-3.9-1.83C0.31,1.95,0.64,4.05,0.57,5.82L0,23.22c0.09,5.06,1.42,9.17,5.38,10.92 c0.6,0.26,1.44,0.47,2.41,0.62L6.42,77.18c-0.08,2.52,1.98,4.57,4.39,4.57h0.55c2.72,0,5.01-2.32,4.94-5.15l-1.2-41.86 C16.36,34.54,17.41,34.25,18,33.84L18,33.84L18,33.84z M113.36,44.66h1.48c0,10.83-0.04,23.34-0.39,34.12 c-0.15,4.13,7.59,3.97,7.45-0.43l-0.29-33.69h1.27V0C106.9,2.45,112.41,33.39,113.36,44.66L113.36,44.66z M105.56,41.11 c0,10.91-3.84,20.22-11.52,27.91c-7.7,7.7-17,11.55-27.91,11.55c-10.86,0-20.17-3.84-27.88-11.55c-7.7-7.69-11.57-17-11.57-27.91 c0-10.88,3.86-20.15,11.57-27.86c7.73-7.7,17.02-11.57,27.88-11.57c10.91,0,20.21,3.86,27.91,11.57 C101.71,20.95,105.56,30.23,105.56,41.11L105.56,41.11z M89.09,41.07c0,6.36-2.23,11.78-6.73,16.28 c-4.48,4.48-9.91,6.73-16.26,6.73c-6.31,0-11.73-2.25-16.22-6.73c-4.49-4.5-6.73-9.92-6.73-16.28c0-6.31,2.24-11.73,6.73-16.21 c4.5-4.48,9.91-6.73,16.22-6.73C78.86,18.15,89.09,28.29,89.09,41.07L89.09,41.07z M86.19,21.06c-5.53-5.53-12.23-8.28-20.09-8.28 c-7.84,0-14.52,2.75-20.01,8.28c-5.53,5.53-8.31,12.21-8.31,20.01c0,7.83,2.78,14.5,8.31,20.06c5.5,5.54,12.17,8.32,20.01,8.32 c7.85,0,14.55-2.78,20.09-8.32c5.51-5.55,8.28-12.23,8.28-20.06C94.47,33.26,91.71,26.59,86.19,21.06L86.19,21.06z'></path>{' '}
            </g>
          </g>
        </svg>
      );
    case 'FINISHED':
      return (
        <svg
          className='finished-icon w-full h-full'
          viewBox='0 0 20 20'
          fill='currentColor'
        >
          <path
            fill-rule='evenodd'
            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
            clip-rule='evenodd'
          />
        </svg>
      );
    default:
      return (
        <svg fill='currentColor' viewBox='0 0 20 20'>
          <path
            fill-rule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z'
            clip-rule='evenodd'
          />
        </svg>
      );
  }
};

// Function to get icon for TableStatus
export const getTableStatusIcon = (status: TableStatus) => {
  switch (status) {
    case 'EMPTY':
      return (
        <svg viewBox='0 0 24 24' fill='currentColor'>
          <path d='M18.76,6l2,4H3.24l2-4H18.76M20,4H4L1,10v2H3v7H5V16H19v3h2V12h2V10L20,4ZM5,14V12H19v2Z'></path>
          <rect width='24' height='24' fill='none'></rect>
        </svg>
      );
    case 'WAITING_FOR_CLEAN':
      return (
        <svg fill='currentColor' viewBox='0 0 32 32'>
          <path d='M21,10V8.236l1-2V3H10v3.721l2.735,0.912l-0.684,2.051l1.897,0.633l0.684-2.052L15,8.387V10 c0,0-1,5-2,6c-1,1-3,3-3,7c0,2,0,6,0,6h13c0,0,0-4,0-8C23,17,21,10,21,10z M12,5h8v0.764L19.382,7h-2.221L12,5.279V5z M17,9h2v1h-2 V9z M21,27h-9v-4c0-3.171,1.511-4.683,2.414-5.586c0.943-0.943,1.679-3.231,2.197-5.414h2.854C20.026,14.192,21,18.37,21,21V27z'></path>
        </svg>
      );
    case 'HAVING_MEAL':
      return (
        <svg viewBox='0 0 32 32' fill='currentColor'>
          <path d='M30,24h-1v-3c0-7.011-5.554-12.71-12.5-12.975V7.929C17.361,7.706,18,6.931,18,6c0-1.105-0.895-2-2-2 c-1.105,0-2,0.895-2,2c0,0.931,0.639,1.706,1.5,1.929v0.096C8.554,8.29,3,13.989,3,21v3H2c-0.552,0-1,0.448-1,1c0,1.657,1.343,3,3,3 h24c1.657,0,3-1.343,3-3C31,24.448,30.552,24,30,24z M15,6c0-0.551,0.449-1,1-1s1,0.449,1,1s-0.449,1-1,1S15,6.551,15,6z M4,21 C4,14.383,9.383,9,16,9s12,5.383,12,12v3H4V21z M28,27H4c-1.103,0-2-0.897-2-2h28C30,26.103,29.103,27,28,27z M10,13 c-1.105,0-2,0.895-2,2s0.895,2,2,2c1.105,0,2-0.895,2-2S11.105,13,10,13z M10,16c-0.551,0-1-0.449-1-1s0.449-1,1-1s1,0.449,1,1 S10.551,16,10,16z'></path>
        </svg>
      );
    case 'WAITING_FOR_ORDER':
      return (
        <svg fill='currentColor' viewBox='0 0 32 32'>
          <path d='M6.97,30.75H25.03c.41,0,.75-.34,.75-.75V3.89c0-.41-.34-.75-.75-.75h-2.56v-1.14c0-.41-.34-.75-.75-.75s-.75,.34-.75,.75v1.14h-4.22v-1.14c0-.41-.34-.75-.75-.75s-.75,.34-.75,.75v1.14h-4.22v-1.14c0-.41-.34-.75-.75-.75s-.75,.34-.75,.75v1.14h-2.56c-.41,0-.75,.34-.75,.75V30c0,.41,.34,.75,.75,.75Zm.75-26.11h1.81v1.14c0,.41,.34,.75,.75,.75s.75-.34,.75-.75v-1.14h4.22v1.14c0,.41,.34,.75,.75,.75s.75-.34,.75-.75v-1.14h4.22v1.14c0,.41,.34,.75,.75,.75s.75-.34,.75-.75v-1.14h1.81V29.25H7.72V4.64Z' />
          <path d='M16.86,9.66h-6.57c-.41,0-.75,.34-.75,.75s.34,.75,.75,.75h6.57c.41,0,.75-.34,.75-.75s-.34-.75-.75-.75Z' />
          <path d='M16.86,16.19h-6.57c-.41,0-.75,.34-.75,.75s.34,.75,.75,.75h6.57c.41,0,.75-.34,.75-.75s-.34-.75-.75-.75Z' />
          <path d='M16.86,22.73h-6.57c-.41,0-.75,.34-.75,.75s.34,.75,.75,.75h6.57c.41,0,.75-.34,.75-.75s-.34-.75-.75-.75Z' />
          <path d='M10.28,14.27h3.61c.41,0,.75-.34,.75-.75s-.34-.75-.75-.75h-3.61c-.41,0-.75,.34-.75,.75s.34,.75,.75,.75Z' />
          <path d='M10.28,21h3.61c.41,0,.75-.34,.75-.75s-.34-.75-.75-.75h-3.61c-.41,0-.75,.34-.75,.75s.34,.75,.75,.75Z' />
          <path d='M13.89,25.79h-3.61c-.41,0-.75,.34-.75,.75s.34,.75,.75,.75h3.61c.41,0,.75-.34,.75-.75s-.34-.75-.75-.75Z' />
        </svg>
      );
  }
};
