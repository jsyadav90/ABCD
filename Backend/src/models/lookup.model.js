import mongoose from "mongoose";

const lookupSchema = new mongoose.Schema({

  category:{
    type:String,
    required:true,
    trim:true,
    index:true
  },

  name:{
    type:String,
    required:true,
    trim:true
  },

  code:{
    type:String,
    trim:true
  },

  description:{
    type:String
  },

  sortOrder:{
    type:Number,
    default:0
  },

  isActive:{
    type:Boolean,
    default:true
  },

  inactiveAt:{
    type:Date,
    default:null
  },

  inactiveBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
  },

  inactiveReason:{
    type:String,
    trim:true,
    default:null
  },

  isDeleted:{
    type:Boolean,
    default:false
  },

  deletedAt:{
    type:Date,
    default:null
  },

  deletedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
  },

  deletedReason:{
    type:String,
    trim:true,
    default:null
  }

},{
  timestamps:true,
  collection:"lookups"
});

// prevent duplicate value in same category
lookupSchema.index({ category: 1, name: 1 }, { unique: true });

export const Lookup = mongoose.model("Lookup", lookupSchema);
