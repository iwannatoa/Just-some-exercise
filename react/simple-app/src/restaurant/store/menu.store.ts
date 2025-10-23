import { create } from 'zustand';
import type { MenuItem } from './data.type';
import idFactory from './idFactory';

const MENU_PREFIX = 'menu';
export interface MenuStore {
  clearAll: () => void;
  menu: Map<string, MenuItem>;
  add: (item: MenuItem) => string;
  remove: (menuId: string) => void;
}
export const useMenuStore = create<MenuStore>((set, get) => ({
  menu: new Map(),
  add: (item: MenuItem) => {
    const id = idFactory.getNewIdByType(MENU_PREFIX);
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
    idFactory.resetTheCounter(MENU_PREFIX);
    set(state => {
      return { menu: new Map() };
    });
  },
}));
