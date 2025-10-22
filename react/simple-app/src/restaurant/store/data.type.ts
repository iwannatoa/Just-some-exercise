export type CustomerStatus =
  | 'WAITING_TABLE'
  | 'ORDERING'
  // | 'WAITING_FOOD'
  | 'HAVING_MEAL'
  | 'FINISHED';
export interface Customer {
  id: string;
  count: number;
  status: CustomerStatus;
}

export type OrderStatus = 'ACTIVE' | 'WAITING_PAY' | 'PAID';
export interface Order {
  status: OrderStatus;
  orderId: string;
  items: OrderItem[];
  tableId: string;
}

export interface OrderItem {
  menuId: string;
  quantity: number;
  deliveredCount: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export type TableStatus =
  | 'EMPTY'
  | 'WAITING_FOR_CLEAN'
  | 'HAVING_MEAL'
  | 'WAITING_FOR_ORDER';
export interface AbstractTable {
  tableNo: string;
  status: TableStatus;
  /**
   * Add 5 when having meal, add 50 when cleaning.
   * When reach 100, go to next status.
   */
  process: number;
}

export interface EmptyTable extends AbstractTable {
  status: 'EMPTY' | 'WAITING_FOR_CLEAN';
}

export interface OccupiedTable extends AbstractTable {
  status: 'HAVING_MEAL' | 'WAITING_FOR_ORDER';
  customer: Customer;
}

export type Table = EmptyTable | OccupiedTable;

export interface CookBookItem {
  id: string;
  menuId: string;
  /**
   * 1-100, it will take Math.floor(100/countPerTime) tick to finish
   */
  countPerTime: number;
}
