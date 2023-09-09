import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, ApiResponseOptions, getSchemaPath } from "@nestjs/swagger";
import { ListPageDto } from "../dtos/listPage.dto";

export const ApiListPageOkResponse = <TModel extends Type<any>>(
  model: TModel,
  responseOptions?: ApiResponseOptions
) => {
  return applyDecorators(
    ApiExtraModels(ListPageDto),
    ApiExtraModels(model),
    ApiOkResponse({
      ...responseOptions,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ListPageDto) },
          {
            properties: {
              items: {
                type: "array",
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    })
  );
};
