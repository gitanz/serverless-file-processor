import {Job, JobStatus} from "./Job.js";

describe("Job Unit Tests", () => {

    it("can create a Job model object with default values", async () => {
        const before = new Date().toISOString();
        const jobModel = new Job({
            id: "auniqueid",
            sourceFilePath: "/uploads/test.csv"
        });
        const after = new Date().toISOString();

        expect(jobModel.id).toEqual("auniqueid");
        expect(jobModel.sourceFilePath).toEqual("/uploads/test.csv");
        expect(jobModel.status).toEqual(JobStatus.PENDING);
        expect(jobModel.totalRows).toEqual(0);
        expect(jobModel.totalCompleted).toEqual(0);
        expect(jobModel.createdAt >= before).toBe(true);
        expect(jobModel.createdAt <= after).toBe(true);
        expect(jobModel.updatedAt >= before).toBe(true);
        expect(jobModel.updatedAt <= after).toBe(true);
    });

    it("throws if id is empty", () => {
        expect(() => new Job({ id: '', sourceFilePath: '/uploads/test.csv' }))
            .toThrow('Job id is required');
    });

    it("throws if sourceFilePath is empty", () => {
        expect(() => new Job({ id: 'auniqueid', sourceFilePath: '' }))
            .toThrow('Job sourceFilePath is required');
    });
});
