import {
  BrokenRule,
  DomainGuard,
  DomainStringValueObject,
  IDomainPrimitive,
} from '@nestjslatam/ddd';

export class Name extends DomainStringValueObject {
  constructor(name: string) {
    super(name);
  }

  static create(name: string): Name {
    return new Name(name);
  }

  protected businessRules(props: IDomainPrimitive<string>): void {
    const { value } = props;

    if (!DomainGuard.lengthIsBetween(value, 3, 150))
      this.addBrokenRule(
        new BrokenRule(
          this.constructor.name,
          'Invalid Name lenght. The value should be a string with 3 and 150 characters',
        ),
      );
  }
}
