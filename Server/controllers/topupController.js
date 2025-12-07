const TopUp = require("../models/TopUp");
const User = require("../models/User");
const Profile = require("../models/Profile");
const PremiumPlan = require("../models/PremiumPlan");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

// Khởi tạo payment Momo
exports.createMomoPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Số tiền phải lớn hơn 0" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Tạo TopUp record
    console.log("💰 Tạo TopUp: userId=", userId, "amount=", amount);
    const topUp = await TopUp.create({
      userId,
      amount,
      method: "momo",
      status: "pending",
    });
    console.log("✅ TopUp created:", topUp._id);

    // Momo API configuration từ env
    const momoConfig = {
      partnerCode: process.env.MOMO_PARTNER_CODE || "YOUR_PARTNER_CODE",
      accessKey: process.env.MOMO_ACCESS_KEY || "YOUR_ACCESS_KEY",
      secretKey: process.env.MOMO_SECRET_KEY || "YOUR_SECRET_KEY",
      endpoint:
        process.env.MOMO_ENDPOINT ||
        "https://payment.momo.vn/v2/gateway/api/create",
    };

    console.log("⚙️ Momo config:", {
      partnerCode: momoConfig.partnerCode,
      hasAccessKey: !!process.env.MOMO_ACCESS_KEY,
      hasSecretKey: !!process.env.MOMO_SECRET_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL,
      BACKEND_URL: process.env.BACKEND_URL,
      NODE_ENV: process.env.NODE_ENV,
    });

    const requestId = `${Date.now()}-${topUp._id}`;
    const orderId = `topup-${topUp._id}`;
    // Get return URL from request body, query, or use default
    const returnTo = req.body.returnTo || req.query.returnTo || "/topup.html";
    console.log("🔗 Return URL:", returnTo);
    const redirectUrl = process.env.MOMO_TOPUP_RETURN_URL;
    console.log("🔗 Full redirect URL:", redirectUrl);
    const ipnUrl = process.env.MOMO_TOPUP_IPN_URL;

    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      requestId,
      orderId,
      amount,
      orderInfo: `Nạp tiền ${amount}đ`,
      redirectUrl,
      ipnUrl,
      requestType: "captureWallet",
      extraData: "", // Required by Momo API
      signature: "", // Will be calculated below
    };

    // Calculate signature (SHA256) - thứ tự alphabetical
    const crypto = require("crypto");
    const signatureString = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${requestBody.extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${requestBody.orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestBody.requestType}`;

    console.log("🔐 Signature string:", signatureString);

    requestBody.signature = crypto
      .createHmac("sha256", momoConfig.secretKey)
      .update(signatureString)
      .digest("hex");

    console.log("🔐 Calculated signature:", requestBody.signature);

    // Call Momo API
    // For development: Use mock Momo response
    if (process.env.NODE_ENV !== "production") {
      console.log("🧪 Using mock Momo response (development mode)");

      topUp.status = "pending";
      topUp.momoTransactionId = `MOCK_${Date.now()}`;
      await topUp.save();

      const mockResponse = {
        success: true,
        payUrl: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/topup-result?id=${topUp._id}&returnTo=${encodeURIComponent(
          returnTo
        )}`,
        orderId: topUp._id,
        message: "🧪 Mock Momo link created (development mode)",
      };
      console.log("✅ Sending mock response:", JSON.stringify(mockResponse));
      return res.json(mockResponse);
    }

    // For production: Call real Momo API
    console.log("📤 Calling Momo API with endpoint:", momoConfig.endpoint);
    console.log("📋 Request body:", JSON.stringify(requestBody, null, 2));
    console.log("🔑 Using partnerCode:", momoConfig.partnerCode);
    console.log(
      "🔑 Using accessKey:",
      momoConfig.accessKey?.substring(0, 5) + "..."
    );

    try {
      const momoResponse = await axios.post(momoConfig.endpoint, requestBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      console.log("✅ Momo API response:", momoResponse.data);

      // Save Momo transaction ID
      topUp.momoTransactionId = momoResponse.data.requestId;
      await topUp.save();

      res.json({
        success: true,
        payUrl: momoResponse.data.payUrl,
        orderId: topUp._id,
        message: "Tạo link thanh toán thành công",
      });
    } catch (momoError) {
      console.error("❌ Momo API error:", {
        status: momoError.response?.status,
        statusText: momoError.response?.statusText,
        data: momoError.response?.data,
        message: momoError.message,
      });

      // Log chi tiết subErrors
      if (momoError.response?.data?.subErrors) {
        console.error("📋 SubErrors detail:");
        momoError.response.data.subErrors.forEach((err, idx) => {
          console.error(`   [${idx}]:`, err);
        });
      }

      throw momoError;
    }
  } catch (error) {
    console.error("❌ Lỗi tạo payment Momo:", error.message);
    console.error("   Stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Lỗi tạo link thanh toán",
      details: error.message,
    });
  }
};

// Callback từ Momo
exports.momoCallback = async (req, res) => {
  try {
    console.log("=".repeat(80));
    console.log("🔔 MOMO CALLBACK RECEIVED at:", new Date().toISOString());
    console.log("🔔 IP:", req.ip || req.connection.remoteAddress);
    console.log("🔔 Headers:", JSON.stringify(req.headers, null, 2));
    console.log("🔔 Body:", JSON.stringify(req.body, null, 2));
    console.log("=".repeat(80));

    // Tìm topUp bằng requestId hoặc orderId
    const { orderId, resultCode, transId, requestId } = req.body;

    if (!orderId && !requestId) {
      console.error("❌ Callback missing orderId and requestId");
      return res.status(400).json({ error: "Thiếu orderId hoặc requestId" });
    }

    // orderId format: topup-{id}
    let topUpId = orderId?.replace("topup-", "");
    if (!topUpId && requestId) {
      // Try to extract ID from requestId format: {timestamp}-{id}
      topUpId = requestId.split("-").slice(1).join("-");
    }

    console.log("🔍 Looking for topUp with ID:", topUpId);
    const topUp = await TopUp.findById(topUpId);

    if (!topUp) {
      console.error(
        "❌ TopUp not found for orderId:",
        orderId,
        "requestId:",
        requestId
      );
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    console.log("✅ Found topUp:", topUp._id, "resultCode:", resultCode);

    if (resultCode === 0 || resultCode === "0") {
      // Payment success
      topUp.status = "success";
      topUp.momoTransactionId = transId || requestId;
      await topUp.save();
      console.log(
        "✅ TopUp marked as success. Updated at:",
        new Date().toISOString()
      );

      // Cộng tiền vào balance của Profile
      try {
        let profile = await Profile.findOne({ userId: topUp.userId });
        
        // Tạo profile nếu chưa có
        if (!profile) {
          profile = await Profile.create({
            userId: topUp.userId,
            balance: 0
          });
          console.log("✅ Created new Profile for user:", topUp.userId);
        }
        
        profile.balance = (profile.balance || 0) + topUp.amount;
        await profile.save();
        console.log("✅ Profile balance updated:", profile.balance, "for user:", topUp.userId);
      } catch (profileError) {
        console.error("⚠️ Lỗi cập nhật Profile balance:", profileError.message);
        console.error("   Stack:", profileError.stack);
      }

      res.json({ success: true, message: "Thanh toán thành công" });
    } else {
      // Payment failed
      topUp.status = "failed";
      await topUp.save();
      console.log("❌ TopUp marked as failed, resultCode:", resultCode);
      res.json({ success: false, message: "Thanh toán thất bại" });
    }
  } catch (error) {
    console.error("❌ Lỗi callback Momo:", error.message);
    console.error("   Stack:", error.stack);
    res.status(500).json({ error: "Lỗi xử lý callback" });
  }
};

// Manual check status endpoint (for frontend to verify payment after Momo redirect)
exports.checkPaymentStatusFromMomo = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Checking Momo payment status for topUp:", id);

    const topUp = await TopUp.findById(id);
    if (!topUp) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    // If already marked success, return it
    if (topUp.status === "success") {
      console.log("✅ TopUp already marked success:", id);
      return res.json(topUp);
    }

    // If user returned from MoMo and status still pending, assume payment success
    // (User only returns if they completed payment or cancelled)
    if (topUp.status === "pending") {
      console.log("🔄 User returned from MoMo, marking as success");
      
      topUp.status = "success";
      await topUp.save();
      
      // Cộng tiền vào balance
      try {
        const Profile = require("../models/Profile");
        let profile = await Profile.findOne({ userId: topUp.userId });
        
        if (!profile) {
          profile = await Profile.create({
            userId: topUp.userId,
            balance: 0
          });
          console.log("✅ Created new Profile for user:", topUp.userId);
        }
        
        profile.balance = (profile.balance || 0) + topUp.amount;
        await profile.save();
        console.log("✅ Profile balance updated:", profile.balance, "for user:", topUp.userId);
      } catch (profileError) {
        console.error("⚠️ Lỗi cập nhật Profile balance:", profileError.message);
      }
    }

    res.json(topUp);
  } catch (error) {
    console.error("❌ Error checking Momo status:", error.message);
    res.status(500).json({ error: "Lỗi kiểm tra trạng thái" });
  }
};

// Mock callback for development (test locally)
exports.mockMomoCallback = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🧪 Mock Momo callback for topUpId:", id);
    const topUp = await TopUp.findByIdAndUpdate(
      id,
      {
        status: "success",
        momoTransactionId: `MOCK_${Date.now()}`,
      },
      { new: true }
    );

    if (!topUp) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    // Cộng tiền vào balance của Profile
    try {
      const profile = await Profile.findOne({ userId: topUp.userId });
      if (profile) {
        profile.balance = (profile.balance || 0) + topUp.amount;
        await profile.save();
        console.log("✅ Profile balance updated:", profile.balance);
      }
    } catch (profileError) {
      console.error("⚠️ Lỗi cập nhật Profile balance:", profileError.message);
    }

    console.log("✅ Mock callback completed for:", id);
    res.json({ success: true, topUp });
  } catch (error) {
    console.error("❌ Mock callback error:", error.message);
    res.status(500).json({ error: "Lỗi mock callback" });
  }
};

// Get topup history
exports.getTopupHistory = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    console.log("📜 Getting topup history for userId:", userId);
    let history = await TopUp.find({ userId }).sort({ createdAt: -1 });

    // Auto-update status for old pending transactions
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours

    for (let topup of history) {
      // If transaction is pending for more than 10 minutes, mark as failed
      if (
        topup.status === "pending" &&
        new Date(topup.createdAt) < tenMinutesAgo
      ) {
        console.log(
          "Auto-failing old pending transaction:",
          topup._id,
          "created:",
          topup.createdAt
        );
        await TopUp.findByIdAndUpdate(topup._id, { status: "failed" });
      }
      // If transaction is pending for more than 24 hours, mark as cancelled
      else if (
        topup.status === "pending" &&
        new Date(topup.createdAt) < oneDayAgo
      ) {
        console.log("Auto-cancelling very old pending transaction:", topup._id);
        await TopUp.findByIdAndUpdate(topup._id, { status: "cancelled" });
      }
    }

    // Refresh history after updates
    history = await TopUp.find({ userId }).sort({ createdAt: -1 });

    console.log("Found", history.length, "records");
    console.log("Data:", JSON.stringify(history.slice(0, 3)));
    res.json(history);
  } catch (error) {
    console.error(" Lỗi lấy lịch sử:", error.message);
    res.status(500).json({ error: "Lỗi lấy lịch sử nạp tiền" });
  }
};

// Get topup status
exports.getTopupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const topUp = await TopUp.findById(id);

    if (!topUp) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    res.json(topUp);
  } catch (error) {
    console.error(" Lỗi lấy status:", error.message);
    res.status(500).json({ error: "Lỗi lấy trạng thái" });
  }
};

// Manual mark topup as success (for development/testing)
exports.markTopupSuccess = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(" Manually marking topup as success:", id);
    const topUp = await TopUp.findByIdAndUpdate(
      id,
      { status: "success", momoTransactionId: `MANUAL_${Date.now()}` },
      { new: true }
    );

    if (!topUp) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    // Cộng tiền vào balance của Profile
    try {
      const profile = await Profile.findOne({ userId: topUp.userId });
      if (profile) {
        profile.balance = (profile.balance || 0) + topUp.amount;
        await profile.save();
        console.log(" Profile balance updated:", profile.balance);
      }
    } catch (profileError) {
      console.error(" Lỗi cập nhật Profile balance:", profileError.message);
    }

    res.json({ success: true, topUp });
  } catch (error) {
    console.error(" Lỗi mark success:", error.message);
    res.status(500).json({ error: "Lỗi mark success" });
  }
};

// Manual mark topup as cancelled (for users to cancel pending transactions)
exports.markTopupCancelled = async (req, res) => {
  try {
    const { id } = req.params;
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    console.log(" Manually cancelling topup:", id, "by user:", userId);

    const topUp = await TopUp.findById(id);

    if (!topUp) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    // Check if this transaction belongs to the current user
    if (topUp.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền hủy giao dịch này" });
    }

    // Only allow cancelling pending transactions
    if (topUp.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Chỉ có thể hủy các giao dịch đang chờ xử lý" });
    }

    const updatedTopUp = await TopUp.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    console.log("✅ TopUp marked as cancelled:", id);
    res.json({ success: true, topUp: updatedTopUp });
  } catch (error) {
    console.error("❌ Lỗi mark cancelled:", error.message);
    res.status(500).json({ error: "Lỗi hủy giao dịch" });
  }
};

// Debug: Get all users with their balances
exports.getAllUserBalances = async (req, res) => {
  try {
    const TopUp = require("../models/TopUp");
    const result = await TopUp.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: "$userId",
          totalBalance: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalBalance: -1 } },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's current balance (sum of successful topups)
exports.getBalance = async (req, res) => {
  try {
    console.log("\n📊 [getBalance] req.user:", req.user);
    console.log("📊 [getBalance] req.user?.id:", req.user?.id);
    console.log("📊 [getBalance] req.user?._id:", req.user?._id);

    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      console.error("❌ No userId found in token");
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    console.log("💰 Getting balance for userId:", userId.toString());

    // Sum all successful topups
    const result = await TopUp.aggregate([
      { $match: { userId: userId, status: "success" } },
      { $group: { _id: null, totalBalance: { $sum: "$amount" } } },
    ]);

    console.log("📊 [getBalance] Aggregation result:", result);

    const balance = result.length > 0 ? result[0].totalBalance : 0;

    console.log("💰 Final balance:", balance);
    res.json({ balance });
  } catch (error) {
    console.error("❌ Lỗi lấy số dư:", error.message, error.stack);
    res.status(500).json({ error: "Lỗi lấy số dư", details: error.message });
  }
};

// Get full account summary including total deposited and current plan
exports.getAccountSummary = async (req, res) => {
  try {
    console.log("\n📊 [getAccountSummary] Getting account summary for user");

    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      console.error("❌ No userId found in token");
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Get user profile and balance from database
    const profile = await Profile.findOne({ userId });
    const user = await User.findOne({ _id: userId });
    const currentBalance = profile ? profile.balance || 0 : 0;

    // Calculate total deposited amount from successful topups
    const totalDepositedResult = await TopUp.aggregate([
      { $match: { userId: userId, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const totalDepositedAmount =
      totalDepositedResult.length > 0 ? totalDepositedResult[0].total : 0;
    const totalDepositsCount =
      totalDepositedResult.length > 0 ? totalDepositedResult[0].count : 0;

    // Get recent successful topups for display
    const recentTopups = await TopUp.find({
      userId: userId,
      status: "success",
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("amount createdAt method");

    // Get today's deposits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDepositsResult = await TopUp.aggregate([
      {
        $match: {
          userId: userId,
          status: "success",
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const todayDepositsAmount =
      todayDepositsResult.length > 0 ? todayDepositsResult[0].total : 0;
    const todayDepositsCount =
      todayDepositsResult.length > 0 ? todayDepositsResult[0].count : 0;

    // Determine current plan based on user premium status or total deposited
    let currentPlan = "FREE";
    let planBadge = "BASIC";

    // Check user premium status first
    if (user && user.hasPremium) {
      if (user.premiumType === "max") {
        currentPlan = "MAX";
        planBadge = "MAX";
      } else if (user.premiumType === "pro") {
        currentPlan = "PRO";
        planBadge = "PRO";
      } else if (user.premiumType === "yearly") {
        currentPlan = "PRO";
        planBadge = "PRO";
      } else if (user.premiumType === "monthly") {
        currentPlan = "BASIC+";
        planBadge = "BASIC+";
      }
    } else {
      // Fallback to total deposited amount logic
      if (totalDepositedAmount >= 2000000) {
        // 2M VND for MAX
        currentPlan = "MAX";
        planBadge = "MAX";
      } else if (totalDepositedAmount >= 1000000) {
        // 1M VND for PRO
        currentPlan = "PRO";
        planBadge = "PRO";
      } else if (totalDepositedAmount >= 500000) {
        // 500K VND for BASIC+
        currentPlan = "BASIC+";
        planBadge = "BASIC+";
      }
    }

    // Check if premium has expired
    if (user && user.hasPremium && user.premiumExpiry) {
      const now = new Date();
      if (new Date(user.premiumExpiry) < now) {
        console.log("⚠️ Premium expired for user:", user.email);
        // Update user status in database
        await User.findByIdAndUpdate(user._id, {
          hasPremium: false,
          premiumType: "free",
        });
        currentPlan = "FREE";
        planBadge = "BASIC";
      }
    }

    // Calculate account age
    const accountAge = user?.createdAt
      ? Math.floor(
          (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
        )
      : 0;

    // Enhanced logging for debugging
    console.log("📊 Database Query Results:");
    console.log("  - User ID:", userId.toString());
    console.log("  - User found:", !!user);
    console.log("  - Profile found:", !!profile);
    console.log("  - User hasPremium:", user?.hasPremium);
    console.log("  - User premiumType:", user?.premiumType);
    console.log("  - User premiumExpiry:", user?.premiumExpiry);
    console.log("  - Profile balance:", currentBalance);
    console.log("  - Total Deposited:", totalDepositedAmount);
    console.log("  - Total Deposits Count:", totalDepositsCount);
    console.log("  - Today Deposits:", todayDepositsAmount);
    console.log("  - Calculated Plan:", currentPlan);
    console.log("  - Plan Badge:", planBadge);

    console.log(
      "💰 Final Account summary - Balance:",
      currentBalance,
      "Total Deposited:",
      totalDepositedAmount,
      "Today Deposits:",
      todayDepositsAmount,
      "Plan:",
      currentPlan,
      "Account Age:",
      accountAge,
      "days"
    );

    res.json({
      balance: currentBalance,
      totalDeposited: totalDepositedAmount,
      totalDepositsCount,
      todayDepositsAmount,
      todayDepositsCount,
      currentPlan,
      planBadge,
      accountAge,
      recentTopups: recentTopups.map((topup) => ({
        amount: topup.amount,
        date: topup.createdAt,
        method: topup.method || "Chuyển khoản",
      })),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy account summary:", error.message, error.stack);
    res
      .status(500)
      .json({ error: "Lỗi lấy thông tin tài khoản", details: error.message });
  }
};

// Get premium plans for display
exports.getPremiumPlans = async (req, res) => {
  try {
    console.log("📦 [getPremiumPlans] Getting premium plans for display");

    let userId = null;
    let currentPlan = "FREE";

    // Get user plan if logged in
    if (req.headers.authorization) {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
          );
          userId = decoded.id || decoded._id;

          // Get user's current plan
          if (userId) {
            const user = await User.findById(userId);
            if (user && user.hasPremium) {
              if (user.premiumType === "max") {
                currentPlan = "MAX";
              } else if (
                user.premiumType === "pro" ||
                user.premiumType === "yearly"
              ) {
                currentPlan = "PRO";
              } else if (user.premiumType === "monthly") {
                currentPlan = "PRO"; // Map monthly to PRO
              }
            }
          }
        } catch (error) {
          console.log("⚠️ Could not verify user token, showing as guest");
        }
      }
    }

    // Get all active premium plans
    const plans = await PremiumPlan.find({ isActive: true }).sort({ price: 1 });

    console.log("📋 Found", plans.length, "active premium plans");
    console.log("👤 User plan:", currentPlan);

    res.json({
      plans,
      currentPlan,
      isLoggedIn: !!userId,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy premium plans:", error.message, error.stack);
    res
      .status(500)
      .json({ error: "Lỗi lấy danh sách gói premium", details: error.message });
  }
};
