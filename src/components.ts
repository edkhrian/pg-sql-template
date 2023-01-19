class SQLComponent<Value = any> {
  value: Value;
  constructor(value: Value) {
    this.value = value;
  }
}

export class SQLComponentL extends SQLComponent {}
export class SQLComponentI extends SQLComponent {}
export class SQLComponentS extends SQLComponent<string> {}
