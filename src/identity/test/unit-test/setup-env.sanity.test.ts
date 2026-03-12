describe('test environment sanity', () => {
  it('should provide a JWT secret with the minimum required length', () => {
    const jwtSecret = process.env.JWT_SECRET;

    expect(jwtSecret).toBeDefined();
    expect(jwtSecret?.trim().length).toBeGreaterThanOrEqual(16);
  });
});
