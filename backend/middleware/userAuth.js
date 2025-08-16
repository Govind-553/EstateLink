import jwt from "jsonwebtoken";

export const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "failed",
      message: "Unauthorized User - No Token!",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);

    if (!decoded) {
      return res.status(403).json({
        status: "failed",
        message: "User Unauthorized - Invalid Token!",
      });
    }

    req.userId = decoded.userId;
    req.mobileNumber = decoded.mobileNumber; // works only if included in token payload

    next();
  } catch (error) {
    console.error("Error in Verifying Token: ", error.message);
    return res.status(401).json({
      status: "failed",
      message: "Invalid or expired token",
    });
  }
};
