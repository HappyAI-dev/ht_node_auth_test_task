import { PaginationDto } from '../dto/base.dto';

export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginationDto {
  return {
    data,
    total,
    page,
    limit,
  };
}
