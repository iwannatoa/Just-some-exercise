/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import React from 'react';
import { Outlet } from 'react-router';

export default class SudokuHome extends React.Component {
  constructor(prop: {}) {
    super(prop);
  }
  render(): React.ReactNode {
    return (
      <div>
        <h1>Sudoku works?</h1>
        <Outlet></Outlet>
      </div>
    );
  }
}
