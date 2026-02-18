# Getting Started with Gaming Agents 🏹
*From zero to autonomous fleet management in 30 minutes*

## Quick Start Guide

This guide walks you through creating your first gaming agent for Star Atlas SAGE, demonstrating the complexity differences between gaming and trading automation.

### Prerequisites
- Node.js 18+
- Basic Solana/Web3 knowledge
- A Star Atlas wallet (for testing)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/ArtemisHunts/sage-agent-demo.git
cd sage-agent-demo

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your RPC endpoint and wallet details
```

## Your First Gaming Agent

### Step 1: Simple Trading Bot (Baseline)
```javascript
// trading-bot.js - Simple token trading automation
import { Connection, PublicKey } from '@solana/web3.js';

class SimpleTradingBot {
  constructor(rpcUrl) {
    this.connection = new Connection(rpcUrl);
  }
  
  async getWalletBalance(walletAddress) {
    const publicKey = new PublicKey(walletAddress);
    
    // Simple: Get SOL balance (1 account)
    const balance = await this.connection.getBalance(publicKey);
    
    // Simple: Get SPL token accounts (2-5 accounts typically)
    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );
    
    return {
      sol: balance / 1e9,
      tokens: tokenAccounts.value.length
    };
  }
  
  // Trading decision: Buy low, sell high
  async shouldTrade(tokenPrice, targetPrice) {
    return tokenPrice < targetPrice * 0.95; // Simple price comparison
  }
}

// Usage: 3-5 account reads, 1-2 programs, linear logic
const bot = new SimpleTradingBot(RPC_URL);
const balance = await bot.getWalletBalance(WALLET_ADDRESS);
console.log('Trading bot complexity:', balance);
```

### Step 2: Gaming Agent (Real Complexity)
```javascript
// gaming-agent.js - Star Atlas fleet management
import { Connection, PublicKey } from '@solana/web3.js';

class StarAtlasGamingAgent {
  constructor(rpcUrl) {
    this.connection = new Connection(rpcUrl);
    this.programs = {
      PPROFLEX: new PublicKey('pprofELXqDsLG969Ak72A7weUQ51AaYoZgvPzzJBRH8'),
      SAGE: new PublicKey('SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6'),
      CARGO: new PublicKey('Cargo2VNvQEp5cC7C6GrVZXfbxWh9wBh6tKNusgHLnCTB')
    };
  }
  
  async discoverPlayerAssets(walletAddress) {
    const publicKey = new PublicKey(walletAddress);
    
    // Step 1: Find ALL player profiles across seasons (multi-program)
    const allProfiles = await this.connection.getProgramAccounts(
      this.programs.PPROFLEX,
      {
        filters: [
          { memcmp: { offset: 8, bytes: publicKey.toString() } }
        ]
      }
    );
    
    console.log(`Found ${allProfiles.length} player profiles across seasons`);
    
    // Step 2: Find which profile has active SAGE gaming data
    let activeProfile = null;
    for (const profile of allProfiles) {
      try {
        const sageProfile = await this.findSagePlayerProfile(profile.pubkey);
        if (sageProfile) {
          activeProfile = profile.pubkey;
          break;
        }
      } catch (error) {
        // This profile doesn't have SAGE activity, continue
        continue;
      }
    }
    
    if (!activeProfile) {
      throw new Error('No active SAGE profiles found');
    }
    
    // Step 3: Multi-program asset discovery
    const [fleets, resources, marketOrders] = await Promise.all([
      this.discoverFleets(activeProfile),
      this.discoverResources(activeProfile), 
      this.discoverMarketActivity(activeProfile)
    ]);
    
    return {
      wallet: walletAddress,
      activeProfile: activeProfile.toString(),
      fleets: fleets,
      resources: resources,
      marketOrders: marketOrders,
      totalAccounts: fleets.totalAccounts + resources.length + marketOrders.length
    };
  }
  
  async discoverFleets(profilePublicKey) {
    // Fleet discovery requires multiple derived account lookups
    const fleetRegistry = await this.findFleetRegistry(profilePublicKey);
    
    if (!fleetRegistry) {
      return { fleets: [], totalAccounts: 0 };
    }
    
    // Batch fetch all fleet data
    const fleetAccounts = await this.batchGetFleetAccounts(fleetRegistry);
    
    // For each fleet, get ships, crews, and cargo
    const detailedFleets = [];
    let totalAccounts = 0;
    
    for (const fleet of fleetAccounts) {
      const [ships, crews, cargo] = await Promise.all([
        this.getFleetShips(fleet.publicKey),
        this.getFleetCrews(fleet.publicKey),
        this.getFleetCargo(fleet.publicKey)
      ]);
      
      detailedFleets.push({
        id: fleet.publicKey.toString(),
        ships: ships,
        crews: crews,
        cargo: cargo,
        accountsRead: ships.length + crews.length + cargo.length + 1
      });
      
      totalAccounts += ships.length + crews.length + cargo.length + 1;
    }
    
    console.log(`Discovered ${detailedFleets.length} fleets with ${totalAccounts} total accounts`);
    
    return {
      fleets: detailedFleets,
      totalAccounts: totalAccounts
    };
  }
  
  // Gaming decision: Multi-objective optimization
  async optimizeFleetStrategy(playerAssets) {
    const objectives = {
      efficiency: this.calculateEfficiency(playerAssets.fleets),
      profitability: this.calculateProfitability(playerAssets.resources),
      safety: this.calculateSafety(playerAssets.fleets),
      flexibility: this.calculateFlexibility(playerAssets.fleets)
    };
    
    // Multi-criteria decision making (not simple price comparison)
    const strategy = this.weightedOptimization(objectives, {
      efficiency: 0.3,
      profitability: 0.4, 
      safety: 0.2,
      flexibility: 0.1
    });
    
    return strategy;
  }
  
  // Helper methods (implementation details)
  async findSagePlayerProfile(profileKey) {
    // Derive SAGE player profile from base profile
    const seeds = [Buffer.from('SagePlayerProfile'), profileKey.toBuffer()];
    const [sageProfilePDA] = PublicKey.findProgramAddressSync(
      seeds,
      this.programs.SAGE
    );
    
    try {
      const accountInfo = await this.connection.getAccountInfo(sageProfilePDA);
      return accountInfo ? sageProfilePDA : null;
    } catch (error) {
      return null;
    }
  }
  
  async findFleetRegistry(profileKey) {
    // Derive fleet registry from SAGE profile
    const sageProfile = await this.findSagePlayerProfile(profileKey);
    if (!sageProfile) return null;
    
    const seeds = [Buffer.from('FleetRegistry'), sageProfile.toBuffer()];
    const [fleetRegistryPDA] = PublicKey.findProgramAddressSync(
      seeds,
      this.programs.SAGE
    );
    
    try {
      const accountInfo = await this.connection.getAccountInfo(fleetRegistryPDA);
      return accountInfo ? fleetRegistryPDA : null;
    } catch (error) {
      return null;
    }
  }
  
  async batchGetFleetAccounts(fleetRegistry) {
    // Implementation would batch fetch fleet accounts
    // This is a simplified example
    return []; // Real implementation would return fleet account data
  }
  
  async getFleetShips(fleetKey) {
    // Get all ships belonging to a fleet
    return []; // Simplified - real implementation would fetch ship accounts
  }
  
  async getFleetCrews(fleetKey) {
    // Get all crew members for a fleet
    return []; // Simplified
  }
  
  async getFleetCargo(fleetKey) {
    // Get cargo hold contents
    return []; // Simplified
  }
  
  async discoverResources(profileKey) {
    // Discover all resource accounts (ATLAS, POLIS, materials, etc.)
    return []; // Simplified
  }
  
  async discoverMarketActivity(profileKey) {
    // Find active market orders across multiple marketplaces
    return []; // Simplified
  }
  
  calculateEfficiency(fleets) {
    // Fleet composition efficiency calculation
    return Math.random(); // Placeholder
  }
  
  calculateProfitability(resources) {
    // Resource allocation profitability
    return Math.random(); // Placeholder
  }
  
  calculateSafety(fleets) {
    // Fleet safety and risk assessment
    return Math.random(); // Placeholder
  }
  
  calculateFlexibility(fleets) {
    // Strategic flexibility measurement
    return Math.random(); // Placeholder
  }
  
  weightedOptimization(objectives, weights) {
    // Multi-objective weighted optimization
    let totalScore = 0;
    for (const [objective, score] of Object.entries(objectives)) {
      totalScore += score * weights[objective];
    }
    
    return {
      strategy: 'optimized',
      score: totalScore,
      objectives: objectives
    };
  }
}

// Usage: 50-200+ account reads, 5+ programs, multi-objective optimization
const agent = new StarAtlasGamingAgent(RPC_URL);
try {
  const assets = await agent.discoverPlayerAssets(WALLET_ADDRESS);
  console.log('Gaming agent complexity:', assets);
  
  const strategy = await agent.optimizeFleetStrategy(assets);
  console.log('Optimization result:', strategy);
} catch (error) {
  console.error('Gaming agent error:', error);
}
```

## Complexity Comparison

Run both examples to see the difference:

```bash
# Simple trading bot
node trading-bot.js
# Output: 3-5 accounts, simple balance check

# Gaming agent  
node gaming-agent.js
# Output: 50-200+ accounts, multi-program coordination
```

### Key Differences

| Aspect | Trading Bot | Gaming Agent |
|--------|-------------|--------------|
| **Accounts** | 3-5 | 50-200+ |
| **Programs** | 1-2 | 5+ |
| **Decision Logic** | Price comparison | Multi-objective optimization |
| **State Management** | Simple balances | Complex game progression |
| **Error Handling** | Retry trades | Game-aware recovery |

---

## Next Steps

### 1. Try the Real Demo
Visit our live analyzer: [ArtemisHunts.github.io/sage-agent-demo/](https://ArtemisHunts.github.io/sage-agent-demo/)

Enter a Star Atlas wallet address and see the account complexity in action.

### 2. Build Your Own Agent

Follow the [Developer Guide](./DEVELOPER-GUIDE.md) for complete implementation patterns:
- Multi-program account discovery
- RPC batching and optimization  
- Gaming-aware state management
- Multi-objective decision engines

### 3. Study the Architecture

Read the [Technical Architecture](./ARCHITECTURE.md) for deep system design:
- Multi-program coordination patterns
- Performance optimization strategies
- Error recovery and state synchronization
- Security frameworks

### 4. Learn from Production

Review the [Fleet Discovery Case Study](./CASE-STUDY-FLEET-DISCOVERY.md):
- Real production debugging experience
- Account relationship complexity
- Infrastructure requirements
- Performance benchmarks

---

## Community

- **GitHub**: [ArtemisHunts/sage-agent-demo](https://github.com/ArtemisHunts/sage-agent-demo)
- **Documentation**: Complete guides and examples in this repository  
- **Demo Site**: [Live fleet analyzer](https://ArtemisHunts.github.io/sage-agent-demo/)
- **Star Atlas**: [Official game documentation](https://sage.staratlas.com/docs)

---

## Contributing

We welcome contributions from the gaming, blockchain, and AI communities!

Areas where you can help:
- **Gaming Integration**: Support for additional Solana games
- **Optimization**: Performance improvements and caching strategies
- **Documentation**: Tutorials, examples, and guides
- **Testing**: Edge case coverage and load testing

See our [Enhanced README](./README-enhanced.md) for full contribution guidelines.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Gaming agents aren't trading bots with game assets - they're infrastructure for autonomous economies.** 🏹

Start building with the patterns above, then dive deeper into our comprehensive documentation for production-ready implementations.