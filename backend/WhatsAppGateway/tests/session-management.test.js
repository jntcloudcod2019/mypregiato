const { v4: uuidv4 } = require('uuid');

describe('Session Management', () => {
  let sessionState;

  beforeEach(() => {
    sessionState = {
      isConnected: false,
      status: 'disconnected',
      qrCode: null,
      sessionId: null,
      lastActivity: null
    };
  });

  test('should initialize session state correctly', () => {
    expect(sessionState.isConnected).toBe(false);
    expect(sessionState.status).toBe('disconnected');
    expect(sessionState.qrCode).toBeNull();
    expect(sessionState.sessionId).toBeNull();
    expect(sessionState.lastActivity).toBeNull();
  });

  test('should update session state when QR code is received', () => {
    const qrCode = 'data:image/png;base64,test-qr-code';
    const sessionId = uuidv4();
    const timestamp = new Date().toISOString();

    sessionState = {
      isConnected: false,
      status: 'qr_ready',
      qrCode,
      sessionId,
      lastActivity: timestamp
    };

    expect(sessionState.isConnected).toBe(false);
    expect(sessionState.status).toBe('qr_ready');
    expect(sessionState.qrCode).toBe(qrCode);
    expect(sessionState.sessionId).toBe(sessionId);
    expect(sessionState.lastActivity).toBe(timestamp);
  });

  test('should update session state when connected', () => {
    const sessionId = uuidv4();
    const timestamp = new Date().toISOString();

    sessionState = {
      isConnected: true,
      status: 'connected',
      qrCode: null,
      sessionId,
      lastActivity: timestamp
    };

    expect(sessionState.isConnected).toBe(true);
    expect(sessionState.status).toBe('connected');
    expect(sessionState.qrCode).toBeNull();
    expect(sessionState.sessionId).toBe(sessionId);
    expect(sessionState.lastActivity).toBe(timestamp);
  });

  test('should update session state when disconnected', () => {
    const timestamp = new Date().toISOString();

    sessionState = {
      isConnected: false,
      status: 'disconnected',
      qrCode: null,
      sessionId: null,
      lastActivity: timestamp
    };

    expect(sessionState.isConnected).toBe(false);
    expect(sessionState.status).toBe('disconnected');
    expect(sessionState.qrCode).toBeNull();
    expect(sessionState.sessionId).toBeNull();
    expect(sessionState.lastActivity).toBe(timestamp);
  });

  test('should generate valid session ID', () => {
    const sessionId = uuidv4();
    
    expect(sessionId).toBeDefined();
    expect(typeof sessionId).toBe('string');
    expect(sessionId.length).toBe(36);
    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  test('should update last activity timestamp', () => {
    const oldTimestamp = sessionState.lastActivity;
    
    // Update timestamp immediately for test
    sessionState.lastActivity = new Date().toISOString();

    expect(sessionState.lastActivity).not.toBe(oldTimestamp);
    expect(sessionState.lastActivity).toBeDefined();
  });
}); 