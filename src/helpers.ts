import get from 'lodash/get';
import has from 'lodash/has';
import isPlainObject from 'lodash/isPlainObject';
import set from 'lodash/set';
import {ApiResponse} from './type';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import snakeCase from 'lodash/snakeCase';

export const ensureSafeChaining = (object: Object, path: string | string[], defaultValue?: any) => {
  // Ensure the path is existed first
  if (!has(object, path)) {
    set(object, path, undefined);
  }
  // Set default value if you want to. (defaultValue !== undefined)
  if (defaultValue !== undefined && get(object, path) === undefined) {
    set(object, path, defaultValue);
  }
};

export const getObjNthItem = (obj: Record<any, any>, nth: number) => {
  if (!obj) {
    return undefined;
  }
  const index = nth - 1;
  const objKeys = Object.keys(obj);
  const targetKey = objKeys && objKeys[index];
  return obj[targetKey];
};

export const requestDummyData = async (
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data: Record<string, any> = {}
): Promise<ApiResponse<any>> => {
  const [endpoint] = url.split('?');
  return {
    config: {},
    headers: {},
    request: undefined,
    status: 200,
    statusText: '',
    data: {data: data[endpoint][method], message: '', status: '200'},
  };
};

export const snakeCaseObj = (obj: Record<string, any>, removeWhitespace = true) => {
  if (!isPlainObject(obj)) {
    return obj;
  }
  const res: Record<string, any> = {};
  Object.keys(obj).forEach(property => {
    let value = obj[property];
    if (isArray(value)) {
      value = value.map(item => snakeCaseObj(item));
    } else if (isPlainObject(value)) {
      value = snakeCaseObj(value);
    }
    if (removeWhitespace) {
      if (isString(value)) {
        value = value.replace(/\\t$/, '').trim();
      }
    }
    res[snakeCase(property)] = value;
  });

  return res;
};

export const parseFormDataToObj = (formData: FormData) => {
  const object: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File)) {
      object[key] = value;
    }
  }
  return object;
};

export const serializeQueryString = (obj: Record<string, any>, {encode = true, snakeKey = false} = {}) => {
  if (!obj) {
    return '';
  }
  return `?${Object.keys(obj)
    .reduce((a, k) => {
      if (Array.isArray(obj[k]) && obj[k].length > 0) {
        obj[k].forEach((val: any) => {
          const key = snakeKey ? snakeCase(k) : k;
          let value = val;
          if (isString(value)) {
            value = value.replace(/\\t$/, '').trim();
          }
          value = encode ? encodeURIComponent(value) : value;

          // @ts-ignore
          a.push(`${key}[]=${value}`);
        });
      } else if (obj[k] !== null && obj[k] !== undefined) {
        const key = snakeKey ? snakeCase(k) : k;
        let value = obj[k];
        if (isString(value)) {
          value = value.replace(/\\t$/, '').trim();
        }
        value = encode ? encodeURIComponent(value) : value;
        // @ts-ignore
        a.push(`${key}=${value}`);
      }
      return a;
    }, [])
    .join('&')}`;
};
