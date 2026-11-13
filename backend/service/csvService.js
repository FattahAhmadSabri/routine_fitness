const { format } = require("@fast-csv/format");
const { Writable } = require("stream");

const createCsvBuffer = (data) => {
    return new Promise((resolve, reject) => {
        const chunks = [];

        const writable = new Writable({
            write(chunk, encoding, callback) {
                chunks.push(chunk);
                callback();
            }
        });

        const csvStream = format({ headers: true });

        csvStream.on("error", reject);
        writable.on("error", reject);

        writable.on("finish", () => {
            resolve(Buffer.concat(chunks));
        });

        csvStream.pipe(writable);

        
        const bmi = typeof data.toJSON === "function"
            ? data.toJSON()
            : data;

        csvStream.write({
            Name: bmi.name,
            Age: bmi.age,
            Gender: bmi.gender,
            Height: bmi.height,
            Weight: bmi.weight,
            BMI: bmi.bmIndex,
            BMR: bmi.bmr,
            BFP: bmi.bfp
        });

        csvStream.end();
    });
};

module.exports = { createCsvBuffer };