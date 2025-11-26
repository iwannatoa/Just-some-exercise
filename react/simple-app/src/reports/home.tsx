import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type FC } from 'react';
import { getData } from './data';
import type { EChartsOption, ToolboxComponentOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import type { KeyValueData, pageStatusType } from './reports.type';
import VirtualListDetail from './VirtualListDetail';
import LazyLoadDetail from './LazyLoadDetail';
import React from 'react';

const ReportHome: FC<ReportHomeBean> = prop => {
  const updateGridOptions = (prevOptions: EChartsOption, data: KeyValueData): EChartsOption => {
    const series = data.categories.map(type => {
      return {
        type: 'line',
        name: type,
        smooth: true,
        dimensions: ['time', type],
        stack: 'Total',
        areaStyle: {},
        showSymbol: false,
      };
    }) as any;
    return {
      ...prevOptions,
      dataset: {
        source: data.data,
      },
      series: series,
    };
  };
  const [pageStatus, setPageStatus] = useState<pageStatusType>('Loading');
  const [gridOptions, setGridOptions] = useReducer(updateGridOptions, {
    legend: {},
    tooltip: {
      trigger: 'axis',
    },
    dataset: {
      source: [],
    },
    yAxis: {},
    xAxis: {
      type: 'time',
    },
    dataZoom: { type: 'inside' },
    series: [],
    toolbox: {
      right: 128,
      itemSize: 16,
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
        },
      },
    } as ToolboxComponentOption,
  } as EChartsOption);
  const current = new Date();
  const [endTime] = useState<Date>(new Date());
  const [startTime] = useState<Date>(new Date(current.setFullYear(current.getFullYear() - 1)));
  const chartRef = useRef<ReactECharts>(null);
  const fullData = useRef({} as KeyValueData);
  const [data, setData] = useReducer(
    (_, { start, end }: { start: number; end: number }) => {
      if (!start || !end) {
        start = startTime.getTime();
        end = endTime.getTime();
      }
      const result = {
        categories: fullData.current.categories,
        data: fullData.current.data.filter(item => item.time >= start && item.time <= end),
      };
      return result;
    },
    {
      categories: [],
      data: [],
    } as KeyValueData,
  );

  React.captureOwnerStack;

  const handleDataZoom = useCallback((event: any) => {
    const option = chartRef.current?.getEchartsInstance().getOption();
    if (!option) return;
    const val = (option.dataZoom as [{ startValue: number; endValue: number }])[0];
    setData({ start: val.startValue, end: val.endValue });
  }, []);

  const eventDict: Record<string, Function> = {
    dataZoom: handleDataZoom,
  };
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    getData(startTime, endTime, 1000)
      .then(data => {
        if (!isMounted.current) return;
        setData({ start: startTime.getTime(), end: endTime.getTime() });
        setGridOptions(data);
        fullData.current = data;
        setPageStatus('Success');
      })
      .catch(() => {
        setPageStatus('Failed');
      });
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <div className='h-full flex flex-col p-4 min-h-0 space-y-4'>
      <ReactECharts
        ref={chartRef}
        className='flex-none rounded-lg shadow-md border border-gray-200 bg-white'
        option={gridOptions}
        lazyUpdate={true}
        showLoading={pageStatus === 'Loading'}
        onEvents={eventDict}
      />
      {/* <VirtualListDetail data={data} status={pageStatus}></VirtualListDetail> */}
      <LazyLoadDetail data={data} status={pageStatus} />
    </div>
  );
};

interface ReportHomeBean {}
export default ReportHome;
