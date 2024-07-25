const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require('../models/SubSection');

//create a section ka handler function
exports.createSection = async(req,res)=>{
    try{
        // data fetch
        const {sectionName, courseId} = req.body;
        // data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success : false,
                message : "Missing properties",
            })
        }
        // create section
        const newSection = await Section.create({sectionName});
        // update course schema with courseID
        const updatedCourseDetails = await Course.findByIdAndUpdate(
                                                        courseId,
                                                        {
                                                            $push :{
                                                                courseContent : newSection._id,
                                                            }
                                                        },
                                                        {new : true,}
                                                    )
                                                    .populate({
                                                        path:"courseContent",
                                                        populate: {
                                                            path:"subSection"
                                                        }})
                    // TODO : use populate to replace sections/subsections both in updatedCourseDetails
        //return response
        return res.status(200).json({
            success : true,
            message : "Section created successfullty",
            updatedCourseDetails,
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Unable to create section, please try again",
            error : error.message,
        })
    }
}

//update a section ka handler function
exports.updateSection = async(req,res)=>{
    try{
        //data input
        const {sectionName, sectionId} = req.body;
        //data validate
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success : false,
                message : "Missing properties",
            })
        }
        //update data
        const updatedSection = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new:true,});
        const updatedCourse = await Course.findById(courseId)
          .populate({
              path:"courseContent",
              populate: {
                  path:"subSection"
              }});

        // return response 
        return res.status(200).json({
            success : true,
            message : "Section updated successfully",
            updatedCourse,
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Unable to update section, please try again",
            error : error.message,
        })
    }
}

//deleteSection ka handler
exports.deleteSection = async(req,res)=>{
    try{
        //get ID - assuming we are sending IDs in params
        const {sectionId} = req.params
        // use findByIdAndDelete
        // testing k time pr pata lgana CourseSchema se bhi delete krna h kya 
        await Section.findByIdAndDelete(sectionId);
        // return response
        return res.status(200).json({
            success : true,
            message : "Section deleted successfully",
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Unable to delete section, please try again",
            error : error.message,
        })
    }
}
// we will see that delete section and delete a section from the course later
