'use strict';

import { handler } from '../../put_event.mjs';
import { expect } from 'chai';
var event, context;

describe('Tests trigger event', function () {
    it('verifies successful response', async () => {

        event = {
            body: '{\n' +
                '  "configuration-id":"0671F841-03A4-4CC6-ABFF-9B5CC8610938",\n' +
                '  "object-ids": [\n' +
                '      101,\n' +
                '      108,\n' +
                '      223,\n' +
                '      444\n' +
                '  ]\n' +
                '}\n'
        };
        const result = await handler(event, context)

        console.log(result);

        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.be.an('string');

        let response = JSON.parse(result.body);

        expect(response).to.be.an('object');
    });
});
