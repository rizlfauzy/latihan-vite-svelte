export class Warning extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Warning';
  }
}

export class Info extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Info';
  }
}

export class Success extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Success';
  }
}
