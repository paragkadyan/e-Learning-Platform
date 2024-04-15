import {course} from "../models/course.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"; 
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";



const getCourse = asyncHandler(async(req,res)=>{

    const courses = await course.find();

    return res
    .status(200)
    .json(new ApiResponse(200, courses, "All courses"))

})

const getcourseTeacher = asyncHandler(async(req,res)=>{

    const coursename = req.params.coursename;

    if(!coursename){
        throw new ApiError(400, "Choose a course")
    }
    
    const Courses = await course.findOne({
        coursename
    })
    
    if(!Courses){
        throw new ApiError(400, "No course found")
    }

    const courseTeachers = await course.aggregate([
        {
          $match: {
            coursename 
          }
        },
        {
            $lookup: {
              from: "teachers",
              localField: "enrolledteacher",
              foreignField: "_id",
              as: "enrolledteacher" 
            }
        },
        {
            $project: {
              _id: 1,
              coursename: 1,
              description:1,
              enrolledteacher: {
                _id: 1,
                Firstname: 1,
                Lastname: 1
              }
            }
        }
    ])

    if (!courseTeachers || courseTeachers.length === 0) {
        throw new ApiError(400, "No teachers found for the specified course");
    }

    return res
    .status(200)
    .json( new ApiResponse(200, courseTeachers, "details fetched"))
    
})


const addCourseTeacher = asyncHandler(async(req,res)=>{
    const loggedTeacher = req.teacher

    const teacherParams = req.params.id

    if(!teacherParams){
      throw new ApiError(400,"Invalid user")
    }

    console.log("running");
 
    if(loggedTeacher._id != teacherParams){
      throw new ApiError(400,"not authorized")
    }

    

    const{coursename,description} = req.body

    if ([coursename,description].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    const existingCourse = await course.findOne({
      coursename,
      enrolledteacher: loggedTeacher._id
  });

  if (existingCourse) {
      throw new ApiError(400, "A course with the same name already exists for this teacher");
  }

    const newCourse = await course.create({
      coursename,
      description,
      enrolledteacher: loggedTeacher._id,
    })

    if(!newCourse){
      throw new ApiError(400, "couldnt create course")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {newCourse, loggedTeacher}, "new course created"))
    
})


const addCourseStudent = asyncHandler(async(req,res)=>{
 
  const loggedStudent = req.Student

  const studentParams = req.params.id

  if(!studentParams){
    throw new ApiError(400, "no params found")
  }

  if(loggedStudent._id != studentParams){
    throw new ApiError(400, "not authorized")
  }

  const courseID = req.params.courseID

  if(!courseID){
    throw new ApiError(400, "select a course")
  }
 //condition if student already enrolled in that course [ADD LATER]
 
  const selectedCourse = await course.findByIdAndUpdate(courseID, 
    {
      $push: {
        enrolledStudent:loggedStudent._id
      }
    }, {
      new: true
    })

  if(!selectedCourse){
    throw new ApiError(400, "failed to add student in course schema")
  }

  return res
  .status(200)
  .json( new ApiResponse(200, {selectedCourse, loggedStudent}, "successfully opted in course"))
})

const enrolledcourseSTD = asyncHandler(async(req,res)=>{
  const stdID = req.params.id

  if(!stdID){
    throw new ApiError(400, "authorization failed")
  }

  if(stdID != req.Student._id){
    throw new ApiError(400, "params and logged student id doesnt match")
  }

  const Student = await course.find({ enrolledStudent: stdID }).select( "-enrolledStudent -liveClasses -enrolledteacher")

  if (!Student) {
      throw new ApiError(404, "Student not found");
  }

  return res
  .status(200)
  .json( new ApiResponse(200,Student, "student and enrolled course"))

})


const enrolledcourseTeacer = asyncHandler(async(req,res)=>{
  const teacherID = req.params.id

  if(!teacherID){
    throw new ApiError(400, "authorization failed")
  }

  if(teacherID != req.teacher._id){
    throw new ApiError(400, "params and logged teacher id doesnt match")
  }

  const teacher = await course.find({ enrolledteacher: teacherID }).select( "-enrolledStudent -liveClasses -enrolledteacher")

  if (!teacher) {
      throw new ApiError(404, "teacher not found");
  }

  return res
  .status(200)
  .json( new ApiResponse(200,teacher, "teacher and enrolled course"))
})


export {getCourse, getcourseTeacher, addCourseTeacher, addCourseStudent, enrolledcourseSTD, enrolledcourseTeacer} 






