/**
 * injector.test
 */

/* Node modules */

/* Third-party modules */
import steeplejackCore, { Base } from '@steeplejack/core';

/* Files */
import { expect, proxyquire, sinon } from '../../test/helpers/configure';
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

    describe('#getComponent', function () {

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
          });

      });

      it('should return the component by name', function () {

        expect(this.obj.getComponent('factoryNoDeps')).to.be.equal(this.obj.components.factoryNoDeps);

      });

      it('should return undefined if nothing found', function () {

        expect(this.obj.getComponent('nothingFound')).to.be.undefined;

      });

    });

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

        it('should process a dep starting npm: as an npm module', function () {

          const target = function (topLevel) {
            this.exec = topLevel;
          };

          const objTarget = this.obj.process(target, [
            'npm:@steeplejack/core',
          ]);
          expect(objTarget).to.be.instanceof(target);

          expect(objTarget.exec).to.be.equal(steeplejackCore);

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

        it('should throw an error if too many arguments compared to injected dependencies - one', function () {

          const target = function (factoryDep, someDep) {
            this.exec = someDep;
          };

          let fail = false;
          try {
            this.obj.process(target, [
              'factoryDep',
            ]);
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal(`Missing argument in argument 2: ${target.toString()}`);
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should not throw an error if too many injected dependencies compared to arguments - zero', function () {

          const target = function () {

          };

          const objTarget = this.obj.process(target, [
            'factoryNoDeps',
          ]);

          expect(objTarget).to.be.instanceof(target);

        });

        it('should not throw an error if too many injected dependencies compared to arguments - one', function () {

          const target = function (topLevel) {

            this.exec = topLevel;

          };

          const objTarget = this.obj.process(target, [
            'factoryNoDeps',
            'instanceNoPathFactory',
          ]);

          expect(objTarget).to.be.instanceof(target);

          expect(objTarget.exec).to.be.eql({
            hello: 'factoryNoDeps',
          });

        });

      });

      describe('class', function () {

        it('should process a target that has no dependencies', function () {

          class Target {}

          expect(this.obj.process(Target)).to.be.instanceof(Target);

        });

        it('should process a target that has a top-level dependency', function () {

          class Target {
            constructor (topLevel) {
              this.exec = topLevel;
            }
          }

          const objTarget = this.obj.process(Target, [
            'instancePathFactory',
          ]);
          expect(objTarget).to.be.instanceof(Target);

          expect(objTarget.exec()).to.be.equal('instancePathFactory');

        });

        it('should process a target that has a multiple top-level dependencies', function () {

          class Target {
            constructor (topLevel, otherFunc) {

              this.exec = topLevel;
              this.otherFunc = otherFunc;

            }
          }

          const objTarget = this.obj.process(Target, [
            'instanceNoPathFactory',
            'instancePathFactory',
          ]);
          expect(objTarget).to.be.instanceof(Target);
          expect(objTarget.exec()).to.be.equal('instanceNoPathFactory');
          expect(objTarget.otherFunc()).to.be.equal('instancePathFactory');

        });

        it('should get a constructor dependency', function () {

          class Target {
            constructor (topLevel) {
              this.exec = topLevel;
            }
          }

          const objTarget = this.obj.process(Target, [
            'factoryNoDeps',
          ]);

          expect(objTarget.exec).to.be.eql({
            hello: 'factoryNoDeps',
          });

        });

        it('should process stacked dependencies', function () {

          class Target {
            constructor (topLevel) {
              this.exec = topLevel;
            }
          }

          const objTarget = this.obj.process(Target, [
            'factoryDep',
          ]);

          expect(objTarget.exec).to.be.eql({
            dep1: 'instancePath',
          });

        });

        it('should throw an error if dependency is missing', function () {

          class Target {
            constructor (topLevel, otherFunc) {
              this.exec = topLevel;
              this.otherFunc = otherFunc;
            }
          }

          let fail = false;
          try {
            this.obj.process(Target, [
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

          class Target {
            constructor (someDep) {
              this.exec = someDep;
            }
          }

          let fail = false;
          try {
            this.obj.process(Target);
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal(`Missing argument in argument 1: ${Target.toString()}`);
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if too many arguments compared to injected dependencies - one', function () {

          class Target {
            constructor (factoryDep, someDep) {
              this.exec = someDep;
            }
          }

          let fail = false;
          try {
            this.obj.process(Target, [
              'factoryDep',
            ]);
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal(`Missing argument in argument 2: ${Target.toString()}`);
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should not throw an error if too many injected dependencies compared to arguments - zero', function () {

          class Target {}

          const objTarget = this.obj.process(Target, [
            'factoryNoDeps',
          ]);

          expect(objTarget).to.be.instanceof(Target);

        });

        it('should not throw an error if too many injected dependencies compared to arguments - one', function () {

          class Target {
            constructor (topLevel) {
              this.exec = topLevel;
            }
          }

          const objTarget = this.obj.process(Target, [
            'factoryNoDeps',
            'instanceNoPathFactory',
          ]);

          expect(objTarget).to.be.instanceof(Target);

          expect(objTarget.exec).to.be.eql({
            hello: 'factoryNoDeps',
          });

        });

      });

    });

    describe('#register', function () {

      beforeEach(function () {

        this.registers = {
          factory: () => {},
        };

        const Injector2 = proxyquire('../../src/index', {
          '/path/to/error/noName': {
            default: this.registers.factory,
          },
          '/path/to/factoryPath': {
            hello: this.registers.factory,
            inject: {
              deps: [
                'dep1',
                'dep2',
              ],
              export: 'hello',
              name: 'factoryPathDefault',
            },
          },
          '/path/to/factoryPathDefault': {
            default: this.registers.factory,
            inject: {
              name: 'factoryPathDefault',
            },
          },
          '/path/to/factoryPathDefaultDeps': {
            default: this.registers.factory,
            inject: {
              deps: [
                'dep1',
              ],
              name: 'factoryPathDefault',
            },
          },
          '/path/to/instancePathDefault': {
            default: 'someInstance',
            inject: {
              name: 'instancePathDefault',
              type: 'instance',
            },
          },
        });

        this.obj = new Injector2();

        this.getComponent = sinon.stub(this.obj, 'getComponent')
          .returns(false);
        this.registerComponent = sinon.stub(this.obj, 'registerComponent')
          .returns('registered');

      });

      it('should throw an error if no name - path', function () {

        let fail = false;

        try {
          this.obj.register('/path/to/error/noName');
        } catch (err) {
          fail = true;

          expect(err).to.be.instanceof(Error);
          expect(err.message).to.be.equal('No name specified in injected module: /path/to/error/noName');
        } finally {
          expect(fail).to.be.true;
        }

      });

      it('should throw an error if no name - no path', function () {

        let fail = false;

        try {
          this.obj.register({
            default: this.registers.factory,
          });
        } catch (err) {
          fail = true;

          expect(err).to.be.instanceof(Error);
          expect(err.message).to.be.equal('No name specified in injected module');
        } finally {
          expect(fail).to.be.true;
        }

      });

      it('should require and register a factory object', function () {

        expect(this.obj.register({
          default: this.registers.factory,
          inject: {
            name: 'factoryPathDefault',
          },
        })).to.be.equal('registered');

        expect(this.registerComponent).to.be.calledOnce
          .calledWithExactly({
            deps: undefined,
            factory: this.registers.factory,
            instance: undefined,
            name: 'factoryPathDefault',
            path: undefined,
          });

      });

      it('should require and register a factory file', function () {

        expect(this.obj.register('/path/to/factoryPathDefault')).to.be.equal('registered');

        expect(this.registerComponent).to.be.calledOnce
          .calledWithExactly({
            deps: undefined,
            factory: this.registers.factory,
            instance: undefined,
            name: 'factoryPathDefault',
            path: '/path/to/factoryPathDefault',
          });

      });

      it('should require and register an instance object', function () {

        expect(this.obj.register({
          default: 'someInstance',
          inject: {
            name: 'instancePathDefault',
            type: 'instance',
          },
        })).to.be.equal('registered');

        expect(this.registerComponent).to.be.calledOnce
          .calledWithExactly({
            deps: undefined,
            factory: undefined,
            instance: 'someInstance',
            name: 'instancePathDefault',
            path: undefined,
          });

      });

      it('should require and register an instance file', function () {

        expect(this.obj.register('/path/to/instancePathDefault')).to.be.equal('registered');

        expect(this.registerComponent).to.be.calledOnce
          .calledWithExactly({
            deps: undefined,
            factory: undefined,
            instance: 'someInstance',
            name: 'instancePathDefault',
            path: '/path/to/instancePathDefault',
          });

      });

      it('should require and register an factory file not on the default', function () {

        expect(this.obj.register('/path/to/factoryPath')).to.be.equal('registered');

        expect(this.registerComponent).to.be.calledOnce
          .calledWithExactly({
            deps: [
              'dep1',
              'dep2',
            ],
            factory: this.registers.factory,
            instance: undefined,
            name: 'factoryPathDefault',
            path: '/path/to/factoryPath',
          });
      });

      it('should require and register a factory object not on the default', function () {

        expect(this.obj.register({
          exporty: this.registers.factory,
          inject: {
            export: 'exporty',
            deps: [
              'dep1',
            ],
            name: 'factoryPath',
          },
        })).to.be.equal('registered');

        expect(this.registerComponent).to.be.calledOnce
          .calledWithExactly({
            deps: [
              'dep1',
            ],
            factory: this.registers.factory,
            instance: undefined,
            name: 'factoryPath',
            path: undefined,
          });

      });

    });

    describe('#registerComponent', function () {

      beforeEach(function () {
        this.obj = new Injector();

        const factoryNoDeps = () => ({
          hello: 'factoryNoDeps',
        });

        const factoryDep = dep1 => ({
          dep1,
        });

        const instanceNoPathFactory = () => 'instanceNoPathFactory';

        const instancePathFactory = () => 'instancePathFactory';

        /* Set some components */
        this.obj
          .registerComponent({
            factory: factoryNoDeps,
            name: 'factoryNoDeps',
            path: '/path/to/fnd',
          })
          .registerComponent({
            deps: [
              'instancePath',
            ],
            factory: factoryDep,
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
            instance: instanceNoPathFactory,
            name: 'instanceNoPathFactory',
          })
          .registerComponent({
            instance: instancePathFactory,
            name: 'instancePathFactory',
            path: '/path/to/ipf',
          });

        expect(Object.keys(this.obj.components)).to.have.length(6);

        expect(this.obj.components.factoryNoDeps).to.be.eql({
          deps: [],
          factory: factoryNoDeps,
          instance: undefined,
          path: '/path/to/fnd',
        });

        expect(this.obj.components.factoryDep).to.be.eql({
          deps: [
            'instancePath',
          ],
          factory: factoryDep,
          instance: undefined,
          path: undefined,
        });

        expect(this.obj.components.instanceNoPath).to.be.eql({
          deps: [],
          factory: undefined,
          instance: 'instanceNoPath',
          path: undefined,
        });

        expect(this.obj.components.instancePath).to.be.eql({
          deps: [],
          factory: undefined,
          instance: 'instancePath',
          path: '/path/to/ip',
        });

        expect(this.obj.components.instanceNoPathFactory).to.be.eql({
          deps: [],
          factory: undefined,
          instance: instanceNoPathFactory,
          path: undefined,
        });

        expect(this.obj.components.instancePathFactory).to.be.eql({
          deps: [],
          factory: undefined,
          instance: instancePathFactory,
          path: '/path/to/ipf',
        });

      });

      describe('no path', function () {

        it('should throw an error if no name specified', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              factory: () => {
              },
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Name is required to register a component');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if component name is already registered', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              name: 'instancePathFactory',
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Component \'instancePathFactory\' is already registered');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if factory and instance are both empty', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              name: 'neitherRegistered',
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Either one of factory and instance must be registered');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if factory and instance are on same type', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              name: 'bothRegistered',
              factory: () => {},
              instance: () => {},
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Cannot register both factory and instance');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if factory is not an object', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              name: 'bothRegistered',
              factory: 'sss',
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Factory \'bothRegistered\' can only accept a function');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if deps is not array', function () {

          const types = [
            2,
            3.4,
            true,
            false,
            function () {},
            {},
            'string',
          ];

          types.forEach((deps) => {
            let fail = false;
            try {
              this.obj.registerComponent({
                deps,
                name: 'bothRegistered',
                factory: () => {
                },
              });
            } catch (err) {
              fail = true;

              expect(err).to.be.instanceof(Error);
              expect(err.message).to.be.equal('Dependencies must be an array of strings');
            } finally {
              expect(fail).to.be.true;
            }
          });

        });

      });

      describe('path', function () {

        it('should throw an error if no name specified', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              factory: () => {
              },
              path: '/path/to/file',
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Name is required to register a component in: /path/to/file');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if component name is already registered', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              name: 'instancePathFactory',
              path: '/path/to/file',
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Component \'instancePathFactory\' is already registered in: /path/to/file');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if factory and instance are both empty', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              name: 'neitherRegistered',
              path: '/path/to/file',
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Either one of factory and instance must be registered in: /path/to/file');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if factory and instance are on same type', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              name: 'bothRegistered',
              factory: () => {},
              instance: () => {},
              path: '/path/to/file',
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Cannot register both factory and instance in: /path/to/file');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if factory is not an object', function () {

          let fail = false;
          try {
            this.obj.registerComponent({
              name: 'bothRegistered',
              factory: 'sss',
              path: '/path/to/file2',
            });
          } catch (err) {
            fail = true;

            expect(err).to.be.instanceof(Error);
            expect(err.message).to.be.equal('Factory \'bothRegistered\' can only accept a function in: /path/to/file2');
          } finally {
            expect(fail).to.be.true;
          }

        });

        it('should throw an error if deps is not array', function () {

          const types = [
            2,
            3.4,
            true,
            false,
            function () {},
            {},
            'string',
          ];

          types.forEach((deps) => {
            let fail = false;
            try {
              this.obj.registerComponent({
                deps,
                name: 'bothRegistered',
                factory: () => {
                },
                path: '/path/to/file2',
              });
            } catch (err) {
              fail = true;

              expect(err).to.be.instanceof(Error);
              expect(err.message).to.be.equal('Dependencies must be an array of strings in: /path/to/file2');
            } finally {
              expect(fail).to.be.true;
            }
          });

        });

      });

    });

  });

});
