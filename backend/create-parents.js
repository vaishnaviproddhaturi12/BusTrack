const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

async function createParents() {
  try {
    await mongoose.connect("mongodb://bususer:Kannayya123@ac-wvzpwgx-shard-00-00.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-01.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-02.25dirsd.mongodb.net:27017/bustrack?ssl=true&replicaSet=atlas-p0lp50-shard-0&authSource=admin&retryWrites=true&w=majority");

    // Get all students
    const students = await User.find({ role: "student" });

    if (students.length === 0) {
      console.log("❌ No students found. Please seed students first.");
      process.exit(0);
    }

    const parentData = [];
    const hashedPassword = await bcrypt.hash("Parent@123", 10);

    // Create parent for each student
    for (const student of students) {
      const parentEmail = `parent.${student.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
      const parentName = `${student.name}'s Parent`;

      const existingParent = await User.findOne({ email: parentEmail, role: "parent" });

      if (!existingParent) {
        const parent = new User({
          name: parentName,
          email: parentEmail,
          password: hashedPassword,
          role: "parent",
          studentId: student._id
        });

        await parent.save();
        parentData.push({
          parentName: parentName,
          studentName: student.name,
          email: parentEmail,
          password: "Parent@123",
          studentId: student._id
        });
        console.log(`✅ Created parent for: ${student.name}`);
      } else {
        console.log(`⏭️  Parent already exists for: ${student.name}`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📋 PARENT CREDENTIALS - LOGIN INFORMATION");
    console.log("=".repeat(80));

    parentData.forEach((p, index) => {
      console.log(`\n${index + 1}. Student: ${p.studentName}`);
      console.log(`   Parent Name: ${p.parentName}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   Password: ${p.password}`);
      console.log(`   Role: Parent`);
      console.log(`   Access: View live bus location and student attendance`);
    });

    console.log("\n" + "=".repeat(80));
    console.log(`✅ Total parents created: ${parentData.length}`);
    console.log("=".repeat(80));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating parents:", error);
    process.exit(1);
  }
}

createParents();
