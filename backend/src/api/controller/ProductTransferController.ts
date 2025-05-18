import { Request, Response } from "express";
import { transferOwnership } from "./ProductController";
import ProductManagementController from "./ProductManagementController";
import { container } from 'tsyringe';
import { UserRole, ProductStatus, TransactionActionType } from '../../enum';
import RoleService from '../../core/RoleService';

/**
 * Controller for handling product transfer operations
 */
export default class ProductTransferController {
  /**
   * Transfer product ownership and automatically update status
   */
  static transferProduct = async (req: Request, res: Response) => {
    try {
      // Get instance of ProductManagementController
      const productManagementController = container.resolve(ProductManagementController);
      
      // Extract request data
      const { productId, fromUserId, toUserId, details } = req.body;
      const userId = req.user?.id;

      // Validate basic data
      if (!productId || !fromUserId || !toUserId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters: productId, fromUserId, and toUserId are required"
        });
      }

      // Ensure authenticated user is the current product owner
      if (userId !== fromUserId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only transfer products you own"
        });
      }

      // Get roles of sender and receiver to validate transfer flow
      let fromUserRole: UserRole | null = null;
      let toUserRole: UserRole | null = null;
      
      try {
        fromUserRole = await RoleService.getUserRole(fromUserId);
        toUserRole = await RoleService.getUserRole(toUserId);
        
        // Validate transfer according to supply chain flow
        if (!fromUserRole || !toUserRole) {
          return res.status(400).json({
            success: false,
            message: "Could not determine user roles for transfer"
          });
        }
        
        // Check if transfer follows the correct supply chain flow
        const isValidTransfer = await validateTransferFlow(fromUserRole, toUserRole);
        if (!isValidTransfer) {
          return res.status(400).json({
            success: false,
            message: `Invalid transfer: ${fromUserRole} cannot transfer to ${toUserRole}`
          });
        }
      } catch (error) {
        console.error("Could not determine user roles for transfer:", error);
        return res.status(500).json({
          success: false,
          message: "Error validating transfer roles"
        });
      }

      // 1. Transfer product ownership first
      const transferResult = await transferOwnership(req, res);
      
      // If response has already been sent (error), stop here
      if (res.headersSent) {
        return;
      }
      
      // 2. Always automatically receive products for all role transfers
      const shouldAutoReceive = true;
      
      // Prepare updated details with transfer information
      const transferTime = new Date().toISOString();
      const updatedDetails = {
        ...details,
        previousOwner: fromUserId,
        previousOwnerRole: fromUserRole,
        newOwner: toUserId, 
        newOwnerRole: toUserRole,
        transferTime,
        autoReceived: shouldAutoReceive,
        fromRole: fromUserRole,
        toRole: toUserRole,
        transferStep: getTransferStep(fromUserRole, toUserRole),
        transferTimestamp: Date.now()
      };

      // If auto-receive is enabled, update status to RECEIVED
      if (shouldAutoReceive) {
        console.log(`Auto-receiving product ${productId} transferred from ${fromUserRole} to ${toUserRole}`);
        
        // Modified request for auto-receive with receiver as actor
        req.body = {
          productId,
          targetUserId: toUserId,
          details: {
            ...updatedDetails,
            receivedQuantity: details?.quantity || 100, // Use provided quantity or default
            receivedDate: transferTime,
            receivedBy: toUserId,
            receivedByRole: toUserRole,
            location: details?.location || "Transfer Location",
            condition: details?.condition || "Good",
            notes: `Product automatically received upon transfer from ${fromUserRole} to ${toUserRole}`
          }
        };
        
        // Use the user ID of the receiver as the actor for the receive operation
        const originalUser = req.user;
        req.user = { id: toUserId, role: toUserRole };
        
        // Call the receiveProduct method directly - product will be auto-received
        return productManagementController.receiveProduct(req, res);
      } else {
        // For other transfers, update status to TRANSFERRED
        req.body = {
          productId,
          targetUserId: toUserId,
          details: updatedDetails
        };
        
        return productManagementController.transferProduct(req, res);
      }
    } catch (error) {
      console.error("Error in transfer product:", error);
      return res.status(500).json({
        success: false,
        message: `Error transferring product: ${(error as Error).message}`
      });
    }
  }
}

/**
 * Validate if the transfer follows the correct supply chain flow
 */
async function validateTransferFlow(fromRole: UserRole, toRole: UserRole): Promise<boolean> {
  switch (fromRole) {
    case UserRole.FARMER:
      return toRole === UserRole.COLLECTOR;
    case UserRole.COLLECTOR:
      return toRole === UserRole.TRADER;
    case UserRole.TRADER:
      return toRole === UserRole.RETAILER;
    case UserRole.RETAILER:
      return false; // Retailers cannot transfer products
    default:
      return false;
  }
}

/**
 * Get the step/stage in the transfer flow
 */
function getTransferStep(fromRole: UserRole, toRole: UserRole): string {
  if (fromRole === UserRole.FARMER && toRole === UserRole.COLLECTOR) {
    return 'PRODUCTION_TO_COLLECTION';
  } else if (fromRole === UserRole.COLLECTOR && toRole === UserRole.TRADER) {
    return 'COLLECTION_TO_TRADE';
  } else if (fromRole === UserRole.TRADER && toRole === UserRole.RETAILER) {
    return 'TRADE_TO_RETAIL';
  } else {
    return 'UNKNOWN_TRANSFER';
  }
}