const User = require('../models/user');
const {Order} = require("../models/order");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.userById = async (req, res, next, id) => {
    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        req.profile = user;
        next();
    } catch (err) {
        return res.status(400).json({ error: 'User not found' });
    }
};

exports.read = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
};

exports.update = async (req, res) => {
    try {
        let user = req.profile;
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        await user.save();

        user.hashed_password = undefined;
        user.salt = undefined;
        res.json(user);
    }
    catch (err) {
        return res.status(400).json({
            error: "You are not authorized to perform this action"
        });
    }
    
};

exports.addOrderToUserHistory = (req, res, next) => {
    let history = []

    req.body.order.products.forEach((item) => {
        history.push({
            _id: item._id,
            name:item.name,
            description: item.description,
            category: item.category,
            quantity: item.count,
            transaction_id: req.body.order.transaction_id,
            amount: req.body.order.amount
        })
    })

    User.findOneAndUpdate(
        {_id: req.profile._id}, 
        {$push: {history: history}}, 
        {new: true}, 
        (error, data) => {
            if (error){
                return res.status(400).json({
                error: "Could not update user purchase history"
                });
            }
            next();
        }
    );
};

exports.purchaseHistory = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.profile._id })
            .populate('user', '_id name')
            .sort('-created')
            .exec();

        res.json(orders);
    } catch (err) {
        return res.status(400).json({
            error: errorHandler(errr)
        });
    }
};
