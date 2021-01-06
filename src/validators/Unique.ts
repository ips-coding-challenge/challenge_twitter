import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator'

import db from '../db/connection'

@ValidatorConstraint({ async: true })
export class UniqueConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args: ValidationArguments) {
    const table = args.constraints[0]

    if (!table) throw new Error('Table argument is missing')

    const [item] = await db(table).where(args.property, value)
    if (!item) return true
    return false
  }
}

export function Unique(table: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [table],
      validator: UniqueConstraint,
    })
  }
}
