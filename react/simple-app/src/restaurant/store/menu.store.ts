import { create } from 'zustand';
import type { MenuItem } from './data.type';
import idFactory from './idFactory';

export interface MenuStore {
  clearAll: () => void;
  menu: Map<string, MenuItem>;
  add: (item: MenuItem) => string;
  remove: (menuId: string) => void;
}
export const useMenuStore = create<MenuStore>((set, get) => ({
  menu: new Map(),
  add: (item: MenuItem) => {
    const id = idFactory.getNewIdByType('menu');
    set(state => {
      item.id = id;
      state.menu.set(id, item);
      return { menu: state.menu };
    });
    return id;
  },

  remove: (menuId: string) =>
    set(state => {
      state.menu.delete(menuId);
      return { menu: state.menu };
    }),
  clearAll: () => {
    set(state => {
      return { menu: new Map() };
    });
  },
}));
