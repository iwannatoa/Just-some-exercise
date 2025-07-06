/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from '@react-router/dev/routes';

export default [
  index("./app.tsx"),
  route("sudoku", "./sudoku/home.tsx", [
    index("./sudoku/input.tsx"),
    route("result", "sudoku/result.tsx"),
  ]),
  ...prefix("reports", [index("./reports/home.tsx")]),
] satisfies RouteConfig;


