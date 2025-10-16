
import { Experiment, InventoryItem, Equipment, Result, RecentActivity } from "./types";

export const experiments: Experiment[] = [
  { id: "EXP001", name: "FPGA Signal Processing", project: "Project Alpha", personnel: "Dr. Evelyn Reed", status: "In Progress", startDate: "2024-05-01" },
  { id: "EXP002", name: "Power Supply Noise Analysis", project: "Project Beta", personnel: "Dr. Ben Carter", status: "Completed", startDate: "2024-04-22" },
  { id: "EXP003", name: "MCU Firmware Debugging", project: "Project Gamma", personnel: "Dr. Chloe Yao", status: "In Progress", startDate: "2024-05-05" },
  { id: "EXP004", name: "Antenna Gain Measurement", project: "Project Alpha", personnel: "Dr. Evelyn Reed", status: "Planned", startDate: "2024-06-01" },
  { id: "EXP005", name: "SoC Thermal Throttling Test", project: "Project Gamma", personnel: "Dr. Chloe Yao", status: "Completed", startDate: "2024-03-15" },
];

export const inventory: InventoryItem[] = [
];

export const equipment: Equipment[] = [
  { id: "EQ001", name: "Oscilloscope", status: "Available", lastMaintenance: "2024-03-10", nextMaintenance: "2024-09-10", lastUsedBy: "Dr. Chloe Yao" },
  { id: "EQ002", name: "Logic Analyzer", status: "In Use", lastMaintenance: "2024-01-15", nextMaintenance: "2024-07-15", lastUsedBy: "Dr. Ben Carter" },
  { id: "EQ003", name: "Spectrum Analyzer", status: "Under Maintenance", lastMaintenance: "2024-05-10", nextMaintenance: "2024-05-18", lastUsedBy: "Dr. Evelyn Reed" },
  { id: "EQ004", name: "SMD Rework Station", status: "Available", lastMaintenance: "2024-04-01", nextMaintenance: "2024-10-01", lastUsedBy: "Dr. Chloe Yao" },
];

export const results: Result[] = [
  { id: "RES-240506-001", experiment: "Power Supply Noise Analysis", date: "2024-05-06", recordedBy: "Dr. Ben Carter", dataSnippet: "Noise at 120Hz is within spec. 5V rail stable under load." },
  { id: "RES-240505-001", experiment: "MCU Firmware Debugging", date: "2024-05-05", recordedBy: "Dr. Chloe Yao", dataSnippet: "Stack overflow identified on ADC interrupt. Increasing stack size." },
  { id: "RES-240502-001", experiment: "FPGA Signal Processing", date: "2024-05-02", recordedBy: "Dr. Evelyn Reed", dataSnippet: "FFT core implemented. Latency at 256 cycles. Pipelining can be improved." },
  { id: "RES-240318-001", experiment: "SoC Thermal Throttling Test", date: "2024-03-18", recordedBy: "Dr. Chloe Yao", dataSnippet: "Core temp reaches 85C after 10 mins at full load. Throttling kicks in as expected." },
];

export const recentActivities: RecentActivity[] = [
    { id: "ACT001", activity: "Logged new result for EXP002", user: "Dr. Ben Carter", date: "2 hours ago", status: "Completed" },
    { id: "ACT002", activity: "Started experiment EXP003", user: "Dr. Chloe Yao", date: "5 hours ago", status: "In Progress" },
    { id: "ACT003", activity: "Updated inventory for 10k Resistors", user: "Lab Tech", date: "1 day ago", status: "Completed" },
    { id: "ACT004", activity: "Reported issue with Oscilloscope Probe", user: "Dr. Evelyn Reed", date: "2 days ago", status: "Completed" },
]
