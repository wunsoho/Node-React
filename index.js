    const express = require('express')
    const app = express()
    const port = 5000
    const bodyParser = require('body-parser');
    const cookieParser = require('cookie-parser');
    const config = require('./config/key')
    const { User } = require("./models/User");
    const { auth } = require('./middleware/auth');

    //application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({extended: true})); 

    //application/json
    app.use(bodyParser.json());
    
    app.use(cookieParser());


    const mongoose = require('mongoose')
    mongoose.connect(config.mongoURI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))

    app.get('/', (req, res) => res.send('Hello World! 안녕'))

    
    app.post('/api/users/register', async (req, res) => {
        // 회원 가입 할 때 필요한 정보들을 client에서 가져오면
        // 그것들을 데이터 베이스에 넣어줌.
        
        const user = new User(req.body);

        try {
            await user.save();
            res.status(200).json({ message: "success"});
        } catch(error){
            console.error("Error saving data", error);
            res.status(500).json({ message: "Failed to save data", error: error.message});
        }
    })

    // 쿠키 확인용 엔드포인트 추가
    app.get('/check-cookie', (req, res) => {
        console.log('쿠키 내용:', req.cookies);
        res.send('쿠키 확인 완료');
    });

    app.post('/api/users/login', async(req, res) => {
        try{
            // 요청된 이메일을 데이터베이스에서 찾기
            const user = await User.findOne({ email: req.body.email});
            if(!user) {
                return res.json({
                    loginSuccess: false,
                    message: "제공된 이메일에 해당하는 유저가 없습니다."
                })
            }
            
            // 요청된 비밀번호를 문자열로 변환
            const plainPassword = req.body.password.toString();

            // 요청된 이메일이 있다면 비밀번호가 같은지 확인
            const isMatch = await user.comparePassword(plainPassword);
                if(!isMatch)
                    return res.json({ loginSuccess: false, message:"비밀번호가 틀렸습니다."})

            // 비밀번호까지 같다면 Token 생성
            const updatedUser = await user. generateToken();

            // 토큰을 저장해두어야 함. 쿠키 or 로컬 스토리지 -> 여기서는 쿠키
            res.cookie("x_auth", user.token, {
                httpOnly: true,  // 자바스크립트에서 쿠키에 접근 불가
                secure: false,   // 로컬에서는 http로 실행하므로 false로 설정
                sameSite: 'None' // 크로스 도메인 요청 시 쿠키가 전달되도록 설정)
            })
                .status(200)
                .json({ loginSuccess: true, userId: user._id, token: user.token }); 
        } catch(err) {
            console.error("로그인 중 오류 발생", err);
            res.status(500).json({ message: "서버 오류가 발생했습니다.", error: err.message});
        }
    });

    app.get('/api/users/auth', auth, async(req, res) => {

        // 여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication이 True라는 말.
        res.status(200).json({
            _id: req.user._id,
            isAdmin: req.user.role === 0 ? false : true,
            isAuth: true,
            email: req.user.email,
            name: req.user.name,
            lastname: req.user.lastname,
            role: req.user.role,
            image: req.user.image
        })
    })

    app.get('/api/users/logout', auth, async (req, res) => {
        try {
            // 사용자 토큰을 ""로 업데이트
            const user = await User.findOneAndUpdate(
                { _id: req.user._id }, 
                { token: "" },
                { new: true }  // 업데이트된 문서 반환
            );
    
            if (!user) {
                return res.status(400).json({ success: false, message: 'User not found' });
            }
    
            return res.status(200).send({ success: true });
        } catch (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
    });

    app.listen(port, () => console.log(`Example app listening on port ${port}!`))