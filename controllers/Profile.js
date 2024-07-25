const Profile = require("../models/Profile");
const User = require("../models/User");

//update Profile
exports.updateProfile = async(req,res)=>{
    try{
        //data fetch
        const {dateOfBirth = "", about="", contactNumber, gender} = req.body;
        // get user ID 
        const id = req.user.id;
        
        //data validation
        if(!contactNumber || !gender || !id){
            return res.status(400).json({
                success : true,
                message : "All fields are required",
            })
        }
        console.log(contactNumber,gender,id);
        //find profile
        const userDetails = await User.findById(id);
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);
        if (!profileDetails) {
            return res.status(404).json({
                success: false,
                message: "Profile not found",
            });
        }

        //update profile
        // profileDetails.dateOfBirth = dateOfBirth;
        // profileDetails.gender = gender;
        // profileDetails.about = about;
        // profileDetails.contactNumber = contactNumber;
        // await profileDetails.save();
        const updatedProfile = await Profile.findByIdAndUpdate(profileId, {dateOfBirth, gender, about, contactNumber}, {new:true});
        const updatedUserDetails = await User.findById(id).populate("additionalDetails").exec();
        //return response
        return res.status(200).json({
            success : true,
            message : "Profile updated successfully",
            updatedUserDetails,
        })
    }
    catch{
        return res.status(500).json({
            success : false,
            error : "cannot update the profile detaisl",
        })
    }
}
// explore ->how can we schedule this delete account
//delete account
exports.deleteAccount = async(req,res) =>{
    try{
        //get id
        const id = req.user.id;
        // validation 
        const userDetails = await User.findById(id);
        if(!userDetails){
            return res.status(404).json({
                success : false,
                message : "User not found",
            })
        }
        //delete profile
        await Profile.findByIdAndUpdate({_id : userDetails.additionalDetails});
        //delete user
        await User.findByIdAndDelete({_id :id});
        //return response
        return res.status(200).json({
            success : true,
            message : "Account deleted successfully",
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "user cannot be deleted successfully"
        })
    }
}

// get all details of the user
exports.getAllDetails = async(req,res)=>{
    try{
        //get id
        const id = req.user.id;
        //validation and get user details
        const userDetails =  User.findById(id).populate("additionalDetails").exec();
        if(userDetails){
            console.log(userDetails);
        }
        return res.status(200).json({
            success : true,
            message : "User Data fetched successfully",
            userDetails,
        })

    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : error.message,
        })
    }
}


//instructor dashboard
//enrolled courses
//updated displayPictures