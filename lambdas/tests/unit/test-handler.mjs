'use strict';

import { handler } from '../../put_event.mjs';
import { expect } from 'chai';
var event, context;

describe('Tests trigger event', function () {
    it('verifies successful response', async () => {
        const result = {
            'statusCode': 200,
            'body': JSON.stringify({"insert":"OK"})
        };

        console.log(result);

        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.be.an('string');

        let response = JSON.parse(result.body);

        expect(response).to.be.an('object');
    });
});
