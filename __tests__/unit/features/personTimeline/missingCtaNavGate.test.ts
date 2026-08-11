/**
 * Maestro 018: after missing-person CTA, assert destination before screenshot.
 */

import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../../../..');

describe('018 person-timeline-uat missing-cta navigation gate', () => {
  it('waits for insights-screen after missing-cta before screenshot', () => {
    const flow = fs.readFileSync(
      path.join(root, '.maestro/flows/018-person-timeline-uat.yaml'),
      'utf8',
    );
    const cta = flow.indexOf('id: person-timeline-missing-cta');
    const wait = flow.indexOf('id: insights-screen', cta);
    const shot = flow.indexOf(
      '06b-after-missing-cta',
      cta,
    );
    expect(cta).toBeGreaterThan(-1);
    expect(wait).toBeGreaterThan(cta);
    expect(shot).toBeGreaterThan(wait);
  });
});
