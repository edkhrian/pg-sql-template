function isObject(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    value !== undefined &&
    !(value instanceof RegExp) &&
    !(value instanceof Error) &&
    !(value instanceof Date)
  );
}

export function camelCase(value: string): string {
  return value.replace(/_+([a-zA-Z0-9])/g, (match, letter) => letter.toUpperCase());
}

export function camelCaseKeys<ReturnType = any>(value: any): ReturnType;
export function camelCaseKeys<ReturnType = any>(value: any[]): ReturnType[];
export function camelCaseKeys<ReturnType = any>(value: any | any[]): ReturnType | ReturnType[] {
  if (Array.isArray(value)) {
    return value.map(item => camelCaseKeys(item));
  } else if (isObject(value)) {
    return Object.keys(value).reduce((obj: any, key) => {
      obj[camelCase(key)] = value[key];
      return obj;
    }, {}) as any;
  } else {
    return value;
  }
}
