const formidable = require('formidable');
const _ = require("lodash");
const fs = require('fs');
const Product = require('../models/product');
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.productById = async (req, res, next, id) => {
    try {
        const product = await Product.findById(id).populate('category');

        if (!product) {
            return res.status(400).json({ error: "Product not found" });
        }

        req.product = product; // gắn vào req
        next();                // đi tiếp
    } catch (err) {
        return res.status(400).json({ error: "Product not found" });
    }
};

exports.read = (req, res) => {
    req.product.photo = undefined;
    return res.json(req.product);
};

exports.create = (req, res) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, async (err, fields, files) => {
        if(err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            })
        }

        //check for all fields
        const {name, description, price, category, quantity, shipping} = fields

        if (!name || !description || !price || !category || !quantity || !shipping) {
            return res.status(400).json({
            error: "All fields are required"});
        }

        let product = new Product(fields);

        //1kb = 1000
        // 1mb = 1000000

        if (files.photo) {
            //console.log("FILES PHOTO: ", files.photo);
            if (files.photo.size > 1000000) {
              return res.status(400).json({
                error: "Image should be less than 1mb in size",
              });
            }
            product.photo.data = fs.readFileSync(files.photo.filepath); // change path to filepath
            product.photo.contentType = files.photo.mimetype; // change typt to mimetype
           }

        try {
            const data = await category.save();
            res.json({data});
        } catch (err) {
            return res.status(400).json({
                  error: errorHandler(err)
              });
        }
     });
            
};

exports.remove = async (req, res) => {
    try {
        await req.product.deleteOne();
        res.json({"message": "Product deleted successfully"});
    } catch (err) {
        return res.status(400).json({
            error: errorHandler(err)
        });
    }
};

exports.update = async (req, res) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, async (err, fields, files) => {
        if(err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            })
        }

        //check for all fields
        //const {name, description, price, category, quantity, shipping} = fields

        //if (!name || !description || !price || !category || !quantity || !shipping) {
        //    return res.status(400).json({
        //    error: "All fields are required"});
        //}

        let product = req.product
        product = _.extend(product, fields)

        //1kb = 1000
        // 1mb = 1000000

        if (files.photo) {
            //console.log("FILES PHOTO: ", files.photo);
            if (files.photo.size > 1000000) {
              return res.status(400).json({
                error: "Image should be less than 1mb in size",
              });
            }
            product.photo.data = fs.readFileSync(files.photo.filepath); // change path to filepath
            product.photo.contentType = files.photo.mimetype; // change typt to mimetype
           }

        try {
            const data = await product.save(); // dùng promise
            res.json(data);
        } catch (error) {
            return res.status(400).json({
                error: errorHandler(error)
            });
        }
    });
};

/**
 * sell / arrival
 * by sell = /products?sortBy=sold&order=desc&limit=4
 * by arrival = /products?sortBy=createAt&order=desc&limit=4
 * if no params are sent, then all products are returned
 */ 

exports.list = async (req, res) => {
    let order = req.query.order ? req.query.order : 'asc';
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    try {
        const products = await Product.find()
            .select("-photo")
            .populate("category")
            .sort([[sortBy, order]])
            .limit(limit);

        res.json(products);
    } catch (err) {
        return res.status(400).json({
            error: "Products not found"
        });
    }
};

/**
 * it will find the products based on the req product category
 * other productss that has the same category, will be returned
 */

exports.listRelated = async (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    try {
        const products = await Product.find({
            _id: {$ne: req.product},
            category: req.product.category
        })
        .limit(limit)
        .populate('category', '_id name')
        res.json(products);
    } catch (err) {
        return res.status(400).json({
            error: errorHandler(err)
        });
    }
   
        
};


exports.listCategories = async (req, res) => {
    try {
        const categories = await Product.distinct("category", {});
        res.json(categories);
    } catch (err) {
        return res.status(400).json({
            error: "Categories not found"
        });
    }
};

/**
 * list products by search
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 */
 
exports.listBySearch = async (req, res) => {
    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};
 
    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);
 
    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }
 
    try { 
        const data = await Product.find(findArgs)
            .select("-photo")
            .populate("category")
            .sort([[sortBy, order]])
            .skip(skip)
            .limit(limit);
        res.json({
            size: data.length,
            data
        });
    } catch (err) {
        return res.status(400).json({
            error: "Products not found"
        });
    }
};

exports.photo = (req, res, next) => {
    if (req.product.photo.data) {
        res.set('Content-Type', req.product.photo.contentType)
        return res.send(req.product.photo.data);
    }
    next();
};

exports.listSearch = async (req, res) => {
    try {
        // create query object to hold search value and category value
        const query = {}
        //assign search value to query.name
        if (req.query.search) {
            query.name = {$regex: req.query.search, $options: 'i'}
            //assign category value to query.category
            if (req.query.category && req.query.category != 'All') {
                query.category = req.query.category
            }
        }
        
        //find the product based on query object with 2 properties
        // search and category
        const products = await Product.find(query).select('-photo');
        res.json(products);
    } catch (err) {
        return res.status(400).json({
            error: errorHandler(err)
        });
    } 
    
};
 
exports.decreaseQuantity = (req, res, next) => {
    let bulkOps = req.body.order.products.map((item) => {
        return {
            updateOne: {
                filter: {_id: item._id},
                update: {$inc: {quantity: -item.count, sold: +item.count}}
            }
        };
    });

    Product.bulkWrite(bulkOps, {}, (error, products) => {
        if (error) {
            return res.status(400).json({
                error: "Could not update product"
            });
        }
        next();
    });
};