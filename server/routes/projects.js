const express = require("express");
const multer = require("multer");

const Project = require("../models/Project");
const sectors = require("../config/sectors");
const requireAdmin = require("../middleware/auth");
const { uploadImage, deleteImage } = require("../utils/imageStorage");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// عام: يرجع القطاعات الأربعة مع مشاريع كل قطاع - يستخدمه الموقع العام
router.get("/sectors", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    const data = sectors.map((sector) => ({
      ...sector,
      projects: projects.filter((p) => p.sectorId === sector.id)
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// محمي: إضافة مشروع جديد (لوحة التحكم)
router.post("/projects", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { sectorId, name, description, link } = req.body;
    if (!sectorId || !name) {
      return res.status(400).json({ error: "القطاع واسم المشروع مطلوبان" });
    }

    let imageUrl = "";
    let imagePublicId = "";
    if (req.file) {
      const result = await uploadImage(req.file.buffer, req.file.originalname);
      imageUrl = result.url;
      imagePublicId = result.publicId;
    }

    const project = await Project.create({
      sectorId,
      name,
      description,
      link,
      imageUrl,
      imagePublicId
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// محمي: تعديل مشروع
router.put("/projects/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "المشروع غير موجود" });

    const { sectorId, name, description, link } = req.body;
    if (sectorId) project.sectorId = sectorId;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (link !== undefined) project.link = link;

    if (req.file) {
      if (project.imagePublicId) await deleteImage(project.imagePublicId);
      const result = await uploadImage(req.file.buffer, req.file.originalname);
      project.imageUrl = result.url;
      project.imagePublicId = result.publicId;
    }

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// محمي: حذف مشروع
router.delete("/projects/:id", requireAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "المشروع غير موجود" });

    if (project.imagePublicId) await deleteImage(project.imagePublicId);
    await project.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
