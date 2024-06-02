const fs = require("fs");

const schemaRegistry = JSON.parse(
  fs.readFileSync("../schemas/schema-registry.json", "utf8")
);

for (const [schemaName, schemaData] of Object.entries(schemaRegistry.schemas)) {
  const schema = schemaData.schema;

  // Resolve custom types
  for (const propName in schema.properties) {
    const propType = schema.properties[propName].type;
    if (schemaRegistry.types[propType]) {
      schema.properties[propName].type = schemaRegistry.types[propType];
    }
  }

  // Generate TypeScript interface (you'll likely use a library for this)
  const interfaceCode = `export interface ${schemaName} {\n`;
  for (const [propName, propDef] of Object.entries(schema.properties)) {
    interfaceCode += `  ${propName}: ${propDef.type};\n`;
  }
  interfaceCode += "}\n";

  fs.writeFileSync(`./${schemaName}.ts`, interfaceCode);
}
