import { Response } from '@angular/http';
import jp from '@ramonornela/jsonpath';
import { Transform } from '../transform';

export class ModelCollection implements Transform {

    constructor(private model: any, private path?: string) {
      if (typeof this.model !== 'object' && this.model === null) {
        throw new Error('Data type model invalid');
      }
    }

    transform(data: Response) {
      let result = data.json();

      if (this.path) {
        result = jp.query(result, this.path);
      }

      if (!Array.isArray(result)) {
        throw new Error(`Returns should be Array`);
      }

      let models = [];
      for (let i = 0, length = result.length; i < length; i++) {
          models.push(new this.model(result[i]));
      }

      return models;
    }
}
