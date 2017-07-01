/**
 * injector
 */

/* Node modules */

/* Third-party modules */
import { _ } from 'lodash';
import { Base } from '@steeplejack/core';

/* Files */

/**
 * Construct
 *
 * Factory method to create a new instance of
 * the constructor.
 *
 * @param {object} constructor
 * @param {*[]} args
 * @return {Factory}
 */
function construct (constructor, args) {
  function Factory () {
    return constructor.apply(this, args);
  }

  Factory.prototype = constructor.prototype;

  return new Factory();
}

/**
 * Get Dependencies
 *
 * Iterates over the dependencies and resolve them
 * as usable items.
 *
 * @param {Injector} injector
 * @param {string[]} dependencies
 * @returns {object[]}
 */
function getDependencies (injector, dependencies) {
  return dependencies.map((name) => {
    const dependency = injector.getComponent(name);

    if (!dependency) {
      throw new Error(`Missing dependency: ${name}`);
    }

    /* If instance hasn't already been processed, process it */
    if (!dependency.instance) {
      dependency.instance = injector.process(dependency.factory, dependency.deps);
    }

    return dependency.instance;
  });
}

class Injector extends Base {

  constructor () {
    super();

    this.components = {};
  }

  /**
   * Get Component
   *
   * Get the components by name
   *
   * @param {string} name
   * @returns {object}
   */
  getComponent (name) {
    if (_.has(this.components, name)) {
      return this.components[name];
    }

    return undefined;
  }

  /**
   * Process
   *
   * Process all the dependencies and create
   * an instance of the target with the dependencies
   * injected into it.
   *
   * @param {function} target
   * @param {string[]} dependencies
   * @returns {Factory}
   */
  process (target, dependencies = []) {
    const resolvedDeps = getDependencies(this, dependencies);

    const argCount = target.length;
    if (resolvedDeps.length < argCount) {
      throw new Error(`Missing argument in argument ${argCount}: ${target.toString()}`);
    }

    return construct(target, resolvedDeps);
  }

  /**
   * Register
   *
   * Register a component to be managed by the injector.
   * Anything that returns a constructor function is a valid
   * component. Attempting to register the same component
   * multiple times will throw an error.
   *
   * @param {string|object} filePath
   * @returns {Injector}
   */
  register (filePath) {
    const isRequirable = _.isString(filePath);

    // eslint-disable-next-line import/no-dynamic-require, global-require
    const module = isRequirable ? require(filePath) : filePath;
    const path = isRequirable ? filePath : undefined;

    const inject = module.inject || {};
    const name = inject.name;

    if (!name) {
      const pathLocation = path ? `: ${path}` : '';
      throw new SyntaxError(`No name specified in injected module${pathLocation}`);
    }

    const exportable = inject.export || 'default';
    const type = inject.type || 'factory';
    let deps = inject.deps;
    const injectable = module[exportable];

    if (deps) {
      deps = deps.map((dep) => {
        /* Anything starting 'npm:' is automatically included */
        if (/^npm:/.test(dep) && !this.getComponent(dep)) {
          const npmModule = dep.substr(4);

          this.registerComponent({
            // eslint-disable-next-line import/no-dynamic-require, global-require
            factory: () => require(npmModule),
            name: dep,
          });
        }

        return dep;
      });
    }

    return this.registerComponent({
      deps,
      factory: type === 'factory' ? injectable : undefined,
      instance: type === 'instance' ? injectable : undefined,
      name,
      path,
    });
  }

  /**
   * Register Component
   *
   * Registers a new component to the injector. It can
   * be a factory (a function) or an instance (any type}
   *
   * @param {string} name
   * @param {string[]} deps
   * @param {function} factory
   * @param {*} instance
   * @param {string} path
   * @returns {Injector}
   */
  registerComponent ({ name, deps = [], factory, instance, path }) {
    const errorPath = path ? ` in: ${path}` : '';

    if (_.isEmpty(name)) {
      /* Name is required */
      throw new Error(`Name is required to register a component${errorPath}`);
    } else if (this.getComponent(name)) {
      /* Cannot register the same component multiple times */
      throw new Error(`Component '${name}' is already registered${errorPath}`);
    } else if (!factory && !instance) {
      /* One must be registered */
      throw new Error(`Either one of factory and instance must be registered${errorPath}`);
    } else if (!!factory && !!instance) {
      /* Cannot register both */
      throw new Error(`Cannot register both factory and instance${errorPath}`);
    } else if (!!factory && _.isFunction(factory) === false) {
      /* Register a factory - check a function */
      throw new TypeError(`Factory '${name}' can only accept a function${errorPath}`);
    } else if (_.isArray(deps) === false) {
      /* Dependencies must be an array */
      throw new TypeError(`Dependencies must be an array of strings${errorPath}`);
    }

    /* Register with the components object */
    this.components[name] = {
      deps,
      factory,
      instance,
      path,
    };

    return this;
  }

}

module.exports = Injector;
