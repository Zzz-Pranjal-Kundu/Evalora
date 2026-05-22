import { db } from "../db/database.js";

/**
 * Data access layer for users (MVC Model).
 */
export class UserModel {
  static async findByEmail(email) {
    if (!email) return null;
    const user = await db.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    if (!user) return null;
    return {
      ...user,
      password_hash: user.passwordHash,
      role: user.userRoles[0]?.role?.code || 'EMPLOYEE',
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    };
  }

  static async findById(id) {
    if (!id) return null;
    const user = await db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    if (!user) return null;
    return {
      ...user,
      password_hash: user.passwordHash,
      role: user.userRoles[0]?.role?.code || 'EMPLOYEE',
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    };
  }

  static async create({ email, passwordHash, role }) {
    let dbRole = await db.role.findUnique({ where: { code: role } });
    if (!dbRole) {
      dbRole = await db.role.findFirst({ where: { code: 'EMPLOYEE' } });
    }
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        userRoles: {
          create: {
            roleId: dbRole.id
          }
        }
      }
    });
    return UserModel.findById(user.id);
  }

  /** Used by demo seed so downstream SQLite services can reference fixed user IDs. */
  static async createWithId({ id, email, passwordHash, role }) {
    let dbRole = await db.role.findUnique({ where: { code: role } });
    if (!dbRole) {
      dbRole = await db.role.findFirst({ where: { code: 'EMPLOYEE' } });
    }
    const user = await db.user.create({
      data: {
        id,
        email,
        passwordHash,
        userRoles: {
          create: {
            roleId: dbRole.id
          }
        }
      }
    });
    return UserModel.findById(user.id);
  }

  static async updateRole(id, role) {
    const dbRole = await db.role.findUnique({ where: { code: role } });
    if (!dbRole) return null;
    await db.userRole.deleteMany({ where: { userId: id } });
    await db.userRole.create({
      data: {
        userId: id,
        roleId: dbRole.id
      }
    });
    return UserModel.findById(id);
  }

  static async updatePasswordHash(id, passwordHash) {
    await db.user.update({
      where: { id },
      data: { passwordHash, updatedAt: new Date() }
    });
    return UserModel.findById(id);
  }
}
