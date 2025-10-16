import { Experiment, InventoryItem, Equipment, Result, RecentActivity } from "./types";

export const experiments: Experiment[] = [
  { id: "EXP001", name: "Protein Synthesis Analysis", project: "Project Alpha", personnel: "Dr. Evelyn Reed", status: "In Progress", startDate: "2024-05-01" },
  { id: "EXP002", name: "Cell Culture Contamination Check", project: "Project Beta", personnel: "Dr. Ben Carter", status: "Completed", startDate: "2024-04-22" },
  { id: "EXP003", name: "Gene Sequencing Run", project: "Project Gamma", personnel: "Dr. Chloe Yao", status: "In Progress", startDate: "2024-05-05" },
  { id: "EXP004", name: "Drug Efficacy Trial - Phase 1", project: "Project Alpha", personnel: "Dr. Evelyn Reed", status: "Planned", startDate: "2024-06-01" },
  { id: "EXP005", name: "CRISPR-Cas9 Gene Editing", project: "Project Gamma", personnel: "Dr. Chloe Yao", status: "Completed", startDate: "2024-03-15" },
];

export const inventory: InventoryItem[] = [
  { id: "INV001", name: "DMEM Medium", type: "Reagent", quantity: 5, unit: "L", location: "Fridge A-2", expirationDate: "2025-12-31" },
  { id: "INV002", name: "HeLa Cell Line", type: "Sample", quantity: 20, unit: "Vials", location: "Cryo Tank 1", expirationDate: "2026-01-01" },
  { id: "INV003", name: "Fetal Bovine Serum", type: "Reagent", quantity: 8, unit: "Bottles", location: "Fridge A-2", expirationDate: "2025-06-30" },
  { id: "INV004", name: "Trypsin-EDTA", type: "Reagent", quantity: 2, unit: "Bottles", location: "Cabinet 3", expirationDate: "2024-08-01" },
  { id: "INV005", name: "Human Tissue Sample #52", type: "Sample", quantity: 1, unit: "Slide", location: "Pathology Shelf", expirationDate: "N/A" },
];

export const equipment: Equipment[] = [
  { id: "EQ001", name: "PCR Machine", status: "Available", lastMaintenance: "2024-03-10", nextMaintenance: "2024-09-10", lastUsedBy: "Dr. Chloe Yao" },
  { id: "EQ002", name: "Centrifuge 5810R", status: "In Use", lastMaintenance: "2024-01-15", nextMaintenance: "2024-07-15", lastUsedBy: "Dr. Ben Carter" },
  { id: "EQ003", name: "Confocal Microscope", status: "Under Maintenance", lastMaintenance: "2024-05-10", nextMaintenance: "2024-05-18", lastUsedBy: "Dr. Evelyn Reed" },
  { id: "EQ004", name: "Gel Imager", status: "Available", lastMaintenance: "2024-04-01", nextMaintenance: "2024-10-01", lastUsedBy: "Dr. Chloe Yao" },
];

export const results: Result[] = [
  { id: "RES-240506-001", experiment: "Cell Culture Contamination Check", date: "2024-05-06", recordedBy: "Dr. Ben Carter", dataSnippet: "No visible contamination after 48 hours incubation. Proceeding with main experiment..." },
  { id: "RES-240505-001", experiment: "Gene Sequencing Run", date: "2024-05-05", recordedBy: "Dr. Chloe Yao", dataSnippet: "Run successful. Raw data output to /seq/gamma/050524.fastq.gz. Quality score avg: 35." },
  { id: "RES-240502-001", experiment: "Protein Synthesis Analysis", date: "2024-05-02", recordedBy: "Dr. Evelyn Reed", dataSnippet: "Initial Western blot shows faint bands for target protein X. Increasing antibody concentration for next run." },
  { id: "RES-240318-001", experiment: "CRISPR-Cas9 Gene Editing", date: "2024-03-18", recordedBy: "Dr. Chloe Yao", dataSnippet: "Editing efficiency confirmed at 85% via T7E1 assay. Clones selected for further analysis." },
];

export const recentActivities: RecentActivity[] = [
    { id: "ACT001", activity: "Logged new result for EXP002", user: "Dr. Ben Carter", date: "2 hours ago", status: "Completed" },
    { id: "ACT002", activity: "Started experiment EXP003", user: "Dr. Chloe Yao", date: "5 hours ago", status: "In Progress" },
    { id: "ACT003", activity: "Updated inventory for DMEM", user: "Lab Assistant", date: "1 day ago", status: "Completed" },
    { id: "ACT004", activity: "Reported issue with Centrifuge", user: "Dr. Evelyn Reed", date: "2 days ago", status: "Completed" },
]
