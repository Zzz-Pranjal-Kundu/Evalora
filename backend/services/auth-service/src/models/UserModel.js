import mongoose from "mongoose";
import { randomUUID } from "crypto";

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: randomUUID },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, {
  versionKey: false,
  _id: false // Disable auto ObjectId since we use custom string UUIDs
});

const User = mongoose.model("User", UserSchema, "users");

export class UserModel {
  static async findByEmail(email) {
    if (!email) return null;
    const doc = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, "i") } }).lean();
    if (!doc) return null;
    return { ...doc, id: doc._id };
  }

  static async findById(id) {
    if (!id) return null;
    const doc = await User.findById(id).lean();
    if (!doc) return null;
    return { ...doc, id: doc._id };
  }

  static async create({ email, passwordHash, role }) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const doc = await User.create({
      _id: id,
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      role: role || "EMPLOYEE",
      created_at: now,
      updated_at: now
    });
    return UserModel.findById(id);
  }

  static async createWithId({ id, email, passwordHash, role }) {
    const now = new Date().toISOString();
    const doc = await User.create({
      _id: id,
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      role: role || "EMPLOYEE",
      created_at: now,
      updated_at: now
    });
    return UserModel.findById(id);
  }

  static async updateRole(id, role) {
    const now = new Date().toISOString();
    const doc = await User.findByIdAndUpdate(id, {
      role,
      updated_at: now
    }, { new: true }).lean();
    return doc ? UserModel.findById(id) : null;
  }

  static async updatePasswordHash(id, passwordHash) {
    const now = new Date().toISOString();
    const doc = await User.findByIdAndUpdate(id, {
      password_hash: passwordHash,
      updated_at: now
    }, { new: true }).lean();
    return doc ? UserModel.findById(id) : null;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
