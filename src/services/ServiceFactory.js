/**
 * Service Factory
 * Provides dependency injection and service management for admin services
 */

import { supabase } from '../supabase/client.js';

class ServiceFactory {
  constructor() {
    this.services = new Map();
    this.dependencies = new Map();
    this.config = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      rateLimitWindow: 60 * 1000, // 1 minute
      rateLimitMax: 100, // 100 requests per minute
      logger: console
    };
  }

  // Register a service class
  register(serviceName, ServiceClass, dependencies = []) {
    this.dependencies.set(serviceName, {
      ServiceClass,
      dependencies,
      singleton: true // All admin services are singletons by default
    });
  }

  // Get or create a service instance
  get(serviceName) {
    // Return existing instance if it's a singleton
    if (this.services.has(serviceName)) {
      return this.services.get(serviceName);
    }

    const serviceConfig = this.dependencies.get(serviceName);
    if (!serviceConfig) {
      throw new Error(`Service '${serviceName}' not registered`);
    }

    // Resolve dependencies
    const resolvedDependencies = serviceConfig.dependencies.map(depName => {
      if (depName === 'supabase') {
        return supabase;
      }
      return this.get(depName);
    });

    // Create service instance
    const serviceOptions = {
      serviceName,
      ...this.config,
      dependencies: resolvedDependencies
    };

    const serviceInstance = new serviceConfig.ServiceClass(serviceOptions);

    // Store singleton instance
    if (serviceConfig.singleton) {
      this.services.set(serviceName, serviceInstance);
    }

    return serviceInstance;
  }

  // Create a new instance (non-singleton)
  create(serviceName, options = {}) {
    const serviceConfig = this.dependencies.get(serviceName);
    if (!serviceConfig) {
      throw new Error(`Service '${serviceName}' not registered`);
    }

    // Resolve dependencies
    const resolvedDependencies = serviceConfig.dependencies.map(depName => {
      if (depName === 'supabase') {
        return supabase;
      }
      return this.get(depName);
    });

    // Create service instance with custom options
    const serviceOptions = {
      serviceName,
      ...this.config,
      ...options,
      dependencies: resolvedDependencies
    };

    return new serviceConfig.ServiceClass(serviceOptions);
  }

  // Check if service is registered
  has(serviceName) {
    return this.dependencies.has(serviceName);
  }

  // Get all registered service names
  getRegisteredServices() {
    return Array.from(this.dependencies.keys());
  }

  // Clear all service instances (useful for testing)
  clearInstances() {
    this.services.clear();
  }

  // Update global configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update existing service instances
    for (const [serviceName, serviceInstance] of this.services) {
      if (serviceInstance.updateConfig) {
        serviceInstance.updateConfig(this.config);
      }
    }
  }

  // Get service dependency graph
  getDependencyGraph() {
    const graph = {};
    
    for (const [serviceName, config] of this.dependencies) {
      graph[serviceName] = {
        dependencies: config.dependencies,
        singleton: config.singleton,
        instantiated: this.services.has(serviceName)
      };
    }
    
    return graph;
  }

  // Validate dependency graph for circular dependencies
  validateDependencies() {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (serviceName) => {
      if (recursionStack.has(serviceName)) {
        return true; // Circular dependency found
      }

      if (visited.has(serviceName)) {
        return false; // Already processed
      }

      visited.add(serviceName);
      recursionStack.add(serviceName);

      const serviceConfig = this.dependencies.get(serviceName);
      if (serviceConfig) {
        for (const dependency of serviceConfig.dependencies) {
          if (dependency !== 'supabase' && hasCycle(dependency)) {
            return true;
          }
        }
      }

      recursionStack.delete(serviceName);
      return false;
    };

    for (const serviceName of this.dependencies.keys()) {
      if (hasCycle(serviceName)) {
        throw new Error(`Circular dependency detected involving service '${serviceName}'`);
      }
    }

    return true;
  }

  // Initialize all services (useful for warming up)
  async initializeAll() {
    this.validateDependencies();
    
    const serviceNames = this.getRegisteredServices();
    const initPromises = serviceNames.map(async (serviceName) => {
      try {
        const service = this.get(serviceName);
        if (service.initialize && typeof service.initialize === 'function') {
          await service.initialize();
        }
        return { serviceName, status: 'initialized' };
      } catch (error) {
        return { serviceName, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.allSettled(initPromises);
    return results.map(result => result.value);
  }

  // Shutdown all services
  async shutdown() {
    const shutdownPromises = Array.from(this.services.entries()).map(async ([serviceName, service]) => {
      try {
        if (service.shutdown && typeof service.shutdown === 'function') {
          await service.shutdown();
        }
        return { serviceName, status: 'shutdown' };
      } catch (error) {
        return { serviceName, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.allSettled(shutdownPromises);
    this.services.clear();
    return results.map(result => result.value);
  }

  // Health check for all services
  async healthCheck() {
    const healthPromises = Array.from(this.services.entries()).map(async ([serviceName, service]) => {
      try {
        let status = 'healthy';
        let details = {};

        if (service.healthCheck && typeof service.healthCheck === 'function') {
          const result = await service.healthCheck();
          status = result.status || 'healthy';
          details = result.details || {};
        }

        return { serviceName, status, details };
      } catch (error) {
        return { 
          serviceName, 
          status: 'unhealthy', 
          details: { error: error.message } 
        };
      }
    });

    const results = await Promise.allSettled(healthPromises);
    return results.map(result => result.value);
  }
}

// Create singleton factory instance
const serviceFactory = new ServiceFactory();

// Helper functions for easier service registration and access
export const registerService = (serviceName, ServiceClass, dependencies = []) => {
  serviceFactory.register(serviceName, ServiceClass, dependencies);
};

export const getService = (serviceName) => {
  return serviceFactory.get(serviceName);
};

export const createService = (serviceName, options = {}) => {
  return serviceFactory.create(serviceName, options);
};

export const hasService = (serviceName) => {
  return serviceFactory.has(serviceName);
};

export const clearServiceInstances = () => {
  serviceFactory.clearInstances();
};

export const updateServiceConfig = (config) => {
  serviceFactory.updateConfig(config);
};

export const initializeAllServices = () => {
  return serviceFactory.initializeAll();
};

export const shutdownAllServices = () => {
  return serviceFactory.shutdown();
};

export const serviceHealthCheck = () => {
  return serviceFactory.healthCheck();
};

export const getServiceDependencyGraph = () => {
  return serviceFactory.getDependencyGraph();
};

export default serviceFactory;