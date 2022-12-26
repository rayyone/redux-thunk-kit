import {schema, SchemaObject} from 'normalizr';

export type WhiteListFields<Entity> = (keyof Entity | '*')[];
export type StrategyFunction<T> = (pickedFields: any, value: any, parent: any, key: string) => T;

export interface EntityOptions<T = any> {
  idAttribute?: any;
  mergeStrategy?: any;
  processStrategy?: StrategyFunction<T>;
  fallbackStrategy?: any;
}

export class BaseEntityConfig<EntityType> {
  protected entityKey: string = '';

  protected associates: {name: string; unset: boolean}[] = [];

  protected whiteListFields: WhiteListFields<EntityType> = [];

  protected entityOptions?: EntityOptions;

  protected entity?: schema.Entity<EntityType>;

  getAllSelectedFields = () => [
    ...this.whiteListFields,
    ...this.associates?.map(a => this.associateToIdentifier(a.name)),
  ];

  associateToIdentifier = (associate: string) => `$${associate}Id`;

  getEntitySchema = () => {
    if (this.entity) {
      return this.entity;
    }
    this.entity = new schema.Entity<EntityType>(this.entityKey, undefined, {
      ...this.entityOptions,
      processStrategy: (entity, parent, key) => {
        this.getAccessors?.(entity, parent, key);

        this.associates?.forEach(({name, unset}) => {
          if (name in entity) {
            entity[this.associateToIdentifier(name)] = entity[name];
            if (unset) {
              delete entity[name];
            }
          }
        });
        const allSelectedFields = this.getAllSelectedFields();

        const pickedFields =
          this.whiteListFields?.[0] === '*'
            ? entity
            : Object.keys(entity).reduce((res, field) => {
                if (allSelectedFields.indexOf(field) !== -1 || field[0] === '$') {
                  res[field] = entity[field];
                }
                return res;
              }, {} as Record<string, any>);

        if (this.entityOptions?.processStrategy) {
          return this.entityOptions?.processStrategy(pickedFields, entity, parent, key);
        }

        return pickedFields as EntityType;
      },
    });

    return this.entity;
  };

  // Get associate definition
  getAssDef = (definition: SchemaObject<EntityType>) => {
    const res = {} as Record<string, any>;
    Object.keys(definition).forEach((associate: string) => {
      if (this.associates.every(i => i.name !== associate)) {
        throw new Error(`${this.constructor.name}: ${associate} association is not defined yet!
         Associate: ${associate}
         Declared: ${this.associates.map(a => a.name)}
         `);
      }
      res[this.associateToIdentifier(associate)] = definition[associate];
    });
    return res;
  };

  protected getAccessors = (value: EntityType, parent: any, key: string) => {};
}
