import { html2markdown } from "./src/index";

const sampleHtml = `
  <h1>Hello World</h1>
  <p>This is a <strong>test</strong> of the <em>html2text</em> converter.</p>
  Some Text before the title.
    <h2>Features</h2>
    Some Text after the title.
  <ul>
    <li>Lists (unordered and ordered)
      <ul>
        <li>Nested unordered</li>
        <li>Nested unordered 2</li>
      </ul>
    </li>
    <li>Images: <img src="image.png" alt="A nice image" title="Image title" /></li>
    <li>Links: <a href="https://example.com" title="Example">Click here</a></li>
    <li>Code blocks:
      <pre><code class="language-typescript">
const x = 10;
console.log(x);
      </code></pre>
    </li>
  </ul>

  <hr>

  <h3>Tables</h3>
  Some Text after the title.
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Age</th>
        <th>City</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice</td>
        <td>28</td>
        <td>New York</td>
      </tr>
      <tr>
        <td>Bob</td>
        <td>34</td>
        <td>San Francisco</td>
      </tr>
    </tbody>
  </table>

  <blockquote>
    This is a blockquote.<br>
    It can span multiple lines.
  </blockquote>

  <h3>Definition Lists</h3>
  <dl>
    <dt>Toys</dt>
    <dd><a href="https://www.die.net/earth/">world sunlight</a></dd>
    <dd><a href="https://www.die.net/moon/">moon phase</a></dd>
    <dt>Multi-line</dt>
    <dd>This is the first line of the definition.<br>This is the second line.<br><br>And a new paragraph.</dd>
  </dl>
`;

console.log("--- Original HTML ---");
console.log(sampleHtml);
console.log("\n=================================\n");

const result = html2markdown(sampleHtml, {
  frontmatter: {
    title: "Test Document",
    date: "2026-04-29",
    tags: ["typescript", "markdown", "parser"],
  },
});

console.log("--- Generated Markdown ---");
console.log(result);
