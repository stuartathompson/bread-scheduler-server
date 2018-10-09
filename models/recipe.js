var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var RecipeSchema = new Schema({
  title: {
    type: String
  },
  description: String,
  shortDescription: String,
  totalRecipeLength: Number,
  date: Date,
  last_edited: Date,
  numberOfLoaves: Number,
  ingredients: [{
      item: String,
      totalFlour: Number,
      ingredients: [{
        amount: String,
        ingredient: String,
        measurement: String
      }]
  }],
  steps: [{
      category: String,
      step: String,
      ingredients: [{
        amount: String,
        ingredient: String,
        measurement: String,
      }],
      timeBreak: [{
        timeMin: String,
        timeMax: String
      }]
  }],
  images: [{
    attachment_id: String,
    secure_url: String,
    filename: String,
    resource_type: String,
    format: String
  }],
  owner: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    username: {
      type: String
    }
  }
});

module.exports = mongoose.model("Recipe", RecipeSchema);
