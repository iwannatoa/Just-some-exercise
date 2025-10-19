/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FC,
} from "react";
import { getData } from "./data";
import type { EChartsOption, ToolboxComponentOption } from "echarts";
import ReactECharts from "echarts-for-react";
import type { GridData, KeyValueData, pageStatusType } from "./reports.type";

const ReportHome: FC<ReportHomeBean> = prop => {
  const updateGridOptions = (
    options: EChartsOption,
    data: KeyValueData,
  ): EChartsOption => {
    const series = data.categories.map(type => {
      return {
        type: "line",
        name: type,
        smooth: true,
        dimensions: ["time", type],
        stack: "Total",
        areaStyle: {},
        showSymbol: false,
      };
    }) as any;
    return {
      ...options,
      dataset: {
        source: data.data,
      },
      series: series,
    };
  };
  const [pageStatus, setPageStatus] = useState<pageStatusType>("Loading");
  const fullData = useRef({} as KeyValueData);
  const [gridOptions, setGridOptions] = useReducer(updateGridOptions, {
    legend: {},
    tooltip: {
      trigger: "axis",
    },
    dataset: {
      source: [],
    },
    yAxis: {},
    xAxis: {
      type: "time",
    },
    dataZoom: { type: "inside" },
    series: [],
    toolbox: {
      right: 128,
      itemSize: 16,
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
      },
    } as ToolboxComponentOption,
  } as EChartsOption);
  const [data, setData] = useReducer(
    (_, { start, end }) => {
      const result = {
        categories: fullData.current.categories,
        data: fullData.current.data.filter(
          item => item.time >= start && item.time <= end,
        ),
      };
      return result;
    },
    {
      categories: [],
      data: [],
    } as KeyValueData,
  );

  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  const handleDataZoom = useCallback((event: any) => {
    if (event.batch) {
      const val = event.batch[event.batch.length - 1];
      if (val.startValue && val.endValue) {
        setData({ start: val.startValue, end: val.endValue });
      } else {
        setData({ start: start.getTime(), end: end.getTime() });
      }
    }
  }, []);
  const eventDict: Record<string, Function> = {
    dataZoom: handleDataZoom,
  };
  const memorized = useMemo(() => {
    return (
      <ReactECharts
        className='flex-none'
        option={gridOptions}
        lazyUpdate={true}
        showLoading={pageStatus === "Loading"}
        onEvents={eventDict}
      />
    );
  }, [gridOptions, pageStatus, eventDict]);
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    getData(start, end, 100)
      .then(data => {
        if (!isMounted.current) return;
        setGridOptions(data);
        fullData.current = data;
        setData({ start, end });
        setPageStatus("Success");
      })
      .catch(() => {
        setPageStatus("Failed");
      });
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <div className='h-full flex flex-col p-4 min-h-0'>
      <h1 className='flex-none'>Here we come</h1>
      {memorized}
      <div className='flex flex-row'>
        {(data.data.length > 0 && (
          <table className='flex-1 text-center bg-gray-50 min-h-0 overflow-auto'>
            <tr key='header' className='bg-gray-200 shadow-2xl shadow-gray-300'>
              <th key='time'>Time</th>
              {data.categories.map(type => (
                <th key={type}>{type}</th>
              ))}
            </tr>
            {data.data.map((row, i) => (
              <tr key={i}>
                <td key={`${i}_time`}>{new Date(row.time).toDateString()}</td>
                {data.categories.map(type => (
                  <td key={`${i}_${type}`}>{row[type]}</td>
                ))}
              </tr>
            ))}
          </table>
        )) ||
          (pageStatus === "Failed" && <div>Load data failed</div>)}
      </div>
    </div>
  );
};

interface ReportHomeBean {}
export default ReportHome;
