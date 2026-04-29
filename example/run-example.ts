import * as fs from "fs";
import * as path from "path";
import { html2markdown } from "../src/index";

// Resolve example directory
const exampleDir = __dirname;

function runExamples() {
  try {
    const files = fs.readdirSync(exampleDir);
    const inputFiles = files.filter(f => f.startsWith("example-input") && f.endsWith(".htm"));

    if (inputFiles.length === 0) {
      console.error(`No example input files found in ${exampleDir}`);
      return;
    }

    inputFiles.forEach(inputFile => {
      const inputPath = path.join(exampleDir, inputFile);
      // Derive output name: example-input1.htm -> example-output1.md
      const outputName = inputFile.replace("input", "output").replace(".htm", ".md");
      const outputPath = path.join(exampleDir, outputName);

      console.log(`\n--- Processing: ${inputFile} ---`);
      console.log(`Reading input from: ${inputPath}`);
      const html = fs.readFileSync(inputPath, "utf-8");

      console.log(`Converting to Markdown...`);
      const markdown = html2markdown(html, {
        frontmatter: {
          title: `Example Conversion: ${inputFile}`,
          source: "html2text example suite",
          date: new Date().toISOString().split("T")[0],
        },
      });

      console.log(`Writing output to: ${outputPath}`);
      fs.writeFileSync(outputPath, markdown, "utf-8");
      console.log(`SUCCESS! Created ${outputName}`);
    });

  } catch (error) {
    console.error("An error occurred during conversion:", error);
  }
}

runExamples();

