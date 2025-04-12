export class BaseDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  data: any[];
}
