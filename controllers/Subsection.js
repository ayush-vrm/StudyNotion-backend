const SubSection = require("../models/SubSection");
const section = require("../models/Section");
const uploadImageToCloudinary = require("../utils/imageUploader");
const Section = require("../models/Section");

//create section ka handler
exports.createSubSection = async(req,res)=>{
    try{
        //data fetch from req body
        const {sectionId, title, timeDuration, description} = req.body; 
        //extract file 
        const video = req.files.videoFile;
        //validation
        if(!sectionId ||!title ||!timeDuration ||!description|| !video){
            return res.status(400).json({
                success : false,
                message : "All fields are required",
            })
        }
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env,FOLDER_NAME);
        //create subsection
        const subSectionDetails = await subSection.create(
            {title : title,
            timeDuration : timeDuration,
            description : description,
            videoUrl : uploadDetails.secure_url,
        }
        )
        //update section with this subsection ObjectId
        const updatedSection = await Section.findByIdAndUpdate({_id : sectionId},
                                                                {
                                                                  $push:{
                                                                    subSection : subSectionDetails._id
                                                                  }  
                                                                },
                                                                {new : true})
        // TODO : log updated section here after adding populate query
        // returnn response
        return res.status(200).json({
            success : true,
            message : "SubSection created successfully",
            updatedSection,
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Internal Server error",
            error : error.message,
        })
    }
}

//update subSection ka handler
exports.updateSubSection = async (req, res) => {
    try {
        // Extract necessary data from request body
        const { subSectionId, title, timeDuration, description } = req.body;

        // Validate presence of required fields
        if (!subSectionId || !title || !timeDuration || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Update the subsection
        const updatedSubSection = await SubSection.findByIdAndUpdate(
            subSectionId,
            {
                title: title,
                timeDuration: timeDuration,
                description: description,
            },
            { new: true }
        );

        if (!updatedSubSection) {
            return res.status(404).json({
                success: false,
                message: "Subsection not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subsection updated successfully",
            updatedSubSection,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            error: error.message,
        });
    }
};
//delete subsection ka handler
exports.deleteSubSection = async (req, res) => {
    try {
        // Extract subsection ID from request parameters
        const { subSectionId } = req.params;

        // Validate if subsectionId is provided
        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: "Subsection ID is required",
            });
        }

        // Delete the subsection
        const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

        // Check if subsection is found and deleted
        if (!deletedSubSection) {
            return res.status(404).json({
                success: false,
                message: "Subsection not found",
            });
        }

        // Return success message
        return res.status(200).json({
            success: true,
            message: "Subsection deleted successfully",
            deletedSubSection,
        });
    } catch (error) {
        // Handle errors
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            error: error.message,
        });
    }
};
