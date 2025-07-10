/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import Dexie, { type EntityTable } from 'dexie';

interface User {
  id?: number;
  name: string;
  entitlement: string;
}

interface Task {
  id?: number;
  name: string;
  category: string;
  status: string;
  creatorId: number;
  assigneeId: number;
}

interface TaskHistory {
  id?: number;
  type: string;
  userId: number;
  taskId: number;
  detail: string;
  operateTime: number;
}

interface Workflow {
  id?: number;
  taskType: string;
  current: string;
  next: string[];
  isActive: boolean;
  createTime: number;
  updateTime: number;
}

interface Entitlement {
  id?: number;
  name: string;
}

const db = new Dexie('simpleTaskDataBase') as Dexie & {
  user: EntityTable<User, 'id'>;
  task: EntityTable<Task, 'id'>;
  taskHistory: EntityTable<TaskHistory, 'id'>;
  workflow: EntityTable<Workflow, 'id'>;
  entitlement: EntityTable<Entitlement, 'id'>;
};

db.version(1).stores({
  user: '++id, name, entitlement',
  task: '++id, name, category, status, creatorId, assigneeId',
  taskHistory: '++id, type, userId, taskId, detail, operateTime',
  workflow: '++id, taskType, current, next, isActive, createTime, updateTime',
  entitlement: '++id, name',
});

async function initDB() {
  db.entitlement.clear();
  db.task.clear();
  db.user.clear();
  db.taskHistory.clear();
  db.workflow.clear();
  console.log('Init DB data');
  await db.entitlement.bulkAdd([
    {
      name: 'SuperAdmin',
    },
    {
      name: 'Admin',
    },
    {
      name: 'user',
    },
  ]);
  await db.user.bulkAdd([
    {
      name: 'Super Admin',
      entitlement: 'SuperAdmin',
    },
    {
      name: 'Admin',
      entitlement: 'Admin',
    },
    {
      name: 'User A',
      entitlement: 'User',
    },
    {
      name: 'User B',
      entitlement: 'User',
    },
  ]);
  await db.workflow.bulkAdd([
    {
      taskType: 'Task',
      current: 'Open',
      next: ['In Progress', 'Defer'],
      isActive: true,
      createTime: Date.now(),
      updateTime: Date.now(),
    },
    {
      taskType: 'Task',
      current: 'In Progress',
      next: ['Resolved', 'Open', 'Defer'],
      isActive: true,
      createTime: Date.now(),
      updateTime: Date.now(),
    },
    {
      taskType: 'Task',
      current: 'Defer',
      next: ['Open', 'Closed'],
      isActive: true,
      createTime: Date.now(),
      updateTime: Date.now(),
    },
    {
      taskType: 'Task',
      current: 'Resolved',
      next: ['In Progress', 'Closed'],
      isActive: true,
      createTime: Date.now(),
      updateTime: Date.now(),
    },
    {
      taskType: 'Task',
      current: 'Closed',
      next: ['Resolved'],
      isActive: true,
      createTime: Date.now(),
      updateTime: Date.now(),
    },
  ]);
  console.log('Init DB data complete');
}

db.on('populate', () => initDB());

export type { User, Task, TaskHistory, Workflow, Entitlement };
export { db };
