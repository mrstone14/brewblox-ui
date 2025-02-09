import forEach from 'lodash/forEach';
import last from 'lodash/last';
import parseDuration from 'parse-duration';
import {
  DEFAULT_GRAPH_DECIMALS,
  MAX_GRAPH_POINTS,
  Y2_COLOR,
} from '@/plugins/history/const';
import { defaultLabel } from '@/plugins/history/nodes';
import {
  GraphSource,
  MetricsSource,
  TimeSeriesMetricsResult,
  TimeSeriesRangesResult,
} from '@/plugins/history/types';
import { fixedNumber } from '@/utils/quantity';

function boundedConcat(left: number[] = [], right: number[] = []): number[] {
  const sliced = Math.max(left.length + right.length - MAX_GRAPH_POINTS, 0);
  if (sliced > left.length) {
    return right.slice(sliced - left.length);
  }
  if (sliced > 0) {
    const result = left.slice(sliced);
    result.push(...right);
    return result;
  }
  return [...left, ...right];
}

/**
 * Returns a HTML span element with the field name postfixed with the current value.
 *
 * @param source
 * @param key
 * @param value
 * @returns
 */
function fieldLabel(
  source: GraphSource,
  key: string,
  value: number | undefined,
): string {
  const label = source.renames[key] || defaultLabel(key);
  const precision = source.precision[key] ?? DEFAULT_GRAPH_DECIMALS;
  const prop = source.axes[key] === 'y2' ? `style="color: ${Y2_COLOR}"` : '';
  return `<span ${prop}>${label}<br>${fixedNumber(value, precision)}</span>`;
}

export function graphSourceTransformer(
  source: GraphSource,
  result: TimeSeriesRangesResult,
): void {
  if (result.ranges.length > 0) {
    if (result.initial) {
      source.values = {};
    }

    result.ranges.forEach((range) => {
      const key = range.metric.__name__;
      const existing = source.values[key];
      const min = source.min?.[key];
      const max = source.max?.[key];

      const x: number[] = boundedConcat(
        existing?.x,
        range.values.map((v) => v[0] * 1000),
      );
      const y: number[] = boundedConcat(
        existing?.y,
        range.values.map((v) => {
          const value = Number(v[1]);
          if (min != null && value < min) {
            return NaN;
          }
          if (max != null && value > max) {
            return NaN;
          }
          return Number(v[1]);
        }),
      );
      source.values[key] = {
        ...existing, // Plotly can set values
        x,
        y,
        type: 'scattergl',
        mode: 'lines',
        name: fieldLabel(source, key, last(y)),
        yaxis: source.axes[key] ?? 'y',
        line: { color: source.colors[key] },
      };
    });

    if (source.params.duration && !source.params.start && !source.params.end) {
      // timestamp in Ms that should be discarded
      const boundary =
        new Date().getTime() - (parseDuration(source.params.duration) ?? 0);
      forEach(source.values, (val) => {
        const boundaryIdx = val.x.findIndex((x: number) => x > boundary);
        if (boundaryIdx > 0) {
          val.x = val.x.slice(boundaryIdx);
          val.y = val.y.slice(boundaryIdx);
        }
      });
    }

    source.truncated = Object.values(source.values).some(
      (vals) => vals.x.length === MAX_GRAPH_POINTS,
    );
  }
}

export function metricsSourceTransformer(
  source: MetricsSource,
  result: TimeSeriesMetricsResult,
): void {
  source.updated = new Date();
  source.values = result.metrics.map((res) => ({
    field: res.metric,
    time: new Date(res.timestamp),
    value: res.value,
  }));
}
