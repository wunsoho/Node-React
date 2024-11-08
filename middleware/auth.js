const { User } = require('../models/User');

// 인증 처리를 하는 곳
let auth = async (req, res, next) => {
    try{
        // 클라이언트 쿠키에서 토큰을 가져옴. 
        let token = req.cookies.x_auth;

        // 토큰이 없는 경우
        if (!token) {
            return res.json({ isAuth: false, error: true });
        }
        // 토큰을 복호화하여 유저를 찾음
        const user = await User.findByToken(token);

        // 유저가 없으면 인증 실패
        if (!user) {
            return res.json({ isAuth: false, error: true });
        }
        req.token = token;  // 토큰을 요청 객체에 추가
        req.user = user;     // 유저를 요청 객체에 추가
        next();              // 미들웨어를 계속 진행
    } catch (err) {
        console.error("Authentication error:", err);
        return res.status(500).json({ isAuth: false, error: true });
    }
}

module.exports = { auth };