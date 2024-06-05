const fs = require("fs");
const path = require("path");
const clientDir = `${process.env.GITHUB_WORKSPACE}/package`;
const versionJsonPath = `${process.env.GITHUB_WORKSPACE}/schemas/version.json`;
// const clientDir = "../../package";
// const versionJsonPath = "../../schemas/version.json";

if (!fs.existsSync(clientDir)) {
  fs.mkdirSync(clientDir);
  console.log(`Directory package created successfully.`);
} else {
  console.log(`Directory package already exists.`);
}

const schemaRegistry = JSON.parse(
  fs.readFileSync(
    `${process.env.GITHUB_WORKSPACE}/schemas/schema-registry.json`,
    // `../../schemas/schema-registry.json`,
    "utf8"
  )
);

function incrementVersion(currentVersion, releaseType = "patch") {
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  switch (releaseType.toLowerCase()) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// // Read the existing version from version.json
// const versionJsonPath = path.join(clientDir, "version.json");
const versionData = JSON.parse(fs.readFileSync(versionJsonPath, "utf8"));

// Determine the type of change
const releaseType = "patch"; // Change this to "minor" or "major" as needed

// Increment the version number
const newVersion = incrementVersion(versionData.version, releaseType);

// Write the updated version back to version.json
fs.writeFileSync(versionJsonPath, JSON.stringify({ version: newVersion }, null, 2));



for (const [schemaName, schemaData] of Object.entries(schemaRegistry.schemas)) {
  const schema = schemaData.schema;

  // Resolve custom types and convert "integer" to "number"
  for (const propName in schema.properties) {
    let propType = schema.properties[propName].type;
    if (schemaRegistry.types[propType]) {
      propType = schemaRegistry.types[propType];
    }
    if (propType === "integer") {
      propType = "number"; // Correct the type
    }
    schema.properties[propName].type = propType; // Update the schema
  }

  // Generate TypeScript interface
  let interfaceCode = `export interface ${schemaName} {\n`;
  for (const [propName, propDef] of Object.entries(schema.properties)) {
    interfaceCode += `  ${propName}: ${propDef.type};\n`;
  }
  interfaceCode += "}\n";

  fs.writeFileSync(path.join(clientDir, `${schemaName}.ts`), interfaceCode);
}

const packageJson = {
  name: `@eyeamkd/${schemaRegistry.packageName}`, 
  version: newVersion,
  description: `${schemaRegistry.description}`,
  repository: {
    type: "git",
    url: "https://github.com/eyeamkd/schemacher.git",
  },
};

fs.writeFileSync(
  path.join(clientDir, "package.json"),
  JSON.stringify(packageJson, null, 2)
);
