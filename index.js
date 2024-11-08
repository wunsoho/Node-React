    const express = require('express')
    const app = express()
    const port = 5000
    const bodyParser = require('body-parser');
    const { User } = require("./models/User");

    const config = require('./config/key')

    //application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({extended: true})); 

    //application/json
    app.use(bodyParser.json());


    const mongoose = require('mongoose')
    mongoose.connect(config.mongoURI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))

    app.get('/', (req, res) => res.send('Hello World! 안녕'))

    
    app.post('/register', async (req, res) => {
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


    app.listen(port, () => console.log(`Example app listening on port ${port}!`))