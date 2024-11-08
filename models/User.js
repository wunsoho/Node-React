const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Salt가 몇 글자인가
const jwt = require('jsonwebtoken');


const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true, // 빈칸(space)를 자동으로 없애주는 역할
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: { // 토큰의 유효기간
        type: Number
    }
})

userSchema.pre('save', function(next){ // 서버에 저장되기 전에 먼저 실행됨.
    var user = this;
    if(user.isModified('password')) {
        // 비밀번호 암호화
        bcrypt.genSalt(saltRounds, function(err, salt) { // Salt 생성
            if(err) return next(err)

            bcrypt.hash(user.password, salt, function(err, hash) { 
                if(err) return next(err)
                user.password = hash
                next()
            }); 
        })
    } else {
        next()
    }
})

userSchema.methods.comparePassword = async function(plainPassword) {
    try{
         // 비밀번호가 유효한 문자열인지 확인
         if (typeof plainPassword !== 'string' || typeof this.password !== 'string') {
            throw new Error("비밀번호가 올바르지 않습니다.");
        }
        
        // plainPassword 1234567  === 암호화된 비밀번호(얘를 복호화 하는 것은 불가능)
        const isMatch = await bcrypt.compare(plainPassword, this.password);
        return isMatch;
    } catch(err){
        throw err;
    }
}

userSchema.methods.generateToken = async function() {
    try {
        const user = this;
        // jsonwebToken
        var token = jwt.sign({ _id: user._id.toString() }, 'secretToken')

        user.token = token
        await user.save(); 

        return user;
    } catch(err) {
        throw err;
    }
}

userSchema.statics.findByToken = async function(token) {
    try {
        var user = this;
        const decoded = jwt.verify(token, 'secretToken'); // token을 복호화
        const foundUser = await user.findOne({ "_id": decoded._id, "token": token }); // DB에서 사용자 확인

        if (!foundUser) {
            throw new Error("User not found or token mismatch");
        }
        
        return foundUser;
    } catch (err) {
        throw new Error("Authentication failed: " + err.message);
    }
}

const User = mongoose.model('User', userSchema)

module.exports = { User }