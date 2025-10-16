export type Experiment = {
  id: string;
  name: string;
  project: string;
  personnel: string;
  status: "In Progress" | "Completed" | "Planned" | "On Hold";
  startDate: string;
};

export type InventoryItem = {
  id: string;
  name:string;
  type: "Capacitor" | "Resistor" | "IC" | "Connector" | "Misc";
  quantity: number;
  unit: string;
  value?: string;
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

    