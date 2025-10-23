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
  index('./app.tsx'),
  route('sudoku', './sudoku/home.tsx', [
    index('./sudoku/input.tsx'),
    route('result', 'sudoku/result.tsx'),
  ]),
  ...prefix('reports', [index('./reports/home.tsx')]),
  route('chat-room', './chatRoom/chatRoom.tsx'),
  route('play-ground', './playGround/playGround.tsx'),
  route('restaurant', './restaurant/view/Restaurant.tsx'),
] satisfies RouteConfig;

export const ROUTE_NAME_MAP: Record<string, string> = {
  '': 'Home',
  sudoku: 'Sudoku',
  reports: 'Report',
  'chat-room': 'Chat Room',
  'play-ground': 'Play Ground',
  restaurant: 'Restaurant',
};
