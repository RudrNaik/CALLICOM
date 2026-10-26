import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { Marked } from "marked";

/**
 * These sections are specifically omitted due to them being empty or google's export converts them poorly.
 * It is a rulebook 'reference' not the entire thing.
 */
const omittedSections = [
  " ",
  "![][image1]",
  "Character Creation",
  "Rotor Wing Vehicles",
  "Ground Vehicles",
  "Movement Rules",
  "Injuries",
];

const marked = new Marked({ gfm: true });

const here = path.dirname(fileURLToPath(import.meta.url));
const rulebookPath = path.resolve(
  here,
  "../../../documents/CALAMARI_TTRPG_HANDBOOK.md",
);

const raw = fs.readFileSync(rulebookPath, "utf-8");
const { content } = matter(raw);

const lines = content.replace(/\v/g, "<br>").replace(/﻿/g, "").split("\n");

/**
 * Checks if a string would be a markdown header, denoted by the line starting with some amount of `#` without any leading spaces.
 * @param {*} str input string.
 * @returns 2 value array containing if it's a header line and what depth it would be. [bool, num]
 */
function startsWithPound(line) {
  if (!line.includes("#")) {
    return [false, 0];
  }

  let poundStart = false;
  let depth = 0;

  for (let i = 0; i < 3; i++) {
    if (line[i] == "#") {
      depth++;
      poundStart = true;
    } else {
      break;
    }
  }

  return [poundStart, depth];
}

/**
 * Constructor for JSON sections.
 * @param {*} title the title of the section, denoted by the header line.
 * @param {*} depth the depth of the section, determined by the amount of '#' in the header line
 * @param {*} body the body text.
 * @returns a JSON oject with the title, depth, and body attributes assigned.
 */
function createJSONSection(title, depth, body, parent) {
  return {
    title: title,
    depth: depth,
    body: body,
  };
}

/**
 * checks if a line needs to be skipped, trims, then strips the line of '`','#', and '*' before checking if it's included in the skippables array.
 * @param {*} line the specific line
 * @param {*} skippables an array of skippable sections.
 * @returns
 */
function checkSkippableSections(line, skippables) {
  if (skippables.includes(line.replace(/[#*`]/g, "").trim())) {
    return true;
  } else {
    return false;
  }
}

/**
 * Recursively goes through the rulebook's .md export from google to create new JSON data and push it to an array for json stringification and export.
 * @param {*} content the full content to parse
 * @param {*} startLineIndex the starting line index, used for recursion to pick up where we left off
 * @param {*} sections the array of individual JSON objects.
 * @returns
 */
function buildJSONSectionRecursive(content, startLineIndex, sections) {
  let body = "";
  let title = content[startLineIndex];
  let depth = startsWithPound(content[startLineIndex])[1];
  let j = startLineIndex + 1;

  while (!startsWithPound(content[j])[0]) {
    if (startsWithPound(content[j])[0]) {
      buildJSONSectionRecursive(lines, j, sections, title);
    } else {
      if (content[j] === "" && j != startLineIndex + 1) {
        body += "\n\n";
      } else {
        body += content[j] + "\n";
      }
      //console.log(content[j]);
    }
    j++;
  }

  let jsonSection = createJSONSection(title, depth, body);

  if (!checkSkippableSections(title, omittedSections)) {
    sections.push(jsonSection);
  }

  return [jsonSection, j];
}

/**
 * Renders a section's output from MD to HTML to ensure we dont have to try and use react-markdown for optimization.
 * We use dangerouslySetInnerHTML in the react components, but the JSON data is internala and we know what it'll always be.
 * Need to find a better solution but I also dont have all the time in the world.
 * @param {*} section a section from buildJSONSectionRecursive.
 * @param {*} index the section's position, used for its id.
 * @returns the section as it is written to rulebook.json.
 */
function jsonToHTML(section, index) {
  return {
    id: `rule-${index}`,
    depth: section.depth,
    titleHtml: marked.parseInline(section.title.replace(/^#+\s*/, "")),
    bodyHtml: marked.parse(section.body),
    searchText: `${section.title} ${section.body}`.toLowerCase(),
  };
}

/**
 * Exports data to a .json file in the data directory.
 * @param {*} data the specific data being exported into a.json file.
 * @param {*} name the name of the file.
 */
function exportToFile(data, name) {
  const filePath = path.join(here, "../data", name);

  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData, "utf-8");
    console.log("File successfully saved");
  } catch (e) {
    console.error("Cant write file", e);
  }
}

export function main(content) {
  let counter = 0;
  let sections = [];
  for (let i = counter; i < 1316; i++) {
    //console.log(content[i]);

    if (startsWithPound(content[i])[0]) {
      let jsonSections = buildJSONSectionRecursive(content, i, sections);

      i = jsonSections[1] - 1;
    }
  }

  //console.log(sections);

  exportToFile(sections.map(jsonToHTML), "rulebook.json");
}

main(lines);

//console.log(lines[96] === "");
// console.log(lines[95])
// console.log(startsWithPound(lines[95]))
