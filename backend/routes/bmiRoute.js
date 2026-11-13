
const express = require("express");
const router = express.Router();

const {
    createBmi,
    getBMI,
    getBMIById,
    sortData,
    sortValue,
    generatePDF,
    generateCsv
} = require("../controller/bmiController");
const authMiddleware = require("../middleware/authenticateMiddleware");

router.post("/bmi/create",authMiddleware, createBmi);
router.get("/all",authMiddleware, getBMI);
router.get("/:id",authMiddleware, getBMIById);
router.post("/sort", sortData);
router.post("/sort-value", sortValue);
router.post("/generate-pdf", generatePDF);
router.post("/generate-csv", generateCsv);

module.exports = router;
