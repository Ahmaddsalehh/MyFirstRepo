const mongoose = require("mongoose");
const sectors = require("../config/sectors");

const sectorIds = sectors.map((s) => s.id);

const projectSchema = new mongoose.Schema(
  {
    sectorId: { type: String, required: true, enum: sectorIds },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    link: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
