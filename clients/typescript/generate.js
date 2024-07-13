const fs = require("fs");
const path = require("path");
const clientDir = process.env.GITHUB_WORKSPACE
  ? `${process.env.GITHUB_WORKSPACE}/package`
  : "../../package";
const versionJsonPath = process.env.GITHUB_WORKSPACE
  ? `${process.env.GITHUB_WORKSPACE}/schemas/version.json`
  : "../../schemas/version.json";

const schemaPath = process.env.GITHUB_WORKSPACE
  ? `${process.env.GITHUB_WORKSPACE}/schemas/schema-registry.json`
  : "../../schemas/schema-registry.json";

if (!fs.existsSync(clientDir)) {
  fs.mkdirSync(clientDir);
  console.log(`Directory package created successfully.`);
} else {
  console.log(`Directory package already exists.`);
}

const schemaRegistry = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

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

const versionData = JSON.parse(fs.readFileSync(versionJsonPath, "utf8"));
console.log("Version Data: ", versionData);

// Determine the type of change
const releaseType = "patch"; // Change this to "minor" or "major" as needed
console.log("Release Type: ", releaseType);

// Increment the version number
const newVersion = incrementVersion(versionData.version, releaseType);
console.log("New Version: ", newVersion);

// Write the updated version back to version.json
fs.writeFileSync(
  versionJsonPath,
  JSON.stringify({ version: newVersion }, null, 2)
);
console.log("Version File Updated");

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
console.log("TypeScript Interfaces Generated");

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
console.log("Package.json Generated");
