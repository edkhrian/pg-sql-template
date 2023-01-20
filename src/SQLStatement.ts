import { withArray } from 'pg-format';
import { Client, ClientBase, Pool, QueryArrayResult } from 'pg';
import { camelCase, camelCaseKeys } from './utils';
import { SQLError } from './SQLError';
import { SQLComponentI, SQLComponentS } from './components';

export type AnyClient = ClientBase | Pool | Client;

export type SQLResultKeyType = 'raw' | 'camelCase';

interface SQLResultOptionsBase {
  name?: string;
  client?: AnyClient;
}

interface SQLResultOptions extends SQLResultOptionsBase {
  keysType?: SQLResultKeyType;
}

export interface SQLOptions {
  client: AnyClient;
  keysType?: SQLResultKeyType;
}

interface SQLExecuteResult<T> {
  command: string;
  rowCount: number;
  rows: T[];
}

export class SQLStatement<Result> {
  private readonly strings: TemplateStringsArray;
  private readonly values: any[];
  private readonly options: SQLOptions;

  constructor(strings: TemplateStringsArray, values: any[] = [], options: SQLOptions) {
    this.strings = strings;
    this.values = values;
    this.options = options;
  }

  private createError(): SQLError {
    const data = this.parse();
    throw new SQLError(data.format, data.values);
  }

  private parse(): { format: string; values: any[] } {
    let format = '';
    let values: any[] = [];

    this.strings.forEach((str, index) => {
      format += str.replace('%', '%%');
      if (index > this.values.length - 1) return;
      const value = this.values[index];

      switch (true) {
        case value instanceof SQLStatement:
          const parseData = value.parse();
          format += parseData.format;
          values = values.concat(parseData.values);
          break;
        case value instanceof SQLComponentI:
          values.push(value);
          format += '%I';
          break;
        case value instanceof SQLComponentS:
          values.push(value);
          format += '%S';
          break;
        default:
          values.push(value);
          format += '%L';
      }
    });
    return { format, values };
  }

  private async raw<T = Result>(options: { client: AnyClient; name?: string }): Promise<QueryArrayResult<T[]>> {
    const { values, format } = this.parse();
    const text = withArray(format, values);
    return options.client.query<T[]>({
      text,
      name: options.name,
      rowMode: 'array',
    });
  }

  async execute<T = Result>(options?: SQLResultOptions): Promise<SQLExecuteResult<T>> {
    const keysType = options?.keysType || this.options.keysType || 'camelCase';

    const result = await this.raw({
      client: options?.client || this.options.client,
      name: options?.name,
    });
    let rows: T[] = [];
    let fields = (result.fields || []).map(item => item.name);

    if (fields.length > 0 && keysType === 'camelCase') {
      fields = fields.map(camelCase);
      rows = result.rows.map((row: any[]) => {
        return row.reduce((obj, value: any, index) => {
          const fieldName = fields[index];
          obj[fieldName] = camelCaseKeys(value);
          return obj;
        }, {});
      }) as T[];
    }

    return { rows, rowCount: result.rowCount, command: result.command };
  }

  async run(options?: SQLResultOptions): Promise<void> {
    await this.raw({
      client: options?.client || this.options.client,
      name: options?.name,
    });
  }

  async many<T = Result>(options?: SQLResultOptions): Promise<T[]> {
    const result = await this.execute<T>(options);
    return result.rows;
  }

  async oneOrNone<T = Result>(options?: SQLResultOptions): Promise<T | undefined> {
    const rows = await this.many<T>(options);
    return rows[0];
  }

  async one<T = Result>(options?: SQLResultOptions): Promise<T> {
    const result = await this.oneOrNone<T>(options);
    if (!result) throw this.createError();
    return result;
  }

  async valueOrNone<T = Result>(options?: SQLResultOptions): Promise<T | undefined> {
    const result = await this.raw<T>({
      client: options?.client || this.options.client,
      name: options?.name,
    });
    return result.rows[0] && result.rows[0][0];
  }

  async value<T = Result>(options?: SQLResultOptionsBase): Promise<T> {
    const result = await this.valueOrNone<T>(options);
    if (result === undefined) throw this.createError();
    return result;
  }
}
