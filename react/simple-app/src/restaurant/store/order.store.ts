import { create } from 'zustand/react';
import type { Order, OrderStatus } from './data.type';
import { useMenuStore } from './menu.store';
import idFactory from './idFactory';

export interface OrderStore {
  orders: Map<string, Order>;
  getActiveOrders: () => Order[];
  deliverFood: (orderId: string, menuId: string) => void;
  add: (order: Order) => void;
  cancel: (tableId: string, menuId: string) => boolean;
  getActiveOrdersByTableId: (tableId: string) => Order[];
  payOrders: (tableId: string) => void;
  checkOrderInTableFinished: (tableId: string) => boolean;
  createRandomOrder: (tableId: string, customerCount: number) => Order;
}
export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: new Map(),
  getActiveOrders: () =>
    Array.from(get().orders.values()).filter(
      order => order.status === 'ACTIVE' || order.status === 'WAITING_PAY',
    ),
  getActiveOrdersByTableId: (tableId: string) => {
    const orders = get().getActiveOrders();
    return orders.filter(order => order.tableId === tableId);
  },
  deliverFood: (orderId: string, menuId: string) => {
    const order = get().orders.get(orderId);
    if (!order) return;
    let newStatus: OrderStatus = 'WAITING_PAY';
    const newItems = order.items.map(item => {
      let deliveredCount = item.deliveredCount;
      let count = item.quantity;
      if (item.menuId === menuId && deliveredCount < item.quantity) {
        const neededCount = item.quantity - item.deliveredCount;
        if (neededCount <= count) {
          deliveredCount += neededCount;
          count -= neededCount;
        } else {
          deliveredCount += count;
          count = 0;
        }
      }
      if (item.quantity > deliveredCount) {
        newStatus = 'ACTIVE';
      }
      return { ...item, deliveredCount };
    });

    const updatedOrder = {
      ...order,
      items: newItems,
      status: newStatus,
    } as Order;
    set(state => ({
      orders: new Map(state.orders).set(orderId, updatedOrder),
    }));
  },
  add: (order: Order) =>
    set(state => ({
      orders: new Map(state.orders).set(order.orderId, order),
    })),
  cancel: (tableId: string, menuId: string) => {
    get();
    return true;
  },
  checkOrderInTableFinished: (tableId: string) => {
    const orders = get().getActiveOrdersByTableId(tableId);
    for (let order of orders) {
      if (order.status === 'ACTIVE') {
        return false;
      }
    }
    return true;
  },
  payOrders: (tableId: string) => {
    if (!get().checkOrderInTableFinished(tableId)) {
      return;
    }
    const orders = get().getActiveOrdersByTableId(tableId);
    set(state => {
      const newOrders = new Map(state.orders);
      orders.forEach(order => {
        newOrders.set(order.orderId, { ...order, status: 'PAID' });
      });
      return { orders: newOrders };
    });
  },
  createRandomOrder: (tableId: string, customerCount: number) => {
    const menuItems = Array.from(useMenuStore.getState().menu.values());
    if (menuItems.length === 0) throw 'No items in order';

    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffle = <T>(arr: T[]) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    // decide how many distinct items to order
    const minPerPerson = 1;
    const maxPerPerson = 3;
    const itemsCountTarget = Math.max(
      1,
      Math.min(
        menuItems.length,
        customerCount * randomInt(minPerPerson, maxPerPerson),
      ),
    );
    const shuffledMenu = shuffle(menuItems);
    const chosen = shuffledMenu.slice(0, itemsCountTarget);

    const baseQty = Math.max(1, Math.floor(customerCount / chosen.length));
    const items = chosen.map(m => ({
      menuId: m.id,
      quantity: baseQty + randomInt(0, 1),
      deliveredCount: 0,
    }));
    const order: Order = {
      status: 'ACTIVE',
      orderId: idFactory.getNewIdByType('Order'),
      items,
      tableId,
    };
    get().add(order);
    return order;
  },
}));
