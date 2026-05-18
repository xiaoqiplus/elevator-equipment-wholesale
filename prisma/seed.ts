import { PrismaClient, Role, DocumentType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ─── Clean existing data ────────────────────────────────────────────────────
  await prisma.favorite.deleteMany();
  await prisma.quotationRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();

  // ─── Categories ─────────────────────────────────────────────────────────────
  const catElectrical = await prisma.category.create({
    data: {
      name: "Electrical Wholesaler",
      slug: "electrical-wholesaler",
    },
  });

  const catLift = await prisma.category.create({
    data: {
      name: "Lift Equipment",
      slug: "lift-equipment",
    },
  });

  // ─── Brands ─────────────────────────────────────────────────────────────────
  const brandSiemens = await prisma.brand.create({
    data: {
      name: "Siemens",
      slug: "siemens",
      logoUrl: "https://placehold.co/200x80?text=Siemens",
    },
  });

  const brandOtis = await prisma.brand.create({
    data: {
      name: "Otis",
      slug: "otis",
      logoUrl: "https://placehold.co/200x80?text=Otis",
    },
  });

  // ─── Products ───────────────────────────────────────────────────────────────
  const products = [
    {
      sku: "EL-SIE-001",
      name: "Siemens S7-1200 PLC Controller",
      description:
        "Compact programmable logic controller for elevator control systems. Supports up to 8 I/O modules.",
      price: 429.99,
      categoryId: catElectrical.id,
      brandId: brandSiemens.id,
      images: ["https://placehold.co/600x400?text=Siemens+S7-1200"],
      specs: { voltage: "24V DC", processor: "1200 MHz", memory: "50 KB" },
    },
    {
      sku: "EL-SIE-002",
      name: "Siemens G120 Frequency Inverter",
      description:
        "Variable frequency drive for elevator motor speed control. 5.5 kW output power.",
      price: 1249.5,
      categoryId: catElectrical.id,
      brandId: brandSiemens.id,
      images: ["https://placehold.co/600x400?text=G120+Inverter"],
      specs: { power: "5.5 kW", input: "380-480V 3-phase", ipRating: "IP20" },
    },
    {
      sku: "EL-SIE-003",
      name: "Siemens SIRIUS Contact Relay",
      description:
        "24V DC control relay with 4 normally open contacts. Ideal for lift safety circuits.",
      price: 47.25,
      categoryId: catElectrical.id,
      brandId: brandSiemens.id,
      images: ["https://placehold.co/600x400?text=SIRIUS+Relay"],
      specs: { coilVoltage: "24V DC", contacts: "4 NO", switchingPower: "1600 VA" },
    },
    {
      sku: "EL-SIE-004",
      name: "Siemens LOGO! Logic Module",
      description:
        "Mini logic controller for auxiliary elevator functions. Built-in display and keypad.",
      price: 189.0,
      categoryId: catElectrical.id,
      brandId: brandSiemens.id,
      images: ["https://placehold.co/600x400?text=LOGO+Module"],
      specs: { voltage: "24V DC", iO: "12 DI / 8 DO", programMemory: "400 blocks" },
    },
    {
      sku: "LFT-OTI-001",
      name: "Otis DO2000 Door Operator Assembly",
      description:
        "Complete door operator unit for Otis Gen2 elevators. Includes motor, belt, and controller.",
      price: 2899.0,
      categoryId: catLift.id,
      brandId: brandOtis.id,
      images: ["https://placehold.co/600x400?text=DO2000+Door"],
      specs: { motorType: "AC Servo", doorSpeed: "0.6 m/s", maxDoorWeight: "150 kg" },
    },
    {
      sku: "LFT-OTI-002",
      name: "Otis LCB-2 Lift Controller Board",
      description:
        "Main logic control board for Otis elevator systems with CAN bus communication.",
      price: 1575.0,
      categoryId: catLift.id,
      brandId: brandOtis.id,
      images: ["https://placehold.co/600x400?text=LCB-2+Board"],
      specs: { communication: "CAN Bus", voltage: "24V DC", operatingTemp: "0-65°C" },
    },
    {
      sku: "LFT-OTI-003",
      name: "Otis E-Fuse 320 Elevator Safety Gear",
      description:
        "Overspeed governor and safety gear assembly for 8-person passenger elevators.",
      price: 3450.0,
      categoryId: catLift.id,
      brandId: brandOtis.id,
      images: ["https://placehold.co/600x400?text=EFuse+320"],
      specs: { capacity: "630 kg", maxSpeed: "1.75 m/s", material: "Steel/Alloy" },
    },
    {
      sku: "LFT-OTI-004",
      name: "Otis GCB Controller Board",
      description:
        "Group control board for managing multi-car elevator installations. Supports up to 8 cars.",
      price: 2180.0,
      categoryId: catLift.id,
      brandId: brandOtis.id,
      images: ["https://placehold.co/600x400?text=GCB+Board"],
      specs: { maxCars: 8, protocol: "CAN + Serial", mounting: "19-inch Rack" },
    },
    {
      sku: "EL-SIE-005",
      name: "Siemens 3RT2 Contactor",
      description:
        "Power contactor for elevator main line switching. 32A rated current.",
      price: 92.8,
      categoryId: catElectrical.id,
      brandId: brandSiemens.id,
      images: ["https://placehold.co/600x400?text=3RT2+Contactor"],
      specs: { ratedCurrent: "32 A", coilVoltage: "24V DC", poles: 3 },
    },
    {
      sku: "LFT-OTI-005",
      name: "Otis Traveling Cable – 24-Core",
      description:
        "Flat traveling cable for elevator car connectivity. 24 conductors with steel reinforcement.",
      price: 14.5,
      categoryId: catLift.id,
      brandId: brandOtis.id,
      images: ["https://placehold.co/600x400?text=Traveling+Cable"],
      specs: { conductors: 24, length: "per meter", tensileStrength: "4 kN" },
    },
    {
      sku: "LFT-OTI-006",
      name: "Otis Gen2 Machine Brake Assembly",
      description:
        "Electromagnetic brake unit for Otis Gen2 gearless machines. Includes coil and discs.",
      price: 890.0,
      categoryId: catLift.id,
      brandId: brandOtis.id,
      images: ["https://placehold.co/600x400?text=Gen2+Brake"],
      specs: { torque: "350 Nm", voltage: "110V DC", gap: "0.3 mm" },
    },
    {
      sku: "EL-SIE-006",
      name: "Siemens SITOP Power Supply 24V/10A",
      description:
        "Industrial power supply unit for elevator control cabinets. 24V DC output, 10A.",
      price: 215.0,
      categoryId: catElectrical.id,
      brandId: brandSiemens.id,
      images: ["https://placehold.co/600x400?text=SITOP+PSU"],
      specs: { output: "24V DC / 10A", input: "120-230V AC", efficiency: "90%" },
    },
  ];

  for (const productData of products) {
    const { ...data } = productData;
    const product = await prisma.product.create({
      data: {
        ...data,
        documents: {
          create: {
            type: DocumentType.MANUAL,
            name: `${data.sku}_manual.pdf`,
            fileUrl: `https://placehold.co/600x400?text=${data.sku}+Manual`,
          },
        },
      },
    });
    console.log(`Created product: ${product.sku} - ${product.name}`);
  }

  // ─── Admin user ─────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      companyName: "Elevator Equipment Admin",
      phone: "+44 7507 940266",
      role: Role.ADMIN,
      isApproved: true,
    },
  });
  console.log(`Created admin: ${admin.email}`);
}

main()
  .then(async () => {
    console.log("\nSeed completed successfully ✅");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed ❌", e);
    await prisma.$disconnect();
    process.exit(1);
  });
