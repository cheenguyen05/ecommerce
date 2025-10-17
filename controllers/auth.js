const User = require('../models/user');
const jwt = require('jsonwebtoken'); //to generate signedd token
const { expressjwt } = require("express-jwt"); //for authorization check
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.signup = (req, res) => {
    console.log("req.body", req.body);

    const user = new User(req.body); // tạo user mới từ req.body

    user.save()
        .then(user => {
            // Ẩn mật khẩu trước khi trả về client
            user.hashed_password = undefined;
            user.salt = undefined;
            res.json({ user });
        })
        .catch(err => {
            res.status(400).json({ err: errorHandler(err) });
        });
};


exports.signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Tìm user theo email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup'
            });
        }

        // 2. Kiểm tra password
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: 'Email and password don\'t match'
            });
        }

        // 3. Tạo token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

        // 4. Lưu token vào cookie
        res.cookie('t', token, { expire: new Date() + 9999 });

        // 5. Trả về response cho frontend
        const { _id, name, role } = user;
        return res.json({ token, user: { _id, email, name, role } });

    } catch (err) {
        return res.status(500).json({
            error: 'Something went wrong. Please try again.'
        });
    }
};
    
exports.signout = (req, res) => {
    res.clearCookie("t");
    res.json({message: "Signout success"});
};

exports.requireSignin = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"], // added later
  userProperty: "auth",
});

exports.isAuth = (req, res, next) => {
    let user = req.prfile && req.auth && req.profile._id == req.auth._id
        if(!user) {
            return res.status(403).json({
                error: "Access denied"
            });
        }
        next();
};

exports.isAdmin = (req, res, next) => {
    if(req.profile.role === 0) {
        return res.status(403).json ({
            error: "Admin resource! Access ddenied"
        });
    }
    next();
}