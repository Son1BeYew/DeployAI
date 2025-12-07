const Premium = require("../models/Premium");
const User = require("../models/User");
const mongoose = require("mongoose");
const axios = require("axios");
const verificationService = require("../services/verificationService");
require("dotenv").config();

// Fallback plan configurations for immediate availability
const FALLBACK_PLAN_CONFIGS = {
  free: {
    name: "Gói Miễn Phí",
    price: 0,
    duration: 0,
    dailyLimit: 15,
    features: [
      { name: "Tạo 15 ảnh/ngày", enabled: true },
      { name: "Chất lượng chuẩn", enabled: true },
      { name: "Tốc độ bình thường", enabled: true },
      { name: "Có watermark", enabled: true },
    ],
  },
  pro: {
    name: "Gói Pro",
    price: 199000, // 199,000 VNĐ/tháng
    duration: 30,
    dailyLimit: 100,
    features: [
      { name: "Tạo ảnh không giới hạn", enabled: true },
      { name: "Chất lượng cao (4K)", enabled: true },
      { name: "Tốc độ ưu tiên", enabled: true },
      { name: "Batch processing (10 ảnh)", enabled: true },
      { name: "Hỗ trợ chat 24/7", enabled: true },
      { name: "Không watermark", enabled: true },
    ],
  },
  max: {
    name: "Gói Max",
    price: 1990000, // 1,990,000 VNĐ/năm
    duration: 365,
    dailyLimit: 500,
    features: [
      { name: "Tạo ảnh không giới hạn", enabled: true },
      { name: "Chất lượng siêu cao (8K)", enabled: true },
      { name: "Tốc độ tối đa", enabled: true },
      { name: "Batch processing không giới hạn", enabled: true },
      { name: "Hỗ trợ ưu tiên 24/7", enabled: true },
      { name: "Không watermark", enabled: true },
      { name: "API Access", enabled: true },
      { name: "Quản lý team (5 thành viên)", enabled: true },
    ],
  },
};

// Helper function to get plan config from database with fallback
const getPlanConfigFromDB = async (planType) => {
  try {
    // First try to get from database
    const plan = await Premium.aggregate([
      { $match: { plan: planType } },
      {
        $group: {
          _id: "$plan",
          name: { $first: "$planName" },
          price: { $first: "$price" },
          duration: { $first: "$duration" },
          dailyLimit: { $first: "$dailyLimit" },
          features: { $first: "$features" },
        },
      },
    ]);

    if (plan.length > 0) {
      return {
        name: plan[0].name,
        price: plan[0].price,
        duration: plan[0].duration,
        dailyLimit: plan[0].dailyLimit,
        features: plan[0].features || [],
      };
    }

    // If not found in database, use fallback config
    if (FALLBACK_PLAN_CONFIGS[planType]) {
      console.log(`Using fallback config for plan: ${planType}`);
      return FALLBACK_PLAN_CONFIGS[planType];
    }

    return null;
  } catch (error) {
    console.error("Error getting plan config:", error);
    // Fallback to hardcoded config on error
    if (FALLBACK_PLAN_CONFIGS[planType]) {
      return FALLBACK_PLAN_CONFIGS[planType];
    }
    return null;
  }
};

// Purchase premium
exports.purchasePremium = async (req, res) => {
  try {
    const { plan } = req.body;
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    if (
      !plan ||
      (!FALLBACK_PLAN_CONFIGS[plan] &&
        !["monthly", "yearly", "pro", "max"].includes(plan))
    ) {
      return res.status(400).json({ error: "Gói không hợp lệ" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Don't allow purchasing free plan
    if (plan === "free") {
      return res.status(400).json({ error: "Gói miễn phí là mặc định" });
    }

    // Get current active plan with optimized query
    const currentPremium = await Premium.findOne(
      {
        userId,
        status: "active",
        $or: [{ endDate: { $gt: new Date() } }, { endDate: null }],
      },
      { plan: 1, status: 1, endDate: 1 }
    ).lean();

    // Check if user already has the same plan
    if (currentPremium.plan === plan) {
      return res.status(400).json({ error: "Bạn đang sử dụng gói này" });
    }

    // Get plan config from database
    const planConfig = await getPlanConfigFromDB(plan);
    if (!planConfig) {
      return res
        .status(400)
        .json({ error: "Gói không tồn tại trong hệ thống" });
    }

    // For paid plans, create pending payment
    const premium = await Premium.create({
      userId,
      plan,
      planName: planConfig.name,
      price: planConfig.price,
      duration: planConfig.duration,
      dailyLimit: planConfig.dailyLimit,
      status: "pending",
      paymentMethod: "momo",
      features: planConfig.features,
    });

    // Create Momo payment
    const momoConfig = {
      partnerCode: process.env.MOMO_PARTNER_CODE || "YOUR_PARTNER_CODE",
      accessKey: process.env.MOMO_ACCESS_KEY || "YOUR_ACCESS_KEY",
      secretKey: process.env.MOMO_SECRET_KEY || "YOUR_SECRET_KEY",
      endpoint:
        process.env.MOMO_ENDPOINT ||
        "https://payment.momo.vn/v2/gateway/api/create",
    };

    console.log("Creating MoMo payment with config:", {
      partnerCode: momoConfig.partnerCode,
      plan: plan,
      planName: planConfig.name,
      price: planConfig.price,
      premiumId: premium._id.toString(),
    });

    const orderInfo = `Thanh toan goi Premium ${planConfig.name}`;
    const orderId = `premium_${premium._id}_${Date.now()}`;
    const requestId = `${Date.now()}`;
    const extraData = JSON.stringify({
      premiumId: premium._id.toString(),
      userId: userId.toString(),
    });

    // Create signature
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${
      planConfig.price
    }&extraData=${extraData}&ipnUrl=${
      process.env.MOMO_IPN_URL ||
      "https://your-domain.com/api/premium/momo-callback"
    }&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${
      momoConfig.partnerCode
    }&redirectUrl=${
      process.env.MOMO_RETURN_URL || "https://your-domain.com/topup.html"
    }&requestId=${requestId}&requestType=captureWallet`;

    const crypto = require("crypto");
    const signature = crypto
      .createHmac("sha256", momoConfig.secretKey)
      .update(rawSignature)
      .digest("hex");

    const momoRequest = {
      partnerCode: momoConfig.partnerCode,
      accessKey: momoConfig.accessKey,
      requestId: requestId,
      amount: planConfig.price,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: process.env.MOMO_PREMIUM_RETURN_URL,
      ipnUrl: process.env.MOMO_PREMIUM_IPN_URL,
      extraData: extraData,
      requestType: "captureWallet",
      signature: signature,
      lang: "vi",
    };

    // Send request to Momo
    let momoResponse;
    try {
      momoResponse = await axios.post(momoConfig.endpoint, momoRequest);
      console.log("MoMo response:", momoResponse.data);
    } catch (momoError) {
      console.error(
        "MoMo API error:",
        momoError.response?.data || momoError.message
      );
      return res.status(500).json({
        error: "Không thể tạo thanh toán MoMo",
        details: momoError.response?.data || momoError.message,
      });
    }

    if (momoResponse.data && momoResponse.data.payUrl) {
      // Update premium with Momo transaction info
      await Premium.findByIdAndUpdate(premium._id, {
        momoTransactionId:
          momoResponse.data.transId || momoResponse.data.requestId,
        description: orderInfo,
      });

      return res.json({
        success: true,
        payUrl: momoResponse.data.payUrl,
        premiumId: premium._id,
      });
    } else {
      return res.status(500).json({
        error: "Không thể tạo thanh toán Momo",
        details: momoResponse.data,
      });
    }
  } catch (error) {
    console.error("Error purchasing premium:", error);
    res.status(500).json({
      error: "Lỗi khi mua Premium",
      details: error.message,
    });
  }
};

// Get premium history
exports.getPremiumHistory = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Use lean query with specific field selection for better performance
    const premiums = await Premium.find(
      { userId },
      {
        plan: 1,
        planName: 1,
        price: 1,
        status: 1,
        createdAt: 1,
        endDate: 1,
        duration: 1,
        paymentMethod: 1,
        description: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance

    res.json(premiums);
  } catch (error) {
    console.error("Error getting premium history:", error);
    res.status(500).json({
      error: "Lỗi khi tải lịch sử Premium",
      details: error.message,
    });
  }
};

// Get current premium status
exports.getCurrentPremium = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // First check User model for premium info (more reliable)
    const user = await User.findById(userId, {
      hasPremium: 1,
      premiumType: 1,
      premiumExpiry: 1,
    }).lean();

    if (user && user.hasPremium && user.premiumType && user.premiumType !== "free") {
      // User has premium from User model
      const planConfig = await getPlanConfigFromDB(user.premiumType);

      return res.json({
        hasPremium: true,
        planName: planConfig ? planConfig.name : user.premiumType.toUpperCase(),
        plan: user.premiumType,
        expiryDate: user.premiumExpiry,
        imagesCreated: 0,
        dailyLimit: planConfig ? planConfig.dailyLimit : -1,
        features: planConfig ? planConfig.features : [],
      });
    }

    // Fallback: Check Premium collection
    const currentPremium = await Premium.findOne(
      {
        userId,
        status: "active",
        $or: [
          { endDate: { $gt: new Date() } },
          { endDate: null }
        ]
      },
      {
        plan: 1,
        planName: 1,
        price: 1,
        duration: 1,
        status: 1,
        startDate: 1,
        endDate: 1,
        imagesCreated: 1,
        dailyLimit: 1,
        features: 1,
      }
    ).lean();

    if (!currentPremium) {
      // Get free plan config from database
      const freePlanConfig = await getPlanConfigFromDB("free");
      return res.json({
        hasPremium: false,
        planName: freePlanConfig ? freePlanConfig.name : "Miễn phí",
        plan: "free",
        expiryDate: null,
        imagesCreated: 0,
        dailyLimit: freePlanConfig ? freePlanConfig.dailyLimit : 15,
        features: freePlanConfig ? freePlanConfig.features : [],
      });
    }

    const isPremium = currentPremium.plan !== "free";

    res.json({
      hasPremium: isPremium,
      planName: currentPremium.planName,
      plan: currentPremium.plan,
      expiryDate: currentPremium.endDate,
      imagesCreated: currentPremium.imagesCreated,
      dailyLimit: currentPremium.dailyLimit,
      features: currentPremium.features,
    });
  } catch (error) {
    console.error("Error getting current premium:", error);
    res.status(500).json({
      error: "Lỗi khi kiểm tra trạng thái Premium",
      details: error.message,
    });
  }
};

// Cancel premium
exports.cancelPremium = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    const currentPremium = await Premium.findOne(
      {
        userId,
        status: "active",
        autoRenew: true,
        $or: [
          { endDate: { $gt: new Date() } },
          { endDate: null }, // lifetime plans
        ],
      },
      { _id: 1, userId: 1 }
    ).lean(); // Only select needed fields

    if (!currentPremium) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy gói Premium đang hoạt động" });
    }

    // Disable auto-renew
    await Premium.findByIdAndUpdate(currentPremium._id, {
      autoRenew: false,
    });

    // Update user model
    await User.findByIdAndUpdate(userId, {
      premiumAutoRenew: false,
    });

    res.json({
      success: true,
      message: "Đã hủy tự động gia hạn Premium",
    });
  } catch (error) {
    console.error("Error cancelling premium:", error);
    res.status(500).json({
      error: "Lỗi khi hủy Premium",
      details: error.message,
    });
  }
};

// Get available plans
exports.getPlans = async (req, res) => {
  try {
    // Get unique plans from user premium records in database
    const plans = await Premium.aggregate([
      {
        $group: {
          _id: "$plan",
          name: { $first: "$planName" },
          price: { $first: "$price" },
          duration: { $first: "$duration" },
          dailyLimit: { $first: "$dailyLimit" },
          features: { $first: "$features" },
        },
      },
      {
        $sort: { price: 1 }, // Sort by price (free first)
      },
    ]);

    // Convert to object format for frontend
    const plansObject = {};
    plans.forEach((plan) => {
      plansObject[plan._id] = {
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        dailyLimit: plan.dailyLimit,
        features: plan.features || [],
      };
    });

    // If no plans found in user records, create default free plan to ensure plans exist
    if (Object.keys(plansObject).length === 0) {
      try {
        await Premium.create({
          userId: new mongoose.Types.ObjectId("000000000000000000000000"), // Dummy user ID
          plan: "free",
          planName: "Miễn phí",
          price: 0,
          duration: 0,
          dailyLimit: 15,
          status: "active",
          paymentMethod: "free",
          features: [
            { name: "15 ảnh mỗi ngày", enabled: true },
            { name: "Chất lượng tiêu chuẩn", enabled: true },
            { name: "Tải ảnh có watermark", enabled: true },
            { name: "Mẫu cơ bản", enabled: true },
          ],
        });
      } catch (createError) {
        // Ignore if already exists
      }

      return res.status(500).json({
        success: false,
        error: "Không tìm thấy gói nào trong hệ thống",
      });
    }

    res.json({
      success: true,
      plans: plansObject,
    });
  } catch (error) {
    console.error("Error getting plans:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi tải danh sách gói",
    });
  }
};

// Momo callback handler
exports.momoCallback = async (req, res) => {
  try {
    console.log("MoMo callback received:", req.body);

    const {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      localMessage,
      payType,
      responseTime,
      signature,
      extraData,
    } = req.body;

    // Verify signature
    const momoConfig = {
      partnerCode: process.env.MOMO_PARTNER_CODE || "YOUR_PARTNER_CODE",
      accessKey: process.env.MOMO_ACCESS_KEY || "YOUR_ACCESS_KEY",
      secretKey: process.env.MOMO_SECRET_KEY || "YOUR_SECRET_KEY",
    };

    // TEMPORARY BYPASS FOR TESTING
    const bypassSignature = process.env.MOMO_BYPASS_SIGNATURE === 'true';
    if (bypassSignature) {
      console.log('⚠️  MOMO SIGNATURE VERIFICATION BYPASSED (TEMPORARY FOR TESTING)');
      console.log('⚠️  REMOVE MOMO_BYPASS_SIGNATURE=true FROM .env AFTER TESTING');
    }

    // Only verify signature if not bypassed
    let validSignature = bypassSignature; // If bypassed, assume valid

    if (!bypassSignature) {
      // Build raw signature for verification (Using tested working format)
      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      console.log("Raw signature for verification:", rawSignature);

      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", momoConfig.secretKey)
        .update(rawSignature)
        .digest("hex");

      // Enhanced logging for debugging
      console.log("=== MoMo Signature Debug ===");
      console.log("Received signature:", signature);
      console.log("Expected signature:", expectedSignature);
      console.log("Signatures match:", signature === expectedSignature);
      console.log("Raw signature string:", rawSignature);
      console.log("========================");

      if (signature === expectedSignature) {
        validSignature = true;
      } else {
        console.error("Primary signature format failed, trying fallback formats...");

        // Try alternative signature formats as fallback
        const alternativeFormats = [
          // Format 1: Original format without responseTime (old format)
          `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&resultCode=${resultCode}&transId=${transId}`,
          // Format 2: MoMo documented format (official docs)
          `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${requestId}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&message=${message}&responseTime=${responseTime}&resultCode=${resultCode}&payType=${payType}&extraData=${extraData}`,
          // Format 3: Without extraData (minimal format)
          `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${requestId}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&message=${message}&resultCode=${resultCode}&payType=${payType}`
        ];

        for (let i = 0; i < alternativeFormats.length; i++) {
          const altSignature = crypto
            .createHmac("sha256", momoConfig.secretKey)
            .update(alternativeFormats[i])
            .digest("hex");

          console.log(`Fallback format ${i + 1}:`, altSignature);
          console.log(`Fallback format ${i + 1} matches:`, altSignature === signature);

          if (altSignature === signature) {
            console.log(`MATCH FOUND with fallback format ${i + 1}`);
            validSignature = true;
            break;
          }
        }
      }
    }

    if (!validSignature) {
      console.error("Invalid signature in MoMo callback - all formats failed");
      return res.status(400).json({ error: "Invalid signature" });
    }

    if (resultCode === 0) {
      // Payment successful
      const parsedExtraData = JSON.parse(extraData);
      const { premiumId, userId } = parsedExtraData;

      console.log("Processing successful payment for premium:", premiumId);

      // Get premium record first to calculate end date
      const premiumRecord = await Premium.findById(premiumId);
      if (!premiumRecord) {
        console.error("Premium not found for ID:", premiumId);
        return res.status(404).json({ error: "Premium not found" });
      }

      // Calculate end date based on duration
      let endDate = null;
      if (premiumRecord.duration && premiumRecord.duration > 0) {
        const startDate = new Date();
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + premiumRecord.duration);
      }

      // Update premium status
      const premium = await Premium.findByIdAndUpdate(
        premiumId,
        {
          status: "active",
          startDate: new Date(),
          endDate: endDate,
          momoTransactionId: transId,
          description: `Thanh toán thành công qua Momo (TxID: ${transId})`,
        },
        { new: true }
      );

      if (premium) {
        // Update user model
        await User.findByIdAndUpdate(userId, {
          hasPremium: true,
          premiumType: premium.plan,
          premiumExpiry: premium.endDate,
          premiumAutoRenew: false,
        });

        console.log(
          "Premium payment successful for user:",
          userId,
          "Plan:",
          premium.plan,
          "EndDate:",
          premium.endDate
        );

        // Send success email
        try {
          const user = await User.findById(userId);
          await verificationService.sendPaymentSuccessEmail(
            user.email,
            user.fullname,
            premium.planName,
            premium.endDate
              ? premium.endDate.toLocaleDateString("vi-VN")
              : "Vĩnh viễn"
          );
        } catch (emailError) {
          console.error("Error sending success email:", emailError);
        }
      } else {
        console.error("Premium not found for ID:", premiumId);
      }
    } else {
      // Payment failed
      const parsedExtraData = JSON.parse(extraData);
      const { premiumId } = parsedExtraData;

      console.log("Payment failed for premium:", premiumId, "Error:", message);

      await Premium.findByIdAndUpdate(premiumId, {
        status: "failed",
        momoTransactionId: transId,
        description: `Thanh toán thất bại: ${message} (${resultCode})`,
      });
    }

    // Return proper response to MoMo
    res.json({
      message: "Callback processed successfully",
      errorCode: 0,
    });
  } catch (error) {
    console.error("Error in Momo callback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send verification code for upgrade
exports.sendVerificationCode = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;
    const { plan } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    if (!plan) {
      return res.status(400).json({ error: "Thiếu thông tin gói nâng cấp" });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    // Get plan details
    const planConfig = await getPlanConfigFromDB(plan);
    if (!planConfig) {
      return res.status(400).json({ error: "Gói không tồn tại" });
    }

    // Send verification email
    const result = await verificationService.sendVerificationEmail(
      user.email,
      user.fullname,
      planConfig.name,
      userId.toString()
    );

    res.json({
      success: true,
      message: "Mã xác minh đã được gửi đến email của bạn",
      expiresAt: new Date(result.expiry).toISOString(),
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    res
      .status(500)
      .json({ error: "Không thể gửi mã xác minh. Vui lòng thử lại sau." });
  }
};

// Verify code for payment (not upgrade yet)
exports.verifyAndUpgrade = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;
    const { plan, code, paymentMethod } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    if (!plan || !code || !paymentMethod) {
      return res
        .status(400)
        .json({
          error: "Thiếu thông tin gói, mã xác minh hoặc phương thức thanh toán",
        });
    }

    // Verify code only, don't upgrade yet
    const verification = verificationService.verifyCode(
      userId.toString(),
      code
    );
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    // Code is valid, allow payment to proceed
    res.json({
      success: true,
      message: "Xác minh thành công! Vui lòng hoàn tất thanh toán.",
      paymentMethod: paymentMethod,
      plan: plan,
    });
  } catch (error) {
    console.error("Error verifying and upgrading:", error);
    res
      .status(500)
      .json({ error: "Không thể hoàn tất nâng cấp. Vui lòng thử lại." });
  }
};

// Get verification status
exports.getVerificationStatus = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    const timeRemaining = verificationService.getTimeRemaining(
      userId.toString()
    );

    res.json({
      success: true,
      timeRemaining: timeRemaining,
      canResend: timeRemaining === null || timeRemaining <= 0,
    });
  } catch (error) {
    console.error("Error getting verification status:", error);
    res.status(500).json({ error: "Lỗi khi kiểm tra trạng thái xác minh." });
  }
};

