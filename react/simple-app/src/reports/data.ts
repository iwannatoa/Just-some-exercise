/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */

import type { GridData, KeyValueData } from './reports.type';

export function getData(startDate: Date, endDate: Date, count = 100) {
  const types = ['Java', 'React', 'Vue', 'Angular', 'Python', 'g++'];
  const data: KeyValueData = {
    categories: types,
    data: [],
  };
  const start = startDate.getTime();
  const end = endDate.getTime();
  const step = (end - start) / count;
  for (let i = 0; i < count; i++) {
    const pre = { time: start + step * i } as {
      name: string;
      time: number;
    } & Record<string, number>;
    for (let j = 0; j < types.length; j++) {
      pre[types[j]] = Math.ceil(Math.random() * 100);
    }
    data.data.push(pre);
  }
  return delayPromise<KeyValueData>(2000, data);
}

function delayPromise<T>(
  time: number,
  value: T,
  shouldReject = false,
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      shouldReject ? reject(new Error('Rejected')) : resolve(value);
    }, time);
  });
}
