import express from "express"
import StateRoute from "./StateRoute"
import BlockchainRoute from "./BlockchainRoute"
import TransactionRoute from "./TransactionRoute"
import UserRoute from "./UserRoute"
import RoleRoute from "./RoleRoute"
import ProductRoute from "./ProductRoute"
import ProductSearchRoute from "./ProductSearchRoute"
import TransactionHistoryRoute from "./TransactionHistoryRoute"
import NotificationRoute from "./NotificationRoute"
import FormAuthRoute from "./Auth/FormAuthRoute";
import GoogleAuthRoute from "./Auth/GoogleAuthRoute";
import Web3AuthRoute from "./Auth/Web3AuthRoute";

const router = express.Router()

router.get("/", function (_req, res) {
  return res.status(200).json({
    message: "Welcome to API. Check the documentation for more information",
  })
})

router.use("/node", StateRoute)
router.use("/blockchain", BlockchainRoute)
router.use("/transaction", TransactionRoute)
router.use("/user", UserRoute)
router.use("/role", RoleRoute)
router.use("/product", ProductRoute)
router.use("/product-search", ProductSearchRoute)
router.use("/transaction-history", TransactionHistoryRoute)
router.use("/notifications", NotificationRoute)
router.use("/auth/form", FormAuthRoute);
router.use("/auth/google", GoogleAuthRoute);
router.use("/auth/web3", Web3AuthRoute);

export default router
