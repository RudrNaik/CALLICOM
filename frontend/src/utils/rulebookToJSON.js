import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const omittedSections = [
  " ",
  "![][image1]",
  "Character Creation",
  "Rotor Wing Vehicles",
  "Ground Vehicles",
  "Movement Rules",
  "Injuries"
]

const here = path.dirname(fileURLToPath(import.meta.url));
const rulebookPath = path.resolve(
  here,
  "../../../documents/CALAMARI_TTRPG_HANDBOOK.md",
);

const raw = fs.readFileSync(rulebookPath, "utf-8");
const { content } = matter(raw);

// The lines of the file split by newline chars.
const lines = content.split("\n");

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
 * @returns
 */
function createJSONSection(title, depth, body, parent) {
  return {
    title: title,
    depth: depth,
    body: body,
  };
}

function checkSkippableSections(line, skippables){
  if(skippables.includes(line.replace(/[#*`]/g, "").trim())){
    return true;
  } else {
    return false;
  }
}

function buildJSONSectionRecursive(content, startLineIndex, sections) {
  let body = "";
  let title = content[startLineIndex];
  let depth = startsWithPound(content[startLineIndex])[1];
  let j = startLineIndex + 1;

  while (!startsWithPound(content[j])[0]) {
    if (startsWithPound(content[j])[0]) {
      buildJSONSectionRecursive(lines, j, sections, title);
    } else {
      if ((content[j] === "") &&  (j != startLineIndex+1)) {
        body += "\n\n";
      } else {
        body += content[j] + "\n";
      }
      //console.log(content[j]);
    }
    j++;
  }

  let jsonSection = createJSONSection(title, depth, body);

  if(!checkSkippableSections(title, omittedSections)){
  sections.push(jsonSection);
  }

  return [jsonSection, j];
}

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

  exportToFile(sections, "rulebook.json");
}

main(lines);

//console.log(lines[96] === "");
// console.log(lines[95])
// console.log(startsWithPound(lines[95]))
