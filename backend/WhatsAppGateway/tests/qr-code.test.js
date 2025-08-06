const QRCode = require('qrcode');

describe('QR Code Generation', () => {
  test('should generate QR code data URL successfully', async () => {
    const testData = 'https://example.com';
    
    const qrCode = await QRCode.toDataURL(testData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    expect(qrCode).toBeDefined();
    expect(typeof qrCode).toBe('string');
    expect(qrCode).toMatch(/^data:image\/png;base64,/);
    expect(qrCode.length).toBeGreaterThan(100);
  });

  test('should generate QR code with custom options', async () => {
    const testData = 'Test QR Code Data';
    
    const qrCode = await QRCode.toDataURL(testData, {
      width: 400,
      margin: 4,
      color: {
        dark: '#FF0000',
        light: '#00FF00'
      },
      errorCorrectionLevel: 'H'
    });
    
    expect(qrCode).toBeDefined();
    expect(qrCode).toMatch(/^data:image\/png;base64,/);
  });

  test('should handle empty data', async () => {
    await expect(QRCode.toDataURL('')).rejects.toThrow('No input text');
  });

  test('should handle special characters', async () => {
    const testData = 'Test with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const qrCode = await QRCode.toDataURL(testData);
    
    expect(qrCode).toBeDefined();
    expect(qrCode).toMatch(/^data:image\/png;base64,/);
  });

  test('should handle invalid options gracefully', async () => {
    const testData = 'https://example.com';
    
    // QRCode library doesn't throw for invalid width, it uses default
    const qrCode = await QRCode.toDataURL(testData, {
      width: -1 // Invalid width
    });
    
    expect(qrCode).toBeDefined();
    expect(qrCode).toMatch(/^data:image\/png;base64,/);
  });
}); 