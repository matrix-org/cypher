import {
    client,
    discoverServer,
    getUserDetails,
    Client,
    getRoomIdFromAlias,
    getPublicRooms,
    searchPublicRooms,
    getEvent,
} from '../src/matrix-cypher';

let testClient: Client;

const error404 = new Error('Error from Homeserver. Error code: 404');

beforeAll(async () => {
    testClient = await client('https://matrix.org');
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
    await expect(getUserDetails(testClient, '@jorik:matrix.org'))
        .resolves
        .toStrictEqual({
      'avatar_url': 'mxc://matrix.org/EqMZYbAYhREvHXvYFyfxOlkf',
      'displayname': 'Jorik (Old)',
        });
});

it('doesn\'t get non-existent user\'s data', async () => {
    await expect(getUserDetails(testClient, '@falangarok:matrix.org'))
        .rejects
        .toStrictEqual(error404);
});

it('resolves roomaliases', async () => {
    await expect(getRoomIdFromAlias(testClient, '#element-dev:matrix.org'))
        .resolves
        .toHaveProperty('room_id', '!bEWtlqtDwCLFIAKAcv:matrix.org');
});

it('doesn\'t resolve non-existent roomaliases', async () => {
    await expect(getRoomIdFromAlias(testClient, '#falangarok-lounge:matrix.org'))
        .rejects
        .toStrictEqual(error404);
});

it('gets public room data', async () => {
    await expect(getPublicRooms(testClient))
        .resolves
        .toHaveProperty('chunk');
}, 10000);

it('finds a room in public rooms', async () => {
    await expect(searchPublicRooms(testClient, '!bEWtlqtDwCLFIAKAcv:matrix.org'))
        .resolves
        .toHaveProperty('avatar_url')
}, 10000);

// This will fail, the event enfpoint requires auth
it('finds an event', async () => {
    await expect(getEvent(
        testClient,
        '!OGEhHVWSdvArJzumhm:matrix.org',
        '$MsC19hNiTeRFFhyPdgP0RneLnYX7QCQ1Ty7fLi5-EFM',
    )).resolves
        .toStrictEqual({
        });
});
