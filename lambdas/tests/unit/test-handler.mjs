'use strict';

import { lambdaHandler } from '../../put_event.mjs';
import { expect } from 'chai';
var event, context;

describe('Tests put event', function () {
    it('verifies successful response', async () => {
        const result = await lambdaHandler(event, context)

        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.be.an('string');

        let response = JSON.parse(result.body);

        expect(response).to.be.an('object');
    });
});
