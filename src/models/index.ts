// src/models/index.ts
// Compatibility layer for database models
// Exports the appropriate models based on DATABASE_TYPE and shims Mongoose-like APIs

const databaseType = process.env.DATABASE_TYPE || 'memory';

let Streamer: any;
let Subscription: any;
let StreamEvent: any;
let Sequelize: any;
let Op: any;

if (databaseType === 'sqlite') {
  const sqliteModels = require('../utils/database-sqlite');
  Sequelize = require('sequelize');
  Op = Sequelize.Op;
  Streamer = sqliteModels.Streamer;
  Subscription = sqliteModels.Subscription;
  StreamEvent = sqliteModels.StreamEvent;
} else if (databaseType === 'memory') {
  const memoryModels = require('../utils/database-memory');
  Streamer = memoryModels.Streamer;
  Subscription = memoryModels.Subscription;
  StreamEvent = memoryModels.StreamEvent;
} else {
  // Mongo/Mongoose models – keep as-is; make sure your Streamer.ts includes the virtuals
  Streamer = require('./Streamer').Streamer;
  Subscription = require('./Subscription').Subscription;
  StreamEvent = require('./StreamEvent').StreamEvent;
}

// ─────────────────────────────────────────────────────────────
// Helpers to make Sequelize look like Mongoose (chainable query)
// ─────────────────────────────────────────────────────────────
function normalizeWhere(where: any) {
  if (!where || typeof where !== 'object') return where;

  const out: any = {};
  for (const key of Object.keys(where)) {
    const val = where[key];
    if (val && typeof val === 'object' && ('$in' in val)) {
      out[key] = { [Op.in]: val.$in };
    } else {
      out[key] = val;
    }
  }
  return out;
}

function makeQuery(model: any, where: any = {}, baseOptions: any = {}) {
  // Build a chainable, awaitable object similar to a Mongoose Query.
  const state: any = {
    where: normalizeWhere(where),
    order: undefined,
    limit: undefined,
    offset: undefined,
    include: [],
    raw: false,
    ...baseOptions,
  };

  const q: any = {
    sort(sortObj: Record<string, 1 | -1>) {
      // { field: -1 } -> [['field','DESC']]
      const arr = Object.entries(sortObj || {}).map(([k, v]) => [k, v === -1 ? 'DESC' : 'ASC']);
      state.order = arr.length ? arr : undefined;
      return q;
    },
    limit(n: number) {
      state.limit = Number(n);
      return q;
    },
    skip(n: number) {
      state.offset = Number(n);
      return q;
    },
    populate(field: string) {
      // Support only 'streamerId' as used by routes
      state.include = state.include || [];
      if (field === 'streamerId' && model === Subscription && typeof Streamer?.findAll === 'function') {
        state.include.push({ model: Streamer, as: 'streamerId' });
      }
      return q;
    },
    // Mongoose-like thenable: awaiting the query executes it
    then(onFulfilled: any, onRejected: any) {
      const opts: any = {
        where: state.where,
        order: state.order,
        limit: state.limit,
        offset: state.offset,
        include: state.include?.length ? state.include : undefined,
      };
      return model.findAll(opts).then(onFulfilled, onRejected);
    },
    catch(onRejected: any) {
      return q.then(undefined, onRejected);
    },
    // convenience to mirror mongoose
    exec() {
      return q.then((r: any) => r);
    },
  };
  return q;
}

// Add instance helpers safely (avoid recursion)
function addInstanceHelpers(model: any) {
  if (!model || !model.prototype) return;

  if (!model.prototype.toObject) {
    model.prototype.toObject = function () {
      return this.get ? this.get({ plain: true }) : { ...this };
    };
  }
  if (!model.prototype.deleteOne) {
    model.prototype.deleteOne = function () {
      return this.destroy ? this.destroy() : undefined;
    };
  }
  // DO NOT override .save() – Sequelize instances already have it.
}

// ─────────────────────────────────────────────────────────────
// Apply shims for SQLite only
// ─────────────────────────────────────────────────────────────
if (databaseType === 'sqlite') {
  // Streamer
  if (Streamer && !Streamer.find) {
    Streamer.find = (query: any = {}) => makeQuery(Streamer, query);
    Streamer.findOne = (query: any = {}) =>
      Streamer.findAll({ where: normalizeWhere(query), limit: 1 }).then((rows: any[]) => rows[0] || null);
    Streamer.findById = (id: string) => Streamer.findByPk(id);
    Streamer.findByIdAndUpdate = async (id: string, update: any, options: any = {}) => {
      await Streamer.update(update, { where: { id } });
      return options.new ? Streamer.findByPk(id) : null;
    };
    Streamer.findByIdAndDelete = (id: string) => Streamer.destroy({ where: { id } });
    Streamer.findOneAndUpdate = async (query: any, update: any, options: any = {}) => {
      const where = normalizeWhere(query);
      const [count] = await Streamer.update(update, { where });
      if (options.upsert && count === 0) return Streamer.create({ ...query, ...update });
      return options.new ? Streamer.findOne({ where }) : null;
    };
    Streamer.countDocuments = (query: any = {}) => Streamer.count({ where: normalizeWhere(query) });
    // naive aggregate for platform stats
    Streamer.aggregate = async (pipeline: any[]) => {
      const grouping = pipeline?.[0]?.$group;
      if (grouping && grouping._id === '$platform') {
        const rows = await Streamer.findAll({
          attributes: ['platform', [Streamer.sequelize.fn('COUNT', '*'), 'count']],
          group: ['platform'],
          order: [[Streamer.sequelize.literal('count'), 'DESC']],
          raw: true,
        });
        return rows.map((r: any) => ({ _id: r.platform, count: Number(r.count) }));
      }
      return [];
    };

    addInstanceHelpers(Streamer);
  }

  // Subscription
  if (Subscription && !Subscription.find) {
    Subscription.find = (query: any = {}) => makeQuery(Subscription, query);
    Subscription.findOne = (query: any = {}) =>
      Subscription.findAll({ where: normalizeWhere(query), limit: 1 }).then((rows: any[]) => rows[0] || null);
    Subscription.findById = (id: string) => Subscription.findByPk(id);
    Subscription.findByIdAndUpdate = async (id: string, update: any, options: any = {}) => {
      await Subscription.update(update, { where: { id } });
      return options.new ? Subscription.findByPk(id) : null;
    };
    Subscription.findByIdAndDelete = (id: string) => Subscription.destroy({ where: { id } });
    Subscription.deleteMany = (query: any = {}) => Subscription.destroy({ where: normalizeWhere(query) });
    Subscription.countDocuments = (query: any = {}) => Subscription.count({ where: normalizeWhere(query) });

    addInstanceHelpers(Subscription);
  }

  // StreamEvent
  if (StreamEvent && !StreamEvent.find) {
    StreamEvent.find = (query: any = {}) => makeQuery(StreamEvent, query);
    StreamEvent.findOne = (query: any = {}) =>
      StreamEvent.findAll({ where: normalizeWhere(query), limit: 1 }).then((rows: any[]) => rows[0] || null);
    StreamEvent.findById = (id: string) => StreamEvent.findByPk(id);
    StreamEvent.findByIdAndUpdate = async (id: string, update: any, options: any = {}) => {
      await StreamEvent.update(update, { where: { id } });
      return options.new ? StreamEvent.findByPk(id) : null;
    };
    StreamEvent.findByIdAndDelete = (id: string) => StreamEvent.destroy({ where: { id } });
    StreamEvent.countDocuments = (query: any = {}) => {
      const q = { ...query };
      if (q.timestamp) {
        const t: any = {};
        if (q.timestamp.$gte) t[Op.gte] = q.timestamp.$gte;
        if (q.timestamp.$lte) t[Op.lte] = q.timestamp.$lte;
        q.timestamp = t;
      }
      return StreamEvent.count({ where: normalizeWhere(q) });
    };

    addInstanceHelpers(StreamEvent);
  }
}

export { Streamer, StreamEvent, Subscription };

