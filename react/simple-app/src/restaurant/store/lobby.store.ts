import { create } from 'zustand';
import { useCustomerStore } from './customer.store';
import { useTableStore } from './table.store';
import type { Customer } from './data.type';
import idFactory from './idFactory';

export interface LobbyStore {
  waitingLine: Customer[];
  nextRound: () => void;
}

export const useLobbyStore = create<LobbyStore>((set, get) => ({
  waitingLine: [],
  nextRound: () => {
    const customers = useCustomerStore.getState().customers;
    const waitingCount = Array.from(customers.values()).filter(
      c => c.status === 'WAITING_TABLE',
    ).length;
    const emptyTableCount = Array.from(
      useTableStore.getState().tables.values(),
    ).filter(table => table.status === 'EMPTY').length;
    // Calculate whether there wil be new customers according to the current empty customers and empty tables
    const freeSlots = Math.max(0, emptyTableCount - waitingCount);
    const newCustomersCount =
      waitingCount > 10
        ? 0
        : Math.min(10, Math.floor(Math.random() * (freeSlots * 2 + 1)));
    const newCustomerList = useCustomerStore
      .getState()
      .addNewCustomers(newCustomersCount);
    const newWaitingLine = [...get().waitingLine, ...newCustomerList];
    if (newWaitingLine.length > 0) {
      const seatCustomerCount = Math.floor(
        Math.random() * Math.min(newWaitingLine.length, 5),
      );
      for (let i = 0; i < seatCustomerCount; i++) {
        const firstNewCustomer = newWaitingLine[0];
        if (useTableStore.getState().seatCustomer(firstNewCustomer)) {
          newWaitingLine.shift();
        }
      }
    }
    set(state => {
      return { waitingLine: newWaitingLine };
    });
  },
}));
