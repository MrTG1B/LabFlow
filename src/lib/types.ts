

export type Experiment = {
  id: string;
  name: string;
  project: string;
  personnel: string;
  status: "In Progress" | "Completed" | "Planned" | "On Hold";
  startDate: string;
};

export const inventoryItemTypes = ["Capacitor", "Resistor", "IC", "Connector", "Misc"] as const;

export type InventoryItemType = typeof inventoryItemTypes[number];

export type InventoryItem = {
  id: string;
  name:string;
  type: InventoryItemType;
  value: string;
  quantity?: number;
  unit?: string;
  partNumber?: string;
  description?: string;
  barcode?: string;
  imageUrl?: string;
  vendorId?: string;
  rate?: number;
  createdAt?: string;
};

export type Vendor = {
  id: string;
  name: string;
};

export type Equipment = {
  id: string;
  name: string;
  status: "Available" | "In Use" | "Under Maintenance";
  lastMaintenance: string;
  nextMaintenance: string;
  lastUsedBy: string;
};

export type Result = {
  id: string;
  experiment: string;
  date: string;
  recordedBy: string;
  dataSnippet: string;
};

export type RecentActivity = {
    id: string;
    activity: string;
    user: string;
    date: string;
    status: 'Completed' | 'In Progress';
}
