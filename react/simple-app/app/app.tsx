/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import React from 'react';
import type { Route as RouteInfo } from './+types/app';
import { NavBar } from './navBar/navBar';

export function meta({}: RouteInfo.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}
export default class AppHome extends React.Component {
  render(): React.ReactNode {
    return <div>Welcome</div>;
  }
}
