import { db } from "../db/database.js";

export class ProfileModel {
  static async findByUserId(userId) {
    if (!userId) return null;
    const employee = await db.employee.findUnique({
      where: { userId },
      include: {
        department: true,
        managers: {
          include: {
            manager: true
          }
        }
      }
    });
    if (!employee) return null;
    return {
      user_id: employee.userId,
      full_name: employee.fullName,
      department: employee.department?.name || null,
      job_title: employee.jobTitle,
      manager_id: employee.managers[0]?.manager?.userId || null,
      team: null,
      preferences_json: null,
      created_at: employee.createdAt.toISOString(),
      updated_at: employee.updatedAt.toISOString()
    };
  }

  static async findAll() {
    const employees = await db.employee.findMany({
      include: {
        department: true,
        managers: {
          include: {
            manager: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    });
    return employees.map((emp) => ({
      user_id: emp.userId,
      full_name: emp.fullName,
      department: emp.department?.name || null,
      job_title: emp.jobTitle,
      manager_id: emp.managers[0]?.manager?.userId || null,
      team: null,
      preferences_json: null,
      created_at: emp.createdAt.toISOString(),
      updated_at: emp.updatedAt.toISOString()
    }));
  }

  /** Direct reports only (for manager visibility in downstream services). */
  static async listUserIdsByManagerId(managerId) {
    if (!managerId) return [];
    const mgrEmp = await db.employee.findUnique({
      where: { userId: managerId }
    });
    if (!mgrEmp) return [];

    const relationships = await db.reportingRelationship.findMany({
      where: { managerId: mgrEmp.id },
      include: {
        employee: true
      }
    });
    return relationships.map((r) => r.employee.userId).filter(Boolean);
  }

  static async create({ userId, fullName, department, jobTitle, managerId, team, preferences }) {
    let deptId = undefined;
    if (department) {
      let dbDept = await db.department.findFirst({
        where: { name: department }
      });
      if (!dbDept) {
        dbDept = await db.department.create({
          data: { name: department }
        });
      }
      deptId = dbDept.id;
    }

    const employee = await db.employee.create({
      data: {
        userId,
        fullName: fullName || "New User",
        jobTitle,
        departmentId: deptId
      }
    });

    if (managerId) {
      const mgrEmp = await db.employee.findUnique({
        where: { userId: managerId }
      });
      if (mgrEmp) {
        await db.reportingRelationship.create({
          data: {
            employeeId: employee.id,
            managerId: mgrEmp.id,
            relationshipType: 'DIRECT'
          }
        });
      }
    }

    return ProfileModel.findByUserId(userId);
  }

  static async update(userId, fields) {
    const existing = await db.employee.findUnique({
      where: { userId },
      include: {
        managers: true
      }
    });
    if (!existing) return null;

    let deptId = undefined;
    if (fields.department !== undefined) {
      if (fields.department) {
        let dbDept = await db.department.findFirst({
          where: { name: fields.department }
        });
        if (!dbDept) {
          dbDept = await db.department.create({
            data: { name: fields.department }
          });
        }
          deptId = dbDept.id;
      }
    }

    await db.employee.update({
      where: { userId },
      data: {
        fullName: fields.fullName !== undefined ? fields.fullName : existing.fullName,
        jobTitle: fields.jobTitle !== undefined ? fields.jobTitle : existing.jobTitle,
        departmentId: fields.department !== undefined ? deptId : existing.departmentId,
        updatedAt: new Date()
      }
    });

    if (fields.managerId !== undefined) {
      await db.reportingRelationship.deleteMany({
        where: { employeeId: existing.id }
      });
      if (fields.managerId) {
        const mgrEmp = await db.employee.findUnique({
          where: { userId: fields.managerId }
        });
        if (mgrEmp) {
          await db.reportingRelationship.create({
            data: {
              employeeId: existing.id,
              managerId: mgrEmp.id,
              relationshipType: 'DIRECT'
            }
          });
        }
      }
    }

    return ProfileModel.findByUserId(userId);
  }
}
