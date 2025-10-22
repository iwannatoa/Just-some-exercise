import { create } from 'zustand';
import type { Table, Customer, TableStatus, OccupiedTable } from './data.type';
import idFactory from './idFactory';
import { useOrderStore } from './order.store';
import { useCustomerStore } from './customer.store';
import useKitchenStore from './kitchen.store';

// TODO add dinning room store to deal with the table.
// Currently there's only one area.
export interface TableStore {
  tables: Map<string, Table>;
  findEmptyTable: () => Table | null;
  seatCustomer: (customer: Customer) => boolean;
  addTable: (count: number) => void;
  updateTableToNextStatus: (id: string) => void;
  addProcess: (id: string, process: number) => void;
  clearAll: () => void;
  nextRound: () => void;
}
export const useTableStore = create<TableStore>((set, get) => ({
  tables: new Map(),
  findEmptyTable: () => {
    const tables = get().tables.values();
    for (let table of tables) {
      if (table.status === 'EMPTY') return table;
    }
    return null;
  },
  seatCustomer: (customer: Customer) => {
    const emptyTable = get().findEmptyTable();
    if (emptyTable) {
      set(state => {
        const newCustomer = useCustomerStore
          .getState()
          .updateStatus(customer.id, 'ORDERING');
        return {
          tables: new Map(state.tables).set(emptyTable.tableNo, {
            ...emptyTable,
            customer: newCustomer,
            status: 'WAITING_FOR_ORDER',
          }),
        };
      });
      return true;
    }
    return false;
  },
  addTable: (count: number) => {
    set(state => {
      const newTables = new Map(state.tables);

      for (let i = 0; i < count; i++) {
        const tableNo = idFactory.getNewIdByType('T');
        const newTable: Table = {
          tableNo,
          status: 'EMPTY',
          process: 0,
        };
        newTables.set(tableNo, newTable);
      }

      return { tables: newTables };
    });
  },
  updateTableToNextStatus: (id: string) => {
    set(state => {
      const newTables = new Map(state.tables);
      const table = newTables.get(id);
      if (!table) return state;
      if (table.status === 'EMPTY') {
        throw 'should use seatCustomer for empty table';
        return state;
      }
      table.process = 0;
      switch (table.status) {
        case 'WAITING_FOR_CLEAN':
          newTables.set(id, { ...table, status: 'EMPTY' });
          break;
        case 'HAVING_MEAL':
          newTables.set(id, { ...table, status: 'WAITING_FOR_CLEAN' });
          break;
        case 'WAITING_FOR_ORDER':
          table.customer = useCustomerStore
            .getState()
            .updateStatus(table.customer.id, 'HAVING_MEAL');
          // TODO order food from menu
          const order = useOrderStore
            .getState()
            .createRandomOrder(table.tableNo, table.customer.count);
          useKitchenStore.getState().addOrder(order);
          newTables.set(id, {
            ...table,
            status: 'HAVING_MEAL',
          });
      }
      return { tables: newTables };
    });
  },
  addProcess: (id: string, process: number) => {
    set(state => {
      const newTables = new Map(state.tables);
      const table = newTables.get(id);
      if (!table) return state;
      newTables.set(id, { ...table, process: table.process + process });
      return { tables: newTables };
    });
  },
  clearAll: () => {
    set(state => ({ tables: new Map() }));
  },
  nextRound: () => {
    for (const [tableId, table] of get().tables) {
      switch (table.status) {
        case 'WAITING_FOR_CLEAN':
          if (table.process >= 100) {
            get().updateTableToNextStatus(tableId);
          } else {
            get().addProcess(tableId, 50);
          }
          break;
        case 'HAVING_MEAL':
          if (table.process >= 100) {
            // customer finished
            // pay order
            useOrderStore.getState().payOrders(tableId);
            useCustomerStore
              .getState()
              .updateStatus(table.customer.id, 'FINISHED');
            get().updateTableToNextStatus(tableId);
          } else {
            // check all food is ready
            if (useOrderStore.getState().checkOrderInTableFinished(tableId)) {
              get().addProcess(tableId, 20);
            }
          }
          break;
        case 'WAITING_FOR_ORDER':
          if (table.process >= 100) {
            get().updateTableToNextStatus(tableId);
          } else {
            get().addProcess(tableId, 50);
          }
          break;
      }
    }
  },
}));
