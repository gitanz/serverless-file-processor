export class FileTypeFactory {
    createDto() {
        throw new Error("createDto() method not implemented")
    }

    getStreamer() {
        throw  new Error("createSteamer() method not implemented");
    }

    getResultRepository() {
        throw new Error("createRepository() method not implemented");
    }
}