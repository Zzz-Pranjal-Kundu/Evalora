import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Centralized schema collection mappings
const collectionMap = {
  role: 'roles',
  permission: 'permissions',
  rolePermission: 'role_permissions',
  user: 'users',
  userRole: 'user_roles',
  refreshToken: 'refresh_tokens',
  department: 'departments',
  businessUnit: 'business_units',
  location: 'locations',
  employee: 'employees',
  reportingRelationship: 'reporting_relationships',
  goal: 'goals',
  goalUpdate: 'goal_updates',
  goalComment: 'goal_comments',
  goalApproval: 'goal_approvals',
  feedbackEntry: 'feedback_entries',
  feedbackRequest: 'feedback_requests',
  feedbackTag: 'feedback_tags',
  checkin: 'checkins',
  checkinNote: 'checkin_notes',
  checkinAction: 'checkin_actions',
  reviewCycle: 'review_cycles',
  reviewTemplate: 'review_templates',
  reviewSection: 'review_sections',
  reviewAssignment: 'review_assignments',
  review: 'reviews',
  reviewResponse: 'review_responses',
  reviewerNomination: 'reviewer_nominations',
  competency: 'competencies',
  competencyMapping: 'competency_mappings',
  employeeCompetencyAssessment: 'employee_competency_assessments',
  ratingScale: 'rating_scales',
  ratingRecord: 'rating_records',
  calibrationSession: 'calibration_sessions',
  calibrationAdjustment: 'calibration_adjustments',
  developmentPlan: 'development_plans',
  developmentAction: 'development_actions',
  recognition: 'recognitions',
  attachment: 'attachments',
  notificationEvent: 'notification_events',
  notification: 'notifications',
  auditLog: 'audit_logs',
  event: 'events',
  metricSnapshot: 'metric_snapshots'
};

// Mapped relationships matching the physical snake_case fields in MongoDB
const relationsMap = {
  user: {
    userRoles: { collection: 'user_roles', foreignKey: 'user_id', isArray: true },
    refreshTokens: { collection: 'refresh_tokens', foreignKey: 'user_id', isArray: true },
    employeeProfile: { collection: 'employees', foreignKey: 'user_id', isArray: false }
  },
  userRole: {
    user: { collection: 'users', foreignKey: 'id', localField: 'user_id', isArray: false },
    role: { collection: 'roles', foreignKey: 'id', localField: 'role_id', isArray: false }
  },
  role: {
    rolePermissions: { collection: 'role_permissions', foreignKey: 'role_id', isArray: true },
    userRoles: { collection: 'user_roles', foreignKey: 'role_id', isArray: true }
  },
  employee: {
    user: { collection: 'users', foreignKey: 'id', localField: 'user_id', isArray: false },
    department: { collection: 'departments', foreignKey: 'id', localField: 'department_id', isArray: false },
    businessUnit: { collection: 'business_units', foreignKey: 'id', localField: 'business_unit_id', isArray: false },
    location: { collection: 'locations', foreignKey: 'id', localField: 'location_id', isArray: false },
    managers: { collection: 'reporting_relationships', foreignKey: 'employee_id', isArray: true },
    directReports: { collection: 'reporting_relationships', foreignKey: 'manager_id', isArray: true }
  },
  reportingRelationship: {
    employee: { collection: 'employees', foreignKey: 'id', localField: 'employee_id', isArray: false },
    manager: { collection: 'employees', foreignKey: 'id', localField: 'manager_id', isArray: false }
  },
  reviewCycle: {
    assignments: { collection: 'review_assignments', foreignKey: 'cycle_id', isArray: true },
    reviews: { collection: 'reviews', foreignKey: 'cycle_id', isArray: true }
  },
  review: {
    cycle: { collection: 'review_cycles', foreignKey: 'id', localField: 'cycle_id', isArray: false },
    employee: { collection: 'employees', foreignKey: 'id', localField: 'employee_id', isArray: false },
    reviewer: { collection: 'users', foreignKey: 'id', localField: 'reviewer_id', isArray: false },
    responses: { collection: 'review_responses', foreignKey: 'review_id', isArray: true }
  },
  feedbackEntry: {
    feedbackRequest: { collection: 'feedback_requests', foreignKey: 'id', localField: 'request_id', isArray: false },
    fromUser: { collection: 'users', foreignKey: 'id', localField: 'from_user_id', isArray: false },
    toUser: { collection: 'users', foreignKey: 'id', localField: 'to_user_id', isArray: false }
  },
  feedbackRequest: {
    fromUser: { collection: 'users', foreignKey: 'id', localField: 'from_user_id', isArray: false },
    toUser: { collection: 'users', foreignKey: 'id', localField: 'to_user_id', isArray: false },
    entries: { collection: 'feedback_entries', foreignKey: 'request_id', isArray: true }
  },
  checkin: {
    manager: { collection: 'users', foreignKey: 'id', localField: 'manager_id', isArray: false },
    employee: { collection: 'users', foreignKey: 'id', localField: 'employee_id', isArray: false }
  },
  recognition: {
    fromUser: { collection: 'users', foreignKey: 'id', localField: 'from_user_id', isArray: false },
    toUser: { collection: 'users', foreignKey: 'id', localField: 'to_user_id', isArray: false }
  }
};

const collectionToModel = {
  roles: 'role',
  users: 'user',
  user_roles: 'userRole',
  employees: 'employee',
  departments: 'department',
  reporting_relationships: 'reportingRelationship',
  review_cycles: 'reviewCycle',
  reviews: 'review',
  feedback_entries: 'feedbackEntry',
  feedback_requests: 'feedbackRequest',
  refresh_tokens: 'refreshToken',
  recognitions: 'recognition'
};

// Parse package-level .env fallback securely
function getEnvDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (key.trim() === 'DATABASE_URL') {
        let value = valueParts.join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        return value;
      }
    }
  }
  return 'mongodb://localhost:27017/epfms?authSource=admin';
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Convert camelCase keys to snake_case for MongoDB physical columns
function toDbKey(key) {
  if (key === 'id') return '_id';
  return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Convert snake_case keys to camelCase for microservices
function fromDbKey(key) {
  if (key === '_id') return 'id';
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function toDbDoc(obj) {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(toDbDoc);
  
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = toDbKey(key);
    newObj[newKey] = toDbDoc(value);
  }
  return newObj;
}

export function fromDbDoc(obj) {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(fromDbDoc);
  
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = fromDbKey(key);
    newObj[newKey] = fromDbDoc(value);
  }
  if (obj._id !== undefined) {
    newObj.id = obj._id;
  }
  return newObj;
}

// Convert Prisma-style query object to physical native MongoDB query
function toMongoQuery(where) {
  if (!where) return {};
  const dbWhere = toDbDoc(where);
  
  const query = {};
  for (const [key, value] of Object.entries(dbWhere)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('equals' in value) {
        if (value.mode === 'insensitive' && typeof value.equals === 'string') {
          query[key] = { $regex: new RegExp('^' + escapeRegExp(value.equals) + '$', 'i') };
        } else {
          query[key] = value.equals;
        }
      } else if ('in' in value) {
        query[key] = { $in: value.in };
      } else if ('not' in value) {
        query[key] = { $ne: value.not };
      } else {
        query[key] = toMongoQuery(value);
      }
    } else {
      query[key] = value;
    }
  }
  return query;
}

// Fetch related collections recursively to fulfill Prisma 'include' requests
async function applyIncludes(docs, modelName, include, db) {
  if (!docs || !include) return docs;
  const isArray = Array.isArray(docs);
  const docList = isArray ? docs : [docs];
  
  const modelRelations = relationsMap[modelName];
  if (!modelRelations) return docs;

  for (const [key, incValue] of Object.entries(include)) {
    if (!incValue) continue;
    const rel = modelRelations[key];
    if (!rel) continue;

    const relCollection = db.collection(rel.collection);
    
    for (const doc of docList) {
      let query = {};
      if (rel.localField) {
        const val = doc[rel.localField];
        if (val === undefined || val === null) {
          doc[key] = rel.isArray ? [] : null;
          continue;
        }
        query['_id'] = val;
      } else {
        query[rel.foreignKey] = doc._id;
      }

      let relDocs;
      if (rel.isArray) {
        relDocs = await relCollection.find(query).toArray();
        relDocs = relDocs.map(d => fromDbDoc(d));
      } else {
        const d = await relCollection.findOne(query);
        relDocs = d ? fromDbDoc(d) : null;
      }

      if (incValue && typeof incValue === 'object' && incValue.include && relDocs) {
        const childModel = collectionToModel[rel.collection] || rel.collection;
        await applyIncludes(relDocs, childModel, incValue.include, db);
      }

      doc[key] = relDocs;
    }
  }
  return docs;
}

class NativeCollectionWrapper {
  constructor(modelName, collectionName, getDb) {
    this.modelName = modelName;
    this.collectionName = collectionName;
    this.getDb = getDb;
  }

  get col() {
    return this.getDb().collection(this.collectionName);
  }

  async findFirst(options = {}) {
    const query = toMongoQuery(options.where);
    let doc = await this.col.findOne(query);
    if (!doc) return null;
    doc = fromDbDoc(doc);
    if (options.include) {
      await applyIncludes(doc, this.modelName, options.include, this.getDb());
    }
    return doc;
  }

  async findUnique(options = {}) {
    return this.findFirst(options);
  }

  async findMany(options = {}) {
    const query = toMongoQuery(options.where);
    let cursor = this.col.find(query);

    if (options.orderBy) {
      const sort = {};
      const orderList = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
      for (const order of orderList) {
        for (const [key, dir] of Object.entries(order)) {
          sort[toDbKey(key)] = dir === 'desc' ? -1 : 1;
        }
      }
      cursor = cursor.sort(sort);
    }

    if (options.skip) {
      cursor = cursor.skip(options.skip);
    }
    if (options.take) {
      cursor = cursor.limit(options.take);
    }

    let docs = await cursor.toArray();
    docs = docs.map(d => fromDbDoc(d));

    if (options.include) {
      await applyIncludes(docs, this.modelName, options.include, this.getDb());
    }
    return docs;
  }

  async create(options = {}) {
    const originalData = { ...options.data };

    // Separate relational nested writes
    const nestedWrites = [];
    const relations = relationsMap[this.modelName] || {};
    for (const [key, value] of Object.entries(originalData)) {
      if (value && typeof value === 'object' && value.create) {
        nestedWrites.push({ key, relation: relations[key], createData: value.create });
        delete originalData[key];
      }
    }

    // Convert keys to snake_case for DB write
    const dbData = toDbDoc(originalData);

    const id = dbData._id || crypto.randomUUID();
    dbData._id = id;

    // Default dates
    if (!dbData.created_at) dbData.created_at = new Date();
    if (!dbData.updated_at) dbData.updated_at = new Date();

    await this.col.insertOne(dbData);

    // Run nested writes sequentially
    for (const nw of nestedWrites) {
      if (!nw.relation) continue;
      const childCol = this.getDb().collection(nw.relation.collection);
      const items = Array.isArray(nw.createData) ? nw.createData : [nw.createData];
      for (const item of items) {
        const childDbData = toDbDoc(item);
        const childId = childDbData._id || crypto.randomUUID();
        childDbData._id = childId;
        
        // Map relationship foreign key natively to its database snake_case representation
        const dbForeignKey = toDbKey(nw.relation.foreignKey);
        childDbData[dbForeignKey] = id;
        
        if (!childDbData.created_at) childDbData.created_at = new Date();
        await childCol.insertOne(childDbData);
      }
    }

    let createdDoc = await this.col.findOne({ _id: id });
    createdDoc = fromDbDoc(createdDoc);

    if (options.include) {
      await applyIncludes(createdDoc, this.modelName, options.include, this.getDb());
    }
    return createdDoc;
  }

  async update(options = {}) {
    const query = toMongoQuery(options.where);
    const dbData = toDbDoc(options.data);
    delete dbData._id;
    dbData.updated_at = new Date();

    await this.col.updateOne(query, { $set: dbData });

    let updatedDoc = await this.col.findOne(query);
    updatedDoc = fromDbDoc(updatedDoc);

    if (options.include) {
      await applyIncludes(updatedDoc, this.modelName, options.include, this.getDb());
    }
    return updatedDoc;
  }

  async deleteMany(options = {}) {
    const query = toMongoQuery(options.where);
    const result = await this.col.deleteMany(query);
    return { count: result.deletedCount };
  }

  async count(options = {}) {
    const query = toMongoQuery(options.where);
    return await this.col.countDocuments(query);
  }
}

class CustomPrismaClient {
  constructor() {
    this._client = null;
    this._db = null;

    // Dynamically build model interfaces matching the collection map
    for (const [modelName, collectionName] of Object.entries(collectionMap)) {
      this[modelName] = new NativeCollectionWrapper(
        modelName,
        collectionName,
        () => this.db
      );
    }
  }

  get db() {
    if (!this._db) {
      const url = getEnvDatabaseUrl();
      this._client = new MongoClient(url);
      this._client.connect().catch(e => {
        console.error('❌ Direct MongoDB Atlas Connection Failed:', e);
      });
      this._db = this._client.db();
    }
    return this._db;
  }

  async $connect() {
    if (!this._client) {
      const url = getEnvDatabaseUrl();
      this._client = new MongoClient(url);
      await this._client.connect();
      this._db = this._client.db();
    } else {
      await this._client.connect();
    }
  }

  async $disconnect() {
    if (this._client) {
      await this._client.close();
      this._client = null;
      this._db = null;
    }
  }

  async $runCommandRaw(command) {
    return await this.db.command(command);
  }

  async $transaction(operations) {
    const results = [];
    for (const op of operations) {
      results.push(await op);
    }
    return results;
  }
}

// Export custom client matching Prisma's instantiation format
export const prisma = new CustomPrismaClient();
export { CustomPrismaClient as PrismaClient };
