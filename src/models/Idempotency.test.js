import { Idempotency } from './Idempotency.js';

describe('Idempotency Model', () => {

    it('creates an Idempotency model with a valid key', () => {
        const before = new Date().toISOString();
        const idempotency = new Idempotency({ key: 'test-job-id#1' });
        const after = new Date().toISOString();

        expect(idempotency.key).toEqual('test-job-id#1');
        expect(idempotency.createdAt >= before).toBe(true);
        expect(idempotency.createdAt <= after).toBe(true);
    });

    it('throws if key is empty', () => {
        expect(() => new Idempotency({ key: '' }))
            .toThrow('Idempotency key is required');
    });

    it('serialises to a DynamoDB item correctly', () => {
        const idempotency = new Idempotency({ key: 'test-job-id#1' });
        const item = idempotency.toItem();

        expect(item).toMatchObject({
            PK: 'Idempotency',
            SK: 'test-job-id#1',
        });
    });

    it('hydrates from a DynamoDB item correctly', () => {
        const item = { PK: 'Idempotency', SK: 'test-job-id#1', CreatedAt: new Date().toISOString() };
        const idempotency = Idempotency.fromItem(item);

        expect(idempotency).toBeInstanceOf(Idempotency);
        expect(idempotency.key).toEqual('test-job-id#1');
    });
});

