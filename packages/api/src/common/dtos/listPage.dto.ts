import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ListPageMetaDto {
  @ApiProperty({
    minimum: 1,
    description: "The current page one-based index",
    example: 1,
  })
  public readonly currentPage: number;

  @ApiProperty({
    minimum: 0,
    description: "The amount of items on the current page (the length of items array)",
    example: 5,
  })
  public readonly itemCount: number;

  @ApiProperty({
    minimum: 1,
    description: "The requested items per page",
    example: 10,
  })
  public readonly itemsPerPage: number;

  @ApiProperty({
    minimum: 0,
    description: "The total amount of items",
    example: 15,
  })
  public readonly totalItems: number;

  @ApiProperty({
    minimum: 0,
    description: "The total amount of pages",
    example: 5,
  })
  public readonly totalPages: number;
}

export class ListPageLinksDto {
  @ApiProperty({
    description: "A URL for the first page to call",
    example: "{{entityListEndpoint}}?limit=10",
  })
  public readonly first: string;

  @ApiPropertyOptional({
    description: "A URL for the last page to call, '' if no items in the collection",
    example: "{{entityListEndpoint}}?page=4&limit=10",
    examples: ["{{entityListEndpoint}}?page=4&limit=10", ""],
  })
  public readonly last: string;

  @ApiPropertyOptional({
    description: "A URL for the next page to call, '' if no next page to call",
    example: "{{entityListEndpoint}}?page=4&limit=10",
    examples: ["{{entityListEndpoint}}?page=4&limit=10", ""],
  })
  public readonly next: string;

  @ApiPropertyOptional({
    description: "A URL for the previous page to call, '' if no previous page to call",
    example: "{{entityListEndpoint}}?page=2&limit=10",
    examples: ["{{entityListEndpoint}}?page=2&limit=10", ""],
  })
  public readonly previous: string;
}

export class ListPageDto<T> {
  @ApiProperty({ isArray: true, description: "An array of items" })
  public readonly items: T[];

  @ApiProperty({ type: ListPageMetaDto, description: "An object with a paging configuration" })
  public readonly meta: ListPageMetaDto;

  @ApiPropertyOptional({
    type: ListPageLinksDto,
    description: "An object with first, last, next, previous links defined if available.",
  })
  public readonly links?: ListPageLinksDto;
}
