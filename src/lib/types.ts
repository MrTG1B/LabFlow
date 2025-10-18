

export type Experiment = {
  id: string;
  name: string;
  project: string;
  personnel: string;
  status: "In Progress" | "Completed" | "Planned" | "On Hold";
  startDate: string;
};

export const inventoryItemTypes = ["Capacitor", "Resistor", "IC", "Connector", "Misc"] as const;

export type InventoryItemType = {
  id: string;
  name: string;
  color: string;
}

type UpdateUser = {
    uid: string;
    displayName: string;
    post?: string;
    device?: 'Desktop' | 'Mobile';
}

export type InventoryItem = {
  id: string;
  name:string;
  type: string; // Now a string to allow for custom types
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
  updatedAt?: string;
  updatedBy?: UpdateUser;
};

export const vendorTypes = ["Online", "Offline"] as const;
export type VendorType = typeof vendorTypes[number];

export type Vendor = {
  id: string;
  name: string;
  type?: VendorType;
  website?: string;
  phone?: string;
  address?: string;
  updatedAt?: string;
  updatedBy?: UpdateUser;
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

export const salutations = ["Mr.", "Mrs.", "Ms."] as const;
export type Salutation = typeof salutations[number];

export const genders = ["Male", "Female", "Other", "Prefer not to say"] as const;
export type Gender = typeof genders[number];


export type User = {
    uid: string;
    email: string | null;
    firstName: string;
    lastName: string;
    phone: string;
    post?: string;
    displayName: string;
    salutation: Salutation;
    gender: Gender;
    createdAt: string;
}
