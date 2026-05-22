import { PrismaClient } from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// Pre-hashed bcrypt value for "Demo12345!" with 12 rounds
const DEFAULT_PASSWORD_HASH = "$2a$12$vI5vC.BvM3tZ8m9B8uW.hOQOymjD2Pec5u/tT1mO5cTpyqC1c3WwS";

async function main() {
  console.log('🌱 Starting database seeding with master organizational data...');

  // 1. Resolve seed path
  const seedPath = path.resolve(__dirname, '..', '..', 'database', 'demo_org_seed.json');
  if (!fs.existsSync(seedPath)) {
    console.error(`❌ demo_org_seed.json not found at ${seedPath}`);
    process.exit(1);
  }

  const org = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  
  // 2. Clear existing collections (No SQL Truncate on MongoDB!)
  console.log('🧹 Clearing all collections in correct dependency order...');
  
  // 2.1 Deepest leaves (Relational maps)
  await prisma.reportingRelationship.deleteMany();
  await prisma.employeeCompetencyAssessment.deleteMany();
  await prisma.calibrationAdjustment.deleteMany();
  await prisma.developmentAction.deleteMany();
  await prisma.developmentPlan.deleteMany();
  await prisma.feedbackTag.deleteMany();
  await prisma.feedbackEntry.deleteMany();
  await prisma.feedbackRequest.deleteMany();
  
  // 2.2 Goals & Checkins
  await prisma.goalUpdate.deleteMany();
  await prisma.goalComment.deleteMany();
  await prisma.goalApproval.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.checkinNote.deleteMany();
  await prisma.checkinAction.deleteMany();
  await prisma.checkin.deleteMany();

  // 2.3 Reviews & Cycles
  await prisma.reviewResponse.deleteMany();
  await prisma.review.deleteMany();
  await prisma.reviewerNomination.deleteMany();
  await prisma.reviewAssignment.deleteMany();
  await prisma.reviewSection.deleteMany();
  await prisma.reviewTemplate.deleteMany();
  await prisma.reviewCycle.deleteMany();

  // 2.4 Competencies, Ratings & Calibrations
  await prisma.competencyMapping.deleteMany();
  await prisma.competency.deleteMany();
  await prisma.ratingRecord.deleteMany();
  await prisma.ratingScale.deleteMany();
  await prisma.calibrationSession.deleteMany();

  // 2.5 Security, Tokens & Operational logs
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.recognition.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.event.deleteMany();
  await prisma.metricSnapshot.deleteMany();

  // 2.6 Primary nodes
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.businessUnit.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // 3. Create Roles
  console.log('👥 Creating Roles...');
  const roles = {};
  const allowedRoles = org.roles || ['SUPER_ADMIN', 'LEADERSHIP', 'HR_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'];
  for (const rCode of allowedRoles) {
    roles[rCode] = await prisma.role.create({
      data: {
        code: rCode,
        label: rCode.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
      }
    });
  }

  // 4. Create Departments
  console.log('🏢 Creating Departments...');
  const departments = {};
  const deptSet = new Set();
  for (const u of org.users) {
    if (u.department) deptSet.add(u.department);
  }
  for (const dName of deptSet) {
    departments[dName] = await prisma.department.create({
      data: { name: dName }
    });
  }

  // 5. Create Users and Employee Profiles
  console.log('👩‍💼 Seeding Users and Employee Profiles...');
  const userMap = {}; // Maps user_id -> employee_id
  
  for (const u of org.users) {
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Demo User';
    
    // Create User record
    const user = await prisma.user.create({
      data: {
        id: u.id,
        email: u.email.trim().toLowerCase(),
        passwordHash: DEFAULT_PASSWORD_HASH,
        userRoles: {
          create: {
            roleId: roles[u.role].id
          }
        }
      }
    });

    // Resolve department
    let deptId = null;
    if (u.department && departments[u.department]) {
      deptId = departments[u.department].id;
    }

    // Create Employee record
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeNumber: `EMP-${u.id.slice(-8).toUpperCase()}`,
        fullName: fullName,
        jobTitle: u.title || null,
        departmentId: deptId
      }
    });

    userMap[u.id] = employee.id;
  }

  // 6. Create Reporting Relationships
  console.log('🔗 Establishing Reporting Hierarchy...');
  for (const u of org.users) {
    if (u.managerId && userMap[u.id] && userMap[u.managerId]) {
      await prisma.reportingRelationship.create({
        data: {
          employeeId: userMap[u.id],
          managerId: userMap[u.managerId],
          relationshipType: 'DIRECT'
        }
      });
    }
  }

  console.log('✅ Master seeding complete! MongoDB is 100% prepared.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
