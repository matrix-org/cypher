/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import VersionSchema from './schemas/VersionSchema';
import WellKnownSchema from './schemas/WellKnownSchema';
import UserSchema, { UserType } from './schemas/UserSchema';
import RoomAliasSchema, {
    RoomAliasSchemaType,
} from './schemas/RoomAliasSchema';
import PublicRoomsSchema, {
    PublicRooms,
    PublicRoomsChunk,
} from './schemas/PublicRoomsSchema';
import EventSchema, {
    EventType,
} from './schemas/EventSchema';


import { isTrue, ensure, yupCast, any } from './utils/promises';
import { prefixFetch, parseJSON } from './utils/fetch';

/*
 * A client is a resolved homeserver name wrapped in a lambdad fetch
 */
export type Client = (path: string) => Promise<Response>;

/*
 * Confirms that the target homeserver is properly configured and operational
 */
export const validateHS = (host: string) =>
    prefixFetch(host)('/_matrix/client/versions')
        .then(parseJSON)
        .then(x => VersionSchema.isValid(x))
        .then(isTrue(() => host, new Error('Host versions file incorrect')));

/*
 * Discovers the correct domain name for the host according to the spec's
 * discovery rules
 */
export const discoverServer = (host: string) =>
    prefixFetch(host)('/.well-known/matrix/client')
        .then(resp => resp.ok
            ? resp.json()
                .then(yupCast(WellKnownSchema))
                .then(content => {
                    if (content === undefined) return host;
                    else if (
                        'm.homeserver' in content && content['m.homeserver']
                    ) {
                        return content['m.homeserver'].base_url
                    } else {
                        return host
                    }
                })
            : ensure(
                resp.status == 404,
                () => host,
            ),
        )
        .then(validateHS)


/*
 * Takes a hs domain and resolves it to it's current domain and returns a
 * client
 */
export async function client(host: string): Promise<Client> {
    return prefixFetch(await discoverServer(host))
}

/*
 * Gets the details for a user
 */
export function getUserDetails(
    client: Client,
    userId: string,
): Promise<UserType> {
    return client(`/_matrix/client/r0/profile/${userId}`)
        .then(parseJSON)
        .then(yupCast(UserSchema))
}

/*
 * Gets the roomId of a room by resolving it's alias
 */
export function getRoomIdFromAlias(
    client: Client,
    roomAlias: string,
): Promise<RoomAliasSchemaType> {
    const encodedRoomAlias = encodeURIComponent(roomAlias);
    return client(`/_matrix/client/r0/directory/room/${encodedRoomAlias}`)
        .then(parseJSON)
        .then(yupCast(RoomAliasSchema));
}

/*
 * Gets the details of a room if that room is public
 */
export function getRoomDetails(clients: Client[], roomId: string) {
    return any(clients.map(client => searchPublicRooms(client, roomId)));
}

/*
 * Gets a list of all public rooms on a hs
 */
export function getPublicRooms(client: Client): Promise<PublicRooms> {
    return getPublicRoomsUnsafe(client)
        .then(yupCast(PublicRoomsSchema))
}

/*
 * Similar to getPubliRooms however id doesn't confirm the data returned from
 * the hs is correct
 *
 * This is used because the room list can be huge and validating it all takes
 * a long time
 */
export function getPublicRoomsUnsafe(client: Client): Promise<PublicRooms> {
    // TODO: Do not assume server will return all results in one go
    return client('/_matrix/client/r0/publicRooms')
        .then(parseJSON)
}

/*
 * Searches the public rooms of a homeserver for the metadata of a particular
 */
export async function searchPublicRooms(
    client: Client,
    roomId: string,
): Promise<PublicRoomsChunk> {
    // we use the unsage version here because the safe one is sloooow
    return getPublicRoomsUnsafe(client)
        .then(rooms => {
            const [match] = rooms.chunk.filter(
                chunk => chunk.room_id === roomId,
            );
            return match !== undefined
                ? Promise.resolve(match)
                : Promise.reject(new Error(
                    `This server knowns no public room with id ${roomId}`,
                ));
        });
}

/*
 * Gets the details of an event from the homeserver
 */
export async function getEvent(
    client: Client,
    roomIdOrAlias: string,
    eventId: string,
): Promise<EventType> {
    return client(`/_matrix/client/r0/rooms/${roomIdOrAlias}/event/${eventId}`)
        .then(parseJSON)
        .then(yupCast(EventSchema));
}

