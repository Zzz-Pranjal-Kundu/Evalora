import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  department: { type: String, default: null },
  job_title: { type: String, default: null },
  manager_id: { type: String, default: null },
  team: { type: String, default: null },
  preferences_json: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, {
  versionKey: false,
  _id: false
});

// Set _id same as user_id for Mongoose querying ease
ProfileSchema.pre("save", function(next) {
  this._id = this.user_id;
  next();
});

const Profile = mongoose.model("Profile", ProfileSchema, "profiles");

export class ProfileModel {
  static async findByUserId(userId) {
    if (!userId) return null;
    const doc = await Profile.findOne({ user_id: userId }).lean();
    return doc || null;
  }

  static async findAll() {
    const docs = await Profile.find({}).sort({ full_name: 1 }).lean();
    return docs;
  }

  static async listUserIdsByManagerId(managerId) {
    if (!managerId) return [];
    const docs = await Profile.find({ manager_id: managerId }, { user_id: 1 }).lean();
    return docs.map(d => d.user_id);
  }

  static async create({ userId, fullName, department, jobTitle, managerId, team, preferences }) {
    const now = new Date().toISOString();
    const prefs = preferences ? JSON.stringify(preferences) : null;
    
    await Profile.create({
      user_id: userId,
      full_name: fullName,
      department: department || null,
      job_title: jobTitle || null,
      manager_id: managerId || null,
      team: team || null,
      preferences_json: prefs,
      created_at: now,
      updated_at: now
    });
    
    return ProfileModel.findByUserId(userId);
  }

  static async update(userId, fields) {
    const existing = await ProfileModel.findByUserId(userId);
    if (!existing) return null;
    
    const now = new Date().toISOString();
    const fullName = fields.fullName ?? existing.full_name;
    const department = fields.department ?? existing.department;
    const jobTitle = fields.jobTitle ?? existing.job_title;
    const managerId = fields.managerId !== undefined ? fields.managerId : existing.manager_id;
    const team = fields.team !== undefined ? fields.team : (existing.team ?? null);
    
    let preferencesJson = existing.preferences_json;
    if (fields.preferences !== undefined) {
      preferencesJson = JSON.stringify(fields.preferences);
    }
    
    await Profile.updateOne({ user_id: userId }, {
      $set: {
        full_name: fullName,
        department,
        job_title: jobTitle,
        manager_id: managerId,
        team,
        preferences_json: preferencesJson,
        updated_at: now
      }
    });
    
    return ProfileModel.findByUserId(userId);
  }
}
