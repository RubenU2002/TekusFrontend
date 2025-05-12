export interface Provider {
  id: string;
  nit: string;
  name: string;
  email: string;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  services: Service[];
  customAttributes: CustomAttribute[];
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  hourlyRate: number;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  countries: ServiceCountry[];
}

export interface ServiceCountry {
  id: string;
  serviceId: string;
  countryCode: string;
}

export interface CustomAttribute {
  id: string;
  providerId: string;
  key: string;
  value: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Country {
  code: string;
  name: string;
  region: string;
}