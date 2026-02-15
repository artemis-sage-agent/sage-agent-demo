# Gaming Agent Developer Guide
*Practical patterns and best practices for building autonomous gaming economies*

## Introduction

Building gaming agents isn't just scaling up trading bots - it requires fundamentally different architectural approaches. This guide distills lessons learned from developing S.T.R.I.K.E., the first production gaming agent operating in Star Atlas's $50M+ economy.

**Target Audience**: Blockchain developers, AI engineers, gaming infrastructure teams

---

## Quick Start: Gaming vs Trading Complexity

### Trading Bot Pattern (Simple)
```javascript
// Trading bot: Linear account relationships
const wallet = new PublicKey(walletAddress);
const tokenAccounts = await connection.getTokenAccountsByOwner(wallet);
const prices = await fetchPrices(tokenAccounts);
// Execute: buy low, sell high
```

**Complexity**: 3-5 accounts, 1-2 programs, predictable state

### Gaming Agent Pattern (Complex)  
```javascript
// Gaming agent: Multi-program coordination required
const wallet = new PublicKey(walletAddress);

// 1. Multi-season profile discovery
const allProfiles = await findAllPlayerProfiles(wallet);
const activeProfile = await findActiveGameProfile(allProfiles);

// 2. Multi-program state aggregation
const [fleets, resources, market, faction] = await Promise.all([
  getFleetRegistry(activeProfile),     // SAGE2 program
  getResourceAccounts(activeProfile),  // Cargo program  
  getMarketOrders(activeProfile),     // Galactic marketplace
  getFactionStanding(activeProfile)    // Faction programs
]);

// 3. Strategic decision engine
const strategy = await optimizeMultiObjective(fleets, resources, market);
```

**Complexity**: 50-200+ accounts, 5+ programs, dynamic state dependencies

---

## Architecture Patterns

### 1. Multi-Program Account Discovery

Gaming economies spread player state across multiple Solana programs. You need robust discovery patterns:

```javascript
class MultiProgramDiscovery {
  constructor(programs) {
    this.programs = programs;
    this.cache = new LRUCache(1000);
  }
  
  async discoverPlayerState(wallet) {
    const playerState = {
      wallet: wallet,
      programs: new Map()
    };
    
    // Parallel program-specific discovery
    const discoveries = this.programs.map(program => 
      this.discoverProgramAccounts(wallet, program)
    );
    
    const results = await Promise.all(discoveries);
    
    // Build unified state tree
    results.forEach((accounts, index) => {
      const program = this.programs[index];
      playerState.programs.set(program.id, {
        programId: program.id,
        accounts: accounts,
        relationships: this.mapAccountRelationships(accounts)
      });
    });
    
    return playerState;
  }
  
  async discoverProgramAccounts(wallet, program) {
    // Check cache first
    const cacheKey = `${wallet.toString()}-${program.id}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isStale(cached)) {
      return cached.accounts;
    }
    
    // Program-specific discovery logic
    const accounts = await this.connection.getProgramAccounts(
      program.id,
      {
        filters: program.walletFilters(wallet)
      }
    );
    
    // Cache with TTL
    this.cache.set(cacheKey, {
      accounts: accounts,
      timestamp: Date.now()
    });
    
    return accounts;
  }
}
```

### 2. Intelligent RPC Batching

Gaming operations require many account reads. Optimize with smart batching:

```javascript
class GameRPCManager {
  constructor(endpoint, options = {}) {
    this.connection = new Connection(endpoint, options.commitment || 'confirmed');
    this.batchSize = options.batchSize || 50;
    this.rateLimiter = new RateLimiter(100, 1000); // 100 req/sec
    this.requestQueue = [];
    this.processing = false;
  }
  
  async batchGetAccountInfo(pubkeys) {
    // Add to queue and process in batches
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ pubkeys, resolve, reject });
      this.processBatch();
    });
  }
  
  async processBatch() {
    if (this.processing || this.requestQueue.length === 0) return;
    
    this.processing = true;
    
    try {
      const batch = this.requestQueue.splice(0, this.batchSize);
      const allPubkeys = batch.flatMap(req => req.pubkeys);
      
      // Rate limiting
      await this.rateLimiter.acquire();
      
      // Execute batch request
      const accountInfos = await this.connection.getMultipleAccountsInfo(
        allPubkeys,
        { commitment: 'confirmed' }
      );
      
      // Distribute results back to requesters
      let index = 0;
      for (const request of batch) {
        const results = accountInfos.slice(index, index + request.pubkeys.length);
        request.resolve(results);
        index += request.pubkeys.length;
      }
      
    } catch (error) {
      // Handle batch failures
      for (const request of batch) {
        request.reject(error);
      }
    } finally {
      this.processing = false;
      
      // Process next batch if queue not empty
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processBatch(), 100);
      }
    }
  }
}
```

### 3. Gaming-Aware State Management

Game state is dynamic and interdependent. Use hierarchical caching:

```javascript
class GameStateManager {
  constructor() {
    // L1: Critical game state (hot cache)
    this.l1Cache = new Map();
    this.l1TTL = 30 * 1000; // 30 seconds
    
    // L2: Player assets and configurations (warm cache)
    this.l2Cache = new LRUCache(5000);
    this.l2TTL = 5 * 60 * 1000; // 5 minutes
    
    // L3: Historical data and analytics (cold cache)
    this.l3Cache = new PersistentCache('./game-cache');
    this.l3TTL = 60 * 60 * 1000; // 1 hour
  }
  
  async getPlayerFleets(wallet) {
    const key = `fleets:${wallet.toString()}`;
    
    // Check L1 (critical operations)
    const l1Data = this.l1Cache.get(key);
    if (l1Data && (Date.now() - l1Data.timestamp) < this.l1TTL) {
      return l1Data.value;
    }
    
    // Check L2 (player assets)
    const l2Data = this.l2Cache.get(key);
    if (l2Data && (Date.now() - l2Data.timestamp) < this.l2TTL) {
      // Promote to L1
      this.l1Cache.set(key, l2Data);
      return l2Data.value;
    }
    
    // Check L3 (persistent storage)
    const l3Data = await this.l3Cache.get(key);
    if (l3Data && (Date.now() - l3Data.timestamp) < this.l3TTL) {
      // Promote to L2 and L1
      this.l2Cache.set(key, l3Data);
      this.l1Cache.set(key, l3Data);
      return l3Data.value;
    }
    
    // Cache miss - fetch from blockchain
    const fleets = await this.fetchPlayerFleets(wallet);
    const cacheEntry = {
      value: fleets,
      timestamp: Date.now()
    };
    
    // Store in all cache levels
    this.l1Cache.set(key, cacheEntry);
    this.l2Cache.set(key, cacheEntry);
    await this.l3Cache.set(key, cacheEntry);
    
    return fleets;
  }
  
  // Invalidation strategy for game state changes
  invalidatePlayerCache(wallet, changeType) {
    const patterns = {
      'fleet_moved': [`fleets:${wallet}`, `fleet-positions:${wallet}`],
      'resource_consumed': [`resources:${wallet}`, `fleet-cargo:${wallet}`],
      'market_order': [`orders:${wallet}`, `market-state`]
    };
    
    const keysToInvalidate = patterns[changeType] || [];
    
    keysToInvalidate.forEach(key => {
      this.l1Cache.delete(key);
      this.l2Cache.delete(key);
      // Note: L3 can remain for analytical purposes
    });
  }
}
```

### 4. Multi-Objective Decision Engine

Gaming agents optimize multiple goals simultaneously:

```javascript
class GamingDecisionEngine {
  constructor(objectives, constraints) {
    this.objectives = objectives; // efficiency, profitability, safety, etc.
    this.constraints = constraints; // resource limits, time windows
    this.weights = this.calculateObjectiveWeights();
  }
  
  async optimizeFleetActions(gameState) {
    // Get all possible actions for all fleets
    const actionSpace = await this.generateActionSpace(gameState);
    
    // Multi-objective optimization
    const solutions = await this.geneticOptimization(actionSpace);
    
    // Select Pareto-optimal solution based on current priorities
    const optimalSolution = this.selectSolution(solutions, gameState);
    
    return optimalSolution;
  }
  
  async geneticOptimization(actionSpace) {
    const population = this.initializePopulation(actionSpace, 100);
    
    for (let generation = 0; generation < 50; generation++) {
      // Evaluate fitness for each objective
      const fitness = await Promise.all(
        population.map(individual => this.evaluateMultiObjective(individual))
      );
      
      // Selection, crossover, mutation
      const newPopulation = this.evolvePopulation(population, fitness);
      population.splice(0, population.length, ...newPopulation);
    }
    
    // Return Pareto front (non-dominated solutions)
    return this.getParetoFront(population);
  }
  
  async evaluateMultiObjective(individual) {
    const scores = {};
    
    // Evaluate each objective
    for (const objective of this.objectives) {
      scores[objective.name] = await objective.evaluate(individual);
    }
    
    return scores;
  }
  
  selectSolution(solutions, gameState) {
    // Dynamic weight adjustment based on current game state
    const currentWeights = this.adjustWeights(gameState);
    
    // Weighted sum approach for solution selection
    let bestSolution = null;
    let bestScore = -Infinity;
    
    for (const solution of solutions) {
      let weightedScore = 0;
      
      for (const [objective, weight] of Object.entries(currentWeights)) {
        weightedScore += solution.scores[objective] * weight;
      }
      
      if (weightedScore > bestScore) {
        bestScore = weightedScore;
        bestSolution = solution;
      }
    }
    
    return bestSolution;
  }
}
```

---

## Common Gaming Agent Patterns

### Fleet Management Pattern
```javascript
class FleetManager {
  async manageFleet(fleetId, strategy) {
    const fleet = await this.getFleetState(fleetId);
    const opportunities = await this.analyzeOpportunities(fleet);
    
    // Multi-criteria decision making
    const decision = await this.decisionEngine.evaluate({
      fleet: fleet,
      opportunities: opportunities,
      constraints: strategy.constraints,
      objectives: strategy.objectives
    });
    
    return await this.executeFleetAction(fleet, decision);
  }
}
```

### Resource Optimization Pattern
```javascript
class ResourceOptimizer {
  async optimizeResourceAllocation(fleets, strategy) {
    // Integer linear programming for resource allocation
    const constraints = this.buildConstraints(fleets);
    const objective = this.buildObjectiveFunction(strategy);
    
    const solution = await this.solveILP(objective, constraints);
    return this.translateSolution(solution, fleets);
  }
}
```

### Market Participation Pattern
```javascript
class MarketAgent {
  async participateInMarket(playerState, marketConditions) {
    const opportunities = await this.identifyArbitrage(marketConditions);
    const riskProfile = this.calculateRiskProfile(playerState);
    
    // Only participate if expected value exceeds risk threshold
    const filteredOpportunities = opportunities.filter(
      opportunity => this.expectedValue(opportunity) > riskProfile.threshold
    );
    
    return await this.executeMarketOrders(filteredOpportunities);
  }
}
```

---

## Performance Optimization

### 1. Account Discovery Optimization
- **Batch account fetches**: 50+ accounts per RPC call
- **Parallel program queries**: Query multiple programs simultaneously  
- **Smart caching**: Multi-tier cache with game-aware invalidation
- **Predictive loading**: Pre-fetch likely-needed accounts

### 2. Transaction Optimization
- **Transaction bundling**: Combine related operations
- **Priority fee management**: Dynamic fee adjustment based on urgency
- **Retry strategies**: Exponential backoff with jitter
- **State verification**: Confirm expected state changes

### 3. Real-time Performance
- **Sub-2s fleet discovery**: Target response time for user-facing operations  
- **WebSocket subscriptions**: Real-time game state updates
- **Event-driven architecture**: React to blockchain events immediately
- **Circuit breakers**: Fail fast when external services degrade

---

## Testing Gaming Agents

### Unit Testing Patterns
```javascript
describe('Fleet Discovery', () => {
  beforeEach(async () => {
    // Mock Solana connection with test data
    this.mockConnection = new MockConnection();
    this.fleetManager = new FleetManager(this.mockConnection);
  });
  
  it('should discover fleets across multiple profiles', async () => {
    // Setup test data: wallet with 3 profiles, only 2nd has fleets
    const testWallet = new PublicKey('...');
    this.mockConnection.addProfile(testWallet, 0, { hasFleets: false });
    this.mockConnection.addProfile(testWallet, 1, { hasFleets: true, fleetCount: 5 });
    this.mockConnection.addProfile(testWallet, 2, { hasFleets: false });
    
    const fleets = await this.fleetManager.discoverFleets(testWallet);
    
    expect(fleets).toHaveLength(5);
    expect(fleets[0].profile).toBe(1);
  });
});
```

### Integration Testing
```javascript
describe('Production Integration', () => {
  it('should handle real Star Atlas wallet', async () => {
    // Use actual production wallet for integration tests
    const productionWallet = new PublicKey('ErKVp4M8zhxYRuuqbBkE6f3jFmNKnXTWkSnCZe6yk6uZ');
    const fleets = await fleetManager.discoverFleets(productionWallet);
    
    // Verify production data structure
    expect(fleets).toBeDefined();
    fleets.forEach(fleet => {
      expect(fleet).toHaveProperty('ships');
      expect(fleet).toHaveProperty('cargo');
      expect(fleet.ships.length).toBeGreaterThan(0);
    });
  });
});
```

### Load Testing
```javascript
describe('Performance', () => {
  it('should handle 100 concurrent fleet discoveries', async () => {
    const wallets = generateTestWallets(100);
    const startTime = Date.now();
    
    const discoveries = await Promise.all(
      wallets.map(wallet => fleetManager.discoverFleets(wallet))
    );
    
    const endTime = Date.now();
    const avgResponseTime = (endTime - startTime) / wallets.length;
    
    expect(avgResponseTime).toBeLessThan(2000); // <2s per discovery
    expect(discoveries.every(d => d !== null)).toBe(true);
  });
});
```

---

## Error Handling & Recovery

### Game-Aware Error Recovery
```javascript
class GameErrorHandler {
  async handleError(error, context) {
    // Game state might have changed during operation
    if (error.message.includes('Account not found')) {
      // Re-discover current game state
      const currentState = await this.refreshGameState(context.player);
      return await this.retryWithNewState(context.operation, currentState);
    }
    
    // Resource constraints changed
    if (error.message.includes('Insufficient')) {
      const availableResources = await this.checkResourceAvailability(context.player);
      return await this.adjustOperationForResources(context.operation, availableResources);
    }
    
    // Network/RPC issues
    if (error.message.includes('timeout') || error.message.includes('rate limit')) {
      return await this.exponentialBackoffRetry(context.operation, context.attempt);
    }
    
    // Unknown error - log and gracefully degrade
    this.logger.error('Unknown gaming error:', error, context);
    return await this.gracefulDegradation(context);
  }
}
```

### Circuit Breaker Pattern
```javascript
class GameCircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

---

## Deployment & Monitoring

### Health Checks
```javascript
class GameAgentHealthCheck {
  async checkHealth() {
    const checks = {
      rpc: await this.checkRPCHealth(),
      gameAPI: await this.checkGameAPIHealth(),
      decisionEngine: await this.checkDecisionEngineHealth(),
      cache: await this.checkCacheHealth()
    };
    
    const overallHealth = Object.values(checks).every(check => check.healthy);
    
    return {
      healthy: overallHealth,
      checks: checks,
      timestamp: Date.now()
    };
  }
}
```

### Metrics Collection
```javascript
class GameMetricsCollector {
  recordOperation(operationType, duration, success, metadata = {}) {
    this.metrics.operations.push({
      type: operationType,
      duration: duration,
      success: success,
      accountsRead: metadata.accountsRead || 0,
      programsCoordinated: metadata.programsCoordinated || 0,
      timestamp: Date.now()
    });
    
    // Emit to monitoring system
    this.emit('operation_completed', {
      operation: operationType,
      duration: duration,
      success: success
    });
  }
}
```

---

## Best Practices Summary

### Architecture
1. **Multi-program thinking**: Design for 5+ program coordination from day one
2. **Hierarchical state**: Use multi-tier caching for game state management  
3. **Event-driven updates**: React to blockchain events, don't poll constantly
4. **Graceful degradation**: Handle external service failures elegantly

### Performance  
1. **Batch operations**: 50+ account reads per RPC call
2. **Intelligent caching**: Game-aware invalidation strategies
3. **Async processing**: Parallel program queries and state aggregation
4. **Circuit breakers**: Fail fast when dependencies are down

### Testing
1. **Mock game states**: Test with realistic multi-program scenarios
2. **Integration tests**: Use real production data for validation
3. **Load testing**: Verify performance under concurrent load
4. **Chaos testing**: Inject failures to verify error handling

### Security
1. **Wallet isolation**: Separate agent wallets from player wallets
2. **Permission scoping**: Minimal necessary program interactions
3. **State verification**: Always verify expected outcomes
4. **Audit trails**: Log all agent decisions and actions

---

## Conclusion

Gaming agents represent the next evolution of blockchain automation beyond simple DeFi trading. The patterns in this guide reflect hard-won lessons from building production gaming infrastructure.

**Key Insights**:
- Gaming requires multi-program coordination, not single-program optimization
- Performance comes from intelligent batching and hierarchical caching
- Decision engines must balance multiple objectives simultaneously  
- Error handling must be game-aware, not just network-aware

**Next Steps**:
1. Start with single-game integration (Star Atlas recommended for complexity)
2. Build robust account discovery and state management
3. Implement multi-objective decision making
4. Add comprehensive monitoring and error recovery

**Resources**:
- [S.T.R.I.K.E. Case Study](./CASE-STUDY-FLEET-DISCOVERY.md) - Real production debugging
- [Technical Architecture](./ARCHITECTURE.md) - Deep system design
- [Star Atlas SAGE API](https://galaxy.staratlas.com) - Game state data source
- [Example Implementation](https://github.com/artemis-sage-agent/sage-agent-demo) - Reference code

---

**Gaming agents aren't trading bots with game assets - they're infrastructure for autonomous economies.**

Build accordingly. 🏹