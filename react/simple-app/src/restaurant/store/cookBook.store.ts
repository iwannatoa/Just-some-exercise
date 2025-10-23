import { create } from 'zustand';
import type { CookBookItem } from './data.type';
import idFactory from './idFactory';

const COOKBOOK_PREFIX = 'CookBook';
export interface CookBookStore {
  clearAll: () => void;
  cookBooks: Map<string, CookBookItem>;
  update: (menuId: string, count: number) => void;
  add: (item: CookBookItem) => void;
  getByMenuId: (id: string) => CookBookItem | undefined;
}
export const useCookBookStore = create<CookBookStore>((set, get) => ({
  cookBooks: new Map(),
  update: (menuId: string, count: number) => {
    set(state => {
      const targetItem = state.getByMenuId(menuId);
      if (!targetItem) return state;
      const updatedItem = { ...targetItem, countPerTime: count };
      const updatedCookBooks = new Map(state.cookBooks);
      updatedCookBooks.set(menuId, updatedItem);

      return { cookBooks: updatedCookBooks };
    });
  },
  add: (item: CookBookItem) =>
    set(state => {
      const id = idFactory.getNewIdByType(COOKBOOK_PREFIX);
      const updatedCookbooks = new Map(state.cookBooks);
      const newItem = { ...item, id };
      updatedCookbooks.set(newItem.menuId, newItem);
      return { cookBooks: updatedCookbooks };
    }),
  remove: (menuId: string) => {
    set(state => {
      const updatedCookBooks = new Map(state.cookBooks);
      updatedCookBooks.delete(menuId);
      return { cookBooks: updatedCookBooks };
    });
  },
  getByMenuId: (id: string) => get().cookBooks.get(id),
  clearAll: () => {
    idFactory.resetTheCounter(COOKBOOK_PREFIX);
    set(state => ({
      cookBooks: new Map(),
    }));
  },
}));
