const fs = require("fs");
const path = require("path");
const clientDir = "./";

const schemaRegistry = JSON.parse(
  fs.readFileSync(
    `${process.env.GITHUB_WORKSPACE}/schemas/schema-registry.json`,
    // `../../schemas/schema-registry.json`,
    "utf8"
  )
);

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
  

  const packageJson = {
    name: `@eyeamkd/${schemaName}-types`, // Customize the package name
    version: incrementVersion(schemaData.version),
    description: `TypeScript types for the ${schemaName} schema`,
    main: `${schemaName}.ts`,
    types: `${schemaName}.ts`,
    repository: {
      type: "git",
      url: "https://github.com/eyeamkd/schemacher.git", // Replace with your repo URL
    },
  };

  fs.writeFileSync(`./${schemaName}.ts`, interfaceCode);
  fs.writeFileSync(
    path.join(clientDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}
