const Category = require('../models/category');
const { errorHandler } = require("../helpers/dbErrorHandler");
const category = require('../models/category');
const { eq } = require('lodash');

exports.categoryById = (req, res, next, id) => {
    Category.findById = (req, res, next, id) => {
        if (err || !category) {
            return res.status(400).json({
                error: 'Category does not exist'
            });
        }
        req.category = category;
        next();
    }
}

exports.create = async (req, res) => {
    try {
        const category = new Category(req.body)
        const data = await category.save()// lưu lại thay đổi
        res.json(data);
    } catch (err) {
        return res.status(400).json({
                error: errorHandler(err)
            });
    }
 
};


exports.read = (req, res) => {
    return res.json(req.category);
}

exports.update = async (req, res) => {
    try {
        let category = req.category
        category.name = req.body.name
    
        const data = await category.save(); // lưu lại thay đổi
        res.json(data);
    } catch (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
};


exports.remove = async (req, res) => {
    try {
        let category = req.category

        await category.deletedOne();
        res.json({
            message: "Category deleted"
        });
    } catch (err) {
        return res.status(400).json({
                error: errorHandler(err)
            });
    }
};

exports.list = async (req, res) => {
    try {
        const data = await Category.find();
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: errorHandler(err) });
    }
};

