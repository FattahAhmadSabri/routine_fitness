
const {
    createBmiService,
    getBMIService,
    getBMIByIdService,
    sortDataService,
    sortValueService
} = require("../service/bmiService");
const {User} = require("../model/index")

const { createPDFBuffer } = require("../service/pdfService");
const { createCsvBuffer } = require("../service/csvService");



const createBmi = async (req, res) => {
    try {
        const userId = req.user.id;

        
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        
        const bmiData = {
            name: user.name,
            age: user.age,
            gender: user.gender,
            weight: req.body.weight,
            height: req.body.height
        };

        const newBMI = await createBmiService(bmiData);

        res.status(201).json({
            success: true,
            message: "BMI & BMR created successfully",
            data: newBMI
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



const getBMI = async (req, res) => {
    try {
        const data = await getBMIService();

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



const getBMIById = async (req, res) => {
    try {
        const newBmi = await getBMIByIdService(req.params.id);

        if (!newBmi) {
            return res.status(404).json({
                success: false,
                message: "No BMI record found for this ID"
            });
        }

        
        const bmiValue = Number(newBmi.bmIndex);

        const buildResponse = (category, explanation, tips) => ({
            success: true,
            bmiValue: Number(bmiValue.toFixed(2)),
            age: newBmi.age,
            bmr: newBmi.bmr,
            bfp: newBmi.bfp,
            category,
            explanation,
            healthTips: tips,
            note: "Consult a healthcare professional before making major dietary or exercise changes."
        });

        const commonTips = [
            "Maintain balanced nutrition.",
            "Stay physically active.",
            "Consult a healthcare professional for personalized advice."
        ];

        if (bmiValue < 18.5) {
            return res.status(200).json(buildResponse(
                "Underweight",
                "Your BMI indicates that you are underweight.",
                [
                    "Include nutrient-rich foods and adequate protein.",
                    "Consider strength training.",
                    "Consult a doctor or nutritionist if you experience fatigue."
                ]
            ));
        }

        if (bmiValue < 25) {
            return res.status(200).json(buildResponse(
                "Normal",
                "Your BMI is within the normal range.",
                [
                    ...commonTips,
                    "Continue regular health checkups."
                ]
            ));
        }

        if (bmiValue < 30) {
            return res.status(200).json(buildResponse(
                "Overweight",
                "Your BMI indicates that you are overweight.",
                [
                    "Focus on balanced nutrition.",
                    "Include regular cardio and strength training.",
                    "Limit processed foods and sugary drinks."
                ]
            ));
        }

        if (bmiValue < 35) {
            return res.status(200).json(buildResponse(
                "Obesity (Class I)",
                "Your BMI falls in the obesity Class I category.",
                [
                    "Consult a healthcare professional.",
                    "Focus on sustainable nutrition and exercise.",
                    "Monitor blood pressure and blood sugar as advised."
                ]
            ));
        }

        if (bmiValue < 40) {
            return res.status(200).json(buildResponse(
                "Obesity (Class II)",
                "Your BMI falls in the obesity Class II category.",
                [
                    "Consult a healthcare professional.",
                    "Follow a medically guided weight management plan.",
                    "Monitor your health regularly."
                ]
            ));
        }

        return res.status(200).json(buildResponse(
            "Obesity (Class III - Severe)",
            "Your BMI falls in the obesity Class III category.",
            [
                "Seek medical guidance for an appropriate assessment.",
                "Discuss suitable weight management options with your doctor.",
                "Follow a sustainable lifestyle plan."
            ]
        ));

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching BMI data",
            error: error.message
        });
    }
};



const sortData = async (req, res) => {
    try {
        const { age } = req.body;

        const data = await sortDataService(Number(age));

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



const sortValue = async (req, res) => {
    try {
        const { age, weight } = req.body;

        const data = await sortValueService(
            Number(age),
            Number(weight)
        );

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



const generateCsv = async (req, res) => {
    try {
        const csvBuffer = await createCsvBuffer(req.body);

        res.set({
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=bmi_report.csv"
        });

        res.send(csvBuffer);

    } catch (error) {
        console.error("CSV generation failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate CSV"
        });
    }
};



const generatePDF = async (req, res) => {
    try {
        const pdfBuffer = await createPDFBuffer(req.body);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=bmi_report.pdf"
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF generation failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate PDF"
        });
    }
};


module.exports = {
    createBmi,
    getBMI,
    getBMIById,
    sortData,
    sortValue,
    generatePDF,
    generateCsv
};
