import { Response } from '@angular/http';
import { Mapper } from '../mapper';
import { Transform } from '../transform';
import { ModelCollection } from './collection';
import { ModelSimple } from './simple';

export const TypeModel = {
  Simple: 'simple',
  Collection: 'collection'
};

export class ModelMultiple implements Transform {

    private types: {[key: string]: any} = {};

    constructor(private mapper: {[key: string]: MapperOptions}) {
      this.addType(TypeModel.Simple, ModelSimple)
          .addType(TypeModel.Collection, ModelCollection);
    }

    addType(type: string, model: any): this {
      this.types[type] = model;
      return this;
    }

    transform(data: Response) {
      let results = {};

      for (let key in this.mapper) {
        if (!this.types[this.mapper[key].type]) {
          const typeException = this.mapper[key].type;
          throw new Error(`Type ${typeException} not exits`);
        }

        let model = this.mapper[key].model;
        let path = this.mapper[key].path;
        let type = this.types[this.mapper[key].type];
        let mapper = Mapper.create(type, model, path);

        results[key] = mapper.transform(data);
      }

      return results;
    }
}

export interface MapperOptions {
  type: string;
  model: any;
  path?: string;
}
