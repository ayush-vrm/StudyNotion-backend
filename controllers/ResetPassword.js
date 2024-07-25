const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

//resetPasswordToken
exports.resetPasswordToken = async(req,res) =>{
    try{
        //get email from request ki body
        const email = req.body.email;

        // check user for the email , email validation
        const user = await User.findOne({email : email});
        if(!user){
            return res.status(401).json({
                success : false,
                message : "Your email is not registered with us",
            })
        }
        //generate token
        const token = crypto.randomUUID();
        //update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate({email:email},
                                                        {
                                                            token : token,
                                                            resetPasswordExpires : Date.now() + 5*60*1000,
                                                        },
                                                        {new: true})
        //create url
        const url = `http://localhost:3000/update-password/${token}`
        //send mail containing the url
        await mailSender(email, 
                        "Password reset link", 
                        `Passoword reset link is: ${url}`);
        //return response
        return res.json({
            success : true,
            message : "Email sent Successfully and change password",
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success : false,
            message : "Something went wrong while reset password",
        })
    }
}

//resetPassword
exports.resetPassword = async(req,res)=>{
    try{
        //fetch data 
        const {password, confirmPassword, token} = req.body;

        //data validation
        if(password != confirmPassword){
            return res.status(401).json({
                success : false,
                message : "Passwords did not matched",
            })
        }
        //get user details from db using token
        const userDetails = await User.findOne({token : token});
        //if no entry -> invalid token
        if(!userDetails){
            res.json({
                success : false,
                message : "Token is invalid",
            })
        }
        //token time check
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success : false,
                message : "Token is expired, please regenerate your token",
            })
        }
        //Hash password
        const hashedPassword = await bcrypt.hash(password,10);
        //update password
        await User.findOneAndUpdate(
            {token:token},
            {password: hashedPassword},
            {new:true,}
        )
        //return response
        return res.status(200).json({
            success : true,
            message : "Password reset Successful",
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success : false,
            message : "Something went wrong while reset password",
        })
    }
}