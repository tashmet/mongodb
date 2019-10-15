import {Collection, QueryOptions} from '@ziggurat/ziggurat';
import {EventEmitter} from 'eventemitter3';
import {ObjectID, Collection as MongoCollection} from 'mongodb';

export class MongoDBCollection extends EventEmitter implements Collection {
  public constructor(
    private collection: MongoCollection,
    public readonly name: string
  ) {
    super();
  }

  public async find(selector: object = {}, options: QueryOptions = {}): Promise<any[]> {
    let cursor = this.collection.find(selector);
    if (options.sort) {
      const sort: any = {};
      for (let s of options.sort) {
        sort[s.key] = s.order;
      }
      cursor = cursor.sort(sort);
    }
    if (options.offset) {
      cursor = cursor.skip(options.offset);
    }
    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }
    return cursor.toArray();
  }

  public async findOne(selector: object): Promise<any> {
    const doc = await this.collection.findOne(this.toObjectID(selector));
    if (!doc) {
      throw new Error('Failed to find document in collection');
    }
    return doc;
  }

  public async upsert(obj: any): Promise<any> {
    let res: any;
    try {
      res = await this.collection.insertOne(obj);
    } catch (err) {
      res = await this.collection.updateOne({_id: obj._id}, {$set: obj});
      return obj;
    }
    if (res.result.ok === 1) {
      return res.ops[0];
    }
    throw Error('Failed to insert');
  }

  public async remove(selector: object): Promise<any[]> {
    return [];
  }

  public async count(selector?: object): Promise<number> {
    return this.collection.count(selector);
  }

  private toObjectID(selector: any): any {
    if (!selector._id) {
      return selector;
    }
    const out = JSON.parse(JSON.stringify(selector));
    const id = out._id;

    if (typeof id === 'string' || typeof id === 'number') {
      out._id = new ObjectID(id);
    }
    return out;
  }
}
