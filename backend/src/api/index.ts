import express, {
  type NextFunction,
  type Response,
  type Request,
} from "express"
import cors from "cors"
import bodyParser from "body-parser"
import { ValidationError } from "express-validation"
import helmet from "helmet"
import rateLimit from "express-rate-limit"

import Transaction from "../transaction"
import apiRoutes from "./routes"
import catch404Error from "./middleware/catch404"
import handleError from "./middleware/errorHandler"
import { requestLogger, errorLogger } from "../middleware/requestLogger"

import type { ChainInfo, ConnectedNode } from "../types"

import ProductRoute from "./routes/ProductRoute"
import BlockchainRoute from "./routes/BlockchainRoute"
import UserRoute from "./routes/UserRoute"
import StateRoute from "./routes/StateRoute"
import TransactionRoute from "./routes/TransactionRoute"
import RoleRoute from "./routes/RoleRoute"
import NotificationRoute from "./routes/NotificationRoute"
import TransactionHistoryRoute from "./routes/TransactionHistoryRoute"

// Import new routes
import ProductSearchRoute from "./routes/ProductSearchRoute"
import SynchronizationRoute from "./routes/SynchronizationRoute"
import CustomRoute from "./routes/CustomRoute"
import FormAuthRoute from "./routes/Auth/FormAuthRoute"
import GoogleAuthRoute from "./routes/Auth/GoogleAuthRoute"
import Web3AuthRoute from "./routes/Auth/Web3AuthRoute"

// Import ProductSynchronizationService for auto-sync feature
import ProductSynchronizationService from "../core/ProductSynchronizationService"
import BlockchainIntegration from "../core/BlockchainIntegration"

// Import global error handler
import { globalErrorHandler } from "../utils/errorHandler"

const app = express()

const api = (
  port: number,
  client: {
    publicKey: string
    mining: boolean
    chainInfo: ChainInfo
    connectedNodes: Map<string, ConnectedNode>
  },
  transactionHandler: (transaction: Transaction) => void
) => {
  const { chainInfo, publicKey, mining, connectedNodes } = client

  // Initialize BlockchainIntegration with the transaction handler
  const blockchainIntegration = BlockchainIntegration.getInstance();
  blockchainIntegration.setTransactionHandler(async (tx) => {
    try {
      transactionHandler(tx);
      // Fungsi ini mungkin tidak mengembalikan nilai, namun we'll assume success
      return true;
    } catch (error) {
      console.error("Error handling blockchain transaction:", error);
      return false;
    }
  });

  const localsMiddleware = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    res.locals = {
      chainInfo,
      mining,
      getConnectedNode: () => {
        return [...connectedNodes.values()].map((node) => node.publicKey)
      },
      transactionHandler,
      blockchainIntegration, // Make available to controllers
    }
    next()
  }

  process.on("uncaughtException", (err) =>
    console.log(
      `\x1b[31mERROR\x1b[0m [${new Date().toISOString()}] Uncaught Exception`,
      err
    )
  )

  // Security middleware
  app.use(helmet())
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }))

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
  })
  app.use(limiter)

  // Body parsing middleware
  app.use(bodyParser.json({ limit: '10mb' }))
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

  // setup middleware
  app.use(requestLogger)

  // setup routes
  app.use("/api", localsMiddleware, apiRoutes)

  app.get("/api/node/address", (req, res) => {
    res.json({
      data: { publicKey },
    })
  })

  // Simple ping endpoint for connectivity testing
  app.get("/api/ping", (req, res) => {
    res.json({
      success: true,
      message: "Backend server is running",
      timestamp: Date.now()
    });
  });

  // Alias untuk memudahkan akses ke endpoint transaksi
  app.get("/api/transactions", (req, res) => {
    console.log("Alias endpoint /api/transactions dipanggil, mengalihkan ke /transaction-history/latest");
    // Alihkan ke endpoint transaksi yang benar
    return res.redirect(`/api/transaction-history/latest${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`);
  });

  // Endpoint DEBUG untuk memeriksa semua rute yang terdaftar
  app.get('/api/debug/routes', (req, res) => {
    console.log('Generating routes list for debugging');
    const routes: Array<{ path: string; methods: string[] }> = [];
    
    // Fungsi rekursif untuk memeriksa rute
    function processStack(stack: any[], basePath = ''): void {
      stack.forEach((middleware: any) => {
        if (middleware.route) {
          // Route langsung
          const path = basePath + middleware.route.path;
          const methods = Object.keys(middleware.route.methods);
          routes.push({ path, methods });
        } else if (middleware.name === 'router' || middleware.handle?.stack) {
          // Router-level middleware
          const path = basePath + (middleware.regexp ? 
            middleware.regexp.toString().replace('/^', '').replace('\\/?(?=\\/|$)/i', '') : '');
          
          if (middleware.handle?.stack) {
            processStack(middleware.handle.stack, path);
          }
        }
      });
    }
    
    // Proses semua rute yang terdaftar di aplikasi
    if (app._router && app._router.stack) {
      processStack(app._router.stack);
    }
    
    res.json({
      routesCount: routes.length,
      routes: routes.sort((a, b) => a.path.localeCompare(b.path))
    });
  });

  app.use("/api/auth/form", FormAuthRoute)
  app.use("/api/auth/google", GoogleAuthRoute)
  app.use("/api/auth/web3", Web3AuthRoute)
  app.use("/api/blockchain", BlockchainRoute)
  
  app.use(errorLogger)
  app.use(catch404Error)
  app.use(handleError)

  // Register global error handler
  app.use(globalErrorHandler)

  // Handle validation errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation error",
          details: err.details,
          timestamp: Date.now()
        }
      });
    }
    next(err);
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        timestamp: Date.now()
      }
    });
  });

  app.listen(port, () => {
    console.log(`Server up on port ${port}`)
    console.log(`API Documentation available at http://localhost:${port}/api-docs`)
    
    // Jalankan sinkronisasi produk otomatis setiap 60 menit
    console.log("Setting up automatic product synchronization...")
    ProductSynchronizationService.schedulePeriodicSync(60);
    
    // Jalankan sinkronisasi awal saat aplikasi dimulai
    setTimeout(async () => {
      try {
        console.log("Running initial product synchronization...")
        const result = await ProductSynchronizationService.synchronizeProducts();
        console.log(`Initial synchronization completed: ${result.syncedProducts} products synchronized.`);
      } catch (error) {
        console.error("Error during initial product synchronization:", error);
      }
    }, 10000); // Tunggu 10 detik setelah server startup untuk memastikan semua komponen sudah siap
  })
}

export default api
