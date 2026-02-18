// Minimal fast-check test

import * as fc from 'fast-check';

describe('Fast-check Minimal Test', () => {
  it('should work with fast-check', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        expect(typeof n).toBe('number');
      }),
      { numRuns: 10 }
    );
  });
});
