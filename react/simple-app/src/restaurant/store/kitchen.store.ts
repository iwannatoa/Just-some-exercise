import { create } from 'zustand';
import type { Order } from './data.type';
import idFactory from './idFactory';
import { useCookBookStore } from './cookBook.store';
import { useOrderStore } from './order.store';

export interface CookTask {
  status: 'ACTIVE' | 'PENDING' | 'COMPLETE';
  // complete when process > 100
  process: number;
  count: number;
  speed: number;
  taskId: string;
  menuId: string;
  orderIds: string[];
}
export interface Cook {
  cookId: string;
  task?: CookTask;
}
/**
 * Kitchen Store
 *
 * @description Manage the cook task, merge the same food to cook together.
 */
export interface KitchenStore {
  tasks: CookTask[];
  mergeableTaskMap: Map<string, CookTask[]>;
  cooks: Cook[];
  nextRound: () => void;
  addOrder: (order: Order) => void;
  removeCompletedTasks: () => void;
  getActiveTasks: () => (CookTask | undefined)[];
  getPendingTasks: () => CookTask[];
  getTasksByOrderId: (orderId: string) => CookTask[];
  getTasksByMenuId: (menuId: string) => CookTask[];
  initCooks: (num: number) => void;
  mergeTasks: (targetTaskId: string, sourceTaskId: string) => void;
  _updateMergeableMap: (tasks: CookTask[]) => void;
}

const useKitchenStore = create<KitchenStore>((set, get) => ({
  tasks: [],
  mergeableTaskMap: new Map(),
  cooks: [],

  _updateMergeableMap: (tasks: CookTask[]) => {
    const mergeableTaskMap = new Map<string, CookTask[]>();

    // only collect tasks that haven't started
    tasks.forEach(task => {
      if (task.status === 'PENDING') {
        if (!mergeableTaskMap.has(task.menuId)) {
          mergeableTaskMap.set(task.menuId, []);
        }
        mergeableTaskMap.get(task.menuId)!.push(task);
      }
    });

    set({ mergeableTaskMap });
  },

  nextRound: () => {
    set(state => {
      const updatedTasks: CookTask[] = state.tasks.map(task => {
        if (task.status === 'COMPLETE' || task.status === 'PENDING') {
          return task;
        }

        const newStatus = task.process >= 100 ? 'COMPLETE' : 'ACTIVE';
        if (newStatus === 'COMPLETE') {
          for (let orderId of task.orderIds) {
            useOrderStore.getState().deliverFood(orderId, task.menuId);
          }
        }
        for (let cook of state.cooks) {
          if (cook.task?.taskId === task.taskId) {
            cook.task = task;
            break;
          }
        }

        const newProcess = task.process + task.speed;
        return {
          ...task,
          process: Math.min(newProcess, 100),
          status: newStatus,
        };
      });

      // check if there are pending tasks that can be activated
      const cooks = [...state.cooks];
      const pendingTasks = updatedTasks.filter(t => t.status === 'PENDING');
      const tasksToActivate: CookTask[] = [];
      pendingTasks.sort((a, b) => b.count - a.count);
      cooks.forEach(cook => {
        if (!cook.task) {
          const newActiveTask = pendingTasks.shift();
          if (newActiveTask) {
            cook.task = { ...newActiveTask, status: 'ACTIVE' };
            tasksToActivate.push(newActiveTask);
          }
        } else if (cook.task.status === 'COMPLETE') {
          cook.task = undefined;
        } else if (cook.task.process >= 100) {
          cook.task.status = 'COMPLETE';
        }
      });

      let finalTasks: CookTask[] = updatedTasks.map(task => {
        if (tasksToActivate.some(t => t.taskId === task.taskId)) {
          return { ...task, status: 'ACTIVE' };
        }
        return task;
      });

      get()._updateMergeableMap(finalTasks);

      return { tasks: finalTasks };
    });
  },

  addOrder: (order: Order) => {
    if (order.status !== 'ACTIVE') return;
    set(state => {
      const currentTasks = [...state.tasks];
      const newTasks: CookTask[] = [];

      let activeTaskCount = currentTasks.filter(
        t => t.status === 'ACTIVE',
      ).length;
      // handle each item in the order
      order.items.forEach(item => {
        let remainingQuantity = item.quantity;

        // use mergeableTaskMap to quickly find mergeable tasks
        const mergeableTasks = state.mergeableTaskMap.get(item.menuId) || [];

        // sort by taskId (simple stable ordering)
        const sortedTasks = [...mergeableTasks].sort((a, b) =>
          a.taskId.localeCompare(b.taskId),
        );

        // try to merge into existing tasks
        for (const task of sortedTasks) {
          if (remainingQuantity <= 0) break;

          const taskIndex = currentTasks.findIndex(
            t => t.taskId === task.taskId,
          );
          if (taskIndex !== -1) {
            currentTasks[taskIndex] = {
              ...currentTasks[taskIndex],
              count: currentTasks[taskIndex].count + remainingQuantity,
              orderIds: [
                ...new Set([
                  ...currentTasks[taskIndex].orderIds,
                  order.orderId,
                ]),
              ],
            };
            remainingQuantity = 0;
            break;
          }
        }

        // create new task for remaining quantity
        if (remainingQuantity > 0) {
          const initialStatus =
            activeTaskCount++ < state.cooks.length ? 'ACTIVE' : 'PENDING';

          const task: CookTask = {
            taskId: idFactory.getNewIdByType('cookTask'),
            menuId: item.menuId,
            status: initialStatus,
            process: 0,
            count: remainingQuantity,
            speed:
              useCookBookStore.getState().getByMenuId(item.menuId)
                ?.countPerTime || 100,
            orderIds: [order.orderId],
          };

          newTasks.push(task);
        }
      });

      const allTasks = [...currentTasks, ...newTasks];

      get()._updateMergeableMap(allTasks);

      return { tasks: allTasks };
    });
  },

  removeCompletedTasks: () => {
    set(state => {
      const filteredTasks = state.tasks.filter(
        task => task.status !== 'COMPLETE',
      );

      get()._updateMergeableMap(filteredTasks);

      return { tasks: filteredTasks };
    });
  },

  getActiveTasks: () => {
    return get().cooks.map(cook => cook.task);
  },

  getPendingTasks: () => {
    const tasks = get().tasks.filter(task => task.status === 'PENDING');
    tasks.sort((a, b) => b.count - a.count);
    return tasks;
  },

  getTasksByOrderId: (orderId: string) => {
    return get().tasks.filter(task => task.orderIds.includes(orderId));
  },

  getTasksByMenuId: (menuId: string) => {
    return get().tasks.filter(task => task.menuId === menuId);
  },

  mergeTasks: (targetTaskId: string, sourceTaskId: string) => {
    set(state => {
      const targetTask = state.tasks.find(t => t.taskId === targetTaskId);
      const sourceTask = state.tasks.find(t => t.taskId === sourceTaskId);

      if (
        !targetTask ||
        !sourceTask ||
        targetTask.menuId !== sourceTask.menuId
      ) {
        return state;
      }

      const mergedTask: CookTask = {
        ...targetTask,
        count: targetTask.count + sourceTask.count,
        orderIds: [
          ...new Set([...targetTask.orderIds, ...sourceTask.orderIds]),
        ],
        process: Math.round(
          (targetTask.process * targetTask.count +
            sourceTask.process * sourceTask.count) /
            (targetTask.count + sourceTask.count),
        ),
      };

      const filteredTasks = state.tasks.filter(
        task => task.taskId !== targetTaskId && task.taskId !== sourceTaskId,
      );

      const allTasks = [...filteredTasks, mergedTask];

      get()._updateMergeableMap(allTasks);

      return { tasks: allTasks };
    });
  },
  initCooks: (num: number) => {
    set(() => {
      const cooks: Cook[] = [];
      for (let i = 0; i < num; i++) {
        const cookId = idFactory.getNewIdByType('Cook');
        cooks.push({ cookId });
      }
      return { cooks };
    });
  },
}));

export default useKitchenStore;
