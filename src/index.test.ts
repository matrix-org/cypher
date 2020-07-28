import {
    client,
    discoverServer,
    getUserDetails,
    Client,
    getRoomIdFromAlias,
    getPublicRooms,
    searchPublicRooms,
    getEvent,
} from './index';

let client: Client;

const error404 = new Error('Error from Homeserver. Error code: 404');

beforeAll(async () => {
    client = await client('https://matrix.org');
});

it('finds matrix.org', async () => {
    expect(await discoverServer('https://matrix.org'))
        .toBe('https://matrix-client.matrix.org')
});

it('doesn\'t find example.com', async () => {
    await expect(discoverServer('https://example.com'))
        .rejects
        .toStrictEqual(error404);
});

it('gets user data', async () => {
    await expect(getUserDetails(client, '@jorik:matrix.org'))
        .resolves
        .toStrictEqual({
      'avatar_url': 'mxc://matrix.org/EqMZYbAYhREvHXvYFyfxOlkf',
      'displayname': 'Jorik (Old)',
        });
});

it('doesn\'t get non-existent user\'s data', async () => {
    await expect(getUserDetails(client, '@falangarok:matrix.org'))
        .rejects
        .toStrictEqual(error404);
});

it('resolves roomaliases', async () => {
    await expect(getRoomIdFromAlias(client, '#element-dev:matrix.org'))
        .resolves
        .toHaveProperty('room_id', '!bEWtlqtDwCLFIAKAcv:matrix.org');
});

it('doesn\'t resolve non-existent roomaliases', async () => {
    await expect(getRoomIdFromAlias(client, '#falangarok-lounge:matrix.org'))
        .rejects
        .toStrictEqual(error404);
});

it('gets public room data', async () => {
    await expect(getPublicRooms(client))
        .resolves
        .toHaveProperty('chunk');
});

it('finds a room in public rooms', async () => {
    await expect(searchPublicRooms(client, '!bEWtlqtDwCLFIAKAcv:matrix.org'))
        .resolves
        .toHaveProperty('avatar_url')
});

// This will fail, the event enfpoint requires auth
it('finds an event', async () => {
    await expect(getEvent(
        client,
        '!OGEhHVWSdvArJzumhm:matrix.org',
        '$MsC19hNiTeRFFhyPdgP0RneLnYX7QCQ1Ty7fLi5-EFM',
    )).resolves
        .toStrictEqual({
        });
});
