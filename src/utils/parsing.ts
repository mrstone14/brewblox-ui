import fromPairs from 'lodash/fromPairs';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import mapValues from 'lodash/mapValues';
import toPairs from 'lodash/toPairs';

import { BlockOrIntfType, Link, Quantity } from '@/shared-types';

import { canSerialize, isBloxField } from './identity';
import { rawLink } from './link';
import { rawQty } from './quantity';


// string start
// then any characters (captured)
// then a left bracket (captured)
// then any characters (captured)
// then a right bracket
// string end
// Example values:
//   'field<SetpointSensorPair,driven>'
//   'field2[degC]'
//   'field_underscored[1 / degC]'
const postfixExpr = /^(.*)([\[<])(.*)[\]>]$/;

export function splitPostfixed(name: string): [string, string | null] {
  const matched = name.match(postfixExpr);
  if (!matched) {
    return [name, null];
  }
  const baseName = matched[1];
  const unit = matched[3].split(',')[0];
  return [baseName, unit];
}

export function parsePostfixed(key: string, val: unknown): [string, Quantity | Link] | null {
  try {
    if (key.endsWith(']') || key.endsWith('>')) {
      const matched = key.match(postfixExpr);
      if (matched) {
        const [, name, leftBracket, bracketed] = matched;
        if (leftBracket === '<') {
          const [type, driven] = bracketed.split(',');
          return [name, rawLink(val as string | null, type as BlockOrIntfType, !!driven)];
        }
        else if (leftBracket === '[') {
          return [name, rawQty(val as number | null, bracketed)];
        }
      }
    }
  }
  catch (e) { }
  return null;
}

export function deserialize<T>(obj: T): T {
  if (isArray(obj)) {
    return (obj as any).map(deserialize) as T;
  }
  if (isBloxField(obj)) {
    return obj;
  }
  if (isObject(obj)) {
    const parsed = toPairs(obj)
      .map(([key, val]) => parsePostfixed(key, val) ?? [key, deserialize(val)]);
    return fromPairs(parsed) as T;
  }
  return obj;
}

export function serialize<T>(obj: T): T {
  if (isArray(obj)) {
    return (obj as any).map(serialize);
  }
  if (canSerialize(obj)) {
    return obj.toJSON();
  }
  if (isObject(obj)) {
    return mapValues(obj, serialize) as any; // lies
  }
  return obj;
}
