import { describe, it, expect } from 'vitest';
const { reviewService } = require('../services/reviewService');
const dataStore = require('../services/dataStore');

describe('ProjectPulse Review & Immutable Decision Audit Service', () => {
  it('requires a mandatory rejection reason when faculty rejects a project', async () => {
    const facultyUser = { id: 13, name: 'Dr. Arumugam Pillai', role: 'Faculty' };

    await expect(
      reviewService.recordDecision({
        id: 102,
        reviewerUser: facultyUser,
        decision: 'Rejected',
        rejectionReason: '', // missing!
        feedback: 'Please redo this'
      })
    ).rejects.toThrow(/recorded rejection reason is strictly required/);
  });

  it('successfully records a valid rejection decision with reason and archives it', async () => {
    const facultyUser = { id: 13, name: 'Dr. Arumugam Pillai', role: 'Faculty' };

    const result = await reviewService.recordDecision({
      id: 1,
      reviewerUser: facultyUser,
      decision: 'Rejected',
      rejectionReason: 'Substantial overlap with existing campus marketplace project',
      feedback: 'The submission does not introduce enough original architecture beyond the baseline tutorial.'
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('rejected');
    expect(result.message).toContain('immutable audit history');
  });

  it('enforces authorization rules on inspection of historical review decisions', async () => {
    // Student trying to inspect another student's submission history
    const studentUser = { id: 2, name: 'Karthik Raja', role: 'Student' };

    // Submission 999 belongs to student 6 (Dhanush Ram)
    await expect(
      reviewService.getReviewHistory(999, studentUser)
    ).rejects.toThrow(/Forbidden/);

    // Faculty is authorized to inspect
    const facultyUser = { id: 13, name: 'Dr. Arumugam Pillai', role: 'Faculty' };
    const history = await reviewService.getReviewHistory(999, facultyUser);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].reviewer_name).toBe('Dr. Arumugam Pillai');
    expect(history[0].decision).toBe('Rejected');
  });
});
