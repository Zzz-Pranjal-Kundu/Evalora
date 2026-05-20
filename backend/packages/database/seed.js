import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with realistic industry data...');

  // 1. Clear existing data
  console.log('🧹 Clearing existing data...');
  const tableNames = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  for (const { tablename } of tableNames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log({ error });
      }
    }
  }

  // 2. Create Roles
  console.log('👥 Creating Roles...');
  const rolesData = [
    { code: 'SUPER_ADMIN', label: 'Super Administrator' },
    { code: 'LEADERSHIP', label: 'Leadership' },
    { code: 'HR_ADMIN', label: 'HR Administrator' },
    { code: 'ADMIN', label: 'Administrator' },
    { code: 'MANAGER', label: 'Manager' },
    { code: 'EMPLOYEE', label: 'Employee' },
  ];
  
  const roles = {};
  for (const role of rolesData) {
    roles[role.code] = await prisma.role.create({ data: role });
  }

  // 3. Create Departments
  console.log('🏢 Creating Departments...');
  const departments = {};
  const deptNames = ['Executive', 'Engineering', 'Product', 'Sales', 'Marketing', 'People Operations'];
  
  for (const name of deptNames) {
    departments[name] = await prisma.department.create({ data: { name } });
  }

  // 4. Create Users and Employees (Hierarchical)
  console.log('👩‍💼 Creating Employees and Hierarchy...');
  
  const generateUserAndEmployee = async (roleCode, deptName, title, managerId = null) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName, provider: 'epfms.demo' }).toLowerCase();
    
    // Create User
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: 'hashed_demo_password', // In real app, hash this properly
        userRoles: {
          create: {
            roleId: roles[roleCode].id
          }
        }
      }
    });

    // Create Employee Profile
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeNumber: faker.string.alphanumeric({ length: 6, casing: 'upper' }),
        fullName: `${firstName} ${lastName}`,
        jobTitle: title,
        departmentId: departments[deptName].id,
        hireDate: faker.date.past({ years: 5 }),
      }
    });

    // Set Reporting Relationship
    if (managerId) {
      await prisma.reportingRelationship.create({
        data: {
          employeeId: employee.id,
          managerId: managerId,
          relationshipType: 'DIRECT'
        }
      });
    }

    return employee;
  };

  // Create CEO
  const ceo = await generateUserAndEmployee('LEADERSHIP', 'Executive', 'Chief Executive Officer');

  // Create Department Heads
  const cto = await generateUserAndEmployee('LEADERSHIP', 'Engineering', 'Chief Technology Officer', ceo.id);
  const cpo = await generateUserAndEmployee('LEADERSHIP', 'Product', 'Chief Product Officer', ceo.id);
  const cro = await generateUserAndEmployee('LEADERSHIP', 'Sales', 'Chief Revenue Officer', ceo.id);
  const chro = await generateUserAndEmployee('HR_ADMIN', 'People Operations', 'Chief Human Resources Officer', ceo.id);

  // Create Managers
  const engManager = await generateUserAndEmployee('MANAGER', 'Engineering', 'Engineering Manager', cto.id);
  const productManager = await generateUserAndEmployee('MANAGER', 'Product', 'Group Product Manager', cpo.id);
  const salesManager = await generateUserAndEmployee('MANAGER', 'Sales', 'Regional Sales Director', cro.id);

  // Create Individual Contributors
  const allEmployees = [ceo, cto, cpo, cro, chro, engManager, productManager, salesManager];

  const createICs = async (count, roleCode, deptName, titlePool, managerId) => {
    for (let i = 0; i < count; i++) {
      const title = faker.helpers.arrayElement(titlePool);
      const ic = await generateUserAndEmployee(roleCode, deptName, title, managerId);
      allEmployees.push(ic);
    }
  };

  await createICs(5, 'EMPLOYEE', 'Engineering', ['Frontend Engineer', 'Backend Engineer', 'DevOps Engineer', 'QA Engineer'], engManager.id);
  await createICs(3, 'EMPLOYEE', 'Product', ['Product Manager', 'UX Designer', 'Product Analyst'], productManager.id);
  await createICs(4, 'EMPLOYEE', 'Sales', ['Account Executive', 'Sales Development Rep', 'Solutions Architect'], salesManager.id);

  // 5. Create Review Cycle
  console.log('📊 Creating Review Cycle and Assignments...');
  const cycle = await prisma.reviewCycle.create({
    data: {
      name: `Q3 ${new Date().getFullYear()} Performance Review`,
      cycleType: 'QUARTERLY',
      startDate: faker.date.recent({ days: 30 }),
      endDate: faker.date.soon({ days: 30 }),
      status: 'ACTIVE'
    }
  });

  // Assign Reviews for ICs reporting to engManager
  const engReports = await prisma.reportingRelationship.findMany({
    where: { managerId: engManager.id },
    include: { employee: true }
  });

  for (const report of engReports) {
    // Self Review
    await prisma.review.create({
      data: {
        cycleId: cycle.id,
        employeeId: report.employeeId,
        reviewerId: report.employee.userId,
        status: 'SUBMITTED',
        summary: faker.company.catchPhrase(),
        rating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 })
      }
    });

    // Manager Review
    await prisma.review.create({
      data: {
        cycleId: cycle.id,
        employeeId: report.employeeId,
        reviewerId: engManager.userId,
        status: 'SUBMITTED',
        summary: faker.lorem.paragraph(),
        rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 })
      }
    });
  }

  // 6. Create Goals
  console.log('🎯 Creating Goals...');
  const companyGoal = await prisma.goal.create({
    data: {
      ownerEmployeeId: ceo.id,
      title: 'Achieve $10M ARR',
      description: 'Hit our revenue targets for the fiscal year.',
      period: 'FY',
      scope: 'COMPANY',
      status: 'IN_PROGRESS',
      progressPct: 65.5
    }
  });

  const engGoal = await prisma.goal.create({
    data: {
      ownerEmployeeId: cto.id,
      title: 'Launch New Analytics Platform',
      description: 'Deliver the core features for the new analytics product.',
      period: 'H2',
      scope: 'DEPARTMENT',
      parentGoalId: companyGoal.id,
      status: 'IN_PROGRESS',
      progressPct: 40.0
    }
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
