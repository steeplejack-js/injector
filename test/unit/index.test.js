/**
 * injector.test
 */

/* Node modules */
import { EventEmitter } from 'events';

/* Third-party modules */
import { Base } from '@steeplejack/core';

/* Files */
import { expect } from '../../test/helpers/configure';
import Injector from '../../src/index';

describe('Injector library', function () {

  describe('Instantiation', function () {

    it('should be the correct instances', function () {

      const obj = new Injector();

      expect(obj).to.be.instanceof(Injector)
        .to.be.instanceof(Base)
        .to.be.instanceof(EventEmitter);

      expect(obj.getComponent('non-existent')).to.be.null;

    });

  });

});
