import { create } from 'zustand';
import type { Customer } from './data.type';
import idFactory from './idFactory';
import type { CustomerStatus } from './data.type';

export interface CustomerStore {
  customers: Map<string, Customer>;
  addNewCustomers: (count: number) => Customer[];
  updateStatus: (id: string, status: CustomerStatus) => Customer;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: new Map(),
  addNewCustomers: (count: number) => {
    const newCustomers: Customer[] = [];
    set(state => {
      const updatedCustomer = new Map(state.customers);
      for (let i = 0; i < count; i++) {
        const customer: Customer = {
          id: idFactory.getNewIdByType('Guest'),
          status: 'WAITING_TABLE',
          count: Math.ceil(Math.random() * 4),
        };
        updatedCustomer.set(customer.id, customer);
        newCustomers.push(customer);
      }
      return { customers: updatedCustomer };
    });
    return newCustomers;
  },
  updateStatus: (id: string, status: CustomerStatus) => {
    const customer = get().customers.get(id);
    if (!customer) throw 'Wrong customer id';
    const updatedCustomer = { ...customer, status };
    set(state => {
      const updatedCustomers = new Map(state.customers);
      updatedCustomers.set(id, updatedCustomer);
      return { customers: updatedCustomers };
    });
    return updatedCustomer;
  },
}));
