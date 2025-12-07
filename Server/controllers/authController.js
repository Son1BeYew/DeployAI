const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const crypto = require("crypto");
const User = require("../models/User");
const Premium = require("../models/Premium");
const emailService = require("../services/emailService");
const { createSession, deleteSessionByTokenId } = require("./sessionController");

// Generate unique token ID for session tracking
const generateTokenId = () => crypto.randomBytes(16).toString("hex");

const signAccessToken = (user, tokenId) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, tokenId },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const signRefreshToken = (user, tokenId) => {
  return jwt.sign(
    { id: user._id, email: user.email, tokenId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Helper function to create free premium plan for new user
const createFreePremiumForUser = async (userId) => {
  try {
    await Premium.create({
      userId: userId,
      plan: "free",
      planName: "Gói Miễn Phí",
      price: 0,
      duration: 0,
      dailyLimit: 15,
      status: "active",
      paymentMethod: "free",
      features: [
        { name: "Tạo 15 ảnh/ngày", enabled: true },
        { name: "Chất lượng chuẩn", enabled: true },
        { name: "Tốc độ bình thường", enabled: true },
        { name: "Có watermark", enabled: true },
      ],
    });
    console.log("Created free premium plan for user:", userId);
  } catch (error) {
    console.error("Error creating free premium plan:", error);
  }
};

// Email validation helper
const validateEmail = (email) => {
  // Check minimum length
  if (email.length < 6) {
    return { valid: false, message: "Email quá ngắn" };
  }

  // Basic format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Email không đúng định dạng" };
  }

  // Check email length
  if (email.length > 254) {
    return { valid: false, message: "Email quá dài" };
  }

  const [localPart, domain] = email.toLowerCase().split("@");

  // Check local part minimum length (at least 1 character)
  if (localPart.length < 1) {
    return { valid: false, message: "Phần tên email không hợp lệ" };
  }

  // Check local part length
  if (localPart.length > 64) {
    return { valid: false, message: "Phần tên email quá dài" };
  }

  // Check domain minimum length (at least x.xx = 4 chars like a.co)
  if (domain.length < 4) {
    return { valid: false, message: "Domain email không hợp lệ" };
  }

  // Domain must have at least one dot
  if (!domain.includes(".")) {
    return { valid: false, message: "Domain email không hợp lệ" };
  }

  // Check for valid TLD (at least 2 characters)
  const tld = domain.split(".").pop();
  if (tld.length < 2) {
    return { valid: false, message: "Domain email không hợp lệ" };
  }

  // Check domain name part (before TLD) - must be at least 1 char
  const domainParts = domain.split(".");
  const domainName = domainParts.slice(0, -1).join(".");
  if (domainName.length < 1) {
    return { valid: false, message: "Domain email không hợp lệ" };
  }

  // Block single character domains (like a.com, b.net) - often fake
  if (domainParts[0].length < 2) {
    return { valid: false, message: "Domain email không hợp lệ" };
  }

  // Block disposable/temporary email domains
  const disposableDomains = [
    "tempmail.com",
    "temp-mail.org",
    "guerrillamail.com",
    "guerrillamail.org",
    "mailinator.com",
    "maildrop.cc",
    "10minutemail.com",
    "10minutemail.net",
    "throwaway.email",
    "fakeinbox.com",
    "trashmail.com",
    "trashmail.net",
    "yopmail.com",
    "yopmail.fr",
    "sharklasers.com",
    "spam4.me",
    "grr.la",
    "guerrillamail.info",
    "pokemail.net",
    "getnada.com",
    "tempail.com",
    "mohmal.com",
    "dispostable.com",
    "mailnesia.com",
    "tempr.email",
    "discard.email",
    "discardmail.com",
    "spamgourmet.com",
    "mytemp.email",
    "mt2009.com",
    "tempinbox.com",
    "fakemailgenerator.com",
    "emailondeck.com",
    "mailcatch.com",
    "mintemail.com",
    "tempmailo.com",
    "burnermail.io",
    "mailsac.com",
    "33mail.com",
    "getairmail.com",
    "moakt.com",
    "jetable.org",
    "spamex.com",
    "trash-mail.com",
    "wegwerfmail.de",
    "spamherelots.com",
    "spamobox.com",
    "tempmailaddress.com",
    "emkei.cz",
    "anonymbox.com",
    "dropmail.me",
    "harakirimail.com",
    "mailnull.com",
    "nowmymail.com",
    "rmqkr.net",
    "sogetthis.com",
    "spamfree24.org",
    "speed.1s.fr",
    "suremail.info",
    "tempemail.net",
    "tmpmail.org",
    "tmpmail.net",
    "incognitomail.com",
    "incognitomail.org",
  ];

  if (disposableDomains.includes(domain)) {
    return {
      valid: false,
      message: "Không chấp nhận email tạm thời. Vui lòng dùng email thật.",
    };
  }

  // Block suspicious patterns in domain
  const suspiciousPatterns = [
    /^temp/i,
    /^fake/i,
    /^trash/i,
    /^spam/i,
    /^junk/i,
    /^throw/i,
    /^disposable/i,
    /^mailinator/i,
    /^guerrilla/i,
    /^10minute/i,
    /^burner/i,
    /^anonymous/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(domain)) {
      return {
        valid: false,
        message: "Không chấp nhận email từ dịch vụ email tạm thời",
      };
    }
  }

  // Block numeric-only domains (often spam)
  const domainWithoutTld = domain.replace(/\.[^.]+$/, "");
  if (/^\d+$/.test(domainWithoutTld)) {
    return { valid: false, message: "Domain email không hợp lệ" };
  }

  // Block emails with too many dots in local part (often fake)
  if ((localPart.match(/\./g) || []).length > 3) {
    return { valid: false, message: "Email không hợp lệ" };
  }

  // Block emails starting or ending with dot
  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return { valid: false, message: "Email không hợp lệ" };
  }

  // Block consecutive dots
  if (localPart.includes("..")) {
    return { valid: false, message: "Email không hợp lệ" };
  }

  return { valid: true };
};

// Password strength validation helper
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: "Mật khẩu phải có ít nhất 8 ký tự" };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const requirements = [hasUpper, hasLower, hasNumber, hasSpecial];
  const metCount = requirements.filter(Boolean).length;

  if (metCount < 4) {
    return {
      valid: false,
      message: "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt",
    };
  }

  return { valid: true };
};

exports.register = async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    if (!fullname || !email || !password) {
      return res
        .status(400)
        .json({ error: "fullname, email, password required" });
    }

    // Validate email strictly
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.message });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const exist = await User.findOne({ email: normalizedEmail });
    if (exist)
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullname,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "user",
    });

    await createFreePremiumForUser(user._id);

    // Send welcome email - TEMPORARILY DISABLED for faster registration
    // try {
    //   const emailTemplate = emailService.getWelcomeTemplate(
    //     user.email,
    //     user.fullname
    //   );
    //   await emailService.sendEmail({
    //     to: user.email,
    //     ...emailTemplate,
    //   });
    //   console.log("Welcome email sent to:", user.email);
    // } catch (emailError) {
    //   console.error("Error sending welcome email:", emailError);
    //   // Don't fail registration if email fails
    // }

    // Generate unique token ID for session tracking
    const tokenId = generateTokenId();

    const accessToken = signAccessToken(user, tokenId);
    const refreshToken = signRefreshToken(user, tokenId);

    user.refreshToken = refreshToken;
    await user.save();

    // Create session record
    await createSession(user._id, req, tokenId, 7);

    res.json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    async (err, user, info) => {
      if (err || !user)
        return res.status(400).json({ error: info?.message || "Login failed" });
      console.log("Login Sucessfully", "Role:", user.role);

      // Generate unique token ID for session tracking
      const tokenId = generateTokenId();

      const accessToken = signAccessToken(user, tokenId);
      const refreshToken = signRefreshToken(user, tokenId);

      user.refreshToken = refreshToken;
      await user.save();

      // Create session record
      await createSession(user._id, req, tokenId, 7);

      res.json({ accessToken, refreshToken, user });
    }
  )(req, res, next);
};

exports.googleCallback = async (req, res) => {
  if (!req.user) return res.redirect("/login.html?error=google_failed");

  // Check if user has premium plan, create free plan if not
  const existingPremium = await Premium.findOne({ userId: req.user._id });
  if (!existingPremium) {
    await createFreePremiumForUser(req.user._id);
  }

  // Generate unique token ID for session tracking
  const tokenId = generateTokenId();

  const accessToken = signAccessToken(req.user, tokenId);
  const refreshToken = signRefreshToken(req.user, tokenId);

  req.user.refreshToken = refreshToken;
  await req.user.save();

  // Create session record
  await createSession(req.user._id, req, tokenId, 7);

  const role = (req.user?.role || "user").toLowerCase();
  const baseUrl = process.env.FRONTEND_URL || "http://localhost";
  const targetPath = role === "admin" ? "/admin/index.html" : "/dashboard.html";
  const redirectUrl = new URL(targetPath, baseUrl);
  redirectUrl.searchParams.set("token", accessToken);
  redirectUrl.searchParams.set("refreshToken", refreshToken);
  redirectUrl.searchParams.set("role", role);

  res.redirect(redirectUrl.toString());
};
