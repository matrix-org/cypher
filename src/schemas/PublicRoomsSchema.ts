/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { object, array, string, boolean, number, InferType } from 'yup';

export const RoomSchema = object({
  aliases: array().of(string().required()),
  canonical_alias: string(),
  name: string(),
  num_joined_members: number().required(),
  room_id: string().required(),
  topic: string(),
  world_readable: boolean().required(),
  guest_can_join: boolean().required(),
  avatar_url: string(),
}).required();

const PublicRoomsSchema = object({
  chunk: array().of(RoomSchema.required()).required(),
  next_batch: string(),
  prev_batch: string(),
  total_room_count_estimate: number(),
}).required();

export type Room = InferType<typeof RoomSchema>;
export type PublicRooms = InferType<typeof PublicRoomsSchema>;

export default PublicRoomsSchema;

