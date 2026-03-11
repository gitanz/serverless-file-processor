export class BaseModel {

    /**
     * Serialises the model to a DynamoDB item
     * @returns {object}
     */
    toItem() {
        throw new Error('toItem() not implemented');
    }

    /**
     * Hydrates a model from a DynamoDB item
     * @param {object} item
     * @returns {BaseModel}
     */
    static fromItem(item) {
        throw new Error('fromItem() not implemented');
    }
}

