import { Router, Request, Response } from "express";

const router = Router();

// Statistics endpoint
router.get("/statistics", (req: Request, res: Response) => {
  console.log("Custom statistics endpoint called");
  // Return mock statistics data
  res.json({
    success: true,
    data: {
      totalUsers: 124,
      farmerCount: 35,
      collectorCount: 25,
      traderCount: 22,
      retailerCount: 23,
      consumerCount: 19,
      unknownCount: 0
    }
  });
});

// Trend endpoint
router.get("/trend", (req: Request, res: Response) => {
  console.log("Custom trend endpoint called");
  const period = req.query.period as string || 'monthly';
  const now = new Date();
  let data = [];
  let count = period === 'weekly' ? 7 : period === 'monthly' ? 12 : 6;
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);
    if (period === 'weekly') {
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: Math.floor(Math.random() * 10) + 1
      });
    } else if (period === 'monthly') {
      date.setMonth(date.getMonth() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short' }),
        count: Math.floor(Math.random() * 30) + 5
      });
    } else {
      date.setMonth(date.getMonth() - (i * 2));
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: Math.floor(Math.random() * 100) + 10
      });
    }
  }
  
  res.json({
    success: true,
    data
  });
});

export default router; 