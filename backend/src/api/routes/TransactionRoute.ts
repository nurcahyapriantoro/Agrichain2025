import { Router } from "express"

import catcher from "../helper/handler"
import {
  getTransaction,
  signTransaction,
  createTransaction,
  getTransactionPool,
  transferCoin,
  stakeCoin,
  getTransactionFlow,
  createBenih,
  purchaseCoin,
} from "../controller/TransactionController"
import validate from "../middleware/validation"
import {
  transactionSchema,
  coinTransferSchema,
  coinStakeSchema,
  createBenihSchema,
  purchaseCoinSchema,
} from "../validation/transactionSchema"
import { transactionRateLimiter } from "../../middleware/rateLimiter"
import { transactionAmountSchema, fundTransferSchema, productTransactionSchema } from "../validation/transactionValidation"
import { authenticateJWT } from "../../middleware/auth"

const router = Router()

router.get("/", catcher(getTransactionPool));

router.post(
  "/create", 
  authenticateJWT,
  transactionRateLimiter,
  validate(transactionSchema), 
  validate(transactionAmountSchema),
  catcher(createTransaction)
)

router.post("/create-benih", validate(createBenihSchema), catcher(createBenih))

router.post("/sign", validate(transactionSchema), catcher(signTransaction))

router.post(
  "/purchase-coin",
  validate(purchaseCoinSchema),
  catcher(purchaseCoin)
)

router.post(
  "/transfer-coin",
  authenticateJWT,
  transactionRateLimiter,
  validate(coinTransferSchema),
  validate(fundTransferSchema),
  catcher(transferCoin)
)

router.post("/stake", validate(coinStakeSchema), catcher(stakeCoin))

router.get("/pool", catcher(getTransactionPool))

router.get("/:hash", catcher(getTransaction))

router.get("/:hash/flow", catcher(getTransactionFlow))

export default router
