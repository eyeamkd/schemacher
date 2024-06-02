const fs = require("fs");

const schemaRegistry = JSON.parse(
  fs.readFileSync("../../schemas/schema-registry.json", "utf8")
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

  fs.writeFileSync(`./${schemaName}.ts`, interfaceCode);
}
