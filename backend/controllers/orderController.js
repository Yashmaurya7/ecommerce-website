const Order = require("../models/orderModels");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Create New Order
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    user: req.user._id,
    paidAt: Date.now(),
  })

  res.status(201).json({
    success: true,
    order,
  })
});


// Get Single Order -- admin
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email",
    );

    if(!order){
        return next(new ErrorHandler(`No order found with order ID: ${req.params.id}`,400));
    }

    res.status(200).json({
        success: true,
        order,
    })
});


// Get Logged In Orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find({user: req.user._id});

    res.status(200).json({
        success: true,
        orders,
    })
})


// Get All Orders -- admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        totalAmount,
        orders,
    })
})


// Update Order Status -- admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);


    if(!order){
        return next(new ErrorHandler(`No order found with order ID: ${req.params.id}`,400));
    }

    if(order.orderStatus === "Delivered"){
        return next(new ErrorHandler("You Have already Delivered this Order",400));
    }

    
    order.orderStatus = req.body.status;

    if(req.body.status === "Shipped"){
        order.orderItems.forEach(async (item) => {
            await updateStock(item.product , item.quantity);
        })
    }
    
    if(req.body.status === "Delivered"){
        order.deliveredAt = Date.now();
    };

    await order.save({validateBeforeSave: false});

    res.status(200).json({
        success: true,
    })
})

async function updateStock(id,quantity){
    const product  = await Product.findById(id);

    product.stock -= quantity;

    await product.save({validateBeforeSave: false});
};


// Delete Order
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if(!order){
        return next(new ErrorHandler(`No order found with order ID: ${req.params.id}`,400));
    }

    await order.deleteOne({_id:req.params.id});

    res.status(200).json({
        success: true,
    })
})