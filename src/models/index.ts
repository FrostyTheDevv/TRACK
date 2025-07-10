// Compatibility layer for database models
// This file exports the appropriate models based on the database type

const databaseType = process.env.DATABASE_TYPE || 'memory';

let Streamer: any;
let Subscription: any;
let StreamEvent: any;
let Op: any;

if (databaseType === 'sqlite') {
    // Use SQLite models
    const sqliteModels = require('../utils/database-sqlite');
    Op = require('sequelize').Op;
    Streamer = sqliteModels.Streamer;
    Subscription = sqliteModels.Subscription;
    StreamEvent = sqliteModels.StreamEvent;
} else if (databaseType === 'memory') {
    // Use in-memory models
    const memoryModels = require('../utils/database-memory');
    Streamer = memoryModels.Streamer;
    Subscription = memoryModels.Subscription;
    StreamEvent = memoryModels.StreamEvent;
} else {
    // Use MongoDB models
    Streamer = require('./Streamer').Streamer;
    Subscription = require('./Subscription').Subscription;
    StreamEvent = require('./StreamEvent').StreamEvent;
}

// Add compatibility methods for SQLite/Sequelize models
if (databaseType === 'sqlite') {
    // Add Mongoose-like methods to Sequelize models for compatibility
    if (Streamer && !Streamer.find) {
        Streamer.find = (query: any = {}) => {
            // Handle MongoDB-style $in operator
            const where = { ...query };
            Object.keys(where).forEach(key => {
                if (typeof where[key] === 'object' && where[key].$in) {
                    where[key] = where[key].$in;
                }
            });
            return Streamer.findAll({ where });
        };
        Streamer.findById = (id: string) => Streamer.findByPk(id);
        Streamer.findByIdAndUpdate = (id: string, update: any, options: any = {}) => {
            return Streamer.update(update, { where: { id }, returning: true }).then((result: any) => {
                if (options.new) {
                    return Streamer.findByPk(id);
                }
                return result[1] ? result[1][0] : null;
            });
        };
        Streamer.findByIdAndDelete = (id: string) => Streamer.destroy({ where: { id } });
        Streamer.findOne = (query: any) => Streamer.findOne({ where: query });
        Streamer.findOneAndUpdate = (query: any, update: any, options: any = {}) => {
            return Streamer.update(update, { where: query, returning: true }).then((result: any) => {
                if (options.upsert && result[0] === 0) {
                    return Streamer.create({ ...query, ...update });
                }
                if (options.new) {
                    return Streamer.findOne({ where: query });
                }
                return result[1] ? result[1][0] : null;
            });
        };
        
        // Add instance methods to prototype
        if (!Streamer.prototype.toObject) {
            Streamer.prototype.toObject = function() {
                return this.get({ plain: true });
            };
        }
        if (!Streamer.prototype.deleteOne) {
            Streamer.prototype.deleteOne = function() {
                return this.destroy();
            };
        }
        if (!Streamer.prototype.save) {
            Streamer.prototype.save = function() {
                return this.save();
            };
        }
    }

    if (Subscription && !Subscription.find) {
        Subscription.find = (query: any = {}) => {
            const findResult = Subscription.findAll({ where: query });
            // Add populate method to the result
            findResult.populate = (field: string) => {
                if (field === 'streamerId') {
                    return Subscription.findAll({ 
                        where: query,
                        include: [{ model: Streamer, as: 'streamerId' }]
                    });
                }
                return findResult;
            };
            return findResult;
        };
        Subscription.findById = (id: string) => {
            const findResult = Subscription.findByPk(id);
            // Add populate method to the result
            findResult.populate = (field: string) => {
                if (field === 'streamerId') {
                    return Subscription.findByPk(id, {
                        include: [{ model: Streamer, as: 'streamerId' }]
                    });
                }
                return findResult;
            };
            return findResult;
        };
        Subscription.findByIdAndUpdate = (id: string, update: any, options: any = {}) => {
            return Subscription.update(update, { where: { id }, returning: true }).then((result: any) => {
                if (options.new) {
                    return Subscription.findByPk(id);
                }
                return result[1] ? result[1][0] : null;
            });
        };
        Subscription.findByIdAndDelete = (id: string) => Subscription.destroy({ where: { id } });
        Subscription.findOne = (query: any) => Subscription.findOne({ where: query });
        Subscription.deleteMany = (query: any) => Subscription.destroy({ where: query });
        Subscription.countDocuments = (query: any) => Subscription.count({ where: query });
        
        // Add instance methods to prototype
        if (!Subscription.prototype.toObject) {
            Subscription.prototype.toObject = function() {
                return this.get({ plain: true });
            };
        }
        if (!Subscription.prototype.deleteOne) {
            Subscription.prototype.deleteOne = function() {
                return this.destroy();
            };
        }
        if (!Subscription.prototype.save) {
            Subscription.prototype.save = function() {
                return this.save();
            };
        }
    }

    if (StreamEvent && !StreamEvent.find) {
        StreamEvent.find = (query: any = {}) => StreamEvent.findAll({ where: query });
        StreamEvent.findById = (id: string) => StreamEvent.findByPk(id);
        StreamEvent.findByIdAndUpdate = (id: string, update: any, options: any = {}) => {
            return StreamEvent.update(update, { where: { id }, returning: true }).then((result: any) => {
                if (options.new) {
                    return StreamEvent.findByPk(id);
                }
                return result[1] ? result[1][0] : null;
            });
        };
        StreamEvent.findByIdAndDelete = (id: string) => StreamEvent.destroy({ where: { id } });
        StreamEvent.findOne = (query: any) => StreamEvent.findOne({ where: query });
        
        // Add instance methods to prototype
        if (!StreamEvent.prototype.toObject) {
            StreamEvent.prototype.toObject = function() {
                return this.get({ plain: true });
            };
        }
        if (!StreamEvent.prototype.deleteOne) {
            StreamEvent.prototype.deleteOne = function() {
                return this.destroy();
            };
        }
        if (!StreamEvent.prototype.save) {
            StreamEvent.prototype.save = function() {
                return this.save();
            };
        }
    }

    // Add countDocuments method
    if (Streamer && !Streamer.countDocuments) {
        Streamer.countDocuments = (query: any = {}) => {
            return Streamer.count({ where: query });
        };
        
        // Add basic aggregate method for platform stats
        Streamer.aggregate = (pipeline: any[]) => {
            // For now, handle the specific case of platform grouping
            if (pipeline.length === 2 && 
                pipeline[0].$group && 
                pipeline[0].$group._id === '$platform' &&
                pipeline[1].$sort) {
                
                return Streamer.findAll({
                    attributes: [
                        'platform',
                        [Streamer.sequelize.fn('COUNT', '*'), 'count']
                    ],
                    group: ['platform'],
                    order: [[Streamer.sequelize.literal('count'), 'DESC']],
                    raw: true
                }).then((results: any) => {
                    return results.map((r: any) => ({ _id: r.platform, count: parseInt(r.count) }));
                });
            }
            // For other aggregations, return empty array for now
            return Promise.resolve([]);
        };
    }

    if (Subscription && !Subscription.countDocuments) {
        Subscription.countDocuments = (query: any = {}) => {
            return Subscription.count({ where: query });
        };
    }

    if (StreamEvent && !StreamEvent.countDocuments) {
        StreamEvent.countDocuments = (query: any = {}) => {
            // Handle MongoDB-style operators
            const sequelizeQuery = { ...query };
            if (query.timestamp && query.timestamp.$gte) {
                if (Op) {
                    sequelizeQuery.timestamp = {
                        [Op.gte]: query.timestamp.$gte
                    };
                } else {
                    // For memory database, do basic filtering
                    sequelizeQuery.timestamp = query.timestamp.$gte;
                }
            }
            return StreamEvent.count({ where: sequelizeQuery });
        };
    }
}

export { Op, StreamEvent, Streamer, Subscription };

