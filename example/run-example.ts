import * as fs from "fs";
import * as path from "path";
import { html2markdown } from "../src/index";

// Resolve paths relative to current file
const inputPath = path.resolve(__dirname, "example-input1.htm");
const outputPath = path.resolve(__dirname, "example-output1.md");

function runExample() {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Input file not found at ${inputPath}`);
      return;
    }

    console.log(`Reading input from: ${inputPath}`);
    const html = fs.readFileSync(inputPath, "utf-8");

    console.log(`Converting to Markdown...`);
    const markdown = html2markdown(html, {
      frontmatter: {
        title: "Linux Man Page: accept(2)",
        source: "https://linux.die.net/man/2/accept",
        date: new Date().toISOString().split("T")[0],
      },
    });

    console.log(`Writing output to: ${outputPath}`);
    fs.writeFileSync(outputPath, markdown, "utf-8");

    console.log(`\nSUCCESS! Created ${path.basename(outputPath)}`);
  } catch (error) {
    console.error("An error occurred during conversion:", error);
  }
}

runExample();
