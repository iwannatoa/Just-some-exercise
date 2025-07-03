/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import React from "react";
import { NavLink } from "react-router";
import "./navBarStyle.scss";

export class NavBar extends React.Component {
  navClass(isActive: boolean, isPending: boolean) {
    return (isPending ? "pending" : isActive ? "active" : "") + " nav-button";
  }
  render() {
    return (
      <nav className="nav-group">
        <NavLink to="/" className="nav-button">
          Home
        </NavLink>
        <NavLink to="/sudoku" className="nav-button">
          Sudoku
        </NavLink>
        <NavLink to="/reports" className="nav-button">
          Report
        </NavLink>
      </nav>
    );
  }
}
