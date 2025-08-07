import jwt from 'jsonwebtoken';

//generate access token 
export const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_ACCESS_TOKEN_SECRET, { 
        expiresIn: '15m' 
    });
};

//generate refresh token
export const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_TOKEN_SECRET, { 
        expiresIn: '7d' 
    });
};

//Function to Call Generate Tokens & Send Cookie
export const sendTokenResponse = (res, userId) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ accessToken });
};
