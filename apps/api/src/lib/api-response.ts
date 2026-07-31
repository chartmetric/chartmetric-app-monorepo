type ApiResponseMapper = (...arguments_: never[]) => unknown;

export const defineApiResponse = <Mapper extends ApiResponseMapper>(
  mapper: Mapper,
): Mapper => mapper;
