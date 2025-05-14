import express from "express";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadCount
} from "../controller/NotificationController";

const router = express.Router();

router.get("/:userId", getUserNotifications);

router.get("/:userId/unread", getUnreadCount);

router.post("/:userId/:notificationId", markNotificationAsRead);

router.post("/:userId/read-all", markAllNotificationsAsRead);

export default router; 