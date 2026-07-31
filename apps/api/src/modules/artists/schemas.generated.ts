import { Type } from "@sinclair/typebox";

import type { ListArtists as ListArtistsResponseMapper } from "./artist-api-to-web-mapper.ts";

export type ListArtistsReply = Awaited<ReturnType<typeof ListArtistsResponseMapper>>;

export const ListArtistsReplySchema = Type.Unsafe<ListArtistsReply>(
  {
    "type": "object",
    "properties": {
      "data": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "countryCode": {
              "anyOf": [
                {
                  "type": "string"
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
              "type": "string"
            },
            "recordLabel": {
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
            "countryCode",
            "id",
            "imageUrl",
            "name",
            "recordLabel"
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
