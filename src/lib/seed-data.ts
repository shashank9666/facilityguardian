// ─── Seed / Mock Data ─────────────────────────────────────────────────────────
// In production: replace with API calls to your backend.
// All IDs are generated deterministically for stable renders.

import type {
  User, Asset, WorkOrder, PreventiveMaintenance,
  Vendor, Space, Incident, InventoryItem,
} from "@/types";

export const CURRENT_USER: User = {
  id: "U001", name: "Arjun Sharma", email: "arjun@fmnexus.in",
  role: "admin", department: "Facility Management", active: true,
  createdAt: "2024-01-15T00:00:00Z", updatedAt: "2024-01-15T00:00:00Z",
};

export const USERS: User[] = [
  CURRENT_USER,
  { id:"U002",name:"Priya Nair",email:"priya@fmnexus.in",role:"manager",department:"Operations",active:true,createdAt:"2024-02-01T00:00:00Z",updatedAt:"2024-02-01T00:00:00Z" },
  { id:"U003",name:"Rahul Mehta",email:"rahul@fmnexus.in",role:"technician",department:"Maintenance",active:true,createdAt:"2024-02-15T00:00:00Z",updatedAt:"2024-02-15T00:00:00Z" },
  { id:"U004",name:"Sneha Iyer",email:"sneha@fmnexus.in",role:"technician",department:"Electrical",active:true,createdAt:"2024-03-01T00:00:00Z",updatedAt:"2024-03-01T00:00:00Z" },
  { id:"U005",name:"Karan Gupta",email:"karan@fmnexus.in",role:"viewer",department:"HR",active:false,createdAt:"2024-03-10T00:00:00Z",updatedAt:"2024-03-10T00:00:00Z" },
];

export const ASSETS: Asset[] = [
  {
    id:"A001",code:"HVAC-001",name:"Central HVAC Unit – Block A",category:"HVAC",
    status:"operational",location:"Mechanical Room",floor:"B1",building:"Block A",
    serialNumber:"SN-HVAC-2021-001",manufacturer:"Daikin",model:"FT50MV16U",
    purchaseDate:"2021-04-01",warrantyExpiry:"2026-03-31",
    lastMaintenance:"2026-02-15",nextMaintenance:"2026-05-15",
    value:380000,assignedTo:"U003",notes:"Quarterly service due",tags:["cooling","critical"],
    createdAt: "2021-04-01T08:00:00Z", updatedAt: "2026-02-15T10:00:00Z",
  },

  {
    id:"A002",code:"ELEV-001",name:"Passenger Elevator #1",category:"Elevator",
    status:"maintenance",location:"Main Lobby",floor:"G",building:"Block A",
    serialNumber:"SN-ELEV-2020-001",manufacturer:"Otis",model:"Gen2 MR",
    purchaseDate:"2020-06-15",warrantyExpiry:"2025-06-14",
    lastMaintenance:"2026-03-01",nextMaintenance:"2026-04-01",
    value:1200000,assignedTo:"U004",notes:"Annual certification pending",tags:["elevator","safety"],
    createdAt: "2020-06-15T09:00:00Z", updatedAt: "2026-03-01T14:30:00Z",
  },

  {
    id:"A003",code:"FIRE-001",name:"Fire Suppression System – Server Room",category:"Fire Safety",
    status:"operational",location:"Server Room",floor:"G",building:"Block B",
    serialNumber:"SN-FIRE-2022-001",manufacturer:"Kidde",model:"FM-200",
    purchaseDate:"2022-01-10",warrantyExpiry:"2027-01-09",
    lastMaintenance:"2026-01-10",nextMaintenance:"2026-07-10",
    value:250000,notes:"Certified",tags:["fire","safety","critical"],
    createdAt: "2022-01-10T11:00:00Z", updatedAt: "2026-01-10T16:00:00Z",
  },

  {
    id:"A004",code:"PUMP-001",name:"Water Pump – Rooftop",category:"Plumbing",
    status:"faulty",location:"Rooftop",floor:"R",building:"Block A",
    serialNumber:"SN-PUMP-2019-001",manufacturer:"Kirloskar",model:"SP-7.5",
    purchaseDate:"2019-09-20",warrantyExpiry:"2024-09-19",
    lastMaintenance:"2025-12-01",nextMaintenance:"2026-06-01",
    value:45000,notes:"Bearing replacement needed",tags:["plumbing","water"],
    createdAt: "2019-09-20T10:00:00Z", updatedAt: "2025-12-01T15:00:00Z",
  },

  {
    id:"A005",code:"GEN-001",name:"DG Set – 125 KVA",category:"Electrical",
    status:"operational",location:"Power Room",floor:"B1",building:"Main",
    serialNumber:"SN-GEN-2023-001",manufacturer:"Cummins",model:"C125D5",
    purchaseDate:"2023-07-01",warrantyExpiry:"2028-06-30",
    lastMaintenance:"2026-03-10",nextMaintenance:"2026-06-10",
    value:950000,assignedTo:"U004",notes:"Last load test – OK",tags:["power","critical"],
    createdAt: "2023-07-01T08:00:00Z", updatedAt: "2026-03-10T11:00:00Z",
  },

  {
    id:"A006",code:"AC-101",name:"Split AC – Conference Room 101",category:"HVAC",
    status:"operational",location:"Conference Room 101",floor:"1",building:"Block A",
    serialNumber:"SN-AC-2023-101",manufacturer:"Voltas",model:"SAC 185V DZX",
    purchaseDate:"2023-03-15",warrantyExpiry:"2028-03-14",
    lastMaintenance:"2026-01-20",nextMaintenance:"2026-04-20",
    value:42000,notes:"",tags:["cooling"],
    createdAt: "2023-03-15T12:00:00Z", updatedAt: "2026-01-20T14:00:00Z",
  },

];

export const WORK_ORDERS: WorkOrder[] = [
  {
    id:"WO001",woNumber:"WO-2026-001",
    title:"HVAC Compressor Noise – Block A",
    description:"Unusual grinding noise from HVAC compressor unit in Block A mechanical room.",
    type:"corrective",status:"in_progress",priority:"high",
    assetId:"A001",assetName:"Central HVAC Unit – Block A",
    location:"Mechanical Room, B1",
    assignedTo:"U003",assignedTeam:"HVAC Team",requestedBy:"Priya Nair",
    createdAt:"2026-03-28T09:00:00Z", updatedAt:"2026-03-28T09:00:00Z", dueDate:"2026-04-02",
    estimatedHours:4,actualHours:2,cost:8500,notes:"Bearing replacement ordered",
    attachments:[],
    auditLog:[
      {id:"AE1",action:"Work Order Created",performedBy:"Priya Nair",timestamp:"2026-03-28T09:00:00"},
      {id:"AE2",action:"Assigned to Rahul Mehta",performedBy:"Arjun Sharma",timestamp:"2026-03-28T10:30:00"},
      {id:"AE3",action:"Status → In Progress",performedBy:"Rahul Mehta",timestamp:"2026-03-29T08:00:00"},
    ],
  },
  {
    id:"WO002",woNumber:"WO-2026-002",
    title:"Elevator Routine Annual Maintenance",
    description:"Annual preventive maintenance and certification for Passenger Elevator #1.",
    type:"preventive",status:"assigned",priority:"medium",
    assetId:"A002",assetName:"Passenger Elevator #1",
    location:"Main Lobby, Ground Floor",
    assignedTo:"U004",requestedBy:"Arjun Sharma",
    createdAt:"2026-03-25T11:00:00Z", updatedAt:"2026-03-25T11:00:00Z", dueDate:"2026-04-05",
    estimatedHours:8,notes:"Otis service engineer to be scheduled",
    attachments:[],
    auditLog:[
      {id:"AE4",action:"Work Order Created",performedBy:"Arjun Sharma",timestamp:"2026-03-25T11:00:00"},
      {id:"AE5",action:"Assigned to Sneha Iyer",performedBy:"Arjun Sharma",timestamp:"2026-03-25T11:30:00"},
    ],
  },
  {
    id:"WO003",woNumber:"WO-2026-003",
    title:"Water Pump Bearing Replacement",
    description:"Rooftop water pump bearing failure. Immediate replacement required.",
    type:"corrective",status:"open",priority:"critical",
    assetId:"A004",assetName:"Water Pump – Rooftop",
    location:"Rooftop",requestedBy:"Rahul Mehta",
    createdAt:"2026-03-31T07:30:00Z", updatedAt:"2026-03-31T07:30:00Z", dueDate:"2026-04-01",
    estimatedHours:3,notes:"Part ordered from Kirloskar",attachments:[],
    auditLog:[
      {id:"AE6",action:"Work Order Created",performedBy:"Rahul Mehta",timestamp:"2026-03-31T07:30:00"},
    ],
  },
  {
    id:"WO004",woNumber:"WO-2026-004",
    title:"Office Lighting Replacement – Floor 3",
    description:"Fluorescent tubes to be replaced with LED across Floor 3.",
    type:"preventive",status:"completed",priority:"low",
    location:"Floor 3, Block A",assignedTo:"U004",requestedBy:"Karan Gupta",
    createdAt:"2026-03-20T09:00:00Z", updatedAt:"2026-03-24T16:00:00Z", dueDate:"2026-03-25",completedAt:"2026-03-24T16:00:00",
    estimatedHours:6,actualHours:5.5,cost:22000,notes:"48 tubes replaced",attachments:[],
    auditLog:[
      {id:"AE7",action:"Completed",performedBy:"Sneha Iyer",timestamp:"2026-03-24T16:00:00"},
    ],
  },
  {
    id:"WO005",woNumber:"WO-2026-005",
    title:"Fire Alarm System – Quarterly Test",
    description:"Quarterly test and inspection of all fire alarm devices.",
    type:"inspection",status:"open",priority:"high",
    assetId:"A003",assetName:"Fire Suppression System – Server Room",
    location:"All Floors",requestedBy:"Arjun Sharma",
    createdAt:"2026-04-01T08:00:00Z", updatedAt:"2026-04-01T08:00:00Z", dueDate:"2026-04-07",
    estimatedHours:5,notes:"",attachments:[],
    auditLog:[
      {id:"AE8",action:"Work Order Created",performedBy:"Arjun Sharma",timestamp:"2026-04-01T08:00:00"},
    ],
  },
];

export const PM_SCHEDULES: PreventiveMaintenance[] = [
  {
    id:"PM001",title:"HVAC Filter Cleaning",assetId:"A001",assetName:"Central HVAC Unit – Block A",
    frequency:"monthly",lastCompleted:"2026-03-01",nextDue:"2026-04-01",
    assignedTo:"U003",estimatedMinutes:90,status:"active",
    checklist:[
      {id:"C1",task:"Inspect and clean filters",completed:false},
      {id:"C2",task:"Check refrigerant levels",completed:false},
      {id:"C3",task:"Test thermostat calibration",completed:false},
      {id:"C4",task:"Inspect belts and pulleys",completed:false},
      {id:"C5",task:"Clean condenser coils",completed:false},
    ],
    createdAt: "2026-03-01T00:00:00Z", updatedAt: "2026-03-01T00:00:00Z",
  },

  {
    id:"PM002",title:"DG Set Monthly Run",assetId:"A005",assetName:"DG Set – 125 KVA",
    frequency:"monthly",lastCompleted:"2026-03-10",nextDue:"2026-04-10",
    assignedTo:"U004",estimatedMinutes:60,status:"active",
    checklist:[
      {id:"C6",task:"Check oil level",completed:false},
      {id:"C7",task:"Check coolant level",completed:false},
      {id:"C8",task:"Run on load for 30 min",completed:false},
      {id:"C9",task:"Check battery voltage",completed:false},
    ],
    createdAt: "2026-03-10T00:00:00Z", updatedAt: "2026-03-10T00:00:00Z",
  },

  {
    id:"PM003",title:"Fire Extinguisher Inspection",assetId:"A003",assetName:"Fire Suppression System",
    frequency:"quarterly",lastCompleted:"2026-01-15",nextDue:"2026-04-15",
    assignedTo:"U003",estimatedMinutes:120,status:"active",
    checklist:[
      {id:"C10",task:"Check pressure gauge",completed:false},
      {id:"C11",task:"Inspect pin and tamper seal",completed:false},
      {id:"C12",task:"Verify expiry date",completed:false},
      {id:"C13",task:"Log inspection in register",completed:false},
    ],
    createdAt: "2026-01-15T00:00:00Z", updatedAt: "2026-01-15T00:00:00Z",
  },

];

export const VENDORS: Vendor[] = [
  {
    id:"V001",name:"SwiftTech HVAC Services",category:"HVAC",
    contactName:"Deepak Verma",email:"deepak@swifttech.in",phone:"+91 98765 43210",
    address:"12, Industrial Area, Pune – 411001",
    status:"active",rating:4.2,contractStart:"2025-01-01",contractEnd:"2026-12-31",
    slaHours:4,totalOrders:28,completedOnTime:25,notes:"Preferred vendor for HVAC",
    createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
  },

  {
    id:"V002",name:"Otis Elevator India Ltd",category:"Elevator",
    contactName:"Suresh Pillai",email:"suresh@otis.com",phone:"+91 99887 76655",
    address:"5th Floor, Indiabulls Finance Centre, Mumbai – 400013",
    status:"active",rating:4.8,contractStart:"2024-06-15",contractEnd:"2027-06-14",
    slaHours:8,totalOrders:12,completedOnTime:12,notes:"AMC contract",
    createdAt: "2024-06-15T00:00:00Z", updatedAt: "2024-06-15T00:00:00Z",
  },

  {
    id:"V003",name:"Safeguard Fire Systems",category:"Fire Safety",
    contactName:"Anjali Rao",email:"anjali@safeguardfire.in",phone:"+91 88001 22334",
    address:"Block C, Sector 62, Noida – 201309",
    status:"active",rating:3.9,contractStart:"2025-04-01",contractEnd:"2026-03-31",
    slaHours:12,totalOrders:15,completedOnTime:13,notes:"",
    createdAt: "2025-04-01T00:00:00Z", updatedAt: "2025-04-01T00:00:00Z",
  },

  {
    id:"V004",name:"PowerGen Solutions",category:"Electrical",
    contactName:"Vikas Choudhary",email:"vikas@powergen.in",phone:"+91 77002 44556",
    address:"Plot 23, MIDC, Nashik – 422010",
    status:"active",rating:4.5,contractStart:"2024-01-01",contractEnd:"2026-12-31",
    slaHours:6,totalOrders:20,completedOnTime:19,notes:"Cummins authorised partner",
    createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },

];

export const SPACES: Space[] = [
  // HQ Campus
  {id:"S001",site:"HQ Campus",name:"Main Lobby",type:"Conference",floor:"G",building:"Block A",capacity:50,occupied:35,status:"occupied",lastInspection:"2026-03-25",area:1200,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S002",site:"HQ Campus",name:"Conference Hall A",type:"Conference",floor:"1",building:"Block A",capacity:20,occupied:0,status:"available",lastInspection:"2026-03-15",area:450,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S003",site:"HQ Campus",name:"Open Office 1A",type:"Workstation",floor:"1",building:"Block A",capacity:80,occupied:72,status:"occupied",lastInspection:"2026-03-20",area:2000,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S004",site:"HQ Campus",name:"Board Room",type:"Conference",floor:"5",building:"Block A",capacity:30,occupied:0,status:"reserved",lastInspection:"2026-02-10",area:600,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S005",site:"HQ Campus",name:"Server Room",type:"Utility",floor:"3",building:"Block A",capacity:5,occupied:2,status:"maintenance",lastInspection:"2026-03-28",area:200,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S006",site:"HQ Campus",name:"Cafeteria",type:"Cafeteria",floor:"G",building:"Block B",capacity:100,occupied:60,status:"occupied",lastInspection:"2026-03-25",area:3000,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S007",site:"HQ Campus",name:"Gym & Wellness",type:"Recreation",floor:"G",building:"Block B",capacity:40,occupied:12,status:"available",lastInspection:"2026-03-18",area:1500,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S008",site:"HQ Campus",name:"Parking Level B1",type:"Parking",floor:"B1",building:"Block A",capacity:120,occupied:98,status:"occupied",lastInspection:"2026-03-10",area:5000,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  // North Site
  {id:"S009",site:"North Site",name:"Reception",type:"Conference",floor:"G",building:"Tower 1",capacity:15,occupied:0,status:"available",lastInspection:"2026-03-12",area:300,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S010",site:"North Site",name:"Training Room 1",type:"Conference",floor:"2",building:"Tower 1",capacity:40,occupied:32,status:"occupied",lastInspection:"2026-03-18",area:800,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S011",site:"North Site",name:"Open Office 2A",type:"Workstation",floor:"2",building:"Tower 1",capacity:60,occupied:55,status:"occupied",lastInspection:"2026-03-20",area:1400,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S012",site:"North Site",name:"Storage Room N1",type:"Storage",floor:"B1",building:"Tower 1",capacity:0,occupied:0,status:"available",lastInspection:"2026-02-28",area:400,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S013",site:"North Site",name:"Electrical Room",type:"Utility",floor:"B1",building:"Tower 1",capacity:2,occupied:1,status:"maintenance",lastInspection:"2026-03-05",area:150,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  // South Campus
  {id:"S014",site:"South Campus",name:"Auditorium",type:"Conference",floor:"G",building:"Wing A",capacity:300,occupied:0,status:"available",lastInspection:"2026-03-08",area:8000,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S015",site:"South Campus",name:"Labs Block",type:"Workstation",floor:"1",building:"Wing B",capacity:50,occupied:45,status:"occupied",lastInspection:"2026-03-22",area:2200,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S016",site:"South Campus",name:"Visitor Parking",type:"Parking",floor:"G",building:"Wing A",capacity:80,occupied:52,status:"occupied",lastInspection:"2026-03-14",area:3500,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"S017",site:"South Campus",name:"Canteen",type:"Cafeteria",floor:"G",building:"Wing B",capacity:80,occupied:35,status:"occupied",lastInspection:"2026-03-19",area:1800,createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
];

export const INCIDENTS: Incident[] = [
  {
    id:"I001",incidentNumber:"INC-2026-001",
    title:"Water Leakage – 2nd Floor Washroom",
    description:"Water seeping from ceiling of 2F men's washroom. Carpet damage visible.",
    severity:"high",status:"investigating",
    location:"2nd Floor, Block A, Men's Washroom",
    reportedBy:"Karan Gupta",reportedAt:"2026-03-31T08:15:00",
    assignedTo:"U003",category:"Plumbing",
    timeline:[
      {id:"T1",action:"Incident Reported",performedBy:"Karan Gupta",timestamp:"2026-03-31T08:15:00"},
      {id:"T2",action:"Assigned to Rahul Mehta",performedBy:"Arjun Sharma",timestamp:"2026-03-31T08:45:00"},
      {id:"T3",action:"Investigation Started",performedBy:"Rahul Mehta",timestamp:"2026-03-31T09:30:00"},
    ],
    createdAt: "2026-03-31T08:15:00Z", updatedAt: "2026-03-31T09:30:00Z",
  },

  {
    id:"I002",incidentNumber:"INC-2026-002",
    title:"Power Outage – Server Room UPS Fault",
    description:"UPS unit tripped causing 4-minute downtime in server room.",
    severity:"critical",status:"resolved",
    location:"Server Room, Ground Floor, Block B",
    reportedBy:"Sneha Iyer",reportedAt:"2026-03-29T14:00:00",
    assignedTo:"U004",category:"Electrical",resolvedAt:"2026-03-29T16:30:00",
    timeline:[
      {id:"T4",action:"Incident Reported",performedBy:"Sneha Iyer",timestamp:"2026-03-29T14:00:00"},
      {id:"T5",action:"Resolved – UPS replaced",performedBy:"Sneha Iyer",timestamp:"2026-03-29T16:30:00"},
    ],
    createdAt: "2026-03-29T14:00:00Z", updatedAt: "2026-03-29T16:30:00Z",
  },

  {
    id:"I003",incidentNumber:"INC-2026-003",
    title:"Broken Window – Conference Room 302",
    description:"Window glass cracked, safety hazard.",
    severity:"medium",status:"reported",
    location:"Conference Room 302, 3rd Floor",
    reportedBy:"Priya Nair",reportedAt:"2026-04-01T07:00:00",
    category:"Infrastructure",
    timeline:[
      {id:"T6",action:"Incident Reported",performedBy:"Priya Nair",timestamp:"2026-04-01T07:00:00"},
    ],
    createdAt: "2026-04-01T07:00:00Z", updatedAt: "2026-04-01T07:00:00Z",
  },

];

export const INVENTORY: InventoryItem[] = [
  {id:"INV001",code:"SPR-HVAC-F01",name:"HVAC Air Filter (G4)",category:"HVAC Spares",unit:"Pcs",quantity:8,minQuantity:4,maxQuantity:20,status:"in_stock",location:"Store A-1",supplierName:"SwiftTech HVAC",unitCost:850,lastRestocked:"2026-02-01",createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"INV002",code:"SPR-ELEC-B01",name:"MCB 32A (Schneider)",category:"Electrical",unit:"Pcs",quantity:2,minQuantity:5,maxQuantity:20,status:"low_stock",location:"Store A-2",supplierName:"ElectroHub",unitCost:420,lastRestocked:"2026-01-15",createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"INV003",code:"CLN-001",name:"Floor Cleaning Solution (5L)",category:"Housekeeping",unit:"Can",quantity:0,minQuantity:3,maxQuantity:15,status:"out_of_stock",location:"Housekeeping Store",supplierName:"CleanPro",unitCost:650,lastRestocked:"2026-03-01",createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"INV004",code:"SPR-PUMP-B01",name:"Pump Bearing 6205",category:"Plumbing",unit:"Pcs",quantity:3,minQuantity:2,maxQuantity:10,status:"in_stock",location:"Store B-1",supplierName:"Kirloskar Spares",unitCost:1200,lastRestocked:"2026-03-20",createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"INV005",code:"LIGHT-LED-001",name:"LED Tube 18W (Philips)",category:"Electrical",unit:"Pcs",quantity:24,minQuantity:10,maxQuantity:60,status:"in_stock",location:"Store A-2",supplierName:"ElectroHub",unitCost:280,lastRestocked:"2026-03-15",createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
  {id:"INV006",code:"SPR-FIRE-001",name:"Fire Extinguisher ABC 6KG",category:"Fire Safety",unit:"Pcs",quantity:4,minQuantity:5,maxQuantity:20,status:"low_stock",location:"Store B-2",supplierName:"Safeguard Fire",unitCost:2200,lastRestocked:"2026-01-10",createdAt:"2024-01-15T00:00:00Z",updatedAt:"2024-01-15T00:00:00Z"},
];
