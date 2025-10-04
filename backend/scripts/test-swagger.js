import { swaggerSpec } from '../src/config/swagger.js';

console.log('\n🔍 Testing Swagger Configuration...\n');

// Verify swagger spec is generated
if (!swaggerSpec) {
  console.error('❌ Swagger spec not generated');
  process.exit(1);
}

console.log('✅ Swagger spec generated successfully');
console.log(`📋 API Title: ${swaggerSpec.info.title}`);
console.log(`📌 Version: ${swaggerSpec.info.version}`);
console.log(`📝 Description: ${swaggerSpec.info.description}`);

// Count paths
const pathCount = Object.keys(swaggerSpec.paths || {}).length;
console.log(`🛣️  Documented Paths: ${pathCount}`);

// List tags
if (swaggerSpec.tags && swaggerSpec.tags.length > 0) {
  console.log(`🏷️  Tags: ${swaggerSpec.tags.map(t => t.name).join(', ')}`);
}

// Check security schemes
if (swaggerSpec.components?.securitySchemes) {
  console.log(`🔒 Security Schemes: ${Object.keys(swaggerSpec.components.securitySchemes).join(', ')}`);
}

// Check schemas
if (swaggerSpec.components?.schemas) {
  const schemaCount = Object.keys(swaggerSpec.components.schemas).length;
  console.log(`📦 Schemas Defined: ${schemaCount}`);
  console.log(`   - ${Object.keys(swaggerSpec.components.schemas).join(', ')}`);
}

console.log('\n✅ Swagger configuration is valid!');
console.log('📖 Access documentation at: http://localhost:5000/api-docs\n');
