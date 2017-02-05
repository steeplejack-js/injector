/**
 * injector.test
 */

/* Node modules */

/* Third-party modules */
import { Base } from '@steeplejack/core';

/* Files */
import { expect } from '../../test/helpers/configure';
import Injector from '../../src/index';

describe('Injector library', function () {

  beforeEach(function () {

    const obj = new Injector();

    expect(obj).to.be.instanceof(Injector)
      .to.be.instanceof(Base);

    expect(obj.components).to.be.eql({});
    expect(obj.getComponent('non-existent')).to.be.undefined;

  });

  describe('methods', function () {

    describe('#process', function () {

      beforeEach(function () {
        this.obj = new Injector();

        /* Set some components */
        this.obj
          .registerComponent({
            factory: () => ({
              hello: 'factoryNoDeps',
            }),
            name: 'factoryNoDeps',
            path: '/path/to/fnd',
          })
          .registerComponent({
            deps: [
              'instancePath',
            ],
            factory: dep1 => ({
              dep1,
            }),
            name: 'factoryDep',
          })
          .registerComponent({
            instance: 'instanceNoPath',
            name: 'instanceNoPath',
          })
          .registerComponent({
            instance: 'instancePath',
            name: 'instancePath',
            path: '/path/to/ip',
          })
          .registerComponent({
            instance: () => 'instanceNoPathFactory',
            name: 'instanceNoPathFactory',
          })
          .registerComponent({
            instance: () => 'instancePathFactory',
            name: 'instancePathFactory',
            path: '/path/to/ipf',
          })
          .registerComponent({
            instance: () => { throw new Error('ignored'); },
            name: 'ignored',
          });
      });

      describe('dependencies gotten from the function', function () {

        describe('function', function () {

          it('should process a target that has no dependencies', function () {

            const target = function () {};

            expect(this.obj.process(target)).to.be.instanceof(target);

          });

          it('should process a target that has a top-level dependency', function () {

            const target = function (topLevel) {
              this.exec = topLevel;
            };

            const objTarget = this.obj.process(target, [
              'instancePathFactory',
            ]);
            expect(objTarget).to.be.instanceof(target);

            expect(objTarget.exec()).to.be.equal('instancePathFactory');

          });

          it('should process a target that has a multiple top-level dependencies', function () {

            const target = function (topLevel, otherFunc) {

              this.exec = topLevel;
              this.otherFunc = otherFunc;

            };

            const objTarget = this.obj.process(target, [
              'instanceNoPathFactory',
              'instancePathFactory',
            ]);
            expect(objTarget).to.be.instanceof(target);
            expect(objTarget.exec()).to.be.equal('instanceNoPathFactory');
            expect(objTarget.otherFunc()).to.be.equal('instancePathFactory');

          });

          it('should get a constructor dependency', function () {

            const target = function (topLevel) {

              this.exec = topLevel;

            };

            const objTarget = this.obj.process(target, [
              'factoryNoDeps',
            ]);

            expect(objTarget.exec).to.be.eql({
              hello: 'factoryNoDeps',
            });

          });

          it('should process stacked dependencies', function () {

            const target = function (topLevel) {

              this.exec = topLevel;

            };

            const objTarget = this.obj.process(target, [
              'factoryDep',
            ]);

            expect(objTarget.exec).to.be.eql({
              dep1: 'instancePath',
            });

          });

          it('should throw an error if dependency is missing', function () {

            const target = function (topLevel, otherFunc) {

              this.exec = topLevel;
              this.otherFunc = otherFunc;

            };

            let fail = false;
            try {
              this.obj.process(target, [
                'instancePathFactory',
                'otherFunc',
              ]);
            } catch (err) {
              fail = true;

              expect(err).to.be.instanceof(Error);
              expect(err.message).to.be.equal('Missing dependency: otherFunc');
            }

            expect(fail).to.be.true;

          });

          it('should throw an error if too many arguments compared to injected dependencies - zero', function () {

            const target = function (someDep) {
              this.exec = someDep;
            };

            let fail = false;
            try {
              this.obj.process(target);
            } catch (err) {
              fail = true;

              expect(err).to.be.instanceof(Error);
              expect(err.message).to.be.equal(`Missing argument in argument 1: ${target.toString()}`);
            } finally {
              expect(fail).to.be.true;
            }

          });

        });

      });

    });

  });

});
