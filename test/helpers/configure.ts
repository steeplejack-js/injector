/**
 * config
 */

/* Node modules */

/* Third-party modules */
import * as chai from "chai";
import * as Promise from "bluebird";
import * as chaiAsPromised from "chai-as-promised";
import * as proxyquire from "proxyquire";
import * as sinon from "sinon";
const sinonAsPromised = require("sinon-as-promised");
import * as sinonChai from "sinon-chai";

/* Files */

chai.use(sinonChai);
chai.use(chaiAsPromised);

sinonAsPromised(Promise);

let expect = chai.expect;

proxyquire.noCallThru();

export {
  expect,
  proxyquire,
  sinon
};
