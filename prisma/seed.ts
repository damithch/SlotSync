import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Returns a Date for today + dayOffset at the given local hour.
function at(dayOffset: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  // Start clean so the seed can be run again safely.
  await prisma.reservation.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.resourceType.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@slotsync.dev", passwordHash, role: Role.ADMIN },
  });
  const nimal = await prisma.user.create({
    data: { name: "Nimal Perera", email: "nimal@slotsync.dev", passwordHash },
  });
  const kavya = await prisma.user.create({
    data: { name: "Kavya Silva", email: "kavya@slotsync.dev", passwordHash },
  });

  const [room, equipment, vehicle] = await Promise.all(
    ["Meeting Room", "Equipment", "Vehicle"].map((name) => prisma.resourceType.create({ data: { name } })),
  );

  const boardroom = await prisma.resource.create({
    data: { name: "Boardroom", typeId: room.id, location: "Floor 3", capacity: 12, description: "Large table, TV screen and video conferencing." },
  });
  const huddle = await prisma.resource.create({
    data: { name: "Huddle Room A", typeId: room.id, location: "Floor 2", capacity: 4 },
  });
  await prisma.resource.create({
    data: { name: "Training Hall", typeId: room.id, location: "Ground Floor", capacity: 40 },
  });
  const projector = await prisma.resource.create({
    data: { name: "Epson Projector", typeId: equipment.id, location: "IT Store" },
  });
  await prisma.resource.create({
    data: { name: "DSLR Camera", typeId: equipment.id, location: "Marketing Office" },
  });
  await prisma.resource.create({
    data: { name: "Company Van", typeId: vehicle.id, location: "Car Park", capacity: 8, description: "Under maintenance.", isActive: false },
  });

  await prisma.reservation.createMany({
    data: [
      { resourceId: boardroom.id, userId: nimal.id, startTime: at(1, 9), endTime: at(1, 10), purpose: "Weekly sales meeting" },
      { resourceId: boardroom.id, userId: kavya.id, startTime: at(1, 10), endTime: at(1, 12), purpose: "Client presentation" },
      { resourceId: huddle.id, userId: kavya.id, startTime: at(1, 14), endTime: at(1, 15), purpose: "1:1 catch-up" },
      { resourceId: projector.id, userId: nimal.id, startTime: at(2, 13), endTime: at(2, 17), purpose: "Training session" },
      { resourceId: boardroom.id, userId: admin.id, startTime: at(3, 9), endTime: at(3, 11), purpose: "Management review" },
    ],
  });

  console.log("Seeded: 3 users, 6 resources, 5 reservations. Password for all users: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
