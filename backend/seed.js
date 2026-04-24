const mongoose = require("mongoose");
const Bus = require("./models/Bus");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const busData = [
  {
    busNumber: "BUS-001",
    route: "Route 1",
    location: { lat: 17.3850, lng: 78.4867 }, // Hyderabad coordinates
    stops: ["Suraram", "Jeedimetla", "Shapur", "Chintal", "IDPL", "Balanagar X Road", "Peeroz Guda", "Bowenpally (CMR Function Hall)", "Bapuji Nagar", "Tadbund", "Paradise", "Sangeeth", "Tarnaka", "College"],
    distance: "25 km",
    schedule: [
      { time: "6:50 AM", direction: "To Campus" },
      { time: "5:00 PM", direction: "From Campus" }
    ],
    driver: { name: "Laxma Reddy", phone: "9948029392" },
    incharge: { name: "Dr. Priya Sharma", phone: "+91 9876543211" },
    startTime: "6:50 AM"
  },
  {
    busNumber: "BUS-002",
    route: "Route 2",
    location: { lat: 17.4400, lng: 78.3489 },
    stops: ["Mehdipatnam (Before Rythu Bazar)", "Rathibowli", "Raya Dharga", "Nanakramguda", "Gachibowli", "Narsing Service Road", "APPA Junction", "TSPA", "Tukkuguda", "College"],
    distance: "22 km",
    schedule: [
      { time: "7:05 AM", direction: "To Campus" },
      { time: "5:15 PM", direction: "From Campus" }
    ],
    driver: { name: "Ramachandraiah", phone: "7731914909" },
    incharge: { name: "Prof. Ramesh Gupta", phone: "+91 9876543213" },
    startTime: "7:05 AM"
  },
  {
    busNumber: "BUS-003",
    route: "Route 3",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Indira Park", "TDP Office", "Ashok Nagar X Road (Before Khaman)", "RTC X Road Sandhya Theatre", "Bus Bhavan", "Ramnagar Gundu", "Vidya Nagar", "Shivam Road", "Amberpet", "TV Studio", "Ramanthapur Bharat Petrol Pump", "Alkapuri", "Rock Town", "College"],
    distance: "18 km",
    schedule: [
      { time: "7:05 AM", direction: "To Campus" },
      { time: "5:20 PM", direction: "From Campus" }
    ],
    driver: { name: "Venkatesh", phone: "7382805902" },
    incharge: { name: "Dr. Meera Joshi", phone: "+91 9876543215" },
    startTime: "7:05 AM"
  },
  {
    busNumber: "BUS-004",
    route: "Route 4",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Pedda Amberpet Checkpost", "Laxma Reddy Palem", "Word & Deed", "Nayara Petrol Pump", "Injapur", "College"],
    distance: "15 km",
    schedule: [
      { time: "7:50 AM", direction: "To Campus" },
      { time: "5:25 PM", direction: "From Campus" }
    ],
    driver: { name: "Mahender", phone: "9912058673" },
    incharge: { name: "Dr. Sunita Patel", phone: "+91 9876543216" },
    startTime: "7:50 AM"
  },
  {
    busNumber: "BUS-005",
    route: "Route 5",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Bollaram Railway Station", "Risala Bazar", "Macha Bollaram", "Old Alwal IG Statue", "Alwal Bus Stop", "Lothukunta (China Bazar)", "Lal Bazar", "Thirumalagiri", "Kharkhana (Adidas Showroom)", "YMC", "Street No. 8", "Snehapuri Colony", "College"],
    distance: "28 km",
    schedule: [
      { time: "7:00 AM", direction: "To Campus" },
      { time: "5:30 PM", direction: "From Campus" }
    ],
    driver: { name: "Sailu", phone: "9705690956" },
    incharge: { name: "Prof. Anil Kumar", phone: "+91 9876543217" },
    startTime: "7:00 AM"
  },
  {
    busNumber: "BUS-006",
    route: "Route 6",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Hastinapuram Signal", "Bongloor", "College"],
    distance: "12 km",
    schedule: [
      { time: "8:15 AM", direction: "To Campus" },
      { time: "5:35 PM", direction: "From Campus" }
    ],
    driver: { name: "Vishnu", phone: "9652451198" },
    incharge: { name: "Dr. Kavita Singh", phone: "+91 9876543218" },
    startTime: "8:15 AM"
  },
  {
    busNumber: "BUS-007",
    route: "Route 7",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Vinayaka Nagar Bus Stop", "Safil Guda", "Anandbagh", "RK Nagar", "Vani Nagar", "Anutex", "Malkajgiri", "Sai Ram Theatre", "Mirjalguda", "Thukaramgate", "Mettuguda", "College"],
    distance: "20 km",
    schedule: [
      { time: "7:25 AM", direction: "To Campus" },
      { time: "5:40 PM", direction: "From Campus" }
    ],
    driver: { name: "Madhukar Reddy", phone: "9963220970" },
    incharge: { name: "Prof. Rajesh Sharma", phone: "+91 9876543219" },
    startTime: "7:25 AM"
  },
  {
    busNumber: "BUS-008",
    route: "Route 8",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Mother Dairy", "DD Colony (Hotel Management)", "Prashanth Nagar (Shivam Road)", "SBI/Bakers Q (Shivam Road)", "Sri Ramana Theatre", "Amberpet Dargah", "Kamineni", "College"],
    distance: "16 km",
    schedule: [
      { time: "7:25 AM", direction: "To Campus" },
      { time: "5:45 PM", direction: "From Campus" }
    ],
    driver: { name: "Yadagiri Reddy", phone: "8019901377" },
    incharge: { name: "Dr. Pooja Reddy", phone: "+91 9876543220" },
    startTime: "7:25 AM"
  },
  {
    busNumber: "BUS-009",
    route: "Route 9",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Vijaya Laxmi Theatre", "Chintalkunta", "Vishnu Theatre", "Panama", "Prashanth Nagar Reliance Fresh", "RED Tank", "Area Hospital", "College"],
    distance: "14 km",
    schedule: [
      { time: "8:00 AM", direction: "To Campus" },
      { time: "5:50 PM", direction: "From Campus" }
    ],
    driver: { name: "Rama Krishna", phone: "9700123734" },
    incharge: { name: "Prof. Suresh Kumar", phone: "+91 9876543221" },
    startTime: "8:00 AM"
  },
  {
    busNumber: "BUS-010",
    route: "Route 10",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Nalgonda X Road", "Chanchal Guda Jail", "Madannapet", "Dhobighat", "Vinayak Nagar", "Bharat Garden", "Champapet", "Sama Narasimha Reddy Garden", "Sindhura Hotel", "College"],
    distance: "19 km",
    schedule: [
      { time: "7:35 AM", direction: "To Campus" },
      { time: "5:55 PM", direction: "From Campus" }
    ],
    driver: { name: "Srinivas", phone: "9951108428" },
    incharge: { name: "Dr. Anita Gupta", phone: "+91 9876543222" },
    startTime: "7:35 AM"
  },
  {
    busNumber: "BUS-011",
    route: "Route 11",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Area Hospital (Vanasthalipuram)", "NGO's Bus Stop", "BN Reddy (More)", "College"],
    distance: "10 km",
    schedule: [
      { time: "8:15 AM", direction: "To Campus" },
      { time: "6:00 PM", direction: "From Campus" }
    ],
    driver: { name: "Shekar Reddy", phone: "7702210878" },
    incharge: { name: "Prof. Manoj Tiwari", phone: "+91 9876543223" },
    startTime: "8:15 AM"
  },
  {
    busNumber: "BUS-012",
    route: "Route 12",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Yamjal", "College"],
    distance: "8 km",
    schedule: [
      { time: "8:20 AM", direction: "To Campus" },
      { time: "6:05 PM", direction: "From Campus" }
    ],
    driver: { name: "Narsimha", phone: "9618125272" },
    incharge: { name: "Dr. Rekha Sharma", phone: "+91 9876543224" },
    startTime: "8:20 AM"
  },
  {
    busNumber: "BUS-013",
    route: "Route 13",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Satya Nagar", "Maruthi Nagar", "Swetha Garden", "Rajarajeswari Temple", "Mohan Nagar", "New Nagole", "College"],
    distance: "13 km",
    schedule: [
      { time: "7:40 AM", direction: "To Campus" },
      { time: "6:10 PM", direction: "From Campus" }
    ],
    driver: { name: "Sudhakar", phone: "9063983440" },
    incharge: { name: "Prof. Vijay Singh", phone: "+91 9876543225" },
    startTime: "7:40 AM"
  },
  {
    busNumber: "BUS-014",
    route: "Route 14",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Film Nagar", "Jubilee Hill Check Post", "TV9", "Panjagutta", "Nims", "Irrum Manzil", "Khairatabad", "Lakdikapul", "Abids", "Big Bazar", "Gujarathgally", "Koti Womens College", "Chadargattu", "IS Sadan", "KarmanGhatt (Yadagiri Function Hall)", "College"],
    distance: "30 km",
    schedule: [
      { time: "7:00 AM", direction: "To Campus" },
      { time: "6:15 PM", direction: "From Campus" }
    ],
    driver: { name: "Sridhar Reddy", phone: "8328663091" },
    incharge: { name: "Dr. Priya Nair", phone: "+91 9876543226" },
    startTime: "7:00 AM"
  },
  {
    busNumber: "BUS-015",
    route: "Route 15",
    location: { lat: 17.3850, lng: 78.4867 },
    stops: ["Sitapalmandi", "Namalagundu", "Warasiguda", "Warasiguda (ATM)", "Jamia Osmania Railway Station", "Adikmet (Clinic)", "Ram Nagar Gundu (Babai Hotel)", "Vidya Nagar (Turning point)", "Andhra Mahila Sabha", "Tilak Nagar", "Vishal Shopping Mall", "Hyd. Public School", "Pragathi Nagar Khaman", "Uppal NSL", "Bharath Petrol Pump (Ramanthapur)", "BN Reddy (Bharath Petrol Pump)", "College"],
    distance: "26 km",
    schedule: [
      { time: "7:10 AM", direction: "To Campus" },
      { time: "6:20 PM", direction: "From Campus" }
    ],
    driver: { name: "Mahender Goud", phone: "9948308595" },
    incharge: { name: "Prof. Ramesh Yadav", phone: "+91 9876543227" },
    startTime: "7:10 AM"
  }
];

const studentData = [
  {
    name: "Amit Kumar",
    email: "amit.kumar@student.edu",
    password: "password123",
    role: "student",
    busId: null // Will be assigned after buses are created
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@student.edu",
    password: "password123",
    role: "student",
    busId: null
  },
  {
    name: "Rajesh Singh",
    email: "rajesh.singh@student.edu",
    password: "password123",
    role: "student",
    busId: null
  },
  {
    name: "Sneha Patel",
    email: "sneha.patel@student.edu",
    password: "password123",
    role: "student",
    busId: null
  },
  {
    name: "Vikram Reddy",
    email: "vikram.reddy@student.edu",
    password: "password123",
    role: "student",
    busId: null
  }
];

const driverData = [
  {
    name: "Laxma Reddy",
    email: "laxma.reddy@driver.edu",
    password: "password123",
    role: "driver",
    busId: null // Will be assigned to BUS-001
  },
  {
    name: "Ramachandraiah",
    email: "ramachandraiah@driver.edu",
    password: "password123",
    role: "driver",
    busId: null // Will be assigned to BUS-002
  },
  {
    name: "Venkatesh",
    email: "venkatesh@driver.edu",
    password: "password123",
    role: "driver",
    busId: null // Will be assigned to BUS-003
  },
  {
    name: "Mahender",
    email: "mahender@driver.edu",
    password: "password123",
    role: "driver",
    busId: null // Will be assigned to BUS-004
  },
  {
    name: "Sailu",
    email: "sailu@driver.edu",
    password: "password123",
    role: "driver",
    busId: null // Will be assigned to BUS-005
  }
];

const adminData = [
  {
    name: "Admin",
    email: "admin@bustrack.edu",
    password: "password123",
    role: "admin",
    busId: null
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect("mongodb://bususer:Kannayya123@ac-wvzpwgx-shard-00-00.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-01.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-02.25dirsd.mongodb.net:27017/bustrack?ssl=true&replicaSet=atlas-p0lp50-shard-0&authSource=admin&retryWrites=true&w=majority");

    // Clear existing data
    await Bus.deleteMany({});
    await User.deleteMany({});

    // Insert bus data
    const buses = await Bus.insertMany(busData);
    console.log(`${buses.length} buses inserted successfully!`);

    // Assign buses to students
    const hashedPassword = await bcrypt.hash("password123", 10);
    const studentsWithBuses = studentData.map((student, index) => ({
      ...student,
      password: hashedPassword,
      busId: buses[index % buses.length]._id // Assign buses in round-robin fashion
    }));

    const students = await User.insertMany(studentsWithBuses);
    console.log(`${students.length} students inserted successfully!`);

    // Create drivers and assign buses
    const driversWithBuses = driverData.map((driver, index) => ({
      ...driver,
      password: hashedPassword,
      busId: buses[index % driverData.length]._id // Assign first few buses to drivers
    }));

    const drivers = await User.insertMany(driversWithBuses);
    console.log(`${drivers.length} drivers inserted successfully!`);

    // Create admin user
    const adminWithBus = adminData.map((admin) => ({
      ...admin,
      password: hashedPassword,
      busId: null
    }));
    const admins = await User.insertMany(adminWithBus);
    console.log(`${admins.length} admin inserted successfully!`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();