'use strict';

/**
 * Unit tests for Drive route handlers
 *
 * Tests route handler logic by calling handlers directly with mock req/res objects,
 * avoiding the need to load the full Express app (which requires a DB connection).
 *
 * Requirements: 3.1–3.7, 5.1–5.6, 11.1–11.5
 */

// ── Environment stubs ──────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DRIVE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32).toString('base64');
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.DRIVE_OAUTH_REDIRECT_URI = 'http://localhost/callback';

// ── Mock DriveService ──────────────────────────────────────────────────────
class DriveNotConnectedError extends Error {
  constructor() {
    super('Google Drive is not connected.');
    this.name = 'DriveNotConnectedError';
    this.statusCode = 403;
  }
}
class DriveTokenRevokedError extends Error {
  constructor() {
    super('Drive token revoked. Please reconnect.');
    this.name = 'DriveTokenRevokedError';
    this.statusCode = 401;
  }
}
class DrivePermissionError extends Error {
  constructor(msg) {
    super(msg || 'Cannot modify sharing: file is in a shared drive you do not own.');
    this.name = 'DrivePermissionError';
    this.statusCode = 403;
  }
}

const mockDriveService = {
  isConfigured: jest.fn().mockReturnValue(true),
  connectDrive: jest.fn(),
  disconnectDrive: jest.fn(),
  getPickerToken: jest.fn(),
  ensureFileShared: jest.fn(),
  DriveNotConnectedError,
  DriveTokenRevokedError,
  DrivePermissionError,
};

jest.mock('../../services/DriveService', () => mockDriveService);

// ── Mock models (prevent DB connection) ───────────────────────────────────
jest.mock('../../models', () => ({
  users: {
    findOne: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue([1]),
  },
  Sequelize: { Op: {} },
  sequelize: { authenticate: jest.fn(), sync: jest.fn() },
}));

// ── Helper: build mock req/res ─────────────────────────────────────────────
function mockReq(overrides = {}) {
  return {
    user_id: 42,
    role: 'convener',
    body: {},
    params: {},
    query: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
  };
  return res;
}

// ── Load route handlers ────────────────────────────────────────────────────
// We extract the handler functions by registering them on a fake app object
// instead of loading the full Express app.

let handlers = {};

beforeAll(() => {
  const fakeApp = {
    post: jest.fn((path, ...args) => {
      const handler = args[args.length - 1];
      handlers[`POST ${path}`] = handler;
    }),
    get: jest.fn((path, ...args) => {
      const handler = args[args.length - 1];
      handlers[`GET ${path}`] = handler;
    }),
  };

  // Load the route module with the fake app
  require('../../routes/drive')(fakeApp);
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /v1/api/drive/connect', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with connected email on valid code', async () => {
    mockDriveService.connectDrive.mockResolvedValue({ email: 'user@gmail.com' });
    const req = mockReq({ body: { code: 'valid-auth-code' } });
    const res = mockRes();

    await handlers['POST /v1/api/drive/connect'](req, res);

    expect(res._status).toBe(200);
    expect(res._body.connected).toBe(true);
    expect(res._body.email).toBe('user@gmail.com');
  });

  it('returns 400 when code is missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await handlers['POST /v1/api/drive/connect'](req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toBe(true);
    expect(res._body.message).toMatch(/code/i);
  });

  it('returns 500 when DriveService throws a generic error', async () => {
    mockDriveService.connectDrive.mockRejectedValue(new Error('Failed to connect Google Drive.'));
    const req = mockReq({ body: { code: 'bad-code' } });
    const res = mockRes();

    await handlers['POST /v1/api/drive/connect'](req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe(true);
  });
});

describe('POST /v1/api/drive/disconnect', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when disconnection succeeds', async () => {
    mockDriveService.disconnectDrive.mockResolvedValue();
    const req = mockReq();
    const res = mockRes();

    await handlers['POST /v1/api/drive/disconnect'](req, res);

    expect(res._status).toBe(200);
    expect(res._body.disconnected).toBe(true);
  });

  it('returns 500 when DriveService throws', async () => {
    mockDriveService.disconnectDrive.mockRejectedValue(new Error('unexpected'));
    const req = mockReq();
    const res = mockRes();

    await handlers['POST /v1/api/drive/disconnect'](req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe(true);
  });
});

describe('GET /v1/api/drive/picker-token', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with accessToken and appId for connected convener', async () => {
    mockDriveService.getPickerToken.mockResolvedValue({
      accessToken: 'ya29.access-token',
      appId: 'test-client-id',
    });
    const req = mockReq();
    const res = mockRes();

    await handlers['GET /v1/api/drive/picker-token'](req, res);

    expect(res._status).toBe(200);
    expect(res._body.accessToken).toBe('ya29.access-token');
    expect(res._body.appId).toBe('test-client-id');
    // Requirement 3.7: refresh token must NOT appear in response
    expect(JSON.stringify(res._body)).not.toContain('refresh_token');
  });

  it('returns 403 when Drive is not connected', async () => {
    mockDriveService.getPickerToken.mockRejectedValue(new DriveNotConnectedError());
    const req = mockReq();
    const res = mockRes();

    await handlers['GET /v1/api/drive/picker-token'](req, res);

    expect(res._status).toBe(403);
    expect(res._body.message).toMatch(/not connected/i);
  });

  it('returns 401 when Drive token is revoked', async () => {
    mockDriveService.getPickerToken.mockRejectedValue(new DriveTokenRevokedError());
    const req = mockReq();
    const res = mockRes();

    await handlers['GET /v1/api/drive/picker-token'](req, res);

    expect(res._status).toBe(401);
    expect(res._body.message).toMatch(/revoked/i);
  });

  it('returns 429 on rate limit error', async () => {
    const err = new Error('Google Drive rate limit reached. Please try again shortly.');
    err.statusCode = 429;
    mockDriveService.getPickerToken.mockRejectedValue(err);
    const req = mockReq();
    const res = mockRes();

    await handlers['GET /v1/api/drive/picker-token'](req, res);

    expect(res._status).toBe(429);
  });

  it('returns 503 on service unavailable error', async () => {
    const err = new Error('Google Drive is currently unavailable.');
    err.statusCode = 503;
    mockDriveService.getPickerToken.mockRejectedValue(err);
    const req = mockReq();
    const res = mockRes();

    await handlers['GET /v1/api/drive/picker-token'](req, res);

    expect(res._status).toBe(503);
  });
});

describe('POST /v1/api/drive/ensure-shared', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with alreadyShared:true when file is already public', async () => {
    mockDriveService.ensureFileShared.mockResolvedValue({ shared: true, alreadyShared: true });
    const req = mockReq({ body: { fileId: 'file-abc-123' } });
    const res = mockRes();

    await handlers['POST /v1/api/drive/ensure-shared'](req, res);

    expect(res._status).toBe(200);
    expect(res._body.shared).toBe(true);
    expect(res._body.alreadyShared).toBe(true);
  });

  it('returns 200 with alreadyShared:false when sharing is newly set', async () => {
    mockDriveService.ensureFileShared.mockResolvedValue({ shared: true, alreadyShared: false });
    const req = mockReq({ body: { fileId: 'file-xyz-456' } });
    const res = mockRes();

    await handlers['POST /v1/api/drive/ensure-shared'](req, res);

    expect(res._status).toBe(200);
    expect(res._body.shared).toBe(true);
    expect(res._body.alreadyShared).toBe(false);
  });

  it('returns 400 when fileId is missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await handlers['POST /v1/api/drive/ensure-shared'](req, res);

    expect(res._status).toBe(400);
    expect(res._body.message).toMatch(/fileId/i);
  });

  it('returns 403 when file is in a shared drive the convener does not own', async () => {
    mockDriveService.ensureFileShared.mockRejectedValue(
      new DrivePermissionError('Cannot modify sharing: file is in a shared drive you do not own.')
    );
    const req = mockReq({ body: { fileId: 'shared-drive-file' } });
    const res = mockRes();

    await handlers['POST /v1/api/drive/ensure-shared'](req, res);

    expect(res._status).toBe(403);
    expect(res._body.message).toMatch(/shared drive/i);
  });

  it('returns 401 when Drive token is revoked', async () => {
    mockDriveService.ensureFileShared.mockRejectedValue(new DriveTokenRevokedError());
    const req = mockReq({ body: { fileId: 'some-file' } });
    const res = mockRes();

    await handlers['POST /v1/api/drive/ensure-shared'](req, res);

    expect(res._status).toBe(401);
  });

  it('returns 403 when Drive is not connected', async () => {
    mockDriveService.ensureFileShared.mockRejectedValue(new DriveNotConnectedError());
    const req = mockReq({ body: { fileId: 'some-file' } });
    const res = mockRes();

    await handlers['POST /v1/api/drive/ensure-shared'](req, res);

    expect(res._status).toBe(403);
  });

  it('returns 500 on unexpected error', async () => {
    mockDriveService.ensureFileShared.mockRejectedValue(new Error('unexpected'));
    const req = mockReq({ body: { fileId: 'some-file' } });
    const res = mockRes();

    await handlers['POST /v1/api/drive/ensure-shared'](req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe(true);
  });
});

// ── Access control tests (middleware-level) ────────────────────────────────
// These verify that the TokenMiddleware correctly rejects non-convener requests.
// We test this by checking the middleware directly.

describe('TokenMiddleware role enforcement (convener required)', () => {
  const TokenMiddleware = require('../../middleware/TokenMiddleware');
  const jwt = require('jsonwebtoken');

  function makeToken(role, userId = 1) {
    return jwt.sign({ user_id: userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }

  it('allows convener role through', () => {
    const middleware = TokenMiddleware({ role: 'convener' });
    const req = {
      headers: { authorization: `Bearer ${makeToken('convener')}` },
    };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res._status).toBeNull();
  });

  it('blocks student role with 403', () => {
    const middleware = TokenMiddleware({ role: 'convener' });
    const req = {
      headers: { authorization: `Bearer ${makeToken('student')}` },
    };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  it('blocks missing token with 401', () => {
    const middleware = TokenMiddleware({ role: 'convener' });
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('blocks expired token with 401', () => {
    const middleware = TokenMiddleware({ role: 'convener' });
    const expiredToken = jwt.sign(
      { user_id: 1, role: 'convener' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });
});
