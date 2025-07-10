/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
export interface GridDataWithCategories {
  categories: string[];
  data: [header: string, ...rest: number[]][];
}

export interface KeyValueData<T extends string = string> {
  categories: T[];
  data: Array<LanguageValue>;
}

export type GridData = (number | string)[][];
export type LanguageValue = {
  time: number;
} & Record<string, number>;
