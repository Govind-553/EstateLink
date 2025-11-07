import jwt from 'jsonwebtoken';

//generate access token 
export const generateAccessToken = (mobileNumber) => {
    return jwt.sign({ mobileNumber }, process.env.JWT_ACCESS_TOKEN_SECRET, { 
        expiresIn: '2h' 
    });
};

//generate refresh token
export const generateRefreshToken = (mobileNumber) => {
    return jwt.sign({ mobileNumber }, process.env.JWT_REFRESH_TOKEN_SECRET, { 
        expiresIn: '7d' 
    });
};

//Function to Call Generate Tokens & Send Cookie
export const sendTokenResponse = (res, mobileNumber) => {
    const accessToken = generateAccessToken(mobileNumber);
    const refreshToken = generateRefreshToken(mobileNumber);
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7*24*60*60*1000 // 7 days
    });

    res.json({ accessToken });
};
