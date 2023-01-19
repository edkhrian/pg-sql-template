export class SQLError extends Error {
  format: string;
  values: any[];

  constructor(format: string, values: any[]) {
    super(`${format}  -- VALUES: [${values}]`);

    this.format = format;

    this.values = values;
  }
}
