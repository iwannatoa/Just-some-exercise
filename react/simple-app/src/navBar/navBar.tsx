/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import React from 'react';
import { NavLink } from 'react-router';
import './navBarStyle.scss';
import routeConfig, { ROUTE_NAME_MAP } from '../routes';
export class NavBar extends React.Component {
  routes = routeConfig;
  routeNameMap = ROUTE_NAME_MAP;
  navClass(isActive: boolean, isPending: boolean) {
    return (isPending ? 'pending' : isActive ? 'active' : '') + ' nav-button';
  }
  componentDidMount(): void {
    console.log('routes', this.routes);
  }
  render() {
    return (
      <nav className='nav-group'>
        {this.routes
          .map(route => {
            return {
              to: `/${route.path ?? ''}`,
              name: this.routeNameMap[route.path ?? ''],
            };
          })
          .map(item => (
            <NavLink to={item.to} className='nav-button'>
              {item.name}
            </NavLink>
          ))}
      </nav>
    );
  }
}
