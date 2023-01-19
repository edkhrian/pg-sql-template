import { SQLStatement, SQLOptions } from './SQLStatement';
import { SQLComponentL, SQLComponentI, SQLComponentS } from './components';

type SQL = {
  <Result = any>(strings: TemplateStringsArray, ...values: any[]): SQLStatement<Result>;
  l: (value: any) => SQLComponentL;
  i: (value: any) => SQLComponentI;
  s: (value: string) => SQLComponentS;
};

export function SQLFactory(options: SQLOptions): SQL {
  const sql: SQL = function <Result = any>(strings: TemplateStringsArray, ...values: any[]) {
    return new SQLStatement<Result>(strings, values, options);
  };
  sql.l = (value: any) => new SQLComponentL(value);
  sql.i = (value: any) => new SQLComponentI(value);
  sql.s = (value: string) => new SQLComponentS(value);
  return sql;
}
