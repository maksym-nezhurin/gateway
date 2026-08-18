import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mergeAdminOverview } from './admin-overview';

describe('mergeAdminOverview', () => {
  it('attaches garage stats onto the auth-service overview', () => {
    const authOverview = { users: { total: 4 }, companies: { total: 2 } };
    const garageResult = {
      garage: {
        vehicles: { total: 10, last7Days: 1, last30Days: 3 },
        garage: { entriesTotal: 8, last7Days: 1, last30Days: 2 },
        saleListings: { active: 1 },
      },
      garageAvailable: true,
    };

    assert.deepEqual(mergeAdminOverview(authOverview, garageResult), {
      users: { total: 4 },
      companies: { total: 2 },
      garage: garageResult.garage,
      garageAvailable: true,
    });
  });

  it('degrades gracefully when car-service is unavailable', () => {
    const authOverview = { users: { total: 4 } };
    const garageResult = { garage: null, garageAvailable: false };

    assert.deepEqual(mergeAdminOverview(authOverview, garageResult), {
      users: { total: 4 },
      garage: null,
      garageAvailable: false,
    });
  });
});
