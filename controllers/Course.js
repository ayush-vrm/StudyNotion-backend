const { response } = require("express");
const Course = require("../models/Course");
const Tag = require("../models/Category");
const User  = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

//createCourse ka handler function
exports.createCourse = async(req,res) =>{
    try{
        //data fetch
        const{courseName, courseDescription, whatYouWillLearn, price, tag} = req.body;

        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if(!courseName|| !courseDescription|| !whatYouWillLearn|| !price|| !tag){
            return res.status(400).json({
                success : false,
                message : "All fields are required",
            })
        }

        //check for instructor
        const userId = req.user.id; 
        const instructorDetails = await User.findById(userId);
        console.log("Instructor Details :" ,instructorDetails);
        
        //if instructorDetails not found
        if(!instructorDetails){
            return res.status(404).json({
                success : false,
                message : "Instrcutor details not found",
            })
        }

        //check given tag is valid do or not
        const tagDetails = await Tag.findById(tag);
        if(!tagDetails){
            return res.status(404).json({
                success : false,
                message : "Tag details not found",
            })
        }

        //upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        //create an entry for a new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor : instructorDetails._id,
            whatYouWillLearn : whatYouWillLearn,
            price,
            tag : tagDetails._id,
            thumbnail : thumbnailImage.secure_url,
        })

        //add the new course to the user schema of the instructor
        await User.findByIdAndUpdate(
            {id: instructorDetails._id},
            {
                $push: {
                    courses : newCourse._id,
                }
            },
            {new: true,}
        )

        //update Tag ka schema
        // await Tag.findByIdAndUpdate(
        //     {

        //     }
        // )
        // return response 
        return res.status(200).json({
            success : true,
            message : "Course created successfully",
        })
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success : false,
            message : "Failed to create a course",
            error : error.message,
        })
    }
}

//getAllCourses ka handle function
exports.getAllCourses = async(req,res)=>{
    try{
        const allCourses = await Course.find({}, {courseName:true,
                                                    price : true,
                                                    thumbnail : true,
                                                    instructor : true,
                                                    ratingAndReviews : true,
                                                    studentsEnrolled : true,})
                                                    .populate("instructor")
                                                    .exec()
        return res.status(200).json({
            success : true,
            message : "Data for all courses fetched successfully",
            data : allCourses,
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success : false,
            message : "Cannot show course data",
            error : error.message,
        })
    }
}

//getCourseDetails ka handler fucntion
exports.getCourseDetails = async(req,res)=>{
    try{
        //get Id
        const {courseId} = req.body;
        //find course details 
        const courseDetails = await Course.find(
                                    {_id : courseId})
                                    .populate(
                                        {
                                            path : "instructor",
                                            populate :{
                                                path : "additionalDetails"
                                            }
                                        }
                                    )
                                    .populate("category")
                                    .populate("ratingAndReview")
                                    .populate(
                                        {
                                            path : "courseContent",
                                            populate : {
                                                path : "subSection",
                                            }
                                        }
                                    )
                                    .exec();
        //validation
        if(!courseDetails){
            return res.status(400).json({
                success : false,
                message : `Could not find the course with ${courseId}`
            })
        }
        return res.status(200).json({
            success : true,
            message : "Course details fetched successfully",
            data : CourseDetails,
        })                            
    }
    catch{
         console.log(error);
         return res.status(500).json({
            success : false,
            message  :error.message,
         })
    }
}