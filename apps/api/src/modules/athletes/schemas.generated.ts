import { Type } from "@sinclair/typebox";

import type { ListAthletes as ListAthletesResponseMapper } from "./athlete-api-to-web-mapper.ts";
import type { AthleteFilterOptions as AthleteFilterOptionsResponseMapper } from "./athlete-filter-options-api-to-web-mapper.ts";

export type ListAthletesReply = Awaited<ReturnType<typeof ListAthletesResponseMapper>>;

export const ListAthletesReplySchema = Type.Unsafe<ListAthletesReply>(
  {
    "type": "object",
    "properties": {
      "data": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "cmScore": {
              "anyOf": [
                {
                  "type": "number"
                },
                {
                  "type": "null"
                }
              ]
            },
            "id": {
              "type": "number"
            },
            "imageUrl": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ]
            },
            "name": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ]
            },
            "nationality": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ]
            },
            "sport": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ]
            },
            "type": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "cmScore",
            "id",
            "imageUrl",
            "name",
            "nationality",
            "sport",
            "type"
          ]
        }
      },
      "meta": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "number"
          },
          "offset": {
            "type": "number"
          }
        },
        "required": [
          "limit",
          "offset"
        ]
      }
    },
    "required": [
      "data",
      "meta"
    ]
  },
);

export type AthleteFilterOptionsReply = Awaited<ReturnType<typeof AthleteFilterOptionsResponseMapper>>;

export const AthleteFilterOptionsReplySchema = Type.Unsafe<AthleteFilterOptionsReply>(
  {
    "type": "object",
    "properties": {
      "cmScore": {
        "type": "object",
        "properties": {
          "max": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ]
          },
          "min": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ]
          }
        },
        "required": [
          "max",
          "min"
        ]
      },
      "nationalities": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "count": {
              "type": "number"
            },
            "value": {
              "type": "string"
            }
          },
          "required": [
            "count",
            "value"
          ]
        }
      },
      "sports": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "count": {
              "type": "number"
            },
            "value": {
              "type": "string"
            }
          },
          "required": [
            "count",
            "value"
          ]
        }
      },
      "types": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "count": {
              "type": "number"
            },
            "value": {
              "type": "string"
            }
          },
          "required": [
            "count",
            "value"
          ]
        }
      }
    },
    "required": [
      "cmScore",
      "nationalities",
      "sports",
      "types"
    ]
  },
);
