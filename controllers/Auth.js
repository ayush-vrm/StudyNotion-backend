const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const Profile = require('../models/Profile');
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require("dotenv").config();

// send OTP
exports.sendOTP = async(req,res) =>{
    try{
        // fetch email from request ki body
        const {email} = req.body;

        // check if user is present
        const checkUserPresent = await User.findOne({email});

        // if user already exists, then return rsponse
        if(checkUserPresent){
            return res.status(401).json({
                success : false,
                message : "User already registered",
            })
        }
        // genrate otp
        var otp = otpGenerator.generate(6,{
            upperCaseAlphabets : false,
            lowerCaseAlphabets : false,
            specialChars : false,
        })
        console.log("OTP generated is:", otp);

        // check unique otp or not
        let result = await OTP.findOne({otp : otp});

        while(result){
            otp = otpGenerator(6,{
                upperCaseAlphabets : false,
                lowerCaseAlphabets : false,
                specialChars : false,
            });
            result = await OTP.findOne({otp : otp});
        }

        const otpPayload = {email,otp};

        // create an entry in database
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        // return response successful
        return res.status(200).json({
            success : true,
            message : "OTP sent successfully"
        })
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success : false,
            message : error.message,
        })
    }
}

// SignUp
exports.signUp = async(req,res) =>{
    try{
        // data fetch from req ki body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;
        // validate krlo
        if(!firstName|| !lastName|| !email|| !password|| !confirmPassword||!otp){
            return res.status(403).json({
                success : false,
                message : "All fields are required",
            })
        }
        // 2 passowords match kro
        if(password != confirmPassword){
            return res.status(400).json({
                success : false,
                message : "Password and confirmPassword values does not match, please try again",
            })
        }
        // check user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success : false,
                message : "User is already regsistered",
            })
        }

        //otp generate (find most recent for the user)
        const recentOtp  = await OTP.find({email}).sort({createdAt: -1}).limit(1);
        console.log(recentOtp);
        // validate otp
        if(recentOtp.length == 0){
            //OTP not found
            return res.status(400).json({
                success : false,
                messageg : "OTP not found"
            })
        }
        else if(otp != recentOtp[0].otp){
            // Invalid OTP
            return res.status(400).json({
                success : false,
                message : "Invalid OTP(not matched)"
            })
        }
        //Hash password
        const hashedPassword = await bcrypt.hash(password,10);
        //Create entry in database

        const profileDetails = await Profile.create({
            gender : null,
            dateOfBirth : null,
            about : null,
            contactNumber : null,
        })

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password : hashedPassword,
            accountType,
            additionalDetails : profileDetails._id,
            image : `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        //return response successfully
        return res.status(200).json({
            success : true,
            message : "User is registered successfully",
            user,
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success : false,
            message : "User cannot be registered, please try again",
        })
    }
}

// LOGIN
exports.login = async(req,res)=>{
    try{
        //get data from request ki body
        const {email,password} = req.body;

        // validation of data
        if(!email || !password){
            return res.status(403).json({
                success : false,
                message : "All fileds are required, please try again"
            })
        }
        // check user exists or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success : false,
                message : "User is not registered, please signUp",
            })
        }
        // generate JWT token, after password matching
        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email : user.email,
                id : user._id,
                accountType : user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET,{
                expiresIn : "2h",
            })
            user.token = token;
            user.password = undefined;
        
            //create cookie and send respoonse
            const options = {
                expires : new Date(Date.now() + 3*24*60*60*1000),
                httpOnly : true,
            }
            res.cookie("token", token, options).status(200).json({
                success : true,
                token,
                user,
                message : "Logged in Successfully"
            })
        }
        else{
            return res.status(401).json({
                success : false,
                message : "Password is incorrect"
            })
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success : false,
            message : "Login failure please try again",
        })
    }
}


// Change password
exports.changePassowrd = async(req,res)=>{
    try {
		// Get user data from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}


		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		// Return success response
		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	} 
    catch (error) {
		// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
}