/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import React from 'react';

export default class ReportHome extends React.Component<ReportHomeBean> {
  setState<K extends never>(state: unknown): void {
    state;
  }
  forceUpdate(callback?: (() => void) | undefined): void {}
  render(): React.ReactNode {
    return <div>Here we come</div>;
  }
}

interface ReportHomeBean {}
