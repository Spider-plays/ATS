import { db } from "../server/db";
import { users, stages } from "../shared/schema";

// Seed database with initial data
async function seedDatabase() {
  console.log("Seeding database...");
  
  // Check if users exist
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length === 0) {
    console.log("Adding default users...");
    // Add default users
    await db.insert(users).values([
      {
        username: "admin",
        password: "admin123",
        fullName: "Admin User",
        email: "admin@example.com",
        role: "admin",
        avatar: null
      },
      {
        username: "manager",
        password: "manager123",
        fullName: "Manager User",
        email: "manager@example.com",
        role: "manager",
        avatar: null
      },
      {
        username: "recruiter",
        password: "recruiter123",
        fullName: "Recruiter User",
        email: "recruiter@example.com",
        role: "recruiter",
        avatar: null
      }
    ]);
    console.log("Default users added!");
  } else {
    console.log(`Skipping users seed, ${existingUsers.length} users already exist`);
  }

  // Check if stages exist
  const existingStages = await db.select().from(stages);
  
  if (existingStages.length === 0) {
    console.log("Adding default recruitment stages...");
    // Add default stages
    await db.insert(stages).values([
      {
        name: "Applied",
        order: 1,
        isDefault: true
      },
      {
        name: "Resume Screening",
        order: 2,
        isDefault: false
      },
      {
        name: "Phone Interview",
        order: 3,
        isDefault: false
      },
      {
        name: "Technical Assessment",
        order: 4,
        isDefault: false
      },
      {
        name: "Technical Interview",
        order: 5,
        isDefault: false
      },
      {
        name: "Manager Interview",
        order: 6,
        isDefault: false
      },
      {
        name: "HR Interview",
        order: 7,
        isDefault: false
      },
      {
        name: "Offer",
        order: 8,
        isDefault: false
      },
      {
        name: "Hired",
        order: 9,
        isDefault: false
      },
      {
        name: "Rejected",
        order: 10,
        isDefault: false
      }
    ]);
    console.log("Default stages added!");
  } else {
    console.log(`Skipping stages seed, ${existingStages.length} stages already exist`);
  }

  console.log("Database seeding completed!");
}

// Run the seed function
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });