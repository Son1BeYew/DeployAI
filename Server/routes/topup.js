const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const {
  createMomoPayment,
  momoCallback,
  mockMomoCallback,
  checkPaymentStatusFromMomo,
  getTopupHistory,
  getTopupStatus,
  markTopupSuccess,
  markTopupCancelled,
  getBalance,
  getAllUserBalances,
  getAccountSummary,
  getPremiumPlans,
} = require("../controllers/topupController");

const checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

/**
 * @swagger
 * /api/topup/create-momo:
 *   post:
 *     summary: Create MoMo payment request
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to top up
 *               orderInfo:
 *                 type: string
 *                 description: Order description
 *     responses:
 *       200:
 *         description: MoMo payment URL created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payUrl:
 *                   type: string
 *                 orderId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.post("/create-momo", checkAuth, createMomoPayment);
/**
 * @swagger
 * /api/topup/callback:
 *   post:
 *     summary: MoMo payment callback (webhook)
 *     tags: [TopUp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               resultCode:
 *                 type: number
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post("/callback", momoCallback);

// Test endpoint to verify callback is accessible
router.get("/callback", (req, res) => {
  console.log("🧪 GET request to callback endpoint");
  res.json({ 
    message: "Callback endpoint is accessible",
    method: "POST required",
    timestamp: new Date().toISOString()
  });
});
/**
 * @swagger
 * /api/topup/mock-callback/{id}:
 *   get:
 *     summary: Mock MoMo callback for development testing
 *     tags: [TopUp]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TopUp transaction ID
 *     responses:
 *       200:
 *         description: Mock callback processed
 */
router.get("/mock-callback/:id", mockMomoCallback);
/**
 * @swagger
 * /api/topup/check-momo-status/{id}:
 *   get:
 *     summary: Check MoMo payment status from MoMo API
 *     tags: [TopUp]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TopUp transaction ID
 *     responses:
 *       200:
 *         description: Payment status from MoMo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 resultCode:
 *                   type: number
 */
router.get("/check-momo-status/:id", checkPaymentStatusFromMomo);

/**
 * @swagger
 * /api/topup/history:
 *   get:
 *     summary: Get user's topup history
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of topup transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopUp'
 *       401:
 *         description: Unauthorized
 */
router.get("/history", checkAuth, getTopupHistory);

/**
 * @swagger
 * /api/topup/status/{id}:
 *   get:
 *     summary: Get topup transaction status
 *     tags: [TopUp]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TopUp transaction ID
 *     responses:
 *       200:
 *         description: Transaction status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TopUp'
 *       404:
 *         description: Transaction not found
 */
router.get("/status/:id", getTopupStatus);

/**
 * @swagger
 * /api/topup/balance:
 *   get:
 *     summary: Get user's current balance
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                 currency:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/balance", checkAuth, getBalance);

/**
 * @swagger
 * /api/topup/account-summary:
 *   get:
 *     summary: Get full account summary with balance and transactions
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                 totalSpent:
 *                   type: number
 *                 totalTopUp:
 *                   type: number
 *                 transactions:
 *                   type: array
 *       401:
 *         description: Unauthorized
 */
router.get("/account-summary", checkAuth, getAccountSummary);

/**
 * @swagger
 * /api/topup/premium-plans:
 *   get:
 *     summary: Get available premium plans for display
 *     tags: [TopUp]
 *     responses:
 *       200:
 *         description: List of premium plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PremiumPlan'
 */
router.get("/premium-plans", getPremiumPlans);

/**
 * @swagger
 * /api/topup/debug-all-balances:
 *   get:
 *     summary: Debug - Get all users with balances
 *     tags: [TopUp]
 *     responses:
 *       200:
 *         description: List of all user balances (debug only)
 */
router.get("/debug-all-balances", getAllUserBalances);

/**
 * @swagger
 * /api/topup/debug-token:
 *   get:
 *     summary: Debug - Check token validity
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                 userId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/debug-token", checkAuth, (req, res) => {
  // Debug endpoint to check token
  res.json({
    token: req.headers.authorization,
    user: req.user,
    userId: req.user?.id || req.user?._id,
  });
});

/**
 * @swagger
 * /api/topup/mark-success/{id}:
 *   put:
 *     summary: Mark topup as successful (development testing)
 *     tags: [TopUp]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TopUp transaction ID
 *     responses:
 *       200:
 *         description: Transaction marked as successful
 *       404:
 *         description: Transaction not found
 */
router.put("/mark-success/:id", markTopupSuccess);

/**
 * @swagger
 * /api/topup/cancel/{id}:
 *   put:
 *     summary: Cancel pending topup transaction
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TopUp transaction ID
 *     responses:
 *       200:
 *         description: Transaction cancelled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.put("/cancel/:id", checkAuth, markTopupCancelled);

/**
 * @swagger
 * /api/topup/fix-balance:
 *   post:
 *     summary: Fix user balance by recalculating from successful topups
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance fixed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 oldBalance:
 *                   type: number
 *                 newBalance:
 *                   type: number
 *                 totalTopups:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.post("/fix-balance", checkAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const mongoose = require("mongoose");
    const TopUp = require("../models/TopUp");
    const Profile = require("../models/Profile");

    console.log("🔧 Fixing balance for user:", userId);

    // Calculate correct balance from successful topups
    const result = await TopUp.aggregate([
      { 
        $match: { 
          userId: mongoose.Types.ObjectId(userId), 
          status: "success" 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalBalance: { $sum: "$amount" },
          count: { $sum: 1 }
        } 
      },
    ]);

    const correctBalance = result.length > 0 ? result[0].totalBalance : 0;
    const topupCount = result.length > 0 ? result[0].count : 0;

    console.log(`📊 Calculated balance: ${correctBalance} from ${topupCount} topups`);

    // Get or create profile
    let profile = await Profile.findOne({ userId });
    const oldBalance = profile ? profile.balance : 0;

    if (!profile) {
      profile = await Profile.create({
        userId: userId,
        balance: correctBalance,
      });
      console.log("✅ Created new Profile with balance:", correctBalance);
    } else {
      profile.balance = correctBalance;
      await profile.save();
      console.log(`✅ Updated balance: ${oldBalance} → ${correctBalance}`);
    }

    res.json({
      success: true,
      oldBalance,
      newBalance: correctBalance,
      totalTopups: topupCount,
      difference: correctBalance - oldBalance,
    });
  } catch (error) {
    console.error("❌ Error fixing balance:", error);
    res.status(500).json({ error: "Lỗi khi fix balance" });
  }
});

module.exports = router;

