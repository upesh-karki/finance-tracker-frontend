import { API } from './config';

describe('API config', () => {
  test('register URL is defined', () => {
    expect(API.register).toBeDefined();
    expect(typeof API.register).toBe('string');
  });

  test('authLogin URL is defined', () => {
    expect(API.authLogin).toBeDefined();
  });

  test('member() returns URL with id', () => {
    expect(API.member(42)).toContain('42');
  });

  test('expenses() returns URL with memberId', () => {
    expect(API.expenses(1)).toContain('1');
  });

  test('authResendOtp() encodes email', () => {
    const url = API.authResendOtp('test@example.com');
    expect(url).toContain('test%40example.com');
  });
});
